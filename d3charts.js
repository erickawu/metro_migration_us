const map_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/msa_map.json";
const data_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/msa_data.json";

const scatter_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/perc_change.json";
const dict = ["11640", "41980", "10380", "25020", "41900", "32420", "38660", "24540", "34820", "45540", "33260"];

const coords_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/msa_coords.json";
const connections_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/msa_connections.json";

var path = d3.geoPath(d3.geoEquirectangular());

var cans = {}

var y = d3.scaleLinear()
    .domain([5,-4.2])
    .range([90, 440])

var x = d3.scaleLinear()
    .domain([0,120000])
    .range([80,770])

var yAxis = g => g
    .attr("transform", `translate(${80}, 0)`)
    .call(d3.axisLeft(y).tickSize(-700));

var xAxis = g => g
    .attr("transform", `translate(0, ${440})`)
    .call(d3.axisBottom(x).tickSize(-360));

function scatterplot() {
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip-src")
        .style("position", "absolute")
        .style("visibility", "hidden");

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
              .attr("fill", "white")
              .attr("stroke", "red")
              .attr("stroke-width", 2)
              .attr("r", 20)
              .attr("opacity", "0.3")
              .on("mouseover", function(d) {
            d3.select(this).style("fill", "red").style("opacity", "0.6");
            return tooltip.style("visibility", "visible").text(d.origin);
          })
              .on("mousemove", function(){
            return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
          })
              .on("mouseout", function(d) {
            d3.select(this).style("fill", "none").style("opacity", "0.3");
            return tooltip.style("visibility", "hidden");
          }))
      });
      
  svg.append("g")
      .call(xAxis)
        .call(g => g.select(".domain").remove())
        .selectAll('.tick line')
        .attr('stroke', '#eee'); 

  svg.append("g")
      .call(yAxis)
        .call(g => g.select(".domain").remove())
        .selectAll('.tick')
            .selectAll('line')
            .attr('stroke', '#eee');
    
    svg.append("text")
      .attr("class", "text")
      .attr("transform", "translate(370," + 470 + ")")
      .style("text-anchor", "left")
      .style("font-size", "10px")
      .text("Real Personal Income ($)");

  svg.append("text")
      .attr("class", "text")
      .attr("transform", "translate(" + (55) + "," + (250) + ")rotate(-90)")
      .style("text-anchor", "middle")
      .style("font-size", "10px")
      .text("Ratio of Net Migrants over Population");
  //title
  svg.append("text")
      .attr("class", "text")
      .attr("transform", "translate(150," + 40 + ")")
      .style("text-anchor", "left")
      .style("font-size", "18px")
      .text("Relationship Between Net Migration Ratio and RPI")
  return svg.node();
}   

