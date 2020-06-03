let storage = {}

function loadData(){
    return Promise.all([
        d3.csv("maindata.csv", function(d){
            return{
                donor: d.donor,
                recipient: d.recipient,
                purpose: d.purpose,
                code: +d.code,
                amount: +d.amount
            }
        }),
        d3.csv("testdata.csv"),
        d3.csv("donors2.csv", function(d){
            return{
                donor: d.donor,
                amount: +d.amount
            }
        }),
        d3.csv("recipients2.csv", function(d){
            return{
                recipient: d.recipient,
                amount: +d.amount
            }
        })
    ]).then(function(d){
        storage.d1 = d[0];
        storage.d2 = d[1];
        storage.d3 = d[2];
        storage.d4 = d[3];
        return storage;
    })
}

function showData(){
    let maindata = storage.d1;
    let testdata = storage.d2;
    console.log(testdata)
    let donors = storage.d3;
    let recipients = storage.d4;
    let config = Q2chartconfiguration();
    let scales = Q2chartscales(maindata, testdata, donors, recipients, config);
    drawQ2chart(testdata, donors, recipients, scales, config);
    legend(maindata, scales, config);
}

loadData().then(showData);

function Q2chartconfiguration(){
    let width = 1250;
    let height = 650;
    let margin = {
        top: 10,
        bottom: 130,
        left: 150,
        right: 150
    }
    let bodyHeight = height - margin.top - margin.bottom;
    let bodyWidth = width - margin.left - margin.right;
    let container = d3.select("#Q2chart")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("id", "Chart")
                    .append("g")
                    .attr("transform", "translate("+[margin.left,margin.top]+")")

    return { width, height, margin, bodyHeight, bodyWidth, container };
}

function Q2chartscales(maindata, testdata, donors, recipients, configuration){
    let { bodyWidth, bodyHeight } = configuration;
    let max = d3.max(testdata,function(d){return d.total});
    let min = d3.min(testdata,function(d){return d.total});
    let donorcountry = donors.map(function(d){ return d.donor});
    let receipcountry = recipients.map(function(d){ return d.recipient});
    let purposes = d3.map(maindata, function(d){ return d.purpose}).keys();
    let xScale = d3.scalePoint() 
                .range([0, bodyWidth-120])
                .domain(receipcountry)
                .padding(1)
    let yScale = d3.scalePoint()
                .range([0,bodyHeight])
                .domain(donorcountry)
                .padding(1)

    let minr = 2
    let maxr = 7

    
    let rScale = d3.scalePow()
                .exponent(0.5)
                .domain([min,max])
                .range([minr,maxr])
    
    /*let rScale = d3.scaleLinear()
                .domain([min,max])
                .range([7,25])*/

    let cScale = d3.scaleOrdinal()
                .domain(["21050", "21030", "32120", "60040", "23020"])
                .range(['#1f77b4', "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"])
    
    return { xScale, yScale, rScale, cScale, extend: [min,max], rRange: [minr,maxr] }
}

function drawQ2chart(testdata, donors, recipients, scales, configuration){
    let {container, margin, height, bodyHeight, bodyWidth} = configuration;
    let { xScale, yScale, rScale, cScale } = scales;
    let axisX = d3.axisBottom(xScale)
    container.append("g")
        .call(axisX)
        .style("transform", 
            "translate(0px"+","+bodyHeight+"px)"
        )
        .selectAll("text")	
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");
    
    let axisY = d3.axisLeft(yScale)
    container.append("g")
        .call(axisY)

    let donorcountry = donors.map(function(d){ return d.donor});
    let receipcountry = recipients.map(function(d){ return d.recipient});

    container.append("text")             
            .attr("x", 450)
            .attr("y", 600)
            .style("text-anchor", "middle")
            .text("Recipients")
            .style("font-weight", "bold")
            .style("font-size","15px")

    container.append("text")
            .attr("x",-110)
            .attr("y", 300)
            .style("text-anchor", "middle")
            .text("Donors")
            .style("font-weight","bold")
            .style("font-size","15px")

    receipcountry.forEach(country => {
        container.append("line")
                .style("stroke", "#ebebe0") 
                .style("stroke-dasharray", ("1, 1"))
                .attr("y1", bodyHeight)
                .attr("y2", 0)
                .attr("x1", xScale(country))
                .attr("x2", xScale(country))
    })
     donorcountry.forEach(country => {
         container.append("line")
                 .style("stroke", "#ebebe0") 
                 .style("stroke-dasharray", ("1,1"))
                 .attr("y1", yScale(country))
                 .attr("y2", yScale(country))
                 .attr("x1", bodyWidth-120)
                 .attr("x2", 0)
     })
     let maxtotal = d3.max(testdata, function(d){ return d.total});
     let mintotal = d3.min(testdata, function(d){ return d.total});
     console.log(maxtotal, mintotal)
     plot_data = testdata.map(entry => {
        return {
            "donor": entry.donor,
            "pieData": [
                {"type": "21030", "amount": +entry["21030"] ? 20 : 0, "total": entry.total},
                {"type": "21050", "amount": +entry["21050"] ? 20 : 0, "total": entry.total},
                {"type": "23020", "amount": +entry["23020"] ? 20 : 0, "total": entry.total},
                {"type": "32120", "amount": +entry["32120"] ? 20 : 0, "total": entry.total},
                {"type": "60040", "amount": +entry["60040"] ? 20 : 0, "total": entry.total}
            ],
            "total": entry.total,
            "recipient": entry.recipient,
            "x": xScale(entry.recipient),
            "y": yScale(entry.donor),
            "r": rScale(entry.total)
        }
    })
    let maxtotalp = d3.max(plot_data, function(d){ return d.total});
    let mintotalp = d3.min(plot_data, function(d){ return d.total});
     console.log(maxtotalp, mintotalp)
    console.log(plot_data)
    plot_data.forEach(country => {            
        let pie = d3.pie()
                    .value(d => d.amount)
        let arc = d3.arc()
                    .outerRadius((d) => {
                        return 11;//rScale(country.total);
                    })
                    .innerRadius(0)

        var g = container.append("g")
                    .attr("transform", "translate("+[country.x,country.y]+")")
                    

        var gpie = g.selectAll(".pie")        
        gpie.data(pie(country.pieData))
                .enter()
                .append("g")
                .append("path")
                .attr("d", arc)
                .style("fill", (d) => {
                    return cScale(d.data.type)
                })
                //'.style("fill-opacity","0.5")
    })
}

function legend(maindata, scales, configuration){
    let { bodyWidth, bodyHeight, container } = configuration;
    let { xScale, yScale, rScale, cScale, rRange } = scales;
    let purposes = d3.map(maindata, function(d){ return d.purpose}).keys();
    let x = bodyWidth;
    let y=0
    let legend = container.append("g")
    legend.selectAll("mydots")
            .data(purposes)
            .enter()
            .append("circle")
            .attr("cx",850)
            .attr("cy", function(d,i){ return 300+i*25})
            .attr("r", 7)
            .style("fill", function(d){ return cScale(d)})

    legend.selectAll("mylabels")
            .data(purposes)
            .enter()
            .append("text")
            .attr("x", 860)
            .attr("y", function(d,i){ return 300 + i*25}) 
            .style("fill", function(d){ return cScale(d)})
            .text(function(d){ return d})
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
            .style("font-size","12px")

    legend.append("text")
            .attr("x", 830)
            .attr("y", 20)
            .text("Countries on the Y-axis donate to countries on the X-axis")
            .style("font-size", "10px")       
}
