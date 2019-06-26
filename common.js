const SMALL_SCREEN_SIZE = 500;
const FIRST_MELODY_NOTE = 72;

// Map delta interval -> color. This is how I generated it, but I'm saving it
const colds = ['#DBEDC7','#B3DDCC','#88CDCF','#5FBED3','#40A9D0','#3A90BF','#3176B0','#2A5EA0','#2C5DA0','#1A2781','#0D134D','#0D134D', '#0D134D'];
const warms = ['#FACDAA','#F4ABA1','#F08B97','#EB688C','#DD4F86','#B93F8C','#983291','#762598','#60198A','#4E1772','#3F155C','#2F0F43', '#2F0F43'];
const color = d => (d < 0) ? colds[Math.abs(d)%13] : warms[d%13];

const totalPerCountry = {"us":6581192,"br":1541549,"mx":1057061,"it":893475,"es":838700,"tr":834650,"ru":772695,"uk":673990,"co":564413,"ua":538132,"de":524415,"in":514552,"tw":467485,"ca":446992,"ar":414802,"fr":407252,"pl":283701,"nl":277014,"jp":274463,"vn":270068,"pe":223066,"cl":219882,"ro":187220,"ve":165243,"pt":156389,"hk":133441,"cz":118685,"kr":117294,"ec":115863,"hu":111459,"th":110246,"gr":109671,"se":91388,"ch":86990,"dk":84954,"fi":73833,"by":71752,"il":71359,"gt":67469,"rs":67358,"sk":63443,"at":61128,"hr":57219,"eg":53589,"ie":52418,"cr":51580,"sg":49332,"uy":45725,"sa":45028,"do":42835,"bo":41072,"lt":36976,"si":35197,"sv":34254,"bg":33808,"ae":33594,"pa":29171,"py":27509,"hn":26464,"md":25587,"dz":24657,"bd":23013,"am":20805,"ee":19959,"ba":18385,"pr":16605,"ma":16451,"ni":13542,"tn":12575,"au":11741,"iq":9865,"jo":8993,"lb":8251,"other":8000,"qa":7079,"om":6917,"kw":5585,"is":4728,"ph":2462}
const availableCountries = ['other', 'qa', 'fi', 'fr', 'ni', 'nl', 'in', 'il', 'ie', 'is', 'iq', 'it', 'ar', 'au', 'at', 'ae', 'am', 'lb', 'tw', 'tr', 'lt', 'th', 'tn', 'sv', 'si', 'sk', 'kr', 'kw', 'sa', 'se', 'sg', 'ch', 'cl', 'co', 'ca', 'cz', 'ec', 'cr', 'ma', 've', 'vn', 'br', 'by', 'bg', 'bd', 'ba', 'bo', 'md', 'uy', 'us', 'uk', 'ua', 'mx', 'pa', 'pe', 'eg', 'ee', 'pl', 'pr', 'ps', 'pt', 'py', 'es', 'hk', 'hn', 'hr', 'hu', 'do', 'dk', 'de', 'dz', 'ph', 'ro', 'om', 'gt', 'ru', 'rs', 'gr', 'jo', 'jp'];
const availableCountriesNames = {"other":"other","qa":"Qatar","fi":"Finland","fr":"France","ni":"Nicaragua","nl":"Netherlands","in":"India","il":"Israel","ie":"Ireland","is":"Iceland","iq":"Iraq","it":"Italy","ar":"Argentina","au":"Australia","at":"Austria","ae":"the United Arab Emirates","am":"Armenia","lb":"Lebanon","tw":"Taiwan","tr":"Turkey","lt":"Lithuania","th":"Thailand","tn":"Tunisia","sv":"El Salvador","si":"Slovenia","sk":"Slovakia","kr":"Korea","kw":"Kuwait","sa":"Saudi Arabia","se":"Sweden","sg":"Singapore","ch":"Switzerland","cl":"Chile","co":"Colombia","ca":"Canada","cz":"the Czech Republic","ec":"Ecuador","cr":"CostaRica","ma":"Morocco","ve":"Venezuela","vn":"Vietnam","br":"Brazil","by":"Belarus","bg":"Bulgaria","bd":"Bangladesh","ba":"Bosnia And Herzegovina","bo":"Bolivia","md":"Moldova","uy":"Uruguay","us":"the United States","uk":"the United Kingdom","ua":"Ukraine","mx":"Mexico","pa":"Panama","pe":"Peru","eg":"Egypt","ee":"Estonia","pl":"Poland","pr":"Puerto Rico","ps":"Palestine","pt":"Portugal","py":"Paraguay","es":"Spain","hk":"Hong Kong","hn":"Honduras","hr":"Croatia","hu":"Hungary","do":"the Dominican Republic","dk":"Denmark","de":"Germany","dz":"Algeria","ph":"Philippines","ro":"Romania","om":"Oman","gt":"Guatemala","ru":"Russia","rs":"Serbia","gr":"Greece","jo":"Jordan","jp":"Japan"};

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

function getNoteSequenceFromTiming(timing) {
  // Make a NoteSequence out of these timings and deltas.
  const ns = {notes: [], quantizationInfo: {stepsPerQuarter: 4}};
  for (let i = 0; i < timing.length; i++) {
    ns.notes.push({pitch: timing[i][0],
      velocity: 80,
      instrument: 0,
      quantizedStartStep: timing[i][1],
      quantizedEndStep: timing[i][2]
    });
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
