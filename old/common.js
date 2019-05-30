const d3 = window.d3;
const mm = window.mm;
const isoCountries={'AF':'Afghanistan','AX':'AlandIslands','AL':'Albania','DZ':'Algeria','AS':'AmericanSamoa','AD':'Andorra','AO':'Angola','AI':'Anguilla','AQ':'Antarctica','AG':'AntiguaAndBarbuda','AR':'Argentina','AM':'Armenia','AW':'Aruba','AU':'Australia','AT':'Austria','AZ':'Azerbaijan','BS':'Bahamas','BH':'Bahrain','BD':'Bangladesh','BB':'Barbados','BY':'Belarus','BE':'Belgium','BZ':'Belize','BJ':'Benin','BM':'Bermuda','BT':'Bhutan','BO':'Bolivia','BA':'BosniaAndHerzegovina','BW':'Botswana','BV':'BouvetIsland','BR':'Brazil','IO':'BritishIndianOceanTerritory','BN':'BruneiDarussalam','BG':'Bulgaria','BF':'BurkinaFaso','BI':'Burundi','KH':'Cambodia','CM':'Cameroon','CA':'Canada','CV':'CapeVerde','KY':'CaymanIslands','CF':'CentralAfricanRepublic','TD':'Chad','CL':'Chile','CN':'China','CX':'ChristmasIsland','CC':'Cocos(Keeling)Islands','CO':'Colombia','KM':'Comoros','CG':'Congo','CD':'Congo,DemocraticRepublic','CK':'CookIslands','CR':'CostaRica','CI':'CoteD\'Ivoire','HR':'Croatia','CU':'Cuba','CY':'Cyprus','CZ':'CzechRepublic','DK':'Denmark','DJ':'Djibouti','DM':'Dominica','DO':'DominicanRepublic','EC':'Ecuador','EG':'Egypt','SV':'ElSalvador','GQ':'EquatorialGuinea','ER':'Eritrea','EE':'Estonia','ET':'Ethiopia','FK':'FalklandIslands(Malvinas)','FO':'FaroeIslands','FJ':'Fiji','FI':'Finland','FR':'France','GF':'FrenchGuiana','PF':'FrenchPolynesia','TF':'FrenchSouthernTerritories','GA':'Gabon','GM':'Gambia','GE':'Georgia','DE':'Germany','GH':'Ghana','GI':'Gibraltar','GR':'Greece','GL':'Greenland','GD':'Grenada','GP':'Guadeloupe','GU':'Guam','GT':'Guatemala','GG':'Guernsey','GN':'Guinea','GW':'Guinea-Bissau','GY':'Guyana','HT':'Haiti','HM':'HeardIsland&McdonaldIslands','VA':'HolySee(VaticanCityState)','HN':'Honduras','HK':'HongKong','HU':'Hungary','IS':'Iceland','IN':'India','ID':'Indonesia','IR':'Iran,IslamicRepublicOf','IQ':'Iraq','IE':'Ireland','IM':'IsleOfMan','IL':'Israel','IT':'Italy','JM':'Jamaica','JP':'Japan','JE':'Jersey','JO':'Jordan','KZ':'Kazakhstan','KE':'Kenya','KI':'Kiribati','KR':'Korea','KW':'Kuwait','KG':'Kyrgyzstan','LA':'LaoPeople\'sDemocraticRepublic','LV':'Latvia','LB':'Lebanon','LS':'Lesotho','LR':'Liberia','LY':'LibyanArabJamahiriya','LI':'Liechtenstein','LT':'Lithuania','LU':'Luxembourg','MO':'Macao','MK':'Macedonia','MG':'Madagascar','MW':'Malawi','MY':'Malaysia','MV':'Maldives','ML':'Mali','MT':'Malta','MH':'MarshallIslands','MQ':'Martinique','MR':'Mauritania','MU':'Mauritius','YT':'Mayotte','MX':'Mexico','FM':'Micronesia,FederatedStatesOf','MD':'Moldova','MC':'Monaco','MN':'Mongolia','ME':'Montenegro','MS':'Montserrat','MA':'Morocco','MZ':'Mozambique','MM':'Myanmar','NA':'Namibia','NR':'Nauru','NP':'Nepal','NL':'Netherlands','AN':'NetherlandsAntilles','NC':'NewCaledonia','NZ':'NewZealand','NI':'Nicaragua','NE':'Niger','NG':'Nigeria','NU':'Niue','NF':'NorfolkIsland','MP':'NorthernMarianaIslands','NO':'Norway','OM':'Oman','PK':'Pakistan','PW':'Palau','PS':'PalestinianTerritory,Occupied','PA':'Panama','PG':'PapuaNewGuinea','PY':'Paraguay','PE':'Peru','PH':'Philippines','PN':'Pitcairn','PL':'Poland','PT':'Portugal','PR':'PuertoRico','QA':'Qatar','RE':'Reunion','RO':'Romania','RU':'RussianFederation','RW':'Rwanda','BL':'SaintBarthelemy','SH':'SaintHelena','KN':'SaintKittsAndNevis','LC':'SaintLucia','MF':'SaintMartin','PM':'SaintPierreAndMiquelon','VC':'SaintVincentAndGrenadines','WS':'Samoa','SM':'SanMarino','ST':'SaoTomeAndPrincipe','SA':'SaudiArabia','SN':'Senegal','RS':'Serbia','SC':'Seychelles','SL':'SierraLeone','SG':'Singapore','SK':'Slovakia','SI':'Slovenia','SB':'SolomonIslands','SO':'Somalia','ZA':'SouthAfrica','GS':'SouthGeorgiaAndSandwichIsl.','ES':'Spain','LK':'SriLanka','SD':'Sudan','SR':'Suriname','SJ':'SvalbardAndJanMayen','SZ':'Swaziland','SE':'Sweden','CH':'Switzerland','SY':'SyrianArabRepublic','TW':'Taiwan','TJ':'Tajikistan','TZ':'Tanzania','TH':'Thailand','TL':'Timor-Leste','TG':'Togo','TK':'Tokelau','TO':'Tonga','TT':'TrinidadAndTobago','TN':'Tunisia','TR':'Turkey','TM':'Turkmenistan','TC':'TurksAndCaicosIslands','TV':'Tuvalu','UG':'Uganda','UA':'Ukraine','AE':'UnitedArabEmirates','GB':'UnitedKingdom','US':'UnitedStates','UM':'UnitedStatesOutlyingIslands','UY':'Uruguay','UZ':'Uzbekistan','VU':'Vanuatu','VE':'Venezuela','VN':'VietNam','VG':'VirginIslands,British','VI':'VirginIslands,U.S.','WF':'WallisAndFutuna','EH':'WesternSahara','YE':'Yemen','ZM':'Zambia','ZW':'Zimbabwe'};

