// Stop syntax errors in this file.
const d3 = window.d3;
const mm = window.mm;

// Where to load the data from.
const TOP_OVERALL_URL = 'https://cdn.glitch.com/b078d442-623b-41f0-a809-48f5f1ec1cbf%2Ftop_overall.json?1559164437281';
const TOP_PER_COUNTRY_URL = 'https://cdn.glitch.com/b078d442-623b-41f0-a809-48f5f1ec1cbf%2Ftop_per_country.json?1559164216772';
const DATAPOINTS_URL = 'https://cdn.glitch.com/b078d442-623b-41f0-a809-48f5f1ec1cbf%2Fdataset_samples.json?1559248203882';

const isoCountries = {"af":"Afghanistan","ax":"AlandIslands","al":"Albania","dz":"Algeria","as":"AmericanSamoa","ad":"Andorra","ao":"Angola","ai":"Anguilla","aq":"Antarctica","ag":"AntiguaAndBarbuda","ar":"Argentina","am":"Armenia","aw":"Aruba","au":"Australia","at":"Austria","az":"Azerbaijan","bs":"Bahamas","bh":"Bahrain","bd":"Bangladesh","bb":"Barbados","by":"Belarus","be":"Belgium","bz":"Belize","bj":"Benin","bm":"Bermuda","bt":"Bhutan","bo":"Bolivia","ba":"BosniaAndHerzegovina","bw":"Botswana","bv":"BouvetIsland","br":"Brazil","io":"BritishIndianOceanTerritory","bn":"BruneiDarussalam","bg":"Bulgaria","bf":"BurkinaFaso","bi":"Burundi","kh":"Cambodia","cm":"Cameroon","ca":"Canada","cv":"CapeVerde","ky":"CaymanIslands","cf":"CentralAfricanRepublic","td":"Chad","cl":"Chile","cn":"China","cx":"ChristmasIsland","cc":"Cocos(Keeling)Islands","co":"Colombia","km":"Comoros","cg":"Congo","cd":"Congo,DemocraticRepublic","ck":"CookIslands","cr":"CostaRica","ci":"CoteD'Ivoire","hr":"Croatia","cu":"Cuba","cy":"Cyprus","cz":"CzechRepublic","dk":"Denmark","dj":"Djibouti","dm":"Dominica","do":"DominicanRepublic","ec":"Ecuador","eg":"Egypt","sv":"ElSalvador","gq":"EquatorialGuinea","er":"Eritrea","ee":"Estonia","et":"Ethiopia","fk":"FalklandIslands(Malvinas)","fo":"FaroeIslands","fj":"Fiji","fi":"Finland","fr":"France","gf":"FrenchGuiana","pf":"FrenchPolynesia","tf":"FrenchSouthernTerritories","ga":"Gabon","gm":"Gambia","ge":"Georgia","de":"Germany","gh":"Ghana","gi":"Gibraltar","gr":"Greece","gl":"Greenland","gd":"Grenada","gp":"Guadeloupe","gu":"Guam","gt":"Guatemala","gg":"Guernsey","gn":"Guinea","gw":"Guinea-Bissau","gy":"Guyana","ht":"Haiti","hm":"HeardIsland&McdonaldIslands","va":"HolySee(VaticanCityState)","hn":"Honduras","hk":"HongKong","hu":"Hungary","is":"Iceland","in":"India","id":"Indonesia","ir":"Iran,IslamicRepublicOf","iq":"Iraq","ie":"Ireland","im":"IsleOfMan","il":"Israel","it":"Italy","jm":"Jamaica","jp":"Japan","je":"Jersey","jo":"Jordan","kz":"Kazakhstan","ke":"Kenya","ki":"Kiribati","kr":"Korea","kw":"Kuwait","kg":"Kyrgyzstan","la":"LaoPeople'sDemocraticRepublic","lv":"Latvia","lb":"Lebanon","ls":"Lesotho","lr":"Liberia","ly":"LibyanArabJamahiriya","li":"Liechtenstein","lt":"Lithuania","lu":"Luxembourg","mo":"Macao","mk":"Macedonia","mg":"Madagascar","mw":"Malawi","my":"Malaysia","mv":"Maldives","ml":"Mali","mt":"Malta","mh":"MarshallIslands","mq":"Martinique","mr":"Mauritania","mu":"Mauritius","yt":"Mayotte","mx":"Mexico","fm":"Micronesia,FederatedStatesOf","md":"Moldova","mc":"Monaco","mn":"Mongolia","me":"Montenegro","ms":"Montserrat","ma":"Morocco","mz":"Mozambique","mm":"Myanmar","na":"Namibia","nr":"Nauru","np":"Nepal","nl":"Netherlands","an":"NetherlandsAntilles","nc":"NewCaledonia","nz":"NewZealand","ni":"Nicaragua","ne":"Niger","ng":"Nigeria","nu":"Niue","nf":"NorfolkIsland","mp":"NorthernMarianaIslands","no":"Norway","om":"Oman","pk":"Pakistan","pw":"Palau","ps":"PalestinianTerritory,Occupied","pa":"Panama","pg":"PapuaNewGuinea","py":"Paraguay","pe":"Peru","ph":"Philippines","pn":"Pitcairn","pl":"Poland","pt":"Portugal","pr":"PuertoRico","qa":"Qatar","re":"Reunion","ro":"Romania","ru":"RussianFederation","rw":"Rwanda","bl":"SaintBarthelemy","sh":"SaintHelena","kn":"SaintKittsAndNevis","lc":"SaintLucia","mf":"SaintMartin","pm":"SaintPierreAndMiquelon","vc":"SaintVincentAndGrenadines","ws":"Samoa","sm":"SanMarino","st":"SaoTomeAndPrincipe","sa":"SaudiArabia","sn":"Senegal","rs":"Serbia","sc":"Seychelles","sl":"SierraLeone","sg":"Singapore","sk":"Slovakia","si":"Slovenia","sb":"SolomonIslands","so":"Somalia","za":"SouthAfrica","gs":"SouthGeorgiaAndSandwichIsl.","es":"Spain","lk":"SriLanka","sd":"Sudan","sr":"Suriname","sj":"SvalbardAndJanMayen","sz":"Swaziland","se":"Sweden","ch":"Switzerland","sy":"SyrianArabRepublic","tw":"Taiwan","tj":"Tajikistan","tz":"Tanzania","th":"Thailand","tl":"Timor-Leste","tg":"Togo","tk":"Tokelau","to":"Tonga","tt":"TrinidadAndTobago","tn":"Tunisia","tr":"Turkey","tm":"Turkmenistan","tc":"TurksAndCaicosIslands","tv":"Tuvalu","ug":"Uganda","ua":"Ukraine","ae":"UnitedArabEmirates","gb":"UnitedKingdom","us":"UnitedStates","um":"UnitedStatesOutlyingIslands","uy":"Uruguay","uz":"Uzbekistan","vu":"Vanuatu","ve":"Venezuela","vn":"VietNam","vg":"VirginIslands,British","vi":"VirginIslands,U.S.","wf":"WallisAndFutuna","eh":"WesternSahara","ye":"Yemen","zm":"Zambia","zw":"Zimbabwe"};