function map() {
    const path = d3.geoPath(d3.geoAlbersUsa());

    var svg = d3.select(".sticky1").append("svg")
        .attr("width", 900)
        .attr("height", 500)
        .style("cursor", "pointer");

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
                        // populate all coordinates in cans dict
                        var curr_msa = d.properties.GEOID;
                        cans[curr_msa] = [this.getPointAtLength(this.getTotalLength()).x, this.getPointAtLength(this.getTotalLength()).y];
                        
                        if (data.hasOwnProperty(d.properties.GEOID)) {
                            return "lightgray";
                        } else {
                            return "white";
                        }
                    })
                    .on("mouseover", function(d) {
                        var curr_msa = d.properties.GEOID;
                        
                        if (curr_msa in data) {
                            d3.select('#legend').text("");

                            // write selected msa info in legend
                            var curr_txt = '<p id="currname">' + data[curr_msa]["name"] + '</p>';
                            curr_txt += '<p> Net population change, 2013-17: ';
                            if (data[curr_msa]["net"] > 0) {
                                curr_txt += '+';
                            }
                            curr_txt += data[curr_msa]["net"] + '</p>';
                            curr_txt += '<p> RPI: ' + data[curr_msa]["rpi"] + '<p>';
                            d3.select('#slcted').html(curr_txt); // css needed
                            d3.select('#slcted').append("hr");
                            d3.select('#slcted').append("p").html('<p>Top 3 migration areas:</p>');
                            
                            for (var i in conns[curr_msa]) {
                                var dest_msa = conns[curr_msa][i]["dest"];

                                // draw line from source to dest
                                if (dest_msa in coords) {
                                    svg.append("line")
                                    .attr("x1", cans[curr_msa][0])
                                    .attr("y1", cans[curr_msa][1])
                                    .attr("x2", cans[dest_msa][0])
                                    .attr("y2", cans[dest_msa][1])
                                    .attr("stroke-width", Math.abs(parseInt(conns[dest_msa][i]["value"]))/5000)
                                    .attr("stroke", function() {
                                        if (parseInt(conns[curr_msa][i]["value"]) < 0) {
                                            return "red";
                                        } else {
                                            return "lightgreen";
                                        }
                                    });   
                                }

                                if (dest_msa != "00999") {
                                    // write dest info in legend
                                    var color = parseInt(conns[curr_msa][i]["value"]);
                                    if (color < 0) {
                                        color = "#C55547";
                                    }
                                    else {
                                        color = "#9ACD32";
                                    }
                                    var dst_txt = '<p style = "background-color: ' + color + ';">';
                                    if (conns[curr_msa][i]["value"] > 0) {
                                        dst_txt += '+';
                                    }
                                    dst_txt += conns[curr_msa][i]["value"] + ': <b>';

                                    if (dest_msa in data) {
                                        dst_txt += data[dest_msa]["name"] + '</b>, RPI ' + data[dest_msa]["rpi"];
                                    } else {
                                        dst_txt += 'Unknown Metro Area</b>';
                                    }
                                    dst_txt += '</p>';
                                    d3.select('#dst'+i).html(dst_txt); // css needed  
                                }
                            }
                        
                            // color dests gray
                            d3.selectAll('path').style("fill", function (e) {
                                for (var i in conns[curr_msa]) {
                                    var dest_msa = conns[curr_msa][i]["dest"];
                                    if (dest_msa in coords) {
                                        if (e.properties.GEOID == dest_msa) {
                                            return "gray";
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
                                if (data.hasOwnProperty(curr_msa) && data[curr_msa].hasOwnProperty("net")) {
                                    return d3.interpolatePiYG((data[curr_msa]["net"] + 149227) / 298454);
                                } else {
                                    return "white";
                                }
                            });
                        }
                    })
                    .on("mouseout", function(d) {
                        var curr_msa = d.properties.GEOID;
                        d3.selectAll("line").remove();
                        d3.select(this).style("fill", function (d) {
                            if (data.hasOwnProperty(curr_msa)) {
                                return "lightgray";
                            } else {
                                return "white";
                            }
                        });
                        for (var i in conns[curr_msa]) {
                            if (conns[curr_msa][i]["dest"] in coords) {
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

                        d3.select("#slcted").html("");
                        d3.selectAll(".dst").html("");
                        d3.select('#legend').html("<b> Mouse over </b> any metropolitan area to view <b> inflow and outflow data </b> (Only the magnitudes of the top four flows are displayed).");
                    })
                    .style("stroke", function (d) {
                        return "white";
                    });

                    d3.select(".sticky1").append("button").text("Clear").on("click", function() {
                        d3.selectAll("line").remove();
                        d3.selectAll('path').style("fill", function (e) {
                            if (data.hasOwnProperty(e.properties.GEOID)) {
                                return "lightgray";
                            } else {
                                return "white";
                            }
                        });
                    });
                });
            });
        });
    });
}

function outliers() {
    var outliers = {"11640": 0, "41980": 0, "10380": 0, "25020": 0, "41900": 0, "32420": 0, "38660": 0, "24540": 0, "34820": 0, "45540": 0, "33260": 0};

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
                        if (outliers.hasOwnProperty(d.properties.GEOID)) {
                            return "black";
                            // return d3.interpolatePiYG((data[texas_msa]["net"] + 149227) / 298454);
                        } else if (data.hasOwnProperty(d.properties.GEOID)) {
                            return "lightgray";
                        } else {
                            return "white";
                        }
                    })
                    .style("stroke", function (d) {
                        return "white";
                    });
                });
            });
        });
    });
}

