let storage={}
function loadData(){

    return Promise.all([
        d3.csv("Viz1data.csv",function(d){
            return{
                Country: d.Country,
                Amount: +d.Amount,
                Type: d.Type
            }
        }),
        d3.csv("Viz1Data2.csv",function(d){
            return{
                Country: d.Country,
                AmountDonated: +d.AmountDonated,
                AmountReceived: +d.AmountReceived,
                Diff: +d.Diff
            }
        })
    ]).then(function (datasets){
        storage.data1=datasets[0];
        storage.data2=datasets[1];
        return storage;
    })
    
}

function displayData(){
    let d1 = storage.data1;
    let d2 = storage.data2;
    console.log("Viz1data",d1);
    console.log("viz2",d2)    
    /*d2 = d2.sort((a,b) => {
        //return d3.descending(a.AmountDonated,b.AmountDonated);
        return d3.descending(a.Diff,b.Diff)
        //return d3.descending(a.AmountRecieved,b.AmountRecieved);
    })*/
    //console.log(d2);
    let configuration = getQ1chartConfig();
    let scales = getQ1Scales(d2,configuration);
    drawQ1Bars(d1,scales,configuration);
    drawQ1Axes(scales,configuration);
    legend(d2,scales,configuration);

}





function getQ1chartConfig(){
    let width = 1200;
    let height = 650;
    let margin = {
        top: 30,
        bottom: 30,
        left: 110,
        right: 30
        }
    let bodyHeight = height - margin.top - margin.bottom;
    let bodyWidth = width - margin.left - margin.right;

    let container = d3.select("#Q1Chart")
    container.attr("width", width)
            .attr("height", height)

    return { width, height, margin, bodyHeight, bodyWidth, container };
}

function getQ1Scales(data,configuration){
    let { bodyWidth, bodyHeight } = configuration;
        let maximumDonated = d3.max(data, (d) => {
            return Number(d.AmountDonated);
        });
        let maximumReceived = d3.min(data, (d) => {
            return Number(d.AmountReceived);
        })
        //console.log(maximumDonated);
        //console.log(maximumReceived);
        let xScale = d3.scalePow()
            .exponent(0.5)
            .range([0,bodyWidth])
            .domain([maximumReceived,maximumDonated])
            .nice()

        let yScale = d3.scaleBand()
            .range([0, bodyHeight])
            .domain(data.map(d => d.Country)) 
            .padding(0.3)
            

        var cScale = d3.scaleOrdinal()
            .domain(["donated","received"])
            .range(d3.schemePastel1)
        

        return { xScale, yScale, cScale }
}

function drawQ1Bars(data,scales,configuration){
    let {margin, container, bodyHeight, bodyWidth} = configuration;
    let {xScale, yScale, cScale} = scales;
    let mid = xScale(0)+margin.left;
    let bgBars = container.append("g")
                        .selectAll(".bar")
                        .data(data)
                        .enter()
                        .append("rect")
                        .attr("height", yScale.bandwidth())
                        .attr("y", (d) => yScale(d.Country)+margin.top)
                        .attr("x", margin.left )
                        .attr("width", bodyWidth)
                        .attr("fill", "#F5F5F5")

    let body = container.append("g")
    let mainBars = body.selectAll(".bar")
                        .data(data)
    mainBars.enter().append("rect")
                    .attr("height", yScale.bandwidth())
                    .attr("y", (d) => yScale(d.Country)+margin.top)
                    .attr("x", function(d) {
                        return d.Type == "donated" ? mid : (xScale(d.Amount)+margin.left);
                    })
                    .attr("width", (d) => {
                        return Math.abs(xScale(d.Amount) - xScale(0))
                    })
                    .attr("fill", d => cScale(d.Type))
    var labels = container.append("g")
                .attr("class", "labels");
    labels.selectAll("text")
                .data(data)
                .enter().append("text")
                .attr("class", "bar-label")
                .attr("x", mid)
                .attr("y", function(d) { return yScale(d.Country)+margin.top})
                .attr("dx", function(d) {
                        return d.Type == "donated" ? 10 : -10;
                    })
                .attr("dy", yScale.bandwidth())
                .attr("text-anchor", function(d) {
                        return d.Type == "donated" ? "start" : "end";
                    })
                .text(function(d) { 
                    let val = Math.abs(Math.ceil(d.Amount))
                    return  val != 0 ? val : "" 
                    })
                .style("font-size", "9px")
                .style("fill", "#111209");
}

function drawQ1Axes(scales, configuration){
    let {xScale, yScale, cScale } = scales
    let {container, margin, height, bodyHeight} = configuration;
    let axisX = d3.axisTop(xScale)
                .ticks(10)
                .tickFormat((d) => {
                    let val = d < 0 ? -d : d;
                    return d3.format("0")(val) + "M" 
                });
    container.append("g")
            .style("transform", `translate(${margin.left}px,${margin.top}px)`)
            .call(axisX)
    let axisY = d3.axisLeft(yScale)
    container.append("g")
            .style("transform",
            `translate(${margin.left}px,${margin.top}px)`)
            .call(axisY)

    let mid = xScale(0)+margin.left
    container.append("g")
            .attr("class", "m-axis")
            .style("transform",
            `translate(${mid}px,${margin.top}px)`)
            .style("stroke", "black")
            .style("stroke-width",0.5)
            .append("line")
            .attr("y1", 0)
            .attr("y2",bodyHeight);
}

function legend(data, scales, configuration){
    let {margin, container, bodyHeight, bodyWidth} = configuration;
    let {xScale, yScale, cScale} = scales
    container.append("rect")
            .attr("x",margin.left+350)
            .attr("y",bodyHeight+margin.top+10)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", cScale("received"))
            .style("stroke", "black")
    container.append("rect")
            .attr("x",margin.left+570)
            .attr("y",bodyHeight+margin.top+10)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", cScale("donated"))
            .style("stroke", "black")
    container.append("text")
        .attr("x", margin.left+375)
        .attr("y", bodyHeight+margin.top+20)
        .text("Amount Received in Millions")
        .style("font-size", "13px")
    container.append("text")
        .attr("x", margin.left+595)
        .attr("y", bodyHeight+margin.top+20)
        .text("Amount Donated in Millions")
        .style("font-size", "13px")
}

loadData().then(displayData);