let player = new mm.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/salamander');
let sequenceVisualizer;
player.callbackObject = {
  run: (note) => {
    sequenceVisualizer.redraw(note, true);
  },
  stop: () => {
    const els = document.getElementById('visualizer').querySelectorAll('.active');
    for (let i = 0; i < els.length; i++) {
      els[i].removeAttribute('class');
    }
  }
}
let didClick = false;

// Experiments
let leaves;
let activeElementIndex = 10;
document.addEventListener('keydown', handleKeyDown);

// Map pitch -> color.
// const colorScale= d3.scaleOrdinal(d3.quantize(d3.interpolatePlasma, 13))
// const color = d => colorScale((d - 36) % 12)
// Map delta -> color
//const colorScale= d3.scaleOrdinal(d3.quantize(d3.interpolatePlasma, 24))
const warms = d3.scaleOrdinal(d3.quantize(d3.interpolateRdPu, 12+10));
const colds = d3.scaleOrdinal(d3.quantize(d3.interpolateYlGnBu, 12+4));
const color = d => (d < 0) ? colds(Math.abs(d)%12+3) : warms(d%12+10);

for(let i = 0; i < 16; i++) {
  // TODO: figure out why i need this or else the colours are borked.
  console.log(warms(i),colds(i))
}
//const opacityScale =  d3.scaleSqrt().domain([1,20]).range(["0.1","1"]);
const opacityScale =  d3.scaleSqrt().domain([1,20]).range(["1","1"]);

