const map_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/msa_map.json";
const data_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/msa_data.json";

const scatter_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/perc_change.json";
const dict = ["11640", "41980", "10380", "25020", "41900", "32420", "38660", "24540", "34820", "45540", "33260"];

const coords_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/msa_coords.json";
const connections_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/msa_connections.json";


var path = d3.geoPath(d3.geoEquirectangular());

var tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("visibility", "hidden");

var y = d3.scaleLinear()
    .domain([5,-4])
    .range([90, 440])

var x = d3.scaleLinear()
    .domain([0,120000])
    .range([80,770])

var yAxis = g => g
    .attr("transform", `translate(${80}, 0)`)
    .call(d3.axisLeft(y));

var xAxis = g => g
    .attr("transform", `translate(0, ${440})`)
    .call(d3.axisBottom(x));

function scatterplot() {
   var svg = d3.select(".sticky1").append("svg")
        .attr("width", 850)
        .attr("height", 500);

  d3.json(scatter_url).then(function(scatter) {
      svg.append("g")
        .selectAll("g")
        .data(scatter)
        .join("g")
          .attr("transform", d => `translate(${x(d.rpi)},${y(d.perc_change)})`)
          .call(g => g.append("circle")
              .attr("stroke", "gray")
              .attr("fill", "gray")
              .attr("opacity", 0.5)
              .attr("r", 2.5)
           .on("mouseover", function(d) {
            d3.select(this).style("r", "6");
            return tooltip.style("visibility", "visible").text(d.origin);
          })
          .on("mousemove", function(){
            return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
          })
          .on("mouseout", function(d) {
            d3.select(this).style("stroke", "gray").style("r", "2.5");
            return tooltip.style("visibility", "hidden");
          }))
          .call(g => g.append("circle")
              .filter(function(d) {return dict.includes(d.msa_num)})
              .attr("fill", "none")
              .attr("stroke", "red")
              .attr("r", 20)
              .attr("opacity", "0.5")
              .on("mouseover", function(d) {
            d3.select(this).style("fill", "red").style("opacity", "0.5");
            return tooltip.style("visibility", "visible").text(d.origin);
          })
              .on("mousemove", function(){
            return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
          })
              .on("mouseout", function(d) {
            d3.select(this).style("fill", "none").style("opacity", "0.5");
            return tooltip.style("visibility", "hidden");
          }))
      });
      
  
  svg.append("g")
      .call(xAxis);

  svg.append("g")
      .call(yAxis);
  
  return svg.node();
}   

