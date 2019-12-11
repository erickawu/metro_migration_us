const map_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/msa_map.json";
const data_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/msa_data.json";
const coords_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/msa_coords.json";
const connections_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/msa_connections.json";

var path = d3.geoPath(d3.geoEquirectangular());

var tooltip = d3.select("body").append("div")
  .attr("class", "tooltip-src")
  .style("position", "absolute")
  .style("visibility", "hidden");

var dest_tt_1 = d3.select("body").append("div")
  .attr("class", "tooltip-dest")
  .attr("id", "dest_tt_1")
  .style("position", "absolute")
  .style("visibility", "hidden");

var dest_tt_2 = d3.select("body").append("div")
  .attr("class", "tooltip-dest")
  .attr("id", "dest_tt_2")
  .style("position", "absolute")
  .style("visibility", "hidden");

var dest_tt_3 = d3.select("body").append("div")
  .attr("class", "tooltip-dest")
  .attr("id", "dest_tt_3")
  .style("position", "absolute")
  .style("visibility", "hidden");

var dest_tt_4 = d3.select("body").append("div")
  .attr("class", "tooltip-dest")
  .attr("id", "dest_tt_4")
  .style("position", "absolute")
  .style("visibility", "hidden");

var cans = {}

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
                                    if (parseInt(conns[dest_msa][i]["value"]) < 0) {
                                        return "red";
                                    } else {
                                        return "lightgreen";
                                    }
                                });
                            }
                        }
                        // blacken dests
                        d3.selectAll('path').style("fill", function (e) {
                            for (var i in conns[curr_msa]) {
                                var dest_msa = conns[curr_msa][i]["dest"];
                                if (dest_msa in coords) {
                                    if (data.hasOwnProperty(dest_msa)) {
                                        if (i == 0) {
                                            d3.select('#dest_tt_1').style("visibility", "visible").html(data[dest_msa]["name"] + "<br> Net: " + data[dest_msa]["net"] + "<br> RPI: " + data[dest_msa]["rpi"]);
                                        }
                                        if (i == 1) {
                                            d3.select('#dest_tt_2').style("visibility", "visible").html(data[dest_msa]["name"] + "<br> Net: " + data[dest_msa]["net"] + "<br> RPI: " + data[dest_msa]["rpi"]);
                                        }
                                        if (i == 2) {
                                            d3.select('#dest_tt_3').style("visibility", "visible").html(data[dest_msa]["name"] + "<br> Net: " + data[dest_msa]["net"] + "<br> RPI: " + data[dest_msa]["rpi"]);
                                        }
                                        if (i == 3) {
                                            d3.select('#dest_tt_4').style("visibility", "visible").html(data[dest_msa]["name"] + "<br> Net: " + data[dest_msa]["net"] + "<br> RPI: " + data[dest_msa]["rpi"]);
                                        }
                                    }
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
                        // show tooltip
                        if (data.hasOwnProperty(curr_msa)) {
                            return tooltip.style("visibility", "visible").html(data[curr_msa]["name"] + "<br> Net: " + data[curr_msa]["net"] + "<br> RPI: " + data[curr_msa]["rpi"]);
                        }
                    })
                    .on("mousemove", function(d){
                        var curr_msa = d.properties.GEOID;
                        for (var i in conns[curr_msa]) {
                            var dest_msa = conns[curr_msa][i]["dest"];
                            if (dest_msa in coords) {
                                if (i == 0) {
                                    d3.select('#dest_tt_1').style("top", (cans[dest_msa][1]+d3.event.pageY-cans[curr_msa][1]-10)+"px").style("left",(cans[dest_msa][0]+10)+"px");
                                }
                                if (i == 1) {
                                    d3.select('#dest_tt_2').style("top", (cans[dest_msa][1]+d3.event.pageY-cans[curr_msa][1]-10)+"px").style("left",(cans[dest_msa][0]+10)+"px");
                                }
                                if (i == 2) {
                                    d3.select('#dest_tt_3').style("top", (cans[dest_msa][1]+d3.event.pageY-cans[curr_msa][1]-10)+"px").style("left",(cans[dest_msa][0]+10)+"px");
                                }
                                if (i == 3) {
                                    d3.select('#dest_tt_4').style("top", (cans[dest_msa][1]+d3.event.pageY-cans[curr_msa][1]-10)+"px").style("left",(cans[dest_msa][0]+10)+"px");
                                }
                            }
                        }
                        return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
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
                        d3.select('#dest_tt_1').style("visibility", "hidden");
                        d3.select('#dest_tt_2').style("visibility", "hidden");
                        d3.select('#dest_tt_3').style("visibility", "hidden");
                        d3.select('#dest_tt_4').style("visibility", "hidden");
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

    if (response.direction == 'up' && response.index == 0){
		d3.select('.sticky1 svg').remove();
	}
    if (response.direction == 'down' && response.index == 1){
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