function handleClick(d) {
  const ns = getNoteSequenceFromData(d);
  
  const y = window.scrollY;
  window.location.hash = d.elementIndex; // not the empty string so that it doesn't cause a page refresh
  window.scrollY = y;
  
  // Hear it.
  mm.Player.tone.Transport.stop();
  player.stop();
  player.start(ns);
  didClick = true;
}

function getMostLikelyTiming(d) {
  const possibleTimings = d.descendants().map(d => d.data.timing ? [d.data.value, d.data.timing]: [0,[]]);
  possibleTimings.sort((a,b) => b[0] - a[0]);
  return possibleTimings[0][1];
}

function handleMouseOver(d) {
  handleMouseOverForEl(d, d3.select(this));
}

function handleMouseOut(d) {
  handleMouseOutForEl(d3.select(this));
}

function handleMouseOverForEl(d, el) {
  const y = window.scrollY;
  window.location.hash = 'all'; // not the empty string so that it doesn't cause a page refresh
  window.scrollY = y;
  
  // Did we force select an element? deselect that first.
  
  // Fade all the segments.
  const ancestors = d.ancestors().reverse();
  const svg = d3.select('#svg');
  
  zoomPie(el);
  
  // Fade everything else.
  svg.selectAll('path').style('fill-opacity', 0.1);
  svg.selectAll('.annotation').style('fill-opacity', 0.1);
  svg.selectAll('.annotation').style('stroke-opacity', 0.1);
  
  // Highlight these ancestors.
  svg.selectAll('path')
    .filter((node) => ancestors.indexOf(node) >= 0)
    .style('fill-opacity', 1);

  showTooltip(d, el);
} 

function handleMouseOutForEl(el) {
  player.stop();
  hideTooltip();
  
  const svg = d3.select('#svg');
  
  unzoomPie(el);
  svg.selectAll('path').style('fill-opacity', (d) => opacityScale(d.depth));  
  svg.selectAll('.annotation').style('fill-opacity', 1);
  svg.selectAll('.annotation').style('stroke-opacity', 1);
}


function handleForceSelect(i, data) {
  const el = d3.select(`#p${i}`);
  const d = data || el.data()[0];
  
  if (!d) {
    return;
  }
  handleMouseOverForEl(d, el)
  handleClick.bind(el)(d);
}

function handleKeyDown(e) {
  function mouseOutIndex(i) {
    handleMouseOutForEl(d3.select(`#p${leaves[i].elementIndex}`));
  }
  function selectIndex(i) {
    console.log(leaves[i]);
    if (leaves[i].depth > 14) {
      handleForceSelect(leaves[i].elementIndex, leaves[i]);
      return true;
    } else {
      return false;
      console.log('skipping, too short')
    }
  }
  function prev() {
    activeElementIndex--;
    if (activeElementIndex < 0) {
      activeElementIndex = leaves.length - 1;
    }
  }
  function next() {
    activeElementIndex++;
    if (activeElementIndex >= leaves.length) {
      activeElementIndex = 0
    }
  }
  
  if (e.keyCode == '38' || e.keyCode == '37') {  //up, left
    // Cancel current.
    mouseOutIndex(activeElementIndex);
    
    prev();
    while (!selectIndex(activeElementIndex)) {
      prev();
    }
    e.preventDefault();
  } else if (e.keyCode == '40' || e.keyCode == '39') {  //down
    // Cancel current.
    mouseOutIndex(activeElementIndex);
    
    next();
    while (!selectIndex(activeElementIndex)) {
      next();
    }
  } else if (e.keyCode == '27') { // esc.
    // Cancel current.
    mouseOutIndex(activeElementIndex);
    
    const y = window.scrollY;
    window.location.hash = 'all'; // not the empty string so that it doesn't cause a page refresh
    window.scrollY = y;
    
    activeElementIndex = 10;
  } 
}