let ZOOM_OPACITY = 0.9;
let SHOULD_RAISE = true;

let player = new mm.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/salamander');
showLegend();

//const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, 12))
const colorScale= d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, 13))
const color = d => colorScale((d - 36) % 12)

function showLegend() {
  window.onload = () => {
    const legend = document.getElementById('legend');
    if (!legend) {
      return;
    }
    for (let i = 0; i < 12; i++) {
      const div = document.createElement('span');
      div.className = 'legend';
      div.style.background = color(i);
      div.textContent = pitchToNote(60 + i);
      legend.appendChild(div);
    }
  } 
}

function handleClick(d, i) {
  const ns = getNoteSequenceFromData(d);
  
  // Hear it.
  player.stop();
  player.start(ns);
}

function getMostLikelyTiming(d) {
  const possibleTimings = d.descendants().map(d => d.data.timing ? [d.data.value, d.data.timing]: [0,[]]);
  possibleTimings.sort((a,b) => b[0] - a[0]);
  return possibleTimings[0][1];
}

function handleMouseOver(d, i) {
  // Fade all the segments.
  const el = d3.select(this);
  const ancestors = d.ancestors().reverse();
  const svg = d3.select('#svg');
  
  if (el.attr('d')) {
    zoomPie(el);
    // Fade everything else.
    svg.selectAll('path').style('fill-opacity', 0.3);
    // Highlight these ancestors.
    svg.selectAll('path')
      .filter((node) => ancestors.indexOf(node) >= 0)
      .style('fill-opacity', 1);
  } else {
    zoomSquare(el);
    // Fade everything else.
    svg.selectAll('rect').style('fill-opacity', 0.3);
    
    // Highlight these ancestors.
    svg.selectAll('rect')
      .filter((node) => ancestors.indexOf(node) >= 0)
      .style('fill-opacity', 1);
  }
  if (SHOULD_RAISE) {
    svg.select(this.parentNode).raise();
  }
  
  //requestAnimationFrame(() => showTooltip(d, i, null, this));
  showTooltip(d, i, null, this);
} 

function handleMouseOut(d, i) {
  const el = d3.select(this);
  const svg = d3.select('#svg');
  if (el.attr('d')) {
    unzoomPie(el);
    svg.selectAll('path').style('fill-opacity', ZOOM_OPACITY);
  } else {
    unzoomSquare(el);
    svg.selectAll('rect').style('fill-opacity', ZOOM_OPACITY);
  }
  if (SHOULD_RAISE)
    svg.select(this.parentNode).lower();
  
  player.stop();
  hideTooltip();
}

