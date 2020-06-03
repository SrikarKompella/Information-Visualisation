storage={}

function loadData(){
    return Promise.all([
        d3.csv("maindata.csv",function(d){
            return{
                donor: d.donor,
                recipient: d.recipient,
                amount: +d.amount
            }
        }),
        d3.csv("donors.csv",function(d){
            return{
                donor: d.donor,
                amount: +d.amount
            }
        }),
        d3.csv("recipients.csv", function(d){
            return{
                recipient: d.recipient,
                amount: +d.amount
            }
        })
    ]).then(function(d){
        storage.d1 = d[0];
        storage.d2 = d[1];
        storage.d3 = d[2];
        return storage;
    })
}

function showData(){
    let aiddata = storage.d1;
    console.log(aiddata)
    let donors = storage.d2;
    let recipients = storage.d3;
    let config = Q1chartconfiguration();
    let scales = Q1chartScales(aiddata, donors, recipients, config);
    drawQ1chart(aiddata, donors, recipients, scales, config);
    legend(scales, config);
}

loadData().then(showData);

function Q1chartconfiguration(){
    let width = 1200;
    let height = 700;
    let margin = {
        top: 10,
        bottom: 130,
        left: 130,
        right: 250
    }
    let bodyHeight = height - margin.top - margin.bottom;
    let bodyWidth = width - margin.left - margin.right;
    let container = d3.select("#Q1chart")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("id", "Chart")
                    .append("g")
                    .attr("transform", "translate("+[margin.left,margin.top]+")")

    return { width, height, margin, bodyHeight, bodyWidth, container };
}

function Q1chartScales(aiddata, donors, recipients,configuration){
    let { bodyWidth, bodyHeight } = configuration;
    max = d3.max(aiddata, function(d){ return d.amount});
    min = d3.min(aiddata, function(d){ return d.amount});
    console.log("min: "+min+", max: "+max)

    let yScale= d3.scalePoint()
                .range([bodyHeight,0])
                .domain(donors.map(function(d){ return d.donor}))
                .padding(1)

    let xScale = d3.scalePoint() 
                .range([0, bodyWidth])
                .domain(recipients.map(function(d){return d.recipient}))
                .padding(1)

    let minr = 3, maxr = 15; 
    let rScale = d3.scalePow()
                .exponent(0.5)
                .domain([min,max])
                .range([minr,maxr])

    let cScale = d3.scalePow()
                .domain([min, max])
                .range(["#ff8f87","#ff1100"]) 
                
    
    
    return { xScale, yScale, rScale, cScale, extend: [min,max], rRange: [minr,maxr] }
}

function drawQ1chart(aiddata, donors, recipients, scales, configuration){
    let {xScale, yScale, cScale, rScale } = scales
    let {container, margin, height, bodyHeight, bodyWidth} = configuration;
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
    
    container.append("text")             
            .attr("x", 450)
            .attr("y", 650)
            .style("text-anchor", "middle")
            .text("Recipients")
            .style("font-weight", "bold")
            .style("font-size","15px")

    container.append("text")
            .attr("x",-90)
            .attr("y", 350)
            .style("text-anchor", "middle")
            .text("Donors")
            .style("font-size","15px")

    donorcountry = donors.map(function(d){ return d.donor})
    recipientcountry = recipients.map(function(d){ return d.recipient})
    console.log(donorcountry,recipientcountry)

    recipientcountry.forEach(country => {
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
                 .attr("x1", bodyWidth)
                 .attr("x2", 0)
     })
     //Sorting by amount in descending order
     aiddata = aiddata.sort((a,b) => {
        return d3.descending(a.amount,b.amount);
    })
     let circle = container.selectAll("circle")
                .data(aiddata)
                 .enter()
                 .append("circle")
                 .attr("cx", (d) => xScale(d.recipient))
                 .attr("cy", (d) => yScale(d.donor))
                 .attr("r", (d) => rScale(d.amount))
                 .attr("fill", (d) => cScale(d.amount))
    
}

function legend(scales, configuration){
    let { bodyWidth, bodyHeight, container } = configuration;
    let { xScale, yScale, rScale, cScale, rRange } = scales;
    let x = bodyWidth;
    let y = 0;
    let legend = container.append("g")
                    .attr("transform","translate("+[x,y]+")");
    let mt = 20;
    let dx = 70, dy = 20;
    let cx = rRange[1] + dx;
    let cy = rRange[0] + dy + mt;
    for(var i=rRange[0]; i<=rRange[1]; i += 3){
        let amt = rScale.invert(i);
        legend.append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", i)
            .style("fill", cScale(amt))
        legend.append("text")
            .attr("x", cx+i+5)
            .attr("y", cy+5)
            .text((d) => {
                let million = 1000000
                let billion = 1000000000
                if(amt < million){
                    return "$" + Math.ceil(amt/1000) + " K"
                } if(amt < billion){
                    return "$" + Math.ceil(amt/million) + " M"
                }
                return "$" + Math.ceil(amt/billion) + " B"
            })
            .style("font-size", "12px")
        cy += i*2 + dy;
    }
            
    legend.append("text")
        .attr("x", -20)
        .attr("y", 20)
        .text("Countries on the Y-axis donate to countries on the X-axis")
        .style("font-size", "10px")
}