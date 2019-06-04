// Where to load the data from.
const LABELS_URL = './melodyLabels.json';
const TOP_OVERALL_URL = 'data/top_overall.json';
const TOP_PER_COUNTRY_URL = 'https://cdn.glitch.com/b078d442-623b-41f0-a809-48f5f1ec1cbf%2Ftop_per_country.json?1559164216772';
const DATAPOINTS_URL = 'https://cdn.glitch.com/b078d442-623b-41f0-a809-48f5f1ec1cbf%2Fdataset_samples.json?1559248203882';

// Map delta interval -> color. This is how I generated it, but I'm saving it
// as an array so that I don't have to load d3 to have colours.
// const warms = d3.scaleOrdinal(d3.quantize(d3.interpolateRdPu, 12+10));
// const colds = d3.scaleOrdinal(d3.quantize(d3.interpolateYlGnBu, 12+4));
const warms = ["rgb(255, 247, 243)","rgb(254, 238, 235)","rgb(254, 229, 226)","rgb(253, 220, 216)","rgb(252, 210, 206)","rgb(252, 198, 197)","rgb(251, 185, 190)","rgb(251, 171, 184)","rgb(250, 154, 179)","rgb(248, 135, 172)","rgb(246, 115, 166)","rgb(240, 94, 160)","rgb(231, 74, 155)","rgb(219, 55, 149)","rgb(204, 35, 142)","rgb(187, 19, 134)","rgb(168, 7, 128)","rgb(149, 2, 123)","rgb(130, 1, 119)","rgb(111, 1, 115)","rgb(92, 0, 111)","rgb(73, 0, 106)"];
const colds = ["rgb(255, 255, 217)","rgb(245, 251, 197)","rgb(232, 246, 183)","rgb(213, 238, 179)","rgb(186, 228, 181)","rgb(151, 215, 185)","rgb(115, 201, 189)","rgb(83, 187, 193)","rgb(57, 171, 194)","rgb(40, 151, 191)","rgb(33, 127, 183)","rgb(33, 102, 172)","rgb(35, 78, 160)","rgb(32, 57, 144)","rgb(23, 42, 119)","rgb(8, 29, 88)"];
const color = d => (d < 0) ? colds[Math.abs(d)%12+3] : warms[d%12+10];

const availableCountries = ['other', 'qa', 'fi', 'fr', 'ni', 'nl', 'in', 'il', 'ie', 'is', 'iq', 'it', 'ar', 'au', 'at', 'ae', 'am', 'lb', 'tw', 'tr', 'lt', 'th', 'tn', 'sv', 'si', 'sk', 'kr', 'kw', 'sa', 'se', 'sg', 'ch', 'cl', 'co', 'ca', 'cz', 'ec', 'cr', 'ma', 've', 'vn', 'br', 'by', 'bg', 'bd', 'ba', 'bo', 'bh', 'md', 'uy', 'us', 'uk', 'ua', 'mx', 'pa', 'pe', 'eg', 'ee', 'pl', 'pr', 'ps', 'pt', 'py', 'es', 'hk', 'hn', 'hr', 'hu', 'do', 'dk', 'de', 'dz', 'ph', 'ro', 'om', 'gt', 'ru', 'rs', 'gr', 'jo', 'jp'];
const availableCountriesNames = ['other', 'Qatar', 'Finland', 'France', 'Nicaragua', 'Netherlands', 'India', 'Israel', 'Ireland', 'Iceland', 'Iraq', 'Italy', 'Argentina', 'Australia', 'Austria', 'the United Arab Emirates', 'Armenia', 'Lebanon', 'Taiwan', 'Turkey', 'Lithuania', 'Thailand', 'Tunisia', 'El Salvador',  'Slovenia', 'Slovakia', 'Korea', 'Kuwait', 'Saudi Arabia', 'Sweden', 'Singapore',  'Switzerland', 'Chile', 'Colombia', 'Canada', 'CzechRepublic', 'Ecuador', 'CostaRica',  'Morocco', 'Venezuela', 'Vietnam', 'Brazil', 'Belarus', 'Bulgaria',  'Bangladesh', 'Bosnia And Herzegovina', 'Bolivia', 'Bahrain', 'Moldova',  'Uruguay', 'the United States', 'the United Kingdom', 'Ukraine', 'Mexico',  'Panama', 'Peru', 'Egypt', 'Estonia', 'Poland', 'Puerto Rico',  'Palestine', 'Portugal', 'Paraguay', 'Spain', 'Hong Kong',  'Honduras', 'Croatia', 'Hungary', 'Dominican Republic', 'Denmark', 'Germany',  'Algeria', 'Philippines', 'Romania', 'Oman', 'Guatemala', 'Russia', 'Serbia',  'Greece', 'Jordan', 'Japan'];

let player;
let sequenceVisualizer;

// Not all files that import this also import magenta (i.e. world.html) need this.
if (window.mm) {
  player = new mm.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/salamander');

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
}

function visualizeNoteSequence(ns, el) {
  const viz = document.getElementById(el);
  sequenceVisualizer = new mm.PianoRollSVGVisualizer(ns, viz, {noteHeight:14, pixelsPerTimeStep:40});

  // Colour each note according to its pitch.
  const rects = viz.querySelectorAll('rect');
  let previousPitch = ns.notes[0].pitch
  ns.notes.forEach((n,i) => {
    const text = pitchToNote(n.pitch);
    rects[i].style.fill = color(n.pitch - previousPitch);
    previousPitch = n.pitch;

    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textEl.setAttribute('x', parseInt(rects[i].getAttribute('x')) + 4);
    textEl.setAttribute('y', parseInt(rects[i].getAttribute('y')) + 12);
    textEl.setAttribute('fill', 'white');
    textEl.textContent = text;
    viz.appendChild(textEl);
  });
}

function pitchToNote(p) {
  const n = mm.NoteSequence.KeySignature.Key[(p-36)%12];
  return n.replace('_SHARP', '#');
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
