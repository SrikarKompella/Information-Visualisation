storage={}
function loadData(){
    return Promise.all([
        d3.csv("viz3data.csv",function(d){
            return {
                Country:d.Country,
                Purpose:d.Purpose,
                Code:+d.Code,
                Amount: +d.Amount,
                ContinentName:d.ContinentName
            }
        })
    ]).then(function(datasets){
        storage.d = datasets[0];
        return storage;
    })
}

function displayData(){
    let mainData = storage.d;
    console.log(mainData);
    let config = getQ3ChartConfiguration();
    let scales = getQ3ChartScales(mainData,config);
    Q3ChartAxes(mainData,scales,config);
    circles(mainData,scales,config);
    legend(mainData,scales,config);
    
}

function getQ3ChartConfiguration(){
    let width = 1250;
    let height = 650;
    let margin = {
        top: 0,
        bottom: 100,
        left: 200,
        right: 20
    }
    let bodyHeight = height - margin.top - margin.bottom;
    let bodyWidth = width - margin.left - margin.right;
    let container = d3.select(".mainView")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .append("g")
                    .attr("transform", "translate("+[margin.left,margin.top]+")")
    
    return { width, height, margin, bodyHeight, bodyWidth, container };

}

function getQ3ChartScales(cdata, configuration){
    let { bodyWidth, bodyHeight } = configuration;
    let data = cdata;
    let countries = data.map((d)=>d.Country);
    console.log(countries);
    let purpose = ["Air transport","Rail transport","Industrial development","Power generation/non-renewable sources","RESCHEDULING AND REFINANCING"]
    let maximumReceived = d3.max(data, (d) => {
        return d.Amount;
    })
    let minimumReceived = d3.min(data, (d) => {
        return d.Amount
    })
    let yScale= d3.scalePoint()
        .range([0,bodyHeight])
        .domain(purpose)
        .padding(1)
    let xScale = d3.scalePoint() 
        .range([0, bodyWidth])
        .domain(countries)
        .padding(1)
    let rScale = d3.scalePow()
        .exponent(0.5)
        .domain([minimumReceived,maximumReceived])
        .range([1,20])
    let cScale = d3.scalePow()
                    .exponent(0.5)
                    .domain([minimumReceived, maximumReceived])
                    .range(["#072af0","#a9cce8"])
    return { xScale, yScale, rScale, cScale }
}

function Q3ChartAxes(cdata, scales, configuration){
    let {xScale, yScale } = scales
    let {container, margin, height, bodyHeight} = configuration;
    let data = cdata;
    let purpose = ["Air transport","Rail transport","Industrial development","Power generation/non-renewable sources","RESCHEDULING AND REFINANCING"]


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
} 

function circles(cdata, scales, configuration){
    let data = cdata; 
    let { bodyWidth, bodyHeight, container } = configuration;
    let { xScale, yScale, rScale, cScale } = scales;
    
    let maximumReceived = d3.max(data, (d) => {
        return d.Amount
    })
    var circle = container.selectAll("circle")
        .data(data);

    var circleEnter = circle.enter()
                    .append("circle")
                    .attr("cx", (d) => xScale(d.Country))
                    .attr("cy", (d) => yScale(d.Purpose))
                    .attr("r", (d) => rScale((d.Amount)))
                    .attr("fill", (d) => cScale((d.Amount)))
    
    
}

function legend(cdata, scales, configuration){
    let data = cdata; 
    let { bodyWidth, bodyHeight, container, margin } = configuration;
    let { xScale, yScale, rScale, cScale } = scales;
    let maximumReceived = d3.max(data, (d) => {
        return d.Amount
    })
    console.log(maximumReceived);
    let minimumReceived = d3.min(data,(d)=>{
        return d.Amount
    })
    console.log(minimumReceived);
    container=container.append("g")
    container.append("circle")
    .attr("cx",-170)
    .attr("cy",550)
    .attr("r",rScale(maximumReceived))
    .attr("fill",cScale(maximumReceived))
    .attr("stroke","black")
    container.append("circle")
    .attr("cx",-170)
    .attr("cy",600)
    .attr("r",rScale(minimumReceived))
    .attr("fill",cScale(minimumReceived))
    .attr("stroke","black")
    container.append("text")
    .attr("x",-145)
    .attr("y",560)
    .text("Maximum Amount Received")
    .style("font-size","9px")
    container.append("text")
    .attr("x",-145)
    .attr("y",600)
    .text("Minimum Amount Received")
    .style("font-size","9px")

}
loadData().then(displayData);
