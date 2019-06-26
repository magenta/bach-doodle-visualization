function drawTreemap(data, width, height) {
  const countryColors = d3.scaleOrdinal(d3.quantize(d3.interpolateWarm, data.children.length));

  const opacity = d3.scaleLinear().range(["0.5", "1.0"]).domain([0, 1000]).clamp(true);

  const treemap = data => d3.treemap()
    .tile(d3['treemapSquarify'])
    .size([width, height])
    .paddingInner(1)
    .paddingOuter(8)
    (d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value))
  const root = treemap(data);

  // Add an ID to every element so that we can find it later.
  let i = 0;
  root.each((d) => {
    d.elementIndex = i;
    i++;
  });

  let isZoomedIn = false;

  const svg = d3.select('#svg')
    .attr('width', width)
    .attr('height', height)
    .on('click', () => zoom(null));

  svg
    .selectAll('rect')
    .data(root.descendants().slice(1))
    .enter()
    .append('rect')
      .attr('x', (d) => d.x0)
      .attr('y', (d) => d.y0)
      .attr('width', (d) => Math.max(4, d.x1 - d.x0))
      .attr('height', (d) =>  Math.max(4, d.y1 - d.y0))
      .attr('id', d => `p${d.elementIndex}`)
      .attr('fill', (d, i) => {
        return !d.children ?
            countryColors(availableCountries.indexOf(d.parent.data.name))
            : 'white';
      })
      .attr('fill-opacity', d => opacity(d.data.value))
      .attr('stroke-width', '3px')
      .on('mouseover', function(d) {
        d3.select(this).attr('stroke', 'black');
        if (tooltipIsExpanded) {
          return;
        }
        if (d.children) {
          d3.select('#melodyInstructions').attr('hidden', true);
          d3.select('#countryInstructions').attr('hidden', null);
          showTooltip.call(this, d);
        } else {
          d3.select('#melodyInstructions').attr('hidden', null);
          d3.select('#countryInstructions').attr('hidden', true);
          handleMouseOver.call(this, d);
          // On mobile, hover is a bit of a lie, so act as a click.
          if ('ontouchstart' in window) handleClick.call(this, d);
        }
      })
      .on('mouseout', function(d) {
        d3.select(this).attr('stroke', null);
        if (tooltipIsExpanded) {
          return;
        }
        if (d.children) {
          hideTooltip();
        } else {
          handleMouseOut.call(this, d);
        }
      })
      .on('click', d => {
        if (focus !== d) {
          if (d.children) {
            zoom(isZoomedIn ? null : d);
            d3.event.stopPropagation()
          } else if (!d.children) {
            // Hardlinking calls forceSelect.
            window.location.hash = d.elementIndex;
            d3.event.stopPropagation();
          }
        }
      });

  svg
    .selectAll('text')
    .data(root.descendants().filter((d) => d.depth === 1))
    .enter()
    .append('text')
      .attr('x', d => d.x0 + (d.x1 - d.x0) / 2)
      .attr('y', d => d.y0 + (d.y1 - d.y0) / 2)
      .text(d => {
        if (Math.min(d.x1 - d.x0, d.y1 - d.y0) > 30)
          return d.data.name.toUpperCase();
        else
          return '';
      })
      .attr('font-size', d => '20px')
      .attr('fill', 'black')
      .style('font-weight', 'bold')
      .style('font-family', 'inherit')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle');

  function zoom(d) {
    const svgEl = document.getElementById('svg');
    if (d) {
      isZoomedIn = true;
      const el = document.getElementById(`p${d.elementIndex}`);
      if (!el) {
        return;
      }
      const bbox = el.getBBox();
      svgEl.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
      svg.selectAll('rect').attr('stroke-width', '1px');
    } else {
      isZoomedIn = false;
      svgEl.removeAttribute('viewBox');
      svg.selectAll('rect').attr('stroke-width', '3px');
    }
  }
}

// Override the default since these labels are a bit different.
function displayMelodyName(d) {
  if (!d) {
    d3.select('#melodyText').attr('hidden', true);
    d3.select('#melodyNameText').text('');
    return;
  }

  const ns = tooltipIsExpanded ?
      sequenceVisualizer.noteSequence : getNoteSequenceFromData(d)
  if (!ns) {
    return;
  }
  // Is there a label for this pitch sequence?
  let str = '';
  ns.notes.forEach(n => str += n.pitch + ' ');
  const name = labels[str.trim()];

  if (name) {
    d3.select('#melodyText').attr('hidden', null);
    d3.select('#melodyNameText').text(name);
  } else {
    d3.select('#melodyText').attr('hidden', true);
    d3.select('#melodyNameText').text('');
  }
}
