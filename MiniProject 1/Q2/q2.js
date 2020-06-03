let storage={}
function loadData(){

    return Promise.all([
        d3.csv("Viz2data.csv",function(d){
            return{
                Country: d.Country,
                AmountDonated: +d.AmountDonated,
                AmountRecieved: +d.AmountRecieved,
                Total: +d.Total,
                CapitalLatitude: +d.CapitalLatitude,
                CapitalLongitude: +d.CapitalLongitude,
                CapitalName: d.CapitalName,
                ContinentName: d.ContinentName,
                CountryCode: d.CountryCode
            }
        }),
        d3.json("countries.geo.json")
    ]).then(function (datasets){
        storage.d1=datasets[0];
        storage.d2=datasets[1];
        return storage;
    })
    
}

function displayData(){
    let countries = storage.d1;
    let geodata = storage.d2;
    //console.log("Full Data",countries);
    //console.log("Geo data",geodata);
    let cConfig = getQ2ChartConfigurations();
    let scales = getQ2Scales(countries,cConfig);
    let mapConfig = getMapConfiguration(cConfig);
    drawQ2Map(mapConfig,cConfig,geodata);
    pieCharts(mapConfig,cConfig,scales,countries);
    legend(countries,scales,cConfig);
}


function getQ2ChartConfigurations(){
    let width = 1250;
    let height = 650;
    let margin = {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
    }
    let bodyHeight = height - margin.top - margin.bottom;
    let bodyWidth = width - margin.left - margin.right;
    let container = d3.select("#Q2Chart");
    container
        .attr("width", width)
        .attr("height", height);

    return { width, height, margin, bodyHeight, bodyWidth, container };
}

function getQ2Scales(aiddata, configuration) {
    let { bodyWidth, bodyHeight } = configuration;
    let data1 = Object.keys(aiddata).map(key => aiddata[key]);
    let maxTotal = d3.max(data1, (d) => {
        return d.Total;
    })
    let minTotal = d3.min(data1, (d) => {
        return d.Total
    })
    console.log(maxTotal);
    console.log(minTotal);
    var rscale = d3.scaleLinear()
        .domain([minTotal,maxTotal])
        .range([10,30])

    var cscale = d3.scaleOrdinal()
        .domain(["received","donated"])
        .range(d3.schemeSet1)

    return { rscale, cscale }
}

function getMapConfiguration(configuration){
    let {width, height} = configuration;
    let projection = d3.geoMercator(); 
    projection.scale(100)
            .translate([width / 2 , height / 2 + 20])
    
    let path = d3.geoPath()
            .projection(projection);

    return {projection,path};
}

function drawQ2Map(mapConfiguration,chartConfiguration,data){
    let {projection,path} = mapConfiguration;
    let {container}  = chartConfiguration;
    container.selectAll("path").data(data.features)
        .enter().append("path")
        .attr("d", d => {
            return path(d)
        })
        .attr("stroke", "#808080")
        .attr("fill", "#F8F8FF")
}

function pieCharts(mapConfig, chartConfig, cScales, data){
    let {projection, path} = mapConfig;
    let container = chartConfig.container;
    let strokeWidth = 1;
    let radius = 3;
    let padding = 1;
    let {cscale, rscale} = cScales;
    nodes = [];
    data.forEach(function(country) {
        let pos = projection([+country.CapitalLongitude, +country.CapitalLatitude])
        let centroid = {
            "x" : pos[0],
            "y" : pos[1],
            "r" : rscale(country.Total),
            ...country
        }
        nodes.push(centroid);
    });
    //console.log("nodes: ", nodes);
    let graphNodes = nodes.map((d) => {
    let donatedPercent = (d.AmountDonated*100)/d.Total;
    return {
        "id": d.CountryCode,
        "name": d.Country,
        "x": +d.x,
        "y": +d.y,
        "r": +d.r,
        "pieChart": [
            {"color": cscale("donated"),  "percent": donatedPercent},
            {"color": cscale("received"), "percent": 100-donatedPercent}
        ]
    }
    })
    console.log("graphNodes: ", graphNodes);

    var tooltip = container.append("div")
                .attr("class", "node-tooltip")
                .style("position", "absolute")
                .style("z-index", "10")
                .style("visibility", "hidden")

    var pieNode = container.append("g")
                .attr("class", "nodes")
                .selectAll("g")
                .data(graphNodes)
                .enter()
                .append("g")

    pieNode.each(function (d) {
    NodePieBuilder.drawNodePie(d3.select(this), d.pieChart, {
        outerStrokeWidth: 0.5,
        showLabelText: true,
        labelText: d.id,
        radius: d.r,
        labelColor: "white"
    });
});

function ticked() {
    d3.selectAll(".node-circle").attr("cx", function (d) {
        return d.x;
    })
    .attr("cy", function (d) {
        return d.y;
    })
    .on("mouseover", function(d){
        //console.log(d.name)
        let tooltip = d3.select(".node-tooltip")
        return tooltip.style("visibility", "visible")
                        .text(String(d.name))
                        .attr("x", d.x)
                        .attr("y", d.y)
                     .attr("transform", "translate("+[d.x,d.y]+")")
                     .text(d.name);
    })
    .on("mouseout", function(d){return tooltip.style("visibility", "hidden");})
    .on("mousemove", function(){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})

    d3.selectAll(".node-label").attr("x", function (d) {
        return d.x;
    })
    .attr("y", function (d) {
        return d.y;
    });
}
var simulation = d3.forceSimulation(graphNodes)
                .force('x', d3.forceX().x(function(d) {
                    return d.x;
                }))
                .force('y', d3.forceY().y(function(d) {
                    return d.y;
                }))
                .force('collision', d3.forceCollide().radius(function(d) {
                    return d.r;
                }))
                .on('tick', ticked);
}

function legend(data, scales, configuration){
    let {margin, container, bodyHeight, bodyWidth} = configuration;
    let {xScale, yScale, cscale, rscale} = scales
    let data1 = Object.keys(data).map(key => data[key]);
    let maxTotal = d3.max(data1, (d) => {
        return d.Total;
    })
    let minTotal = d3.min(data1, (d) => {
        return d.Total
    })
    container = container.append("g")
    container.append("rect")
            .attr("x",margin.left+1000)
            .attr("y",40)
            .attr("width", 40)
            .attr("height", 40)
            .style("fill", cscale("donated"))
            .style("stroke", "black")
    container.append("rect")
            .attr("x",margin.left+1000)
            .attr("y",100)
            .attr("width", 40)
            .attr("height", 40)
            .style("fill", cscale("received"))
            .style("stroke", "black")
    container.append("text")
        .attr("x", margin.left+1045)
        .attr("y", 65)
        .text("Amount Donated")
        .style("font-size", "20px")
    container.append("text")
        .attr("x", margin.left+1045)
        .attr("y", 120)
        .text("Amount Received")
        .style("font-size", "20px");
    
    }
    




loadData().then(displayData);