function retire() {
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
                        var curr_msa = d.properties.GEOID;
                        cans[curr_msa] = [this.getPointAtLength(this.getTotalLength()).x, this.getPointAtLength(this.getTotalLength()).y];
                        
                        if (data.hasOwnProperty(d.properties.GEOID)) {
                            return "lightgray";
                        } else {
                            return "white";
                        }
                    })
                    .style("stroke", function (d) {
                        return "white";
                    });

                    var places = ["32840", "24540", "45540"];
                    for (var x in places) {
                        var curr_msa = places[x];
                        // draw lines from source to dests
                        for (var i in conns[curr_msa]) {
                            var dest_msa = conns[curr_msa][i]["dest"];
                            if (dest_msa in coords) {
                                // draw line
                                svg.append("line")
                                .attr("x1", cans[curr_msa][0])
                                .attr("y1", cans[curr_msa][1])
                                .attr("x2", cans[dest_msa][0])
                                .attr("y2", cans[dest_msa][1])
                                .attr("stroke-width", Math.abs(parseInt(conns[dest_msa][i]["value"]))/5000)
                                .attr("stroke", function() {
                                    if (parseInt(conns[curr_msa][i]["value"]) < 0) {
                                        return "red";
                                    } else {
                                        return "lightgreen";
                                    }
                                });
                            }
                        }
                    }
                    
                    // blacken dests
                    d3.selectAll('path').style("fill", function (e) {
                        // highlight texas
                        for (var x in places) {
                            var curr_msa = places[x];
                            if (e.properties.GEOID == curr_msa) {
                                return "black";
                            }
                            // highlight dests
                            for (var i in conns[curr_msa]) {
                                var dest_msa = conns[curr_msa][i]["dest"];
                                if (dest_msa in coords) {
                                    if (e.properties.GEOID == dest_msa) {
                                        return "gray";
                                    }
                                }
                            }
                        }
                        if (data.hasOwnProperty(e.properties.GEOID)) {
                            return "lightgray";
                        } else {
                            return "white";
                        }
                    });
                });
            });
        });
    });
}

function texas() {
    var texas_msa = "33260";

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
                        var curr_msa = d.properties.GEOID;
                        cans[curr_msa] = [this.getPointAtLength(this.getTotalLength()).x, this.getPointAtLength(this.getTotalLength()).y];
                        
                        if (data.hasOwnProperty(d.properties.GEOID)) {
                            return "lightgray";
                        } else {
                            return "white";
                        }
                    })
                    .style("stroke", function (d) {
                        return "white";
                    });

                    var curr_msa = "33260";
                    // draw lines from source to dests
                    for (var i in conns[curr_msa]) {
                        var dest_msa = conns[curr_msa][i]["dest"];
                        if (dest_msa in coords) {
                            // draw line
                            svg.append("line")
                            .attr("x1", cans[curr_msa][0])
                            .attr("y1", cans[curr_msa][1])
                            .attr("x2", cans[dest_msa][0])
                            .attr("y2", cans[dest_msa][1])
                            .attr("stroke-width", Math.abs(parseInt(conns[dest_msa][i]["value"]))/5000)
                            .attr("stroke", function() {
                                if (parseInt(conns[curr_msa][i]["value"]) < 0) {
                                    return "red";
                                } else {
                                    return "lightgreen";
                                }
                            });
                        }
                    }
                    // blacken dests
                    d3.selectAll('path').style("fill", function (e) {
                        // highlight texas
                        if (e.properties.GEOID == curr_msa) {
                            return "black";
                        }
                        // highlight dests
                        for (var i in conns[curr_msa]) {
                            var dest_msa = conns[curr_msa][i]["dest"];
                            if (dest_msa in coords) {
                                if (e.properties.GEOID == dest_msa) {
                                    return "gray";
                                }
                            }
                        }
                        if (data.hasOwnProperty(e.properties.GEOID)) {
                            return "lightgray";
                        } else {
                            return "white";
                        }
                    });
                });
            });
        });
    });
}

function puerto() {
    var outliers = {"35620": 0};

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
                        if (outliers.hasOwnProperty(d.properties.GEOID)) {
                            return "black";
                            // return d3.interpolatePiYG((data[texas_msa]["net"] + 149227) / 298454);
                        } else if (data.hasOwnProperty(d.properties.GEOID)) {
                            return "lightgray";
                        } else {
                            return "white";
                        }
                    })
                    .on("mouseover", function(d){
                        if (data.hasOwnProperty(curr_msa)) {
                            return tooltip.style("visibility", "visible").html(data[curr_msa]["name"] + "<br> Net population change, 2013-2017: " + data[curr_msa]["net"] + "<br> RPI: " + data[curr_msa]["rpi"]);
                        }
                    })
                    .on("mousemove", function(d){
                        return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
                    })
                    .on("mouseout", function(d) {
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
    d3.select('button').remove();
    // response = { element, direction, index }

    if (response.index == 0){
		d3.select('.sticky1 svg').remove();
        scatterplot();
	} else {
        d3.select('.tooltip-src').remove();
    }  
    if (response.index == 1){
        d3.select('.sticky1 svg').remove();
        outliers();
    }

    if (response.index == 2){
        d3.select('.sticky1 svg').remove();
        retire();
    }
    
    if (response.index == 3) {
        d3.select('.sticky1 svg').remove();
        texas();
    }
    if (response.index == 4) {
        d3.select('.sticky1 svg').remove();
        puerto();
    }
    if (response.index == 5){
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