function fill(d) {
  if (!d.depth) return '#ccc';
  const deltas = d.ancestors().map(d => parseInt(d.data.name) || 0).reverse();
  
  let previousPitch = 60;
  for (let delta of deltas) {
    previousPitch += delta;
  }
  //return color(previousPitch);
  return color(parseInt(d.data.name));
}

function visualizeNoteSequence(ns, el, minPitch, maxPitch) {
  const viz = document.getElementById(el);
  sequenceVisualizer = new mm.PianoRollSVGVisualizer(ns, viz, {noteHeight:16, pixelsPerTimeStep:60, minPitch:minPitch, maxPitch:maxPitch});
 
  // Colour each note according to its pitch.
  const rects = viz.querySelectorAll('rect');
  let previousPitch = ns.notes[0].pitch
  ns.notes.forEach((n,i) => {
    const text = pitchToNote(n.pitch);
    //rects[i].style.fill = color(n.pitch);
    rects[i].style.fill = color(n.pitch - previousPitch);
    previousPitch = n.pitch;
    d3.select(viz).append('text')
      .text(text)
      .attr('x', parseInt(rects[i].getAttribute('x')) + 4)
      .attr('y', parseInt(rects[i].getAttribute('y')) + 12)
      .attr('fill', 'white');
  });  
}


// el is a d3 element
function showTooltip(d, el) {
  visualizeNoteSequence(getNoteSequenceFromData(d), 'visualizer');
  // Display the value.
  document.getElementById('valueText').textContent = d.value;
  
  
  const tooltip = document.getElementById('tooltip');
  tooltip.removeAttribute('hidden');
  //tooltip.style.borderColor = el.attr('fill')
  
  // Position and show the tooltip.
  const rekt = el.node().getBoundingClientRect();
  const tooltipRekt = tooltip.getBoundingClientRect();

  // Center them above the path.
  let newY = rekt.y - tooltipRekt.height - 10;
  let newX = rekt.x - rekt.width/2 - tooltipRekt.width/2;
  d3.select(tooltip)
    .style('top', newY + document.body.scrollTop)
    .style('left', newX + document.body.scrollLeft);
}

function hideTooltip() {
  if (didClick) {
    return;
  }
  document.getElementById('tooltip').setAttribute('hidden', true);
}

function pitchToNote(p) {
  const n = mm.NoteSequence.KeySignature.Key[(p-36)%12];
  return n.replace('_SHARP', '#');
}

function getNoteSequenceFromData(d) {
  let deltas, timing;
  if (d.deltas) {
    deltas = d.deltas;
    timing = d.timing;
  } else {
    deltas = d.ancestors().map(d => parseInt(d.data.name) || 0).reverse();
    timing = getMostLikelyTiming(d);
  }
  return getNoteSequenceFromDeltasAndTiming(deltas, timing);
}

function getNoteSequenceFromDeltasAndTiming(deltas, timing) {
  // Make a NoteSequence out of these timings and deltas.
  const ns = {notes: [], quantizationInfo: {stepsPerQuarter: 4}};
  let previousPitch = 60;
  for (let i = 0; i < deltas.length; i++) {
    const pitch = previousPitch + deltas[i];
    
    ns.notes.push({pitch: pitch,
      velocity: 80,
      quantizedStartStep: timing.length > 0 ? timing[i][1] : 0,
      quantizedEndStep: timing.length > 0 ? timing[i][2] : 0
    });
    previousPitch = pitch;
  }
  ns.totalQuantizedSteps = ns.notes[ns.notes.length-1].quantizedEndStep;
  return ns;
}

