storage={}
function loadData(){
    return Promise.all([
        d3.csv("P2Viz1.csv",function(d){
            return{
                year:+d.year,
                country: d.Country,
                received: +d.received,
                donated: +d.donated,
                total: +d.total
            }
        })
    ]).then(function(datasets){
         storage.mainData = datasets[0];
         return storage;
    })
}

function displayQ1(){
    let aiddata = storage.mainData;
    console.log(aiddata);
    let config = Q1chartConfiguration();
    let scales = Q1chartScales(aiddata, config);
    Q1chartAxes(aiddata, scales, config);
    legend(aiddata,scales,config);
}

loadData().then(displayQ1);

function Q1chartConfiguration(){
    let width = 1200;
    let height = 650;
    let margin = {
        top: 0,
        bottom: 30,
        left: 110,
        right: 150
    }
    let bodyHeight = height - margin.top - margin.bottom;
    let bodyWidth = width - margin.left - margin.right;
    let container = d3.select(".mainView")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("id", "Chart")
                    .append("g")
                    .attr("transform", "translate("+[margin.left,margin.top]+")")

    return { width, height, margin, bodyHeight, bodyWidth, container };
}

function Q1chartScales(aiddata, configuration){
    let { bodyWidth, bodyHeight } = configuration;
    let data  = aiddata;
    let years = [1973,2013];
    let max = d3.max(data,(d)=>{
        return d.total;
    })
    let min = d3.min(data,(d)=>{
        return d.total;
    })
    let maxdonated = d3.max(data,(d)=>{
        return d.donated;
    });
    let mindonated = d3.min(data,(d)=>{
        return d.donated;
    })
    let maxreceived = d3.max(data,(d)=>{
        return d.received;
    })
    let minreceived = d3.min(data,(d)=>{
        return d.received;
    })
    let m=2,n=15;
    let yScale= d3.scalePoint()
        .range([0,bodyHeight])
        .domain(data.map(d => d.country))
        .padding(2)

    let startDate = new Date(years[0]-2, 12);
    let endDate = new Date(years[1]-1,12)
    
    let xScale = d3.scaleTime()
        .domain([startDate,endDate])
        .range([0, bodyWidth])
        
    
    let oScale = d3.scalePow()
        .exponent(0.1)
        .domain([min,max])
        .range([1,0.6])
    
    
    let rScale = d3.scalePow()
        .exponent(0.5)
        .domain([min,max])
        .range([m,n])

    let cScale = d3.scaleOrdinal()
                .domain(["donated", "received"])
                .range(d3.schemeCategory10)
    
    
    return { xScale, yScale, rScale, cScale, oScale, rRange: [m,n] }
}

function Q1chartAxes(aiddata, scales, configuration){
    let {xScale, yScale, rScale,  cScale, oScale} = scales;
    let {container, margin, height, bodyWidth, bodyHeight} = configuration;
    let data = aiddata;        
    let countries = d3.map(data, function(d){ return d.country}).keys();
    let years = d3.map(data, function(d){ return d.year}).keys();
    console.log(countries,years)
    let axisX = d3.axisBottom(xScale).ticks(20)

    container.append("g")
        .call(axisX)
        .style("transform", 
            "translate(0px"+","+bodyHeight+"px)"
        )
        

    let axisY = d3.axisLeft(yScale)
    container.append("g")
        .call(axisY)

    years.forEach(year => {
        container.append("line")
                .style("stroke", "#ebebe0") 
                .style("stroke-dasharray", ("1, 1"))
                .attr("y1", bodyHeight)
                .attr("y2", 0)
                .attr("x1", xScale(new Date(year-1,12)))
                .attr("x2", xScale(new Date(year-1,12)))
    })

    countries.forEach(country => {
        container.append("line")
                .style("stroke", "#ebebe0") 
                .style("stroke-dasharray", ("1,1"))
                .attr("y1", yScale(country))
                .attr("y2", yScale(country))
                .attr("x1", bodyWidth)
                .attr("x2", 0)
    })


    
    


    data1 = data.map(d => {
        return {
            "country": d.country,
            "pieData": [
                {"type": "donated", "amount": d.donated, "total": d.total},
                {"type": "received", "amount": d.received, "total": d.total}
            ],
            "total": d.total,
            "year": d.year,
            "x": xScale(new Date(d.year-1,12)),
            "y": yScale(d.country),
            "r": rScale(d.total),
            "o": oScale(d.total)
        }
    })
    data1.forEach(country => {            
        let pie = d3.pie()
                    .value(d => d.amount)
        let arc = d3.arc()
                    .outerRadius((d) => {
                        return rScale(d.data.total);
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
                .style("fill", function(d, i) { return cScale(d.data.type); })
                .style("opacity", (d) => { return oScale(d.data.total) })
                    
    })
}

function legend(aiddata, scales, configuration){
    let data = aiddata;
    let { bodyWidth, bodyHeight, container } = configuration;
    let { xScale, yScale, rScale, cScale, rRange } = scales;
    let x = bodyWidth;
    let y = 0;
    let legend = container.append("g")
                    .attr("transform","translate("+[x,y]+")");
    let mt = 50;
    let dx = 50, dy = 25;
    let cx = rRange[1] + dx;
    let cy = rRange[0] + dy + mt;
    for(var i=rRange[0]; i<=rRange[1]; i += 3){
        let amt = rScale.invert(i);
        legend.append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", i)
            .style("fill", "#354241")
            .style("opacity", 0.5)
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
    legend.append("rect")
            .attr("x",30)
            .attr("y",300)
            .attr("width", 20)
            .attr("height", 20)
            .style("fill", "#ff7f0e")
    legend.append("rect")
            .attr("x",30)
            .attr("y",340)
            .attr("width", 20)
            .attr("height", 20)
            .style("fill", "#1f77b4")
            
    legend.append("text")
        .attr("x", 62)
        .attr("y", 315)
        .text("Received")
        .style("font-size", "12px")

    legend.append("text")
        .attr("x", 62)
        .attr("y", 355)
        .text("Donated")
        .style("font-size", "12px")
}