function fill(d) {
  if (window.location.hash === '#alt') {
    while (d.depth > 1) d = d.parent; return color(d.data.name);
  } else {
    if (!d.depth) return '#ccc';
      return color(parseInt(d.data.name));
  }
}

// this is the signature of mouseevents in d3.
function showTooltip(d, i, svg, el) {
  // Visualize the note sequence.
  const ns = getNoteSequenceFromData(d);
  new mm.PianoRollSVGVisualizer(ns, document.getElementById('visualizer'));
 
  // Display the value.
  valueText.textContent = d.value;
  let str = '';
  ns.notes.forEach(n => {str += pitchToNote(n.pitch) + ' '});
  seqText.textContent = str;
  
  tooltip.removeAttribute('hidden');

  // Position and show the tooltip.
  const rekt = (el||this).getBoundingClientRect();
  const tooltipRekt = tooltip.getBoundingClientRect();

  let newY = rekt.y + rekt.height + 5 + document.body.scrollTop;
  let newX = rekt.x + 50;
  if (newY > window.innerHeight / 2) {
    newY -= tooltipRekt.height + 50;
  }
  if (newX > window.innerWidth / 2) {
    newX -= tooltipRekt.width + 50;
  }
  d3.select(tooltip)
    .style('top', newY)
    .style('left', newX);
}

function hideTooltip() {
  tooltip.setAttribute('hidden', true);
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
    // sunburst, icicle
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
    
    // this is fine.
    //if (timing.length > 0 && pitch !== timing[i][0]) {
    
    ns.notes.push({pitch: pitch,
      velocity: 80,
      quantizedStartStep: timing.length > 0 ? timing[i][1] : 0,
      quantizedEndStep: timing.length > 0 ? timing[i][2] : 0
    });
    previousPitch = pitch;
  }
  //ns.totalQuantizedSteps = ns.notes[ns.notes.].length;
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

function zoomSquare(el) {
  const x = el.attr('x');
  const y = el.attr('y');
  const w = el.attr('width');
  const h = el.attr('height');

  el
  .attr('x_', x)
  .attr('y_', y)
  .attr('w_', w)
  .attr('h_', h)

  // Update them.
  const h2 = h < 10 ? 20 : h * 1.5;
  const w2 = w * 1.5;
  el
  .attr('x', x - (w2-w)/2)
  .attr('y', y - (h2-h)/2)
  .attr('width', w2)
  .attr('height', h2)
  .attr('fill-opacity', 1)
  .raise();
}

function unzoomSquare(el) {
  el.attr('x', el.attr('x_'))
  .attr('y', el.attr('y_'))
  .attr('width', el.attr('w_'))
  .attr('height', el.attr('h_'))
  .attr('fill-opacity', ZOOM_OPACITY)
  .lower();
}

function zoomPie(el) {
  el.attr('d_', el.attr('d'))
  
  const radius = (window.innerWidth - 100) / 2;
  const arc = d3.arc()
    .startAngle(d => d.x0 - 10/360)
    .endAngle(d => d.x1 + 10/360)
    .padAngle(d => Math.min((d.x1 - d.x0), 0.005))
    .padRadius(radius / 2)
    .innerRadius(d => d.y0 - 10)
    .outerRadius(d => d.y1 + 10)
  el
  .attr('d', arc)
  .attr('fill-opacity', 1)
  
  if (SHOULD_RAISE)
    el.raise();
}
function unzoomPie(el) {
  el.attr('d', el.attr('d_')).attr('fill-opacity', ZOOM_OPACITY);
  if (SHOULD_RAISE)
    el.lower();
}






function drawSunburst(data, radius) {
  // https://observablehq.com/@d3/sunburst
  const partition = data => d3.partition()
    .size([2 * Math.PI, radius])
  (d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value))
  const root = partition(data);

  const degree = 2 * Math.PI / 360 / 5;
  const arc = d3.arc()
    .startAngle(d => d.x0 - degree)
    .endAngle(d => d.x1 + degree)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(0)
    .innerRadius(d => d.y0 - 0)
    .outerRadius(d => d.y1 - 1)

  const svg = d3.select('#svg')
      .style('width', '100%')
      .style('height', 'auto')
      .style('padding', '10px')
      .style('font', '10px sans-serif')
      .style('box-sizing', 'border-box');

  svg.append('g')
      .selectAll('path')
      .data(root.descendants().filter(d => d.depth))
      .enter().append('path')
      .on('click', handleClick)
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut)
      .attr('fill', fill)
      .attr('fill-opacity', ZOOM_OPACITY)
      .style('cursor', 'pointer')
      .attr('d', arc)

  svg.node();

  const el = document.getElementById('svg');
  const box = el.getBBox();
  el.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);  
}