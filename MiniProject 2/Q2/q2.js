let storage={}

function loadData(){
    return Promise.all([
        d3.csv("test2data.csv",function(d){
            return{
                year: +d.year,
                purpose: d.Purpose,
                code: +d.Code,
                amount: +d.amount
            }
        })
    ]).then(function(datasets){
        storage.d=datasets[0];        
        return storage;
    })
}

function displayData(){
    aiddata = storage.d;
    let test = d3.nest().key(function(d){
        return d.purpose;
    }).entries(storage.d);
    console.log("tEST",test);
    let purposes = test.map((d)=>d.key);
    console.log(purposes);
    let config = Q2chartconfiguration(test);
    console.log(typeof(config));
    let scales = Q2chartscales(aiddata,config);
    drawQ2chart(aiddata,scales,config);
}

loadData().then(displayData);

function Q2chartconfiguration(testdata){
    let data=testdata;
    let margin = {
        top: 30,
        bottom: 30,
        left: 80,
        right: 20
    }
    let bodyHeight = 250 - margin.top - margin.bottom;
    let bodyWidth = 300 - margin.left - margin.right;
    let container = d3.select("#Q2chart")
                    .selectAll("uniqueChart")
                    .data(data)
                    .enter()
                    .append("svg")
                    .attr("width", bodyWidth + margin.left + margin.right)
                    .attr("height", bodyHeight + margin.top + margin.bottom)
                    .attr("id", "Chart")
                    .append("g")
                    .attr("transform", "translate("+[margin.left,margin.top]+")")

    return { margin, bodyHeight, bodyWidth, container };
}

function Q2chartscales(testdata,configuration){
    let {bodyHeight, bodyWidth, container} = Object(configuration);
    console.log(configuration);
    let data = testdata;
    let maximumAmount =  d3.max(data, (d) => d.amount)
    let minimumAmount = d3.min(data, (d) => d.amount)
    let yScale= d3.scaleLinear()
        .range([bodyHeight,0])
        .domain([0,10000000000])
    container.append("g")
        .call(d3.axisLeft(yScale).ticks(4));

    let y = d3.extent(data, function(d) { return d.year; });
    console.log(y)
    let xScale = d3.scaleLinear()
        .domain([1973,2013])
        .range([0, bodyWidth])
    container.append("g")
        .call(d3.axisBottom(xScale).ticks(5))
        .attr("transform", "translate(0," + bodyHeight + ")");
    
    container.append("g")
            .call(d3.axisLeft(yScale).ticks(4)
            .tickSize(-bodyWidth)
            .tickFormat(""))
            .style("stroke", "#ebebe0")
            .style("stroke-dasharray", ("5, 4"))
    
    let purposes = data.map((d)=>d.key);

    let cScale = d3.scaleOrdinal()
                    .domain(purposes)
                    .range(d3.schemeCategory10)
    return { xScale, yScale, cScale}
}

function drawQ2chart(testdata, scales, configuration){
    let {xScale, yScale, cScale } = scales
    let {container, margin, bodyWidth, bodyHeight} = configuration;
    let data = testdata;
    container.append("path")
            .attr("fill", "none")
            .attr("stroke", function(d){ return cScale(d.key) })
            .attr("stroke-width", 1.9)
            .attr("d", function(d){
            return d3.line()
                .x(function(d) { return xScale(d.year); })
                .y(function(d) { return yScale(d.amount); })
                (d.values)
            })
    container.append("text")
            .attr("text-anchor", "start")
            .attr("y", -5)
            .attr("x", 0)
            .attr("font-size","12px")
            .text(function(d){ return(d.key)})
            .style("fill", function(d){ return cScale(d.key) })
}
