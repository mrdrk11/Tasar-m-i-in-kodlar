// Digit outlines taken from the site's own typeface (Archivo, heavy and
// slightly expanded), so 3D numerals match the lettering on the page.
// Supports the characters 0-9 and "/".
import * as THREE from 'three';
import data from './glyphs.json';

/**
 * Shapes for `text`, laid out left to right starting at x = 0 on the baseline.
 * `size` is the em size in scene units; `tracking` adds space between glyphs
 * (in ems). Returns { shapes, width, capHeight }.
 */
export function numeralShapes(text, size = 1, tracking = 0) {
  const shapes = [];
  let x = 0;
  for (const ch of text) {
    const g = data.glyphs[ch];
    if (!g) { x += 0.3 * size; continue; }
    const path = new THREE.ShapePath();
    for (const c of g.path) {
      if (c[0] === 'M') path.moveTo(x + c[1] * size, c[2] * size);
      else if (c[0] === 'L') path.lineTo(x + c[1] * size, c[2] * size);
      else if (c[0] === 'Q') path.quadraticCurveTo(x + c[1] * size, c[2] * size, x + c[3] * size, c[4] * size);
      else if (c[0] === 'C') path.bezierCurveTo(x + c[1] * size, c[2] * size, x + c[3] * size, c[4] * size, x + c[5] * size, c[6] * size);
    }
    // TrueType outlines: solids run clockwise, counters the other way.
    shapes.push(...path.toShapes(false));
    x += (g.advance + tracking) * size;
  }
  return { shapes, width: x - tracking * size, capHeight: data.capHeight * size };
}

/** Extruded, bevelled, centred geometry for a string of numerals. */
export function numeralGeometry(text, { size = 1, depth = 0.3, bevel = 0.04, curveSegments = 8, tracking = 0 } = {}) {
  const { shapes } = numeralShapes(text, size, tracking);
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth, curveSegments, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.75, bevelSegments: 4,
  });
  geo.computeBoundingBox();
  const b = geo.boundingBox;
  geo.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, -(b.min.z + b.max.z) / 2);
  geo.computeBoundingBox();
  return geo;
}