function loadAllSamples() {
  const samples = {notes: [], quantizationInfo: {stepsPerQuarter: 4}};
  for (let i = 60-13; i < 60+13; i++) {
    samples.notes.push({pitch: i,
      velocity: 80,
      quantizedStartStep: 0,
      quantizedEndStep: 1
    });
  }
  player.loadSamples(samples);
}

function zoomPie(el) {
  const radius = (window.innerWidth - 100) / 2;
  const arc = d3.arc()
    .startAngle(d => d.x0 - 10/360)
    .endAngle(d => d.x1 + 10/360)
    .padAngle(d => Math.min((d.x1 - d.x0), 0.005))
    .padRadius(radius / 2)
    .innerRadius(d => d.y0 - 10)
    .outerRadius(d => d.y1 + 10)
  el
  .attr('d_', el.attr('d'))
  .attr('d', arc)
  .attr('fill-opacity', 1)
  .classed('zoom', true);
}

function unzoomPie() {
  d3.selectAll('.zoom').each(function (d,i) { // don't use fat arrow to keep the weird this.
    const el = d3.select(this);
    el.attr('d', el.attr('d_'))
      .attr('fill-opacity', (d) => opacityScale(d.depth))
      .classed('zoom', false);
  });
}

function drawSunburst(data, radius) {
  // https://observablehq.com/@d3/sunburst with tons of changes
  const viewRadius = radius; 
  const partition = data => d3.partition().size([2 * Math.PI, viewRadius])
                    (d3.hierarchy(data)
                      .sum(d => d.value)
                      .sort((a, b) => b.value - a.value))
  const root = partition(data);
  
  // Add an ID to every element so that we can find it later.
  let i = 0;
  root.each((d) => d.elementIndex = i++);
  
  const degree = 2 * Math.PI / 360 / 5;
  let arc, svg;
  
  svg = d3.select('#svg')
    .style('width', radius) // to fit right side labels a bit better
    .style('height', radius)
    .append('g');

  arc = d3.arc()
    .startAngle(d => d.x0 - degree)
    .endAngle(d => d.x1 + degree)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(0)
    .innerRadius(d => d.y0)
    .outerRadius(d => d.y1 - 3)
  
  
  const paths = svg.selectAll('path')
      .data(root.descendants().filter(d => d.depth))
      .enter()
      .append('path')
      .attr('fill', fill)
      .attr('fill-opacity', (d) => opacityScale(d.depth))
      .style('cursor', 'pointer')
      .attr('id', (d) => `p${d.elementIndex}`)
      .attr('d', arc)
  
    paths
      .on('click', handleClick)
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut)
  svg.node();
  
  const el = document.getElementById('svg');
  const box = el.getBBox();
  el.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);  
  
  leaves = root.leaves();
}

function drawPackedSunburst(data, radius, x, y) {
  // https://observablehq.com/@d3/sunburst with tons of changes
  // In all-country view stretch the data out so the per country circles look fuller.
  const viewRadius = radius * 4; 
  const partition = data => d3.partition().size([2 * Math.PI, viewRadius])
                    (d3.hierarchy(data)
                      .sum(d => d.value)
                      .sort((a, b) => b.value - a.value))
  const root = partition(data);
  
  // Add an ID to every element so that we can find it later.
  let i = 0;
  root.each((d) => d.elementIndex = i++);
  
  const degree = 2 * Math.PI / 360 / 5;
  let arc, svg;
  
  svg = d3.select('.base')
    .append('g')
    .attr('transform', `translate(${x},${y})`)

  arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))      
    .padRadius(0)
    .innerRadius(d => Math.min(d.y0, radius))
    .outerRadius(d => Math.min(d.y1, radius))
  
  const paths = svg.selectAll('path')
      .data(root.descendants().filter(d => d.depth))
      .enter()
      .append('path')
      .attr('fill', fill)
      .style('cursor', 'pointer')
      .attr('id', (d) => `p${d.elementIndex}`)
      .attr('d', arc)

  svg.node();
  
  const el = document.getElementById('svg');
  const box = el.getBBox();
  el.setAttribute('viewBox', `${box.x} ${box.y} ${radius * 2} ${radius * 2}`); 
  
  leaves = root.leaves();
}