let storage={}

function loadData(){
    return Promise.all([
        d3.csv("q3data1.csv",function(d){
            return{
                year: +d.year,
                country: d.country,
                amount: +d.amount
            }
        }),
        d3.csv("countrydataViz3.csv",function(d){
            return{
                country: d.country
            }
        }),
        d3.csv("years.csv",function(d){
            return{
                year: +d.year,
                amount:+d.amount
            }
        })
    ]).then(function(datasets){
        storage.d1=datasets[0];
        storage.d2=datasets[1];
        storage.d3=datasets[2];
        return storage;
    })
}

function showData(){
    let aiddata = storage.d1;
    let countries = storage.d2;
    let years = storage.d3;
    console.log(aiddata,countries,years);
    let config = getQ3Chartconfiguration();
    let scales = getQ3ChartScales(aiddata, countries, config);
    drawQ3chart(aiddata, countries, years, scales, config);
    legend(scales, config);
}

loadData().then(showData);

function getQ3Chartconfiguration(){
    let width = 1250;
    let height = 650;
    let margin = {
        top: 10,
        bottom: 30,
        left: 110,
        right: 200
    }
    let bodyHeight = height - margin.top - margin.bottom;
    let bodyWidth = width - margin.left - margin.right;
    let container = d3.select("#Q3chart")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("id", "Chart")
                    .append("g")
                    .attr("transform", "translate("+[margin.left,margin.top]+")")

    return { width, height, margin, bodyHeight, bodyWidth, container };
}

function getQ3ChartScales(aiddata, countrydata, configuration){
    let { bodyWidth, bodyHeight } = configuration;
    let data = aiddata;
    let countries = countrydata;
    let years = [1973,2013];
    
    let startDate = new Date(years[0]-2, 12);
    let endDate = new Date(years[1]-1,12)
    let maximumReceived = d3.max(data, (d) => {
        return d.amount;
    })
    let minimumReceived = d3.min(data, (d) => {
        return d.amount
    })
    let yScale= d3.scalePoint()
        .range([bodyHeight,0])
        .domain(countries.map(d => d.country))
        .padding(3)
    let oScale = d3.scalePow()
        .exponent(0.5)
        .domain([minimumReceived,maximumReceived])
        .range([1,0.9])
    let xScale = d3.scaleTime()
        .domain([startDate,endDate])
        .range([0, bodyWidth])

    let rmin = 2, rmax = 18;
    let rScale = d3.scalePow()
        .exponent(0.5)
        .domain([minimumReceived,maximumReceived])
        .range([rmin,rmax])
    
    let cScale = d3.scalePow()
                    .exponent(0.5)
                    .domain([minimumReceived, maximumReceived])
                    .range(["#87e0c2","#006e48"])
    
    return { xScale, yScale, rScale, cScale, rRange: [rmin, rmax], oScale}
}

function drawQ3chart(aiddata, countries, years, scales, configuration){
    let data=aiddata;
    let yearsdata = d3.map(data, function(d){return d.year}).keys();
    let cnames = d3.map(data, function(d){return d.country}).keys();
    console.log(cnames, yearsdata);
    let { bodyWidth, bodyHeight, container } = configuration;
    let { xScale, yScale, rScale, cScale, oScale } = scales;
    let axisX = d3.axisBottom(xScale).ticks(20)
    container.append("g")
            .call(axisX)
            .style("transform", 
                "translate(0px"+","+bodyHeight+"px)")
    let axisY = d3.axisLeft(yScale).tickPadding(7)
    container.append("g")
        .call(axisY)    
    

    yearsdata.forEach(year => {
        container.append("line")
                .style("stroke", "#a1a1a1") 
                .style("stroke-dasharray", ("1, 1"))
                .attr("y1", bodyHeight)
                .attr("y2", 0)
                .attr("x1", xScale(new Date(year-1,12)))
                .attr("x2", xScale(new Date(year-1,12)))
    })

    cnames.forEach(country => {
        container.append("line")
                .style("stroke", "#a1a1a1") 
                .style("stroke-dasharray", ("1,1"))
                .attr("y1", yScale(country))
                .attr("y2", yScale(country))
                .attr("x1", bodyWidth)
                .attr("x2", 0)
    })



    let circle = container.selectAll("circle")
            .data(data);
    
    let circleEnter = circle.enter()
                        .append("circle")
                        .attr("cx", (d) => xScale(new Date(d.year-1,12)))
                        .attr("cy", (d) => yScale(d.country))
                        .attr("r", (d) => {
                            return rScale(d.amount);
                        })
                        .attr("fill", (d) => {
                            return cScale(d.amount);
                        })
                        .style("opacity", (d) => {
                            return oScale(d.amount);
                        })
                        
}

function legend(scales, configuration){
    let { bodyWidth, bodyHeight, container, margin } = configuration;
    let { rRange, rScale, cScale} = scales
    let x = bodyWidth;
    let y = 0;
    let legend = container.append("g")
                    .attr("transform","translate("+[x,y]+")");
    let mt = 70;
    let dx = 70, dy = 20;
    let cx = rRange[1] + dx;
    let cy = rRange[0] + dy + mt;
    for(var i=rRange[0]; i<=rRange[1]; i += 4){
        let amt = rScale.invert(i);
        legend.append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", i)
            .style("fill", cScale(amt))
        legend.append("text")
            .attr("x", cx+i+10)
            .attr("y", cy+4)
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
}