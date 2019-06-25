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
  if (d.timing && d.timing[0].length === 3) {
    return getNoteSequenceFromTiming(d.timing);
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
let sunburstScale;
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
  root.each((d) => {
    d.x = d.x0;
    d.dx = d.x1 - d.x0;
    d.x_ = d.x;
    d.dx_ = d.dx;

    d.elementIndex = i;
    i++;
    d.current = d;
  });

  const degree = 2 * Math.PI / 360 / 5;
  let arc, svg;
  sunburstScale = d3.scaleLog().range([0, radius]);
  //sunburstScale = (x) => x;

  svg = d3.select('#svg')
    .style('width', radius)
    .style('height', radius)
    .append('g');

  // Add the white circle in the middle.
  svg.append('circle')
    .datum(root)
    .attr('r', radius)
    .attr('fill', 'white')
    .attr('pointer-events', 'all')
    .on('mouseover', hideTooltip)
    .on('click', zoom);

  arc = d3.arc()
    .startAngle(d => d.x0 - degree)
    .endAngle(d => d.x1 + degree)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(20)
    .innerRadius(d => sunburstScale(d.y0))
    .outerRadius(d => sunburstScale(d.y1 - 3))

  const paths = svg.selectAll('path')
      .data(root.descendants().slice(1))
      .enter()
      .append('path')
      .attr('fill', fill)
      .attr('fill-opacity', 1)
      .style('cursor', 'pointer')
      .attr('id', d => `p${d.elementIndex}`)
      .attr('d', d => arc(d.current))
      .on('click', function (d,i) {
        if (d3.event.shiftKey) {
          const ancestors = d.ancestors();
          magnify(ancestors[ancestors.length - 2]);
          magnify(d);
        } else {
          handleClick(d,i);
        }
      })
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut)

  const el = document.getElementById('svg');
  const box = el.getBBox();
  el.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);

  function magnify(node) {
    unzoomPie();

    const parent = node.parent;
    const k = .8;

    if (parent) {
      let x = parent.x0;
      parent.children.forEach((sibling) => {
        x += reposition(sibling, x,
                        sibling === node
                          ? parent.dx * k / node.value
                          : parent.dx * (1 - k) / (parent.value - node.value));
      });
    } else {
      reposition(node, 0, node.dx / node.value);
    }

    paths.transition()
        .duration(400)
        .attrTween('d', arcTween);
  }

  // Recursively reposition the node at position x with scale k.
  function reposition(node, x, k) {
    node.x0 = x;
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        x += reposition(node.children[i], x, k);
      }
    }

    node.dx = node.value * k;
    node.x1 = node.x0 + node.dx;
    return node.dx;
  }

  // Interpolate the arcs in data space.
  function arcTween(a) {
    const i = d3.interpolate({
      x0: a.x_,
      dx: a.dx_,
      x1: a.x_ + a.dx_
    }, a);
    return function(t) {
      const b = i(t);
      a.x_ = b.x0;
      a.dx_ = b.dx;
      return arc(b);
    };
  }



  function zoom(p) {
    unzoomPie();

    // CLicking on the white circle.
    if (p.depth === 0) {
      whiteCircleHint.hidden = true;
    } else {
      whiteCircleHint.hidden = false;
    }

    root.each(d => d.target = {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(20, d.y0 - p.depth),
      y1: Math.max(10, d.y1 - p.depth)
    });

    const t = svg.transition().duration(0);

    // Transition the data on all arcs, even the ones that aren’t visible,
    // so that if this transition is interrupted, entering arcs will start
    // the next transition from the desired position.
    paths.transition(t)
      .tween('data', d => {
        const i = d3.interpolate(d.current, d.target);
        return t => d.current = i(t);
      })
      .attr('fill-opacity', 1)
      .attrTween('d', d => () => arc(d.current));
  }
}

function zoomPie(el) {
  if (!el.attr('d')) {
    return;
  }
  const zoomSize = 10;

  const arc = d3.arc()
    .startAngle(d => d.x0 - zoomSize/360)
    .endAngle(d => d.x1 + zoomSize/360)
    .padAngle(d => Math.min((d.x1 - d.x0), 0.005))
    .padRadius(0)
    .innerRadius(d => sunburstScale(d.y0 - zoomSize))
    .outerRadius(d => sunburstScale(d.y1 + zoomSize))

  el
  .attr('d_', el.attr('d'))
  .attr('d', d => arc(d.current))
  .attr('fill-opacity', 1)
  .attr('stroke-width', sunburstScale(5))
  .classed('zoom', true);
}

function unzoomPie() {
  d3.selectAll('.zoom').each(function (d,i) { // don't use fat arrow to keep the weird this.
    const el = d3.select(this);
    el.attr('d', el.attr('d_'))
      .attr('d_', null)
      .attr('fill-opacity', 1)
      .classed('zoom', false);
  });
}

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
// el is a d3 element
function showTooltip(d, el) {
  // Display the value.
  if (d.data.value) {
    document.getElementById('valueText').textContent = d.data.value;
    document.getElementById('sessionsText').textContent = d.data.sessions;
    if (window.dataText) dataText.hidden = false;
  } else {
    if (window.dataText) dataText.hidden = true;
  }
  if (d.data.country) {
    unseenCountry.textContent = availableCountriesNames[d.data.country];
  }

  if (document.getElementById('unseenSession')){
    unseenSession.hidden = !d.data.unseen;
  }
  if (document.getElementById('countriesText')) {
    countriesText.textContent = availableCountriesNames[d.parent.data.name];
  }
  tooltip.removeAttribute('hidden');

  // Position and show the tooltip. If it's already expanded, then someone
  // else has already done this calculation (i.e from forceSelect()) before
  // this function got called (because it's async) so we don't it anymore.
  if (tooltipIsExpanded) {
    return;
  }
  const rekt = el.node().getBoundingClientRect();
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
  if (melodyTweet) {
    melodyTweet.hidden = true;
  }
  hideTooltip();
  handleMouseOutForEl();
}
/*********************
 * Mouse events
 *********************/
