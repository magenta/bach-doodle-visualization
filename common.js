// Where to load the data from.
const LABELS_URL = 'data/melodyLabels.json';
const TOP_OVERALL_URL = 'data/top_overall.json';
const TOP_PER_COUNTRY_PREFIX = 'data/country/';
const TRIVIA_PER_COUNTRY_URL = 'data/trivia_per_country.json';

const DATAPOINTS_URL = 'https://cdn.glitch.com/b078d442-623b-41f0-a809-48f5f1ec1cbf%2Fdataset_samples.json?1559248203882';
const SMALL_SCREEN_SIZE = 500;
const FIRST_MELODY_NOTE = 72;

// Map delta interval -> color. This is how I generated it, but I'm saving it
// as an array so that I don't have to load d3 to have colours.
// const warms = d3.scaleOrdinal(d3.quantize(d3.interpolateRdPu, 12+10));
// const colds = d3.scaleOrdinal(d3.quantize(d3.interpolateYlGnBu, 12+4));
const warms = ["rgb(255, 247, 243)","rgb(254, 238, 235)","rgb(254, 229, 226)","rgb(253, 220, 216)","rgb(252, 210, 206)","rgb(252, 198, 197)","rgb(251, 185, 190)","rgb(251, 171, 184)","rgb(250, 154, 179)","rgb(248, 135, 172)","rgb(246, 115, 166)","rgb(240, 94, 160)","rgb(231, 74, 155)","rgb(219, 55, 149)","rgb(204, 35, 142)","rgb(187, 19, 134)","rgb(168, 7, 128)","rgb(149, 2, 123)","rgb(130, 1, 119)","rgb(111, 1, 115)","rgb(92, 0, 111)","rgb(73, 0, 106)"];
const colds = ["rgb(255, 255, 217)","rgb(245, 251, 197)","rgb(232, 246, 183)","rgb(213, 238, 179)","rgb(186, 228, 181)","rgb(151, 215, 185)","rgb(115, 201, 189)","rgb(83, 187, 193)","rgb(57, 171, 194)","rgb(40, 151, 191)","rgb(33, 127, 183)","rgb(33, 102, 172)","rgb(35, 78, 160)","rgb(32, 57, 144)","rgb(23, 42, 119)","rgb(8, 29, 88)"];
const color = d => (d < 0) ? colds[Math.abs(d)%12+3] : warms[d%12+10];

const totalPerCountry = {"us":6581192, "br":1541549, "mx":1057061, "it":893475, "es":838700, "tr":834650, "ru":772695, "uk":673990, "co":564413, "ua":538132, "de":524415, "in":514552, "tw":467485, "ca":446992, "ar":414802, "fr":407252, "pl":283701, "nl":277014, "jp":274463, "vn":270068, "pe":223066, "cl":219882, "ro":187220, "ve":165243, "pt":156389, "hk":133441, "cz":118685, "kr":117294, "ec":115863, "hu":111459, "th":110246, "gr":109671, "se":91388, "ch":86990, "dk":84954, "fi":73833, "by":71752, "il":71359, "gt":67469, "rs":67358, "sk":63443, "at":61128, "hr":57219, "eg":53589, "ie":52418, "cr":51580, "sg":49332, "uy":45725, "sa":45028, "do":42835, "bo":41072, "lt":36976, "si":35197, "sv":34254, "bg":33808, "ae":33594, "pa":29171, "py":27509, "hn":26464, "md":25587, "dz":24657, "bd":23013, "am":20805, "ee":19959, "ba":18385, "pr":16605, "ma":16451, "ni":13542, "tn":12575, "au":11741, "iq":9865, "jo":8993, "lb":8251, "other":8000, "qa":7079, "om":6917, "kw":5585, "ps":5370, "is":4728, "ph":2462};
const availableCountries = ['other', 'qa', 'fi', 'fr', 'ni', 'nl', 'in', 'il', 'ie', 'is', 'iq', 'it', 'ar', 'au', 'at', 'ae', 'am', 'lb', 'tw', 'tr', 'lt', 'th', 'tn', 'sv', 'si', 'sk', 'kr', 'kw', 'sa', 'se', 'sg', 'ch', 'cl', 'co', 'ca', 'cz', 'ec', 'cr', 'ma', 've', 'vn', 'br', 'by', 'bg', 'bd', 'ba', 'bo', 'md', 'uy', 'us', 'uk', 'ua', 'mx', 'pa', 'pe', 'eg', 'ee', 'pl', 'pr', 'ps', 'pt', 'py', 'es', 'hk', 'hn', 'hr', 'hu', 'do', 'dk', 'de', 'dz', 'ph', 'ro', 'om', 'gt', 'ru', 'rs', 'gr', 'jo', 'jp'];
const availableCountriesNames = {"other":"other","qa":"Qatar","fi":"Finland","fr":"France","ni":"Nicaragua","nl":"Netherlands","in":"India","il":"Israel","ie":"Ireland","is":"Iceland","iq":"Iraq","it":"Italy","ar":"Argentina","au":"Australia","at":"Austria","ae":"the United Arab Emirates","am":"Armenia","lb":"Lebanon","tw":"Taiwan","tr":"Turkey","lt":"Lithuania","th":"Thailand","tn":"Tunisia","sv":"El Salvador","si":"Slovenia","sk":"Slovakia","kr":"Korea","kw":"Kuwait","sa":"Saudi Arabia","se":"Sweden","sg":"Singapore","ch":"Switzerland","cl":"Chile","co":"Colombia","ca":"Canada","cz":"CzechRepublic","ec":"Ecuador","cr":"CostaRica","ma":"Morocco","ve":"Venezuela","vn":"Vietnam","br":"Brazil","by":"Belarus","bg":"Bulgaria","bd":"Bangladesh","ba":"Bosnia And Herzegovina","bo":"Bolivia","md":"Moldova","uy":"Uruguay","us":"the United States","uk":"the United Kingdom","ua":"Ukraine","mx":"Mexico","pa":"Panama","pe":"Peru","eg":"Egypt","ee":"Estonia","pl":"Poland","pr":"Puerto Rico","ps":"Palestine","pt":"Portugal","py":"Paraguay","es":"Spain","hk":"Hong Kong","hn":"Honduras","hr":"Croatia","hu":"Hungary","do":"Dominican Republic","dk":"Denmark","de":"Germany","dz":"Algeria","ph":"Philippines","ro":"Romania","om":"Oman","gt":"Guatemala","ru":"Russia","rs":"Serbia","gr":"Greece","jo":"Jordan","jp":"Japan"};

