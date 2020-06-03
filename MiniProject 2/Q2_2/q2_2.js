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

function showData(){
    let aiddata = storage.d;
    let testdata = d3.nest()
    .key(function(d){ return d.purpose; })
    .entries(aiddata)
    console.log(aiddata,testdata)
    let config = Q2chartconfiguration();
    console.log(config)
    let scales = Q2chartscales(aiddata, testdata, config);
    drawQ2_2chart(aiddata, testdata, scales, config);
    legend(testdata, scales, config);
}

loadData().then(showData);

function Q2chartconfiguration(){
    let width = 1200;
    let height = 600;
    let margin = {
        top: 10,
        bottom: 60,
        left: 100,
        right: 250
    }
    let bodyHeight = height - margin.top - margin.bottom;
    let bodyWidth = width - margin.left - margin.right;
    let container = d3.select("#Q2_2chart")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("id", "Chart")
                    .append("g")
                    .attr("transform", "translate("+[margin.left,margin.top]+")")

    return { width, height, margin, bodyHeight, bodyWidth, container };
}

function Q2chartscales(aiddata, testdata, configuration){
    let {bodyHeight, bodyWidth, container } = configuration;
    console.log(container);
    let data = aiddata;
    let test = testdata
    let maximumAmount =  d3.max(data, (d) => d.amount)
    let minimumAmount = d3.min(data, (d) => d.amount)
    let yScale= d3.scaleLinear()
        .range([bodyHeight,0])
        .domain([0,8500000000])
    container.append("g")
        .call(d3.axisLeft(yScale).ticks(4));
    let years = [1973,2013];
    let startDate = new Date(years[0]-2, 12);
    let endDate = new Date(years[1]-1,12)
    let xScale = d3.scaleTime()
        .domain([startDate,endDate])
        .range([0, bodyWidth])
    container.append("g")
        .call(d3.axisBottom(xScale).ticks(20))
        .style("transform", 
                "translate(0px"+","+bodyHeight+"px)"
            )
    
    container.append("g")
            .call(d3.axisLeft(yScale).ticks(4)
            .tickSize(-bodyWidth)
            .tickFormat(""))
            .style("stroke", "#ebebe0")
            .style("stroke-dasharray", ("5, 4"))
    
    let purposes = test.map((d)=>d.key);

    let cScale = d3.scaleOrdinal()
                    .domain(purposes)
                    .range(d3.schemeCategory10)
    return { xScale, yScale, cScale}
}

function drawQ2_2chart(aiddata, testdata, scales, configuration){
    let data = aiddata;
    let test = testdata;
    let { bodyWidth, bodyHeight,container } = configuration;
    let {xScale, yScale, cScale } = scales;
    container.selectAll(".line")
            .data(test)
            .enter()
            .append("path")
            .attr("fill","none")
            .attr("stroke", (d)=>cScale(d.key))
            .attr("stroke-width", 1)
            .attr("opacity","1")
            .attr("d", function(d){
                return d3.line()
                .x(function(d){ return xScale(new Date(d.year-1,12))})
                .y(function(d){ return yScale(d.amount)})
                (d.values)
            })

    container.selectAll("myCircles")
            .data(data)
            .enter()
            .append("circle")
            .attr("stroke-width",2)
            .attr("opacity","0.5")
            .attr("cx",function(d){ return xScale(new Date(d.year-1,12))})
            .attr("cy", function(d){ return yScale(d.amount)})
            .attr("r", 2.5)
            .attr("fill",(d)=>cScale(d.purpose))
            
}

function legend(testdata, scales, configuration){
    let test = testdata;
    let {xScale, yScale, cScale} = scales;
    let {width, height, bodyHeight, bodyWidth, container} = configuration;
    let purposes = test.map((d)=>d.key);
    let x = bodyWidth;
    let y=0
    let legend = container.append("g")

    legend.selectAll("mydots")
            .data(purposes)
            .enter()
            .append("circle")
            .attr("cx",870)
            .attr("cy", function(d,i){ return 20+i*25})
            .attr("r", 7)
            .style("fill", function(d){ return cScale(d)})

    legend.selectAll("mylabels")
            .data(purposes)
            .enter()
            .append("text")
            .attr("x", 880)
            .attr("y", function(d,i){ return 20 + i*25}) 
            .style("fill", function(d){ return cScale(d)})
            .text(function(d){ return d})
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
            .style("font-size","12px")
}