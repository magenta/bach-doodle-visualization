let tooltipIsExpanded = false;

/*********************
 * D3 -> Note Sequence
 *********************/
function getMostLikelyTiming(d) {
  const possibleTimings = d.descendants().map(d => d.data.timing ? [d.data.value, d.data.timing]: [0,[]]);
  possibleTimings.sort((a,b) => b[0] - a[0]);
  return possibleTimings[0][1];
}

function getNoteSequenceFromData(d) {
  if (d.data.timing && d.data.timing[0].length === 3) {
    return getNoteSequenceFromTiming(d.data.timing);
  }

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

function displayMelodyName(d) {
  const label = allLabels && allLabels[d.elementIndex];
  d3.select('#melName').text(label ? label.name + '. ' : '');
  d3.select('#statMelName').text(label ? '🎵' + label.name: '');
}

function updateMelodyName(d) {
  let ns;
  if (tooltipIsExpanded) {
    ns = sequenceVisualizer.noteSequence;
  } else if (d) {
    ns = getNoteSequenceFromData(d);
  }
  if (!ns) {
    return;
  }
  // Is there a label for this pitch sequence?
  let str = '';
  ns.notes.forEach(n => str += n.pitch + ' ');
  const name = allLabels[str.trim()];

  if (name) {
    melodyText.hidden = false;
    melodyNameText.textContent = name;
  } else {
    melodyText.hidden = true;
  }
}
/*********************
 * D3 viz drawing
 *********************/
function fill(d) {
  if (!d.depth) return '#ccc';
  if (d.data.unseen) return '#FFD138';
  return color(parseInt(d.data.name));
}

function visualizeNoteSequence(ns, el, minPitch, maxPitch) {
  const viz = document.getElementById(el);
  sequenceVisualizer = new mm.PianoRollSVGVisualizer(ns, viz, {noteHeight:16, pixelsPerTimeStep:60, minPitch:minPitch, maxPitch:maxPitch});

  // Colour each note according to its pitch.
  const rects = viz.querySelectorAll('rect');
  let previousPitch = FIRST_MELODY_NOTE;
  ns.notes.forEach((n,i) => {
    const text = pitchToNote(n.pitch);
    rects[i].style.fill = color(n.pitch - previousPitch);

    previousPitch = n.pitch;
    d3.select(viz).append('text')
      .text(text)
      .attr('x', parseInt(rects[i].getAttribute('x')) + 4)
      .attr('y', parseInt(rects[i].getAttribute('y')) + 12)
      .attr('fill', 'white');
  });
}

/*********************
 * Tooltip
 *********************/
function showTooltip(d) {
  // Display the value.
  if (d.data.value) {
    d3.select('#valueText').text(d.data.value);
    d3.select('#sessionsText').text(d.data.sessions);
    d3.select('#dataText').attr('hidden', null);
    d3.select('#noDataText').attr('hidden', true);
  } else {
    d3.select('#dataText').attr('hidden', true);
    d3.select('#noDataText').attr('hidden', null);
  }

  if (d.data.country) {
    d3.select('#unseenCountry').text(availableCountriesNames[d.data.country]);
    unseenCountry.textContent = availableCountriesNames[d.data.country];
  }

  d3.select('#unseenSession').attr('hidden', !d.data.unseen);
  if (d.parent) {
    d3.select('#countriesText').text(availableCountriesNames[d.parent.data.name]);
  }
  tooltip.removeAttribute('hidden');

  // Position and show the tooltip. If it's already expanded, then someone
  // else has already done this calculation (i.e from forceSelect()) before
  // this function got called (because it's async) so we don't it anymore.
  if (tooltipIsExpanded) {
    return;
  }
  const rekt = this.getBoundingClientRect();
  const tooltipRekt = tooltip.getBoundingClientRect();

  // Center them above the path.
  let newY = rekt.y - tooltipRekt.height - 10;
  let newX = Math.max(20, rekt.x - rekt.width/2 - tooltipRekt.width/2);
  d3.select(tooltip)
    .style('top', newY + document.scrollingElement.scrollTop + 'px')
    .style('left', newX + document.scrollingElement.scrollLeft + 'px');
}

function hideTooltip() {
  if (tooltipIsExpanded) {
    return;
  }
  document.getElementById('tooltip').setAttribute('hidden', true);
}

function closeTooltip() {
  stopMelody();
  document.getElementById('tooltip').classList.remove('expanded');
  tooltipIsExpanded = false;
  d3.select('#melodyTweet').attr('hidden', true);
  d3.select('#coucouField').attr('hidden', true);

  // Don't set this to the empty string since that causes a page refresh.
  window.location.hash = 'all';
  hideTooltip();
}

/*********************
 * Mouse events
 *********************/
function handleClick(d) {
  // Expand the tooltip.
  tooltipIsExpanded = true;

  // If it's hidden, show it first.
  if (tooltip.hasAttribute('hidden')) {
    showTooltip(d);
    displayMelodyName(d);
  }
  tooltip.classList.add('expanded');
  btnHarmonize.disabled = false;

  // Show note sequence.
  let ns = getNoteSequenceFromData(d);
  player.loadSamples(ns);
  visualizeNoteSequence(ns, 'visualizer');

  // Position it in the center of the svg if it's a big enough screen.
  if (window.innerWidth > SMALL_SCREEN_SIZE) {
    const parentRekt = d3.event.currentTarget.getBoundingClientRect();
    const tooltipRekt = tooltip.getBoundingClientRect();
    const y = parentRekt.top + (parentRekt.height - tooltipRekt.height) / 2;
    const x = (window.innerWidth - tooltipRekt.width) / 2;
    d3.select(tooltip)
      .style('top', y + document.scrollingElement.scrollTop + 'px')
      .style('left', x + 'px');
  } else {
    d3.select(tooltip)
      .style('top', document.scrollingElement.scrollTop + 50 + 'px')
      .style('left', '10px');
  }

  // No hash, no tweet link.
  const pathIndex = window.location.hash.slice(1);
  if (pathIndex !== '' && pathIndex !== 'all' ) {
    d3.select('#melodyTweet').attr('hidden', null);
    d3.select('#melodyTweetLink').attr('href',
      'https://twitter.com/intent/tweet?hashtags=madewithmagenta&text=' +
      encodeURIComponent('Listen to this melody from the Bach Doodle dataset! ' + window.location.href));
  } else {
    d3.select('#melodyTweet').attr('hidden', true);
  }
  d3.select('#coucouField').attr('hidden', null);
  d3.select('#coucouLink').attr('href', getCoucouLink());
}

function handleMouseOver(d) {
  // If we're already looking at something, leave it be.
  if (tooltipIsExpanded) {
    return;
  }
  // Don't set this to the empty string since that causes a page refresh.
  window.location.hash = 'all';
  displayMelodyName(d);
  showTooltip.call(this, d);
}

function handleMouseOut() {
  // If we're already looking at something, leave it be.
  if (tooltipIsExpanded) {
    return;
  }
  hideTooltip();

  d3.select('#melName').text('');
  d3.select('#statMelName').text('');
}

function handleForceSelect() {
  // If there's a hash, we should try to select that melody.
  const pathIndex = window.location.hash.slice(1);
  if (pathIndex == '') {
    return
  }

  const el = d3.select(`#p${pathIndex}`);
  if (!el.node()) {
    return
  }
  d3.event = {currentTarget: document.getElementById('svg')}
  handleClick(el.data()[0]);
  btnPlay.focus();
}