function handleClick(d) {
  // If the tooltip is already expanded, close it (imagine someone clicked outside it).
  // otherwise, do the open dance.
  if (tooltipIsExpanded) {
    closeTooltip();
    window.location.hash = 'all'; // not the empty string so that it doesn't cause a page refresh
    return;
  }

  tooltipIsExpanded = true;

  // Expand the tooltip.
  tooltip.classList.add('expanded');
  tooltip.removeAttribute('hidden');
  btnHarmonize.disabled = false;

  let ns = getNoteSequenceFromData(d);

  player.loadSamples(ns);
  visualizeNoteSequence(ns, 'visualizer');

  // Position it in the center of the svg if it's a big enough screen.
  if (window.innerWidth > SMALL_SCREEN_SIZE) {
    const parentRekt = svg.getBoundingClientRect();
    const tooltipRekt = tooltip.getBoundingClientRect();
    const y = parentRekt.top + (parentRekt.height - tooltipRekt.height) / 2;
    const x = parentRekt.left + (parentRekt.width - tooltipRekt.width) / 2;
    d3.select(tooltip)
      .style('top', y + document.scrollingElement.scrollTop + 'px')
      .style('left', x + document.scrollingElement.scrollLeft + 'px');
  } else {
    d3.select(tooltip)
      .style('top', document.scrollingElement.scrollTop + 50 + 'px')
      .style('left', '10px');
  }
  //tooltip.scrollIntoView();

  // So that we can hardlink.
  window.location.hash = d.elementIndex;

  if (melodyTweet) {
    melodyTweet.hidden = false;
  }
  melodyTweetLink.href = 'https://twitter.com/intent/tweet?hashtags=madewithmagenta&text=' +
  encodeURIComponent('Listen to this melody from the Bach Doodle dataset! ' + window.location.href);
  coucouLink.href = getCoucouLink();
}

function handleHackyClick(d, svgName='svg') {
  // If the tooltip is already expanded, close it (imagine someone clicked outside it).
  // otherwise, do the open dance.
  if (tooltipIsExpanded) {
    closeTooltip();
    window.location.hash = 'all'; // not the empty string so that it doesn't cause a page refresh
    return;
  }

  tooltipIsExpanded = true;

  // Expand the tooltip.
  tooltip.classList.add('expanded');
  tooltip.removeAttribute('hidden');
  btnHarmonize.disabled = false;

  let ns =  getNoteSequenceFromData(d.data);

  player.loadSamples(ns);
  visualizeNoteSequence(ns, 'visualizer');

  let svg = document.querySelector(svgName);

  // Position it in the center of the svg if it's a big enough screen.
  if (window.innerWidth > SMALL_SCREEN_SIZE) {
    const parentRekt = svg.getBoundingClientRect();
    const tooltipRekt = tooltip.getBoundingClientRect();
    const y = parentRekt.top + (parentRekt.height - tooltipRekt.height) / 2;
    const x = parentRekt.left + (parentRekt.width - tooltipRekt.width) / 2;
    d3.select(tooltip)
      .style('top', y + document.scrollingElement.scrollTop + 'px')
      .style('left', x + document.scrollingElement.scrollLeft + 'px');
  } else {
    d3.select(tooltip)
      .style('top', document.scrollingElement.scrollTop + 50 + 'px')
      .style('left', '10px');
  }
  //tooltip.scrollIntoView();

  // So that we can hardlink.
  window.location.hash = d.elementIndex;

  if (melodyTweet) {
    melodyTweet.hidden = false;
  }
  melodyTweetLink.href = 'https://twitter.com/intent/tweet?hashtags=madewithmagenta&text=' +
  encodeURIComponent('Listen to this melody from the Bach Doodle dataset! ' + window.location.href);
  coucouLink.href = getCoucouLink();
}

function handleMouseOver(d) {
  if (tooltipIsExpanded) {
    return;
  }
  handleMouseOverForEl(d, d3.select(this));
}

function handleMouseOut() {
  if (tooltipIsExpanded) {
    return;
  }
  handleMouseOutForEl(d3.select(this));
}

function handleMouseOverForEl(d, el) {
  window.location.hash = 'all'; // not the empty string so that it doesn't cause a page refresh
  zoomPie(el);

  if (document.getElementById('melName')) {
    const label = allLabels && allLabels[d.elementIndex];
    melName.textContent = label ? label.name + '. ' : '';
  }

  // Fade everything.
  const svg = d3.select('#svg');
  svg.selectAll('path').style('fill-opacity', 0.3);

  requestAnimationFrame(() => {
    showTooltip(d, el);
  });

  // Highlight this cell's ancestors.
  const ancestors = d.ancestors().reverse();
  if (!ancestors) {
    return;
  }
  svg.selectAll('path')
    .filter((node) => ancestors.indexOf(node) >= 0)
    .style('fill-opacity', 1);
}

function handleMouseOutForEl() {
  hideTooltip();
  unzoomPie();
  restoreOpacities();
}

function restoreOpacities() {
  const svg = d3.select('#svg');
  svg.selectAll('path').style('fill-opacity', 1);
}

function handleForceSelect(i, data) {
  const el = d3.select(`#p${i}`);
  const d = data || el.data()[0];

  if (!d) {
    return;
  }
  handleMouseOverForEl(d, el);
  handleClick(d, el);
  btnPlay.focus();
}
