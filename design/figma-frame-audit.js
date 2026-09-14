/**
 * figma-frame-audit.js — paste the body of frameAudit() into `use_figma` and call it.
 *
 * Purpose: dump a Figma frame's geometry + copy in a NORMALISED shape that can be diffed
 * against a DOM dump of the running app, so "matches the app 1:1" is a numeric claim
 * rather than an impression. Built for the Care2Sleep coach-view replication.
 *
 * Coordinates are returned RELATIVE TO THE FRAME ORIGIN, because the frame's absolute
 * position on the canvas is arbitrary while the app's are relative to the viewport.
 * That normalisation is the whole point — comparing absolute coords is meaningless.
 *
 * Pair with the app-side dump described in coach-figma-build-context.md §2. The app dump
 * must be taken AFTER un-stranding the frozen framer-motion transforms, or every y value
 * is 7-20px off and the diff is worthless.
 */

function frameAudit(frame, opts) {
  opts = opts || {};
  const maxDepth = opts.maxDepth == null ? 12 : opts.maxDepth;
  const origin = frame.absoluteBoundingBox;

  const hex = (c) =>
    '#' + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');

  const paintOf = (n) => {
    if (!('fills' in n) || n.fills === figma.mixed || !n.fills.length) return null;
    const f = n.fills.find((p) => p.visible !== false);
    if (!f) return null;
    if (f.type !== 'SOLID') return f.type;
    // opacity matters: the coach banner's body copy is white at 90%
    return hex(f.color) + (f.opacity != null && f.opacity < 1 ? '@' + f.opacity.toFixed(2) : '');
  };

  const strokeOf = (n) => {
    if (!('strokes' in n) || !n.strokes.length) return null;
    const s = n.strokes.find((p) => p.visible !== false);
    if (!s || s.type !== 'SOLID') return null;
    return hex(s.color) + '/' + (typeof n.strokeWeight === 'number' ? n.strokeWeight : 'mixed');
  };

  const rows = [];

  const visit = (n, depth, path) => {
    const b = n.absoluteBoundingBox;
    const row = {
      path,
      name: n.name,
      type: n.type,
      // normalised to the frame, rounded — sub-pixel noise is not a finding
      x: b ? Math.round(b.x - origin.x) : null,
      y: b ? Math.round(b.y - origin.y) : null,
      w: b ? Math.round(b.width) : null,
      h: b ? Math.round(b.height) : null
    };

    if (n.layoutMode && n.layoutMode !== 'NONE') {
      row.layout = n.layoutMode;
      row.gap = n.itemSpacing;
      row.pad = [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/');
      if (n.primaryAxisAlignItems !== 'MIN') row.mainAlign = n.primaryAxisAlignItems;
      if (n.counterAxisAlignItems !== 'MIN') row.crossAlign = n.counterAxisAlignItems;
      if (n.layoutWrap === 'WRAP') row.wrap = true;
    }

    const fill = paintOf(n);
    if (fill) row.fill = fill;
    const stroke = strokeOf(n);
    if (stroke) row.stroke = stroke;
    if (typeof n.cornerRadius === 'number' && n.cornerRadius) row.radius = n.cornerRadius;
    if ('effects' in n && n.effects.length) {
      row.effects = n.effects
        .filter((e) => e.visible !== false)
        .map((e) => e.type + ':' + (e.radius != null ? e.radius : ''))
        .join(',');
    }

    if (n.type === 'TEXT') {
      row.chars = n.characters;
      row.size = n.fontSize;
      row.weight = n.fontName && n.fontName.style;
      // a bound style is the contract; a raw size is a smell worth surfacing
      row.styleBound = !!(n.textStyleId && n.textStyleId !== '');
    }

    if (n.type === 'INSTANCE') {
      row.master = n.mainComponent ? n.mainComponent.name : null;
      const props = n.componentProperties || {};
      const variant = Object.keys(props)
        .filter((k) => props[k].type === 'VARIANT')
        .map((k) => k + '=' + props[k].value)
        .join(', ');
      if (variant) row.variant = variant;
    }

    // absolute positioning inside auto layout is legal ONLY for overlays; flag it so a
    // reviewer can confirm each case is deliberate rather than a dropped-out-of-flow node
    if (n.layoutPositioning === 'ABSOLUTE') row.absolute = true;

    rows.push(row);

    if (depth < maxDepth && 'children' in n) {
      n.children.forEach((c, i) => {
        if (c.visible === false) return; // invisible sizers are not part of the rendered result
        visit(c, depth + 1, path + '/' + i);
      });
    }
  };

  visit(frame, 0, '0');

  // page-level integrity checks, the Figma-side equivalent of design/layout-audit.js
  const findings = [];
  const frameRight = origin.x + origin.width;
  rows.forEach((r) => {
    if (r.x != null && r.w != null && r.x + r.w > origin.width + 1 && !r.absolute) {
      findings.push('overflows frame width: ' + r.name + ' (' + r.path + ') right edge ' + (r.x + r.w));
    }
    if (r.type === 'TEXT' && !r.styleBound) {
      findings.push('text not bound to a style: "' + String(r.chars).slice(0, 40) + '" (' + r.path + ')');
    }
    if (/^(Frame|Rectangle|Group|Vector|Text|Ellipse|Line)( \d+)?$/.test(r.name)) {
      findings.push('unnamed layer: ' + r.name + ' (' + r.path + ')');
    }
    if (r.type !== 'TEXT' && r.h != null && r.h < 36 && /button|cta|btn/i.test(r.name)) {
      findings.push('control under the 36px floor: ' + r.name + ' h' + r.h + ' (' + r.path + ')');
    }
  });

  return {
    frame: { id: frame.id, name: frame.name, w: Math.round(origin.width), h: Math.round(origin.height) },
    count: rows.length,
    findings,
    rows
  };
}
