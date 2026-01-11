// used leaflet quick start: https://leafletjs.com/examples/quick-start/
// remove class from div: https://d3js.org/d3-selection/modifying
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
// error by plotting polylines, solved by https://gis.stackexchange.com/questions/314946/leaflet-extension-this-callinithooks-is-not-a-function

window.onload = () => {
  // Set the width and height of the SVG container
  const width = 500;
  const height = 500;
  var mode = "force"
  var map = L.map('visualization-container').setView([39, -95], 4);
  
  async function forceLayout() {
    const nodes = [];
    const links = [];
    const nodeSet = new Set();
    
    const data = await d3.csv("./data/flights-airport-5000plus.csv");
    
    data.forEach((row) => {
      const origin = row.origin;
      const destination = row.destination;
      const count = +row.count;

      // Create links between origin and destination airports
      links.push({ source: origin, target: destination, value: count });

      // Add unique origin and destination nodes
      if (!nodeSet.has(origin)) {
        nodes.push({ id: origin, name: origin });
        nodeSet.add(origin)
      }
      
      if (!nodeSet.has(destination)) {
        nodes.push({ id: destination, name: destination });
        nodeSet.add(destination)
      }
    });       
      
    nodes.forEach(n => n.value = links.reduce(
      (a, l) => l.source === n.id || l.target === n.id ? a + l.value : a, 0)
    );
    
    ForceGraph(
      { nodes, links }, 
      { 
        width, 
        height,
        linkStrength: d => Math.sqrt(d.data.value) / 10000,
        nodeRadius: d => d.value / 20000,
        linkStrokeWidth: d => d.value / 1000,
      });

    d3.select("#visualization-container").attr("class", "")
  }

  // copied from code up
  async function mapLayout(){
    
    const links = [];
    const nodeSet = new Set();
    
    const data = await d3.csv("./data/flights-airport-5000plus.csv");
    const airports = await d3.csv("./data/airports.csv");
    data.forEach((row) => {
      const origin = row.origin;
      const destination = row.destination;
      const count = +row.count;

      // Create links between origin and destination airports
      links.push({ source: origin, target: destination, value: count });

      // Add unique origin and destination nodes
      if (!nodeSet.has(origin)) {
        nodeSet.add(origin)
      }
      
      if (!nodeSet.has(destination)) {
        nodeSet.add(destination)
      }
    
    });
    // to compute nodes in one step, I used this: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
    const nodes = airports.filter((airport)=>nodeSet.has(airport.iata))
    nodes.forEach(n => n.id = n.iata)
    nodes.forEach(n => n.value = links.reduce(
      (a, l) => l.source === n.id || l.target === n.id ? a + l.value : a, 0)
    );

    // const svg = d3.select("#visualization-container")
    d3.select("#visualization-container")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
    
    map = L.map('visualization-container').setView([39, -95], 4);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // plot airport-circles
    nodes.forEach((d) => {
      L.circle([d.latitude, d.longitude], {
        color: "black",
        radius: d.value / 5,
      }).addTo(map).bindPopup(d.name);
    })
    
    // plot connections between airports
    const plottedLines = new Set();
    links.forEach((l) => {
      if(!plottedLines.has(l)){
        const lineBack = links.find((link)=> link.target == l.source && link.source == l.target)
        plottedLines.add(l).add(lineBack)
        origin = nodes.find((elt) => elt.id==l.source)
        destination = nodes.find((elt) => elt.id==l.target)
        
        new L.Polyline([[origin.latitude, origin.longitude], [destination.latitude, destination.longitude]], {
          color: 'grey',
          weight: (l.value+lineBack ? lineBack.value : 0)/2000,
          opacity: 0.5,
          smoothFactor: 1
        }).addTo(map);
      }
    })
  }

  

  function draw(layoutType) {
    d3.select("#visualization-container").html("");

    if (layoutType === "force") {
      map.remove()
      forceLayout();
    } else if (layoutType === "map") {
      mapLayout();
    }
  }

  // added event for button: copied from my assignment 2
  d3.select("#changeMode").on("click", function(){
    mode = mode=="force" ? "map" : "force"
    draw(mode)
  })

  draw(mode); // force by default
};