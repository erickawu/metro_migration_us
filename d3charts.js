const map_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/msa_map.json";
const data_url = "https://raw.githubusercontent.com/erickawu/scroll_narrative/master/msa_data.json";

var path = d3.geoPath(d3.geoEquirectangular());

var tooltip = d3.select("body").append("div")
  .attr("class", "tooltip") // need to write html to style this box
  .style("position", "absolute")
  .style("visibility", "hidden");

function map() {
    const path = d3.geoPath(d3.geoAlbersUsa());

    var svg = d3.select(".sticky1").append("svg")
        .attr("width", 900)
        .attr("height", 500);

    let g = svg.append("g");

    d3.json(map_url).then(function(MSA) {
        d3.json(data_url).then(function(msa_data) {
            // Bind metro paths
            g.selectAll("path")
            .data(topojson.feature(MSA, MSA.objects.cb_2014_us_cbsa_500k).features)
            .enter().append("path")
            .attr("d", path)
            .style("fill", function (d) {
                if (msa_data.hasOwnProperty(d.properties.GEOID)) {
                    return "white";
                } else {
                    return "gray";
                }
            })
            .on("mouseover", function(d) {
                d3.select(this).style("fill", function (d) {
                    if (msa_data.hasOwnProperty(d.properties.GEOID) && msa_data[d.properties.GEOID].hasOwnProperty("net")) {
                        return d3.interpolatePiYG((msa_data[d.properties.GEOID]["net"] + 149227) / 298454);
                    } else {
                        return "gray";
                    }
                });
                if (msa_data.hasOwnProperty(d.properties.GEOID)) {
                    return tooltip.style("visibility", "visible").text(msa_data[d.properties.GEOID]["name"] + ": " + msa_data[d.properties.GEOID]["net"]);
                }
            })
            .on("mousemove", function(){
                return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
            })
            .on("mouseout", function(d) {
                d3.select(this).style("fill", function (d) {
                    if (msa_data.hasOwnProperty(d.properties.GEOID) && msa_data[d.properties.GEOID].hasOwnProperty("net")) {
                        return "white";
                    } else {
                        return "gray";
                    }
                });
                return tooltip.style("visibility", "hidden");
            })
            .style("stroke", function (d) {
                if (msa_data.hasOwnProperty(d.properties.GEOID)) {
                    return "lightgray";
                } else {
                    return "gray";
                }
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
    var stepH = Math.floor(window.innerHeight * 0.75);
    step.style('height', stepH + 'px');

    var figureHeight = 0.75*window.innerHeight
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

    map();
}

// kick things off
init();