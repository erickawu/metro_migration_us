const map_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/msa_map.json";
const data_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/msa_data.json";

const scatter_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/perc_change.json";
const dict = ["11640", "41980", "10380", "25020", "41900", "32420", "38660", "24540", "34820", "45540", "33260"];

const coords_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/msa_coords.json";
const connections_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/msa_connections.json";

var path2 = d3.geoPath(d3.geoEquirectangular());

var cans = {}

var clicked = {}

var pt;

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

  svg = d3.select(".sticky1").append("svg")
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
              .attr("opacity", 0.7)
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
      .style("fill", "black")
      .text("Real Personal Income ($)");

  svg.append("text")
      .attr("class", "text")
      .attr("transform", "translate(" + (55) + "," + (250) + ")rotate(-90)")
      .style("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "black")
      .text("Ratio of Net Migrants over Population");
  //title
  svg.append("text")
      .attr("class", "text")
      .attr("transform", "translate(150," + 40 + ")")
      .style("text-anchor", "left")
      .style("font-size", "18px")
      .style("fill", "black")
      .text("Relationship Between Net Migration Ratio and RPI")
  return svg.node();
}

const path = d3.geoPath(d3.geoAlbersUsa());

var svg;
var g;
var outermap;
var outerdata;
var outercoords;
var outerconns;
function map() {
    svg = d3.select(".sticky1").append("svg")
        .attr("width", 900)
        .attr("height", 500)
        .style("cursor", "pointer");

    pt = svg.node().getBoundingClientRect();

    console.log(pt);

    g = svg.append("g");

    d3.json(map_url).then(function(map) {
      outermap = map;
        d3.json(data_url).then(function(data) {
          outerdata = data;
            d3.json(coords_url).then(function(coords) {
              outercoords = coords;
                d3.json(connections_url).then(function(conns) {
                  outerconns = conns;
                    // Bind metro paths
                    g.selectAll("path")
                    .data(topojson.feature(outermap, outermap.objects.cb_2014_us_cbsa_500k).features)
                    .enter().append("path")
                    .attr("d", path)
                    .style("fill", function (d) {
                        // populate all coordinates in cans dict
                        var curr_msa = d.properties.GEOID;
                        cans[curr_msa] = [this.getPointAtLength(this.getTotalLength()).x, this.getPointAtLength(this.getTotalLength()).y];

                        if (outerdata.hasOwnProperty(d.properties.GEOID)) {
                            return "lightgray";
                        } else {
                            return "white";
                        }
                    })
                    .on("click", function(d){
                      var curr_msa = d.properties.GEOID;
                      if (curr_msa in clicked){
                        delete clicked[curr_msa]
                      } else {
                        clicked[curr_msa] = 1
                      }
                    })
                    .on("mouseover", function(d) {
                        var curr_msa = d.properties.GEOID;

                        if (curr_msa in outerdata) {
                            d3.selectAll('.legend').text("");
                            var curr_txt = '<p id="currname">' + outerdata[curr_msa]["name"] + '</p>';
                            curr_txt += '<p> Net population change, 2013-17: ';
                            if (outerdata[curr_msa]["net"] > 0) {
                                curr_txt += '+';
                            }
                            curr_txt += outerdata[curr_msa]["net"] + '</p>';
                            curr_txt += '<p> RPI: ' + outerdata[curr_msa]["rpi"] + '<p>';

                            d3.selectAll('.slcted').html(curr_txt);
                            d3.selectAll('.slcted').append("hr");
                            d3.selectAll('.slcted').append("p").html('<p>Top migration areas:</p>');
                            // draw lines from source to dests
                            for (var i in outerconns[curr_msa]) {
                                var dest_msa = outerconns[curr_msa][i]["dest"];
                                if (dest_msa in outercoords) {
                                    // draw line
                                    svg.append("line")
                                    .attr("x1", cans[curr_msa][0])
                                    .attr("y1", cans[curr_msa][1])
                                    .attr("x2", cans[dest_msa][0])
                                    .attr("y2", cans[dest_msa][1])
                                    .attr("stroke-width", Math.abs(parseInt(outerconns[dest_msa][i]["value"]))/5000)
                                    .attr("stroke", function() {
                                        if (parseInt(outerconns[curr_msa][i]["value"]) < 0) {
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
                                    if (outerconns[curr_msa][i]["value"] > 0) {
                                        dst_txt += '+';
                                    }
                                    dst_txt += outerconns[curr_msa][i]["value"] + ': <b>';

                                    if (dest_msa in outerdata) {
                                        dst_txt += outerdata[dest_msa]["name"] + '</b>, RPI ' + outerdata[dest_msa]["rpi"];
                                    } else {
                                        dst_txt += 'Unknown Metro Area</b>';
                                    }
                                    dst_txt += '</p>';
                                    d3.selectAll('.dst'+i).html(dst_txt); // css needed

                                }
                            }

                            // gray dests
                            d3.selectAll('path').style("fill", function (e) {
                                for (var i in outerconns[curr_msa]) {
                                    var dest_msa = outerconns[curr_msa][i]["dest"];
                                    if (dest_msa in outercoords) {
                                        if (e.properties.GEOID == dest_msa) {
                                            return "gray";
                                        }
                                    }
                                }
                                for (var i in clicked){
                                  if(e.properties.GEOID == i){
                                    return d3.interpolateRdYlGn((outerdata[i]["net"] + 149227) / 298454);
                                  }
                                  for (var j in outerconns[i]) {
                                      var dest_msa = outerconns[i][j]["dest"];
                                      if (dest_msa in outercoords) {
                                          if (e.properties.GEOID == dest_msa) {
                                              return "gray";
                                          }
                                      }
                                  }
                                }
                                if (outerdata.hasOwnProperty(e.properties.GEOID) && outerdata[curr_msa].hasOwnProperty("net")) {
                                    return "lightgray";
                                } else {
                                    return "white";
                                }
                            });

                            // color curr msa by net
                            d3.select(this).style("fill", function (d) {
                                if (outerdata.hasOwnProperty(curr_msa) && outerdata[curr_msa].hasOwnProperty("net")) {
                                    return d3.interpolateRdYlGn((outerdata[curr_msa]["net"] + 149227) / 298454);
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
                            if (outerdata.hasOwnProperty(curr_msa)) {
                                return "lightgray";
                            } else {
                                return "white";
                            }
                        });
                        for (var i in outerconns[curr_msa]) {
                            if (outerconns[curr_msa][i]["dest"] in outercoords) {
                                // stroke around dests
                                d3.selectAll('path').style("fill", function (e) {
                                    if (outerdata.hasOwnProperty(e.properties.GEOID)) {
                                        return "lightgray";
                                    } else {
                                        return "white";
                                    }
                                });
                            }
                        }

                        d3.selectAll(".slcted").html("");
                        d3.selectAll(".dst0").html("");
                        d3.selectAll(".dst1").html("");
                        d3.selectAll(".dst2").html("");
                        d3.selectAll(".dst3").html("");
                        d3.select('#p1').html("						<b> Mouse over </b> any metropolitan area to view <b> inflow and outflow data </b> (Only the magnitudes of the top four flows are displayed). You can continuously highlight any MSA on the map by clicking on it, and then click again to revert the change."")
                        d3.selectAll('#p2').html("We’ve encoded the <b> three outlier groups </b> indicated in scatterplot into this map. We'll walk through them <b> one by one</b>, but you can hover over now them to find out more about their respective areas, and the top three metro areas that people either migrate to or migrate from.");
                        d3.selectAll('#p3').html("The Villages (FL), Myrtle Beach (SC), and Greeley (CO) are <b> popular retirement destinations</b>, hence their <b> low RPI and high net migration ratios.</b> All three have a relatively <b> low cost of living,</b> are <b> suburban,</b> and are somewhat <b>close to a high-density metropolitan area.</b> For example, Greeley is in close proximity to Denver.");
                        d3.selectAll('#p4').html("As seen in the scatterplot above, Midland, Texas has the <b> highest RPI but a negative net migration. </b>\nMidland is part of the <b> Permian Basin,</b> a large oil-and-gas producing region in West Texas. As such, migration is heavily dependent on how the energy industry is doing. In light of Trumps’ presidency, the current oil boom has resulted in record-breaking levels of employment and population counts in Midland. The data we have captures the <b> 2015–16 energy slump </b>, in which the Permian Basin <b>rig count tumbled from 548 to a low of 137, </b> which explains the negative migration.");
                        for (curr_msa in clicked){
                          clicked[curr_msa] = 1
                          // draw lines from source to dests
                          for (var i in outerconns[curr_msa]) {
                              var dest_msa = outerconns[curr_msa][i]["dest"];
                              if (dest_msa in outercoords) {
                                  // draw line
                                  svg.append("line")
                                  .attr("x1", cans[curr_msa][0])
                                  .attr("y1", cans[curr_msa][1])
                                  .attr("x2", cans[dest_msa][0])
                                  .attr("y2", cans[dest_msa][1])
                                  .attr("stroke-width", 1 + Math.abs(parseInt(outerconns[dest_msa][i]["value"]))/5000)
                                  .attr("stroke", function() {
                                      if (parseInt(outerconns[curr_msa][i]["value"]) < 0) {
                                          return "red";
                                      } else {
                                          return "lightgreen";
                                      }
                                  });

                              }
                          }

                          // gray dests
                          d3.selectAll('path').style("fill", function (e) {
                              for (var i in clicked){
                                if(e.properties.GEOID == i){
                                  return d3.interpolateRdYlGn((outerdata[i]["net"] + 149227) / 298454);
                                }
                                for (var j in outerconns[i]) {
                                    var dest_msa = outerconns[i][j]["dest"];
                                    if (dest_msa in outercoords) {
                                        if (e.properties.GEOID == dest_msa) {
                                            return "gray";
                                        }
                                    }
                                }
                              }
                              if (outerdata.hasOwnProperty(e.properties.GEOID)) {
                                  return "lightgray";
                              } else {
                                  return "white";
                              }
                          });
                          // color curr msa by net
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

function outliers() {
    clicked = {"24540": 0, "34820": 0, "45540": 0, "33260": 0};
    for (curr_msa in clicked){
      clicked[curr_msa] = 1
      // draw lines from source to dests
      for (var i in outerconns[curr_msa]) {
          var dest_msa = outerconns[curr_msa][i]["dest"];
          if (dest_msa in outercoords) {
              // draw line
              svg.append("line")
              .attr("x1", cans[curr_msa][0])
              .attr("y1", cans[curr_msa][1])
              .attr("x2", cans[dest_msa][0])
              .attr("y2", cans[dest_msa][1])
              .attr("stroke-width", 1 + Math.abs(parseInt(outerconns[dest_msa][i]["value"]))/5000)
              .attr("stroke", function() {
                  if (parseInt(outerconns[curr_msa][i]["value"]) < 0) {
                      return "red";
                  } else {
                      return "lightgreen";
                  }
              });

          }
      }

      // gray dests
      d3.selectAll('path').style("fill", function (e) {
          for (var i in clicked){
            if(e.properties.GEOID == i){
              return d3.interpolateRdYlGn((outerdata[i]["net"] + 149227) / 298454);
            }
            for (var j in outerconns[i]) {
                var dest_msa = outerconns[i][j]["dest"];
                if (dest_msa in outercoords) {
                    if (e.properties.GEOID == dest_msa) {
                        return "gray";
                    }
                }
            }
          }
          if (outerdata.hasOwnProperty(e.properties.GEOID)) {
              return "lightgray";
          } else {
              return "white";
          }
      });
      // color curr msa by net
    }
}

function retire() {
  clicked = {"24540": 0, "34820": 0, "45540": 0};
  d3.selectAll("line").remove();
  d3.selectAll("fill").remove();
  for (curr_msa in clicked){
    clicked[curr_msa] = 1
    // draw lines from source to dests
    for (var i in outerconns[curr_msa]) {
        var dest_msa = outerconns[curr_msa][i]["dest"];
        if (dest_msa in outercoords) {
            // draw line
            svg.append("line")
            .attr("x1", cans[curr_msa][0])
            .attr("y1", cans[curr_msa][1])
            .attr("x2", cans[dest_msa][0])
            .attr("y2", cans[dest_msa][1])
            .attr("stroke-width", 1 + Math.abs(parseInt(outerconns[dest_msa][i]["value"]))/5000)
            .attr("stroke", function() {
                if (parseInt(outerconns[curr_msa][i]["value"]) < 0) {
                    return "red";
                } else {
                    return "lightgreen";
                }
            });

        }
    }

    // gray dests
    d3.selectAll('path').style("fill", function (e) {
        for (var i in clicked){
          if(e.properties.GEOID == i){
            return d3.interpolateRdYlGn((outerdata[i]["net"] + 149227) / 298454);
          }
          for (var j in outerconns[i]) {
              var dest_msa = outerconns[i][j]["dest"];
              if (dest_msa in outercoords) {
                  if (e.properties.GEOID == dest_msa) {
                      return "gray";
                  }
              }
          }
        }
        if (outerdata.hasOwnProperty(e.properties.GEOID)) {
            return "lightgray";
        } else {
            return "white";
        }
    });
    // color curr msa by net
  }
}

function texas() {
  clicked = {"33260": 0};
  d3.selectAll("line").remove();
  d3.selectAll("fill").remove();
  for (curr_msa in clicked){
    clicked[curr_msa] = 1
    // draw lines from source to dests
    for (var i in outerconns[curr_msa]) {
        var dest_msa = outerconns[curr_msa][i]["dest"];
        if (dest_msa in outercoords) {
            // draw line
            svg.append("line")
            .attr("x1", cans[curr_msa][0])
            .attr("y1", cans[curr_msa][1])
            .attr("x2", cans[dest_msa][0])
            .attr("y2", cans[dest_msa][1])
            .attr("stroke-width", 1 + Math.abs(parseInt(outerconns[dest_msa][i]["value"]))/5000)
            .attr("stroke", function() {
                if (parseInt(outerconns[curr_msa][i]["value"]) < 0) {
                    return "red";
                } else {
                    return "lightgreen";
                }
            });

        }
    }

    // gray dests
    d3.selectAll('path').style("fill", function (e) {
        for (var i in clicked){
          if(e.properties.GEOID == i){
            return d3.interpolateRdYlGn((outerdata[i]["net"] + 149227) / 298454);
          }
          for (var j in outerconns[i]) {
              var dest_msa = outerconns[i][j]["dest"];
              if (dest_msa in outercoords) {
                  if (e.properties.GEOID == dest_msa) {
                      return "gray";
                  }
              }
          }
        }
        if (outerdata.hasOwnProperty(e.properties.GEOID)) {
            return "lightgray";
        } else {
            return "white";
        }
    });
    // color curr msa by net
  }
}

function refresh(){
  clicked = {"12345":0};
  d3.selectAll("line").remove();
  d3.selectAll("fill").remove();
  for (curr_msa in clicked){
    clicked[curr_msa] = 1
    // draw lines from source to dests
    for (var i in outerconns[curr_msa]) {
        var dest_msa = outerconns[curr_msa][i]["dest"];
        if (dest_msa in outercoords) {
            // draw line
            svg.append("line")
            .attr("x1", cans[curr_msa][0])
            .attr("y1", cans[curr_msa][1])
            .attr("x2", cans[dest_msa][0])
            .attr("y2", cans[dest_msa][1])
            .attr("stroke-width", 1 + Math.abs(parseInt(outerconns[dest_msa][i]["value"]))/5000)
            .attr("stroke", function() {
                if (parseInt(outerconns[curr_msa][i]["value"]) < 0) {
                    return "red";
                } else {
                    return "lightgreen";
                }
            });

        }
    }

    // gray dests
    d3.selectAll('path').style("fill", function (e) {
        if (outerdata.hasOwnProperty(e.properties.GEOID)) {
            return "lightgray";
        } else {
            return "white";
        }
    });
    // color curr msa by net
  }
}
function puerto() {
  clicked = {"35620":0};
  d3.selectAll("line").remove();
  d3.selectAll("fill").remove();
  for (curr_msa in clicked){
    clicked[curr_msa] = 1
    // draw lines from source to dests

    // gray dests
    d3.selectAll('path').style("fill", function (e) {
        if(e.properties.GEOID == "35620"){
            return "red";
          }
        if (outerdata.hasOwnProperty(e.properties.GEOID)) {
            return "lightgray";
        } else {
            return "white";
        }
    });
    // color curr msa by net
  }
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

var last = 0
function click(x, y)
{
  var event = $.Event('click');
  event.clientX = x;
  event.clientY = y;
  $('div').trigger(event);
  console.log("clientX: " + event.clientX +
  " - clientY: " + event.clientY)
}
function printMousePos(event) {
  console.log("cc")
  console.log("clientX: " + event.clientX +
  " - clientY: " + event.clientY);
  console.log(cans[24540])
}

document.addEventListener("click", printMousePos);
var last = 0;
// scrollama event handlers
function handleStepEnter(response) {
    console.log(last)
    console.log(response)
    // response = { element, direction, index }
    if (response.index == 0){
		    d3.select('.sticky1 svg').remove();
        scatterplot();
        last = 0
	  } else {
          d3.select('.tooltip-src').remove();
      }
    if (response.index == 1){
      if (last == 0){
        d3.select('.sticky1 svg').remove();
        map();
      }
      last = 1
    }
    if (response.index == 2){
      outliers();
      last = 2
    }
    if (response.index == 3){
        retire();
        last = 3
    }

    if (response.index == 4){
        texas();
        last = 4
    }

    if (response.index == 5) {
        puerto();
        if (last ==6){
          d3.select('.sticky1').select("button").remove();
        }
        last = 5
    }
    if (response.index == 6) {
        refresh();
        d3.select(".sticky1").append("button").text("Clear").on("click", function() {
            refresh();
        });
        last = 6;
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
