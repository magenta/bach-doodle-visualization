/**
 * @license
 * Copyright 2019 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function drawSunburst(data, radius, filledInnerCircle=false) {
  // Based on https://observablehq.com/@d3/sunburst with tons of changes.
  const viewRadius = radius;
  const partition = data => d3.partition().size([2 * Math.PI, viewRadius])
                    (d3.hierarchy(data)
                      .sum(d => d.value)
                      .sort((a, b) => b.value - a.value))
  const root = partition(data);
  const totalSize = root.value;

  // Add an ID to every element so that we can find it later.
  let i = 0;
  root.each((d) => {
    d.x = d.x0;
    d.dx = d.x1 - d.x0;
    d.x_ = d.x_init = d.x;
    d.dx_ = d.dx_init = d.dx;

    d.elementIndex = i;
    i++;
  });

  const degree = 2 * Math.PI / 360 / 5;
  let arc, svg;
  const sunburstScale = d3.scaleLog().range([0, radius]);

  svg = d3.select('#svg')
    .style('width', radius)
    .style('height', radius)
    .on('click', () => {
      reset();
      closeTooltip();
      paths.transition()
        .duration(400)
        .attrTween('d', arcTween);
    })
    .append('g');

  arc = d3.arc()
    .startAngle(d => d.x0 - degree)
    .endAngle(d => d.x1 + degree)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(20)
    .innerRadius(d => d.depth === 1 && filledInnerCircle ? 0 : sunburstScale(d.y0))
    .outerRadius(d => sunburstScale(d.y1 - 3));

  const paths = svg.selectAll('path')
      .data(root.descendants().slice(1))
      .enter()
      .append('path')
      .attr('fill', fill)
      .attr('fill-opacity', 1)
      .style('cursor', 'pointer')
      .attr('id', d => `p${d.elementIndex}`)
      .attr('d', d => arc(d))
      .on('click', function (d,i) {
        if (d3.event.shiftKey) {
          reset();
          unzoomPie();
          const ancestors = d.ancestors();
          for (let i = ancestors.length - 1; i > 0; i--) {
            magnify(ancestors[i]);
          }
          paths.transition()
            .duration(400)
            .attrTween('d', arcTween);
        } else {
          // Hardlinking calls forceSelect.
          window.location.hash = d.elementIndex;
        }
        d3.event.stopPropagation();
      })
      .on('mouseover', function(d) {
        // Update the middle explanation.
        let percent = (100 * d.value / totalSize).toPrecision(3);
        if (percent < 0.1) {
          percent = '< 0.1';
        }

        d3.select('#percentage').text(percent + '%');
        d3.select('.instructions').attr('hidden', true);
        d3.select('.stat').attr('hidden', null);
        d3.select('.hint').attr('hidden', null);

        if (d.data.value) {
          d3.select('#statValue').html(`🔥Harmonized <b>${d.data.value}</b> times.`);
        } else {
          d3.select('#statValue').text('Not in the top 2000.');
        }
        displayMelodyName(d);
        zoomPie(d3.select(this));
        updateOpacities(d);
        d3.event.stopPropagation();
      })
      .on('mouseout', function() {
        d3.select('.instructions').attr('hidden', null);
        d3.select('.stat').attr('hidden', true);
        d3.select('.hint').attr('hidden', true);

        unzoomPie();
        restoreOpacities();
        d3.event.stopPropagation();
      });

  const el = document.getElementById('svg');
  const box = el.getBBox();
  el.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);

  function reset() {
    paths.attr('d', d => {
      d.x0 = d.x = d.x_ = d.x_init;
      d.dx = d.dx_ = d.dx_init;
      d.x1 = d.x0 + d.dx_;
      return arc(d);
    });
  }

  function magnify(node) {
    if (!node) {
      return;
    }
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
    .raise()
    .attr('d_', el.attr('d'))  // Save this for later so that we can unzoom.
    .attr('d', d => arc(d))
    .attr('fill-opacity', 1)
    .classed('zoom', true);
  }

  function unzoomPie() {
    d3.selectAll('.zoom').each(function () { // don't use fat arrow to keep the weird this.
      const el = d3.select(this);
      el.attr('d', el.attr('d_'))
        .attr('d_', null)
        .attr('fill-opacity', 1)
        .classed('zoom', false);
    });
  }

  function updateOpacities(d) {
    const svg = d3.select('#svg');

    // Fade everything out.
    svg.selectAll('path').style('fill-opacity', 0.3);

    // Unfade this melody.
    const ancestors = d.ancestors().reverse();
    svg.selectAll('path')
      .filter((node) => ancestors.indexOf(node) >= 0)
      .style('fill-opacity', 1);
  }

  function restoreOpacities() {
    d3.select('#svg').selectAll('path').style('fill-opacity', 1);
  }
}
