let storage={}

function loadData(){
    return Promise.all([
        d3.csv("stackeddata2.csv")
    ]).then(function(d){
        storage.d1 = d[0];
        return storage;
    })
}

function showData(){
    let data = storage.d1;
    console.log(data);
    let config = Q2chartconfiguration();
    let scales = Q2chartScales(data, config);
    drawQ2_4chart(data, scales, config);
    legend(data, scales, config);
}

loadData().then(showData);

function Q2chartconfiguration(){
    let width = 1250;
    let height = 650;
    let margin = {
        top: 10,
        bottom: 60,
        left:30,
        right: 250
    }
    let bodyHeight = height - margin.top - margin.bottom;
    let bodyWidth = width - margin.left - margin.right;
    let container = d3.select("#Q2_4chart")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("id", "Chart")
                    .append("g")
                    .attr("transform", "translate("+[margin.left,margin.top]+")")

    return { width, height, margin, bodyHeight, bodyWidth, container };
}

function Q2chartScales(data,configuration){
    let {bodyHeight, bodyWidth, container }=configuration;
    let keys = data.columns.slice(1);
    let series = d3.stack().keys(keys).offset(d3.stackOffsetExpand)(data)
    let years = d3.map(data, function(d){ return d.year;}).keys();
    let xScale = d3.scaleBand()
                .domain(years)
                .range([0,bodyWidth])
                .padding([0.2])
    container.append("g")
            .attr("transform", "translate(0," + bodyHeight + ")")
            .call(d3.axisBottom(xScale).tickSizeOuter(0))
    
    let yScale = d3.scaleLinear()
                .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
                .range([bodyHeight,0])
    container.append("g")
            .call(d3.axisLeft(yScale));
    
    let cScale = d3.scaleOrdinal()
                .domain(keys)
                .range(d3.schemeCategory10)
    
    return { xScale, yScale, cScale, series };
}

function drawQ2_4chart(data, scales, configuration){
    let { margin, bodyHeight, bodyWidth, container }= configuration;
    let {xScale, yScale, cScale, series } = scales;
    container.append("g")
    .selectAll("g")
    .data(series)
    .enter().append("g")
      .attr("fill", function(d) { return cScale(d.key); })
      .selectAll("rect")
      .data(function(d) { return d; })
      .enter().append("rect")
        .attr("x", function(d) { return xScale(d.data.year); })
        .attr("y", function(d) { return yScale(d[1]); })
        .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
        .attr("width",xScale.bandwidth())
    
 }          

 function legend(data, scales, configuration){
    let {xScale, yScale, cScale} = scales;
    let {width, height, bodyHeight, bodyWidth, container} = configuration;
    let keys = data.columns.slice(1);
    let x = bodyWidth;
    let y=0
    let legend = container.append("g")

    legend.selectAll("mydots")
            .data(keys)
            .enter()
            .append("circle")
            .attr("cx",1000)
            .attr("cy", function(d,i){ return 20+i*25})
            .attr("r", 7)
            .style("fill", function(d){ return cScale(d)})

    legend.selectAll("mylabels")
            .data(keys)
            .enter()
            .append("text")
            .attr("x", 1010)
            .attr("y", function(d,i){ return 20 + i*25}) 
            .style("fill", function(d){ return cScale(d)})
            .text(function(d){ return d})
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
            .style("font-size","11px")
}