let player;
let sequenceVisualizer;
let coconet;

/****************
 * Setup
 ****************/
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
      btnPlay.textContent = 'play';
    }
  }
  coconet = new mm.Coconet(`https://storage.googleapis.com/magentadata/js/checkpoints/coconet/bach`);
  coconet.initialize();
}

/****************
 * Visualize NoteSequences
 ****************/
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
    textEl.setAttribute('x', parseInt(rects[i].getAttribute('x')) + 6);
    textEl.setAttribute('y', parseInt(rects[i].getAttribute('y')) + 10);
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
  let previousPitch = FIRST_MELODY_NOTE;
  for (let i = 0; i < deltas.length; i++) {
    const pitch = previousPitch + deltas[i];

    ns.notes.push({pitch: pitch,
      velocity: 80,
      instrument: 0,
      quantizedStartStep: timing.length > 0 ? timing[i][1] : 0,
      quantizedEndStep: timing.length > 0 ? timing[i][2] : 0
    });
    previousPitch = pitch;
  }
  ns.totalQuantizedSteps = ns.notes[ns.notes.length-1].quantizedEndStep;
  return ns;
}
/****************
 * Playing NoteSequences
 ****************/
function playMelody() {
  if (player.isPlaying()) {
    stopMelody();
    return;
  }
  mm.Player.tone.Transport.stop();
  player.stop();
  btnPlay.textContent = 'stop';
  sequenceVisualizer.noteSequence.tempos = [{qpm:80, time:0}];
  player.start(sequenceVisualizer.noteSequence);
}

function stopMelody() {
  player.stop();
  btnPlay.textContent = 'play';
}

function loadAllSamples() {
  const samples = {notes: [], quantizationInfo: {stepsPerQuarter: 4}};
  for (let i = FIRST_MELODY_NOTE - 13; i < FIRST_MELODY_NOTE + 13; i++) {
    samples.notes.push({pitch: i,
      velocity: 80,
      quantizedStartStep: 0,
      quantizedEndStep: 1
    });
  }
  player.loadSamples(samples);
}

/****************
 * Coconet
 ****************/
async function harmonize(event) {
  stopMelody();

  const statusEl = document.querySelector('.tooltip .status');
  statusEl.hidden = false;
  event.target.disabled = true;
  await mm.tf.nextFrame();

  const original = sequenceVisualizer.noteSequence;
  // If there are any notes above 82, clamp them down.
  original.notes.forEach(n => n.pitch = Math.min(81, n.pitch));

  coconet.infill(original, {temperature:0.5}).then((output) => {
    stopMelody();
    const fixedOutput =
      mm.sequences.replaceInstruments(
        mm.sequences.mergeConsecutiveNotes(output), original);
    visualizeNoteSequence(fixedOutput, 'visualizer');
    statusEl.hidden = true;

  });
}

function getCoucouLink() {
  let s = '';
  const ns = sequenceVisualizer.noteSequence;
  for (let i = 0; i < ns.notes.length; i++) {
    const note = ns.notes[i];
    for (let t = note.quantizedStartStep; t < note.quantizedEndStep; t++) {
      s += `${note.pitch}:${t}:${note.instrument},`
    }
  }
  return 'http://coconet.glitch.me/#' + s.substring(0, s.length - 1);
}