function map() {
    const path = d3.geoPath(d3.geoAlbersUsa());

    var svg = d3.select(".sticky1").append("svg")
        .attr("width", 900)
        .attr("height", 500);

    let g = svg.append("g");

    d3.json(map_url).then(function(map) {
        d3.json(data_url).then(function(data) {
            d3.json(coords_url).then(function(coords) {
                d3.json(connections_url).then(function(conns) {
                    // Bind metro paths
                    g.selectAll("path")
                    .data(topojson.feature(map, map.objects.cb_2014_us_cbsa_500k).features)
                    .enter().append("path")
                    .attr("d", path)
                    .style("fill", function (d) {
                        if (data.hasOwnProperty(d.properties.GEOID)) {
                            return "lightgray";
                        } else {
                            return "white";
                        }
                    })
                    .on("mouseover", function(d) {
                        // failing attempt to draw lines from source to dests
                        // for (var i in conns[d.properties.GEOID]) {
                        //     if (conns[d.properties.GEOID][i]["dest"] in coords) {
                        //         // draw line
                        //         svg.append("line")
                        //         .attr("x1", coords[d.properties.GEOID][0])
                        //         .attr("y1", coords[d.properties.GEOID][1])
                        //         .attr("x2", coords[conns[d.properties.GEOID][i]["dest"]][0])
                        //         .attr("y2", coords[conns[d.properties.GEOID][i]["dest"]][1])
                        //         .attr("stroke-width", 1)
                        //         // .attr("stroke-width", parseInt(conns[d.properties.GEOID][i]["value"]))
                        //         .attr("stroke", "black");
                        //     }
                        // }
                        // blacken dests
                        d3.selectAll('path').style("fill", function (e) {
                            for (var i in conns[d.properties.GEOID]) {
                                if (conns[d.properties.GEOID][i]["dest"] in coords) {
                                    if (e.properties.GEOID == conns[d.properties.GEOID][i]["dest"]) {
                                        return "black";
                                    }
                                }
                            }
                            if (data.hasOwnProperty(e.properties.GEOID)) {
                                return "lightgray";
                            } else {
                                return "white";
                            }
                        });
                        // color curr msa by net
                        d3.select(this).style("fill", function (d) {
                            if (data.hasOwnProperty(d.properties.GEOID) && data[d.properties.GEOID].hasOwnProperty("net")) {
                                return d3.interpolatePiYG((data[d.properties.GEOID]["net"] + 149227) / 298454);
                            } else {
                                return "white";
                            }
                        });
                        // show tooltip
                        if (data.hasOwnProperty(d.properties.GEOID)) {
                            return tooltip.style("visibility", "visible").html(data[d.properties.GEOID]["name"] + "<br> Net: " + data[d.properties.GEOID]["net"] + "<br> RPI: " + data[d.properties.GEOID]["rpi"]);
                        }
                    })
                    .on("mousemove", function(){
                        return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
                    })
                    .on("mouseout", function(d) {
                        d3.selectAll("line").remove();
                        d3.select(this).style("fill", function (d) {
                            if (data.hasOwnProperty(d.properties.GEOID)) {
                                return "lightgray";
                            } else {
                                return "white";
                            }
                        });
                        for (var i in conns[d.properties.GEOID]) {
                            if (conns[d.properties.GEOID][i]["dest"] in coords) {
                                // stroke around dests
                                d3.selectAll('path').style("fill", function (e) {
                                    if (data.hasOwnProperty(e.properties.GEOID)) {
                                        return "lightgray";
                                    } else {
                                        return "white";
                                    }
                                });
                            }
                        }
                        return tooltip.style("visibility", "hidden");
                    })
                    .style("stroke", function (d) {
                        return "white";
                    });
                });
            });
        });
    });
}

// using d3 for convenience
var main = d3.select('main')
var scrolly = main.select('#scrolly');
var figure = scrolly.select('figure');
var article = scrolly.select('article');
var step = article.selectAll('.step');

// initialize the scrollama
var scroller = scrollama();

// generic window resize listener event
function handleResize() {
    // 1. update height of step elements
    step.style('height', 550 + 'px');

    var figureHeight = 500
    var figureMarginTop = (window.innerHeight - figureHeight) / 2

    figure
        .style('height', figureHeight + 'px')
        .style('top', figureMarginTop + 'px');


    // 3. tell scrollama to update new element dimensions
    scroller.resize();
}

// scrollama event handlers
function handleStepEnter(response) {
    console.log(response)
    // response = { element, direction, index }

    if (response.index == 0){
		d3.select('.sticky1 svg').remove();
        scatterplot();
	}  
    if (response.index == 1){
		d3.select('.sticky1 svg').remove();
        map();
	}

    // add color to current step only
    step.classed('is-active', function (d, i) {
        return i === response.index;
    })

    // update graphic based on step
    figure.select('p').text(response.index + 1);
}

function setupStickyfill() {
    d3.selectAll('.sticky').each(function () {
        Stickyfill.add(this);
    });
}

function init() {
    setupStickyfill();

    // 1. force a resize on load to ensure proper dimensions are sent to scrollama
    handleResize();

    // 2. setup the scroller passing options
    // 		this will also initialize trigger observations
    // 3. bind scrollama event handlers (this can be chained like below)
    scroller.setup({
        step: '#scrolly article .step',
        offset: 0.33,
        debug: false,
    })
        .onStepEnter(handleStepEnter)


    // setup resize event
    window.addEventListener('resize', handleResize);
}

// kick things off
init();