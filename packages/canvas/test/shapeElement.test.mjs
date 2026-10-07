/**
 * The Shape element (RAI and Koyo, 2026-10-06): every free-standing stereotype Shape is one record in
 * ShapeFigures.ts, drawn by one renderer on the live canvas and one in the export. A Shape stands as tall
 * as the Person's bust, with the Class and the name beneath it; its flag halves are its own outline cut at
 * the seam.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  RaiBridge,
  CascaisPalette,
  DualityWashStrength,
  HeraldicWash,
  KNOWN_STEREOTYPES,
  SHAPE_FIGURES,
  SHAPE_FIGURE_HEIGHT,
  SHAPE_FIGURE_TOP,
  SHAPE_LINE_WIDTH,
  SHAPE_DETAIL_WIDTH,
  OBJECT_FOLD,
  computePortalDoorAttrs,
  computeStereotypeGlyphLayout,
  contractStateOf,
  objectCardOutline,
  objectFoldFlap,
  createAimNode,
  getShapeFigure,
  isObjectShape,
  renderShapeFigureSvg,
  resolveStereotype,
  shapeFigureOf,
  shapeFigurePlacement,
} from '../dist/index.js';

const jsdom = new JSDOM();
globalThis.DOMParser = jsdom.window.DOMParser;
globalThis.XMLSerializer = jsdom.window.XMLSerializer;

const DOCUMENTS = ['contract', 'law', 'court', 'certificate', 'checklist'];
const node = (kind, stereotype, extra = {}) => ({ id: 'N', kind, displayName: 'Thing', stereotype, bounds: { x: 0, y: 0, width: 120, height: 110 }, ...extra });
const model = (...nodes) => ({ diagramId: 'D', archetype: 'ObjectDiagram', edges: [], nodes });

/** Every coordinate pair in a path, with arc radii and flags dropped. */
function points(d) {
  const xs = [];
  const ys = [];
  const flat = d.replace(/A\s*[\d.]+[\s,]+[\d.]+[\s,]+[\d.]+[\s,]+[01][\s,]+[01][\s,]+/g, 'L ');
  for (const [, command, args] of flat.matchAll(/([MLCHV])\s*((?:-?[\d.]+[\s,]*)+)/g)) {
    const numbers = args.trim().split(/[\s,]+/).map(Number);
    if (command === 'H') xs.push(...numbers);
    else if (command === 'V') ys.push(...numbers);
    else numbers.forEach((value, index) => (index % 2 === 0 ? xs : ys).push(value));
  }
  return { xs, ys };
}

describe('the Shape records', () => {
  test('there is one record per Shape, and every Shape names the archetypes it fits', () => {
    assert.deepEqual(SHAPE_FIGURES.map((figure) => figure.id).sort(), ['bar', 'certificate', 'checklist', 'contract', 'court', 'law', 'stage', 'system', 'venue']);
    for (const id of DOCUMENTS) assert.deepEqual(getShapeFigure(id).kinds, ['obj']);
    for (const id of ['venue', 'stage', 'bar']) assert.deepEqual(getShapeFigure(id).kinds, ['plc']);
    assert.deepEqual(getShapeFigure('system').kinds, ['per', 'obj']);
    assert.equal(getShapeFigure('lead'), undefined, 'a Feature is not a Shape');
  });

  // Koyo H1: the bust is the standard. Its lines run from y = 8 to y = 54 in the node.
  test('every Shape drawn to the standard stands exactly as tall as the bust', () => {
    for (const figure of SHAPE_FIGURES.filter((candidate) => candidate.height === undefined)) {
      const { ys } = points(`${figure.outline} ${figure.line} ${figure.detail ?? ''}`);
      assert.equal(SHAPE_FIGURE_TOP + Math.min(...ys), 8, `${figure.id} starts on the bust's top line`);
      assert.equal(SHAPE_FIGURE_TOP + Math.max(...ys), 54, `${figure.id} ends on the bust's shoulder line`);
    }
    assert.equal(SHAPE_FIGURE_HEIGHT, 50);
    assert.equal(SHAPE_LINE_WIDTH, 2.2, "the bust's line weight");
    assert.equal(SHAPE_DETAIL_WIDTH, 1.4);
  });

  test('widths follow the drawing: documents 36, Checklist 34, System 44, Stage 56', () => {
    const widths = Object.fromEntries(SHAPE_FIGURES.map((figure) => [figure.id, figure.width]));
    assert.deepEqual(widths, { contract: 36, law: 36, court: 36, certificate: 36, checklist: 34, system: 44, stage: 56, bar: 36, venue: 45 });
    for (const id of DOCUMENTS) assert.equal(KNOWN_STEREOTYPES[id].width, getShapeFigure(id).width);
  });

  // The two flag halves are the outline cut at the middle of the box, so the outline must be centred on it.
  test('every outline spans its box symmetrically, so the seam halves it', () => {
    for (const figure of SHAPE_FIGURES) {
      const { xs } = points(figure.outline);
      const left = Math.min(...xs);
      const right = Math.max(...xs);
      assert.ok(Math.abs((left + right) / 2 - figure.width / 2) < 0.01, `${figure.id} is centred on its seam`);
      assert.ok(left >= 0 && right <= figure.width, `${figure.id} stays in its box`);
    }
  });

  test('no drawing leaves its box', () => {
    for (const figure of SHAPE_FIGURES) {
      for (const state of [undefined, 'ReadyToSign', 'Approved']) {
        const { xs, ys } = points(`${figure.line} ${figure.detail ?? ''} ${figure.accent?.(state)?.d ?? ''}`);
        assert.ok(Math.min(...xs) >= 0 && Math.max(...xs) <= figure.width, `${figure.id} x`);
        assert.ok(Math.min(...ys) >= 0 && Math.max(...ys) <= (figure.height ?? SHAPE_FIGURE_HEIGHT), `${figure.id} y`);
      }
    }
  });
});

describe('which node stands as a Shape', () => {
  test('a document Shape resolves on an Object, under each of its names', () => {
    assert.equal(resolveStereotype('Contract', 'obj'), 'contract');
    assert.equal(resolveStereotype('«Law»', 'obj'), 'law');
    assert.equal(resolveStereotype('Legislation', 'obj'), 'law');
    assert.equal(resolveStereotype('Ruling', 'obj'), 'court');
    assert.equal(resolveStereotype('Runbook', 'obj'), 'checklist');
    for (const id of DOCUMENTS) assert.equal(isObjectShape(id), true);
    assert.equal(isObjectShape('stage'), false);
  });

  test('a Shape is worn only by an archetype it fits; elsewhere it is kept and not drawn', () => {
    assert.equal(shapeFigureOf(node('obj', 'Contract')).id, 'contract');
    assert.equal(shapeFigureOf(node('per', 'Contract')), undefined);
    assert.equal(shapeFigureOf(node('plc', 'Stage')).id, 'stage');
    assert.equal(shapeFigureOf(node('obj', 'Stage')), undefined, 'a Stage is a Place, so an Object does not stand as one');
    assert.equal(shapeFigureOf(node('per', 'System')).id, 'system');
    assert.equal(shapeFigureOf(node('obj', 'System')).id, 'system');
    assert.equal(shapeFigureOf(node('obj', undefined)), undefined);
    assert.equal(shapeFigureOf(node('per', undefined)), undefined, 'a Person stands as the bust, which is not a Shape record');
  });

  // Adele, 2026-10-06 (CR034 §2.1): the pin is the Place archetype's native silhouette.
  test('a Place with no Shape of its own stands as the pin on the ground', () => {
    assert.equal(shapeFigureOf(node('plc', undefined)).id, 'venue');
    assert.equal(shapeFigureOf(node('plc', '')).id, 'venue');
    assert.equal(shapeFigureOf(node('plc', 'Lead')).id, 'venue', 'a Feature does not take the pin away');
    assert.equal(shapeFigureOf(node('plc', 'Contract')).id, 'venue', 'nor does a Shape of another archetype');
    assert.equal(shapeFigureOf(node('plc', 'Venue')).id, 'venue');
    assert.equal(shapeFigureOf(node('plc', 'Bar')).id, 'bar', 'Stage and Bar replace it');
    assert.equal(shapeFigureOf(node('plc', undefined, { slot: true, restriction: 'Place' })).id, 'venue', 'a Where slot is a Place too');
  });

  test('the first compatible Shape written wins, whatever precedes it', () => {
    assert.equal(shapeFigureOf(node('obj', 'Lead, Court, Contract')).id, 'court');
    assert.equal(shapeFigureOf(node('obj', 'System, Contract')).id, 'system');
    assert.equal(shapeFigureOf(node('plc', 'Court, Stage')).id, 'stage');
  });

  test('an Object that shows a description stays a card', () => {
    assert.equal(shapeFigureOf(node('obj', 'Contract', { description: 'Terms of the engagement.' })), undefined);
  });
});

describe('a Contract follows its state', () => {
  test('the state is read however it is spelled', () => {
    assert.equal(contractStateOf(undefined), 'default');
    assert.equal(contractStateOf('Draft'), 'default');
    assert.equal(contractStateOf('ready to sign'), 'readyToSign');
    assert.equal(contractStateOf('Ready_To_Sign'), 'readyToSign');
    assert.equal(contractStateOf('APPROVED'), 'approved');
  });

  test('one sheet, with a gold pen when ready to sign and a status-green tick when approved', () => {
    const contract = getShapeFigure('contract');
    const [plain, pen, tick] = [undefined, 'ReadyToSign', 'Approved'].map((state) => contract.accent(state));
    assert.equal(plain.color, undefined, 'unsigned, the baseline is plain ink');
    assert.equal(pen.color, CascaisPalette.NetGoldStroke);
    assert.equal(tick.color, CascaisPalette.TelemetryGreen, 'an approval is a status, not the flag');
    assert.equal(new Set([plain.d, pen.d, tick.d]).size, 3);
  });

  test('the state travels through the export and back', () => {
    const bridge = new RaiBridge();
    const svg = bridge.generateFreshSvg(model(node('obj', 'Contract', { state: 'Approved' })), {});
    assert.match(svg, /aim-id="N"[^>]*aim-state="Approved"/);
    assert.ok(svg.includes(`fill="${CascaisPalette.TelemetryGreen}"`));
    assert.equal(bridge.extractMetamodel(svg).nodes[0].state, 'Approved');

    const reset = bridge.updateExistingSvg(svg, model(node('obj', 'Contract')), {});
    assert.ok(!reset.includes('aim-state'));
    assert.ok(!bridge.generateFreshSvg(model(node('obj', 'Contract')), {}).includes('aim-state'));
  });
});

describe('the one renderer on the live canvas', () => {
  const SELECTORS = ['body', 'iconFill', 'persona', 'door', 'seam', 'iconStroke', 'iconDetail', 'iconAccent'];

  test('every Shape is the same element, whatever archetype wears it', () => {
    const markups = [node('plc', 'Venue'), node('plc', 'Stage'), node('plc', 'Bar'), node('per', 'System'), node('obj', 'System'), ...DOCUMENTS.map((id) => node('obj', id))]
      .map((data) => createAimNode(data).markup.map((part) => part.selector));
    for (const selectors of markups) {
      assert.deepEqual(selectors, markups[0]);
      assert.deepEqual(selectors.slice(0, SELECTORS.length), SELECTORS, 'washes lie on the ground and under the lines');
      assert.ok(!selectors.includes('head') && !selectors.includes('torso') && !selectors.includes('header'));
    }
  });

  test('the drawing comes straight from the record', () => {
    for (const figure of SHAPE_FIGURES) {
      const kind = figure.kinds[0];
      const { attrs } = createAimNode(node(kind, figure.id));
      const { x, y } = shapeFigurePlacement(figure, 120);
      const transform = `translate(${x}, ${y})`;
      assert.equal(attrs.iconFill.d, figure.outline);
      assert.equal(attrs.iconFill.fill, CascaisPalette.ChalkWhite);
      assert.equal(attrs.iconStroke.d, figure.line);
      assert.equal(attrs.iconStroke.strokeWidth, SHAPE_LINE_WIDTH);
      assert.equal(attrs.iconStroke.stroke, CascaisPalette.WarmGraphite);
      assert.equal(attrs.iconDetail.d, figure.detail ?? '');
      assert.equal(attrs.iconDetail.display, figure.detail ? 'block' : 'none');
      for (const part of [attrs.iconFill, attrs.iconStroke, attrs.iconDetail]) assert.equal(part.transform, transform, `${figure.id} is centred, ${SHAPE_FIGURE_TOP} from the top`);
      assert.equal(attrs.body.fill, 'transparent', 'no card around a Shape');
    }
  });

  test('a node standing as a Shape is 120 wide whatever card size it was saved at', () => {
    const contract = createAimNode(node('obj', 'Contract', { bounds: { x: 0, y: 0, width: 170, height: 64 } }));
    assert.deepEqual([contract.width, contract.height], [120, 110]);
    assert.equal(contract.attrs.iconStroke.transform, 'translate(42, 6)');
  });

  test('the Class and the name sit beneath the Shape', () => {
    const { attrs } = createAimNode(node('obj', 'Contract', { qualifier: 'Contract', displayName: 'Contract4711', instance: true }));
    assert.equal(attrs.qualifier.refY, 66);
    assert.equal(attrs.label.refY, 84);
    assert.equal(attrs.label.textDecoration, 'underline');
    assert.equal(createAimNode(node('obj', 'Contract')).attrs.label.refY, 74, 'the name alone sits where a Person shows it');
    // The pin predates the standard and is 4 taller; its text moves down with it instead of running into it.
    assert.equal(createAimNode(node('plc', 'Venue', { qualifier: 'Physical Site' })).attrs.qualifier.refY, 70);
  });

  test('an initiating node draws its Shape in gold; an accent keeps its own colour', () => {
    const { attrs } = createAimNode(node('obj', 'Certificate, initiates'));
    assert.equal(attrs.iconStroke.stroke, CascaisPalette.NetGoldStroke);
    assert.equal(attrs.iconAccent.fill, CascaisPalette.NetGold);
    assert.equal(createAimNode(node('plc', 'Stage, initiates')).attrs.iconAccent.fill, CascaisPalette.NetGoldStroke, 'the stars take the ink');
  });

  test('both flag halves are the one outline, cut at the seam', () => {
    for (const figure of SHAPE_FIGURES) {
      const data = node(figure.kinds[0], figure.id, { href: '/x' });
      const { cx, x, y, width, height } = shapeFigurePlacement(figure, 120);
      const portal = computePortalDoorAttrs(data, true);
      assert.equal(portal.persona.d, figure.outline);
      assert.equal(portal.door.d, figure.outline);
      assert.equal(portal.door.transform, `translate(${x}, ${y})`);
      assert.deepEqual(portal.persona.style, { clipPath: 'inset(0 50% 0 0)' }, 'left half: the Persona');
      assert.deepEqual(portal.door.style, { clipPath: 'inset(0 0 0 50%)' }, 'right half: the door');
      assert.equal(portal.persona.fill, HeraldicWash.verde(DualityWashStrength.verde));
      assert.equal(portal.door.fill, HeraldicWash.vermelho(DualityWashStrength.vermelho));
      assert.deepEqual([portal.seam.x1, portal.seam.y1, portal.seam.x2, portal.seam.y2], [cx, y, cx, y + height]);
      assert.equal(portal.chevron.refX, cx + width / 2 + 12, 'the chevron sits beside the Shape');
      assert.equal(portal.chevron.refDx, null, 'and the default right-edge offset is cleared');
    }
    assert.equal(computePortalDoorAttrs(node('obj', 'Contract', { href: '/x' }), false).door.display, 'none');
  });
});

describe('archetype marks (Adele and Koyo, 2026-10-06)', () => {
  const card = (extra = {}) => ({ id: 'O', kind: 'obj', displayName: 'Invoice 17', bounds: { x: 0, y: 0, width: 160, height: 64 }, ...extra });

  test('an Object card has its top-right corner folded: a 12-unit bevel with the flap turned down', () => {
    assert.equal(OBJECT_FOLD, 12);
    assert.equal(objectCardOutline(160, 64), 'M 0 0 H 148 L 160 12 V 64 H 0 Z');
    assert.equal(objectFoldFlap(160), 'M 148 0 V 12 H 160 Z');

    const node = createAimNode(card());
    assert.equal(node.attrs.fold.d, 'M 148 0 V 12 H 160 Z');
    assert.match(node.attrs.body.style.clipPath, /^polygon\(-1px -1px, calc\(100% - 13px\) -1px, calc\(100% \+ 1px\) 13px, .* fill-box$/, 'the rectangle is cut on the line from (148, 0) to (160, 12)');
  });

  test('every Object card carries the fold: a slot, an unfilled role and a description card too', () => {
    for (const extra of [{ slot: true, restriction: 'Document' }, { unbound: true }, { description: 'Terms of the engagement.' }]) {
      const node = createAimNode(card(extra));
      assert.ok(node.attrs.fold.d.endsWith(`V 12 H ${node.width} Z`), JSON.stringify(extra));
      assert.ok(node.attrs.body.style.clipPath.endsWith('fill-box'));
    }
  });

  test('an Object that stands as a Shape has no card, so no fold; nor has any other archetype', () => {
    assert.equal(createAimNode(card({ stereotype: 'Contract' })).attrs.fold, undefined);
    for (const kind of ['act', 'uc', 'cls', 'per', 'plc']) assert.equal(createAimNode({ ...card(), kind }).attrs.fold, undefined, kind);
  });

  test('the export draws the folded card and keeps the box extraction reads', () => {
    const bridge = new RaiBridge();
    const svg = bridge.generateFreshSvg(model(card({ qualifier: 'Document' })), {});
    assert.ok(svg.includes('<rect width="160" height="64" fill="none" stroke="none" />'));
    assert.ok(svg.includes(`<path d="M 0 0 H 148 L 160 12 V 64 H 0 Z" fill="${CascaisPalette.ChalkWhite}" stroke="${CascaisPalette.SilverLineDark}"`));
    assert.ok(svg.includes(`<path d="M 148 0 V 12 H 160 Z" fill="${CascaisPalette.SilverLine}" stroke="${CascaisPalette.SilverLineDark}"`));
    const [back] = bridge.extractMetamodel(svg).nodes;
    assert.deepEqual([back.bounds.width, back.bounds.height, back.qualifier], [160, 64, 'Document']);
  });

  test("an exported Object card's door stops at the fold", () => {
    const svg = new RaiBridge().generateFreshSvg(model(card({ href: '/objects/o' })), {});
    assert.ok(svg.includes('<path d="M 80 0 H 148 L 160 12 V 64 H 80 Z"'));
  });

  // Koyo: 18 x 18 slots, 3 between them, starting 16 in from the right edge so the row clears the fold.
  test('the badge row on a card starts 16 in from the right edge, 3 between badges', () => {
    const row = computeStereotypeGlyphLayout('obj', 160, 64, 4).slice(1);
    assert.deepEqual(row.map((badge) => [badge.x, badge.width]), [[126, 18], [105, 18], [84, 18]]);
    assert.ok(row.every((badge) => badge.x + badge.width <= 160 - OBJECT_FOLD), 'clear of the folded corner');
  });
});

describe('the one renderer in the export', () => {
  const bridge = new RaiBridge();
  const svgOf = (data) => bridge.generateFreshSvg(model(data), {});

  test('every Shape is drawn from its record at the standard weights', () => {
    for (const figure of SHAPE_FIGURES) {
      const svg = svgOf(node(figure.kinds[0], figure.id));
      assert.ok(svg.includes(`class="aim-shape-figure aim-shape-${figure.id}"`), figure.id);
      assert.ok(svg.includes(`d="${figure.line}" fill="none" stroke="${CascaisPalette.WarmGraphite}" stroke-width="${SHAPE_LINE_WIDTH}"`), `${figure.id} line`);
      if (figure.detail) assert.ok(svg.includes(`d="${figure.detail}" fill="none" stroke="${CascaisPalette.WarmGraphite}" stroke-width="${SHAPE_DETAIL_WIDTH}"`), `${figure.id} detail`);
      assert.ok(svg.includes('<rect width="120" height="110" fill="none" stroke="none" />'), 'the box extraction reads is kept, invisible');
    }
  });

  test('a Shape survives a round trip as the same node', () => {
    const [back] = bridge.extractMetamodel(svgOf(node('obj', 'Court', { qualifier: 'Ruling', displayName: 'Schrems II' }))).nodes;
    assert.deepEqual([back.kind, back.stereotype, back.qualifier, back.displayName], ['obj', 'Court', 'Ruling', 'Schrems II']);
    assert.deepEqual([back.bounds.width, back.bounds.height], [120, 110]);
  });

  test("the door is the outline seen through the right half of the Shape's box", () => {
    const stage = getShapeFigure('stage');
    const svg = svgOf(node('plc', 'Stage', { href: '/places/s' }));
    const door = svg.match(/<svg [^>]*class="aim-portal-door"[^>]*>.*?<\/svg>/)[0];
    assert.ok(door.includes('x="60" y="6" width="28" height="50" viewBox="28 0 28 50"'));
    assert.ok(door.includes(`<path d="${stage.outline}" fill-rule="evenodd" />`));
    assert.match(svg, /<a href="\/places\/s"[^>]*>\s*<svg [^>]*class="aim-portal-door"/, 'a direct child of the link, so hover and press reach it');
    assert.ok(svg.includes('<line x1="60" y1="6" x2="60" y2="56"'), 'the seam runs down the middle of the box');
  });

  test('a Shape on an archetype it does not fit is kept in the data and not drawn', () => {
    const svg = svgOf(node('per', 'Contract'));
    assert.ok(!svg.includes('aim-shape-contract'));
    assert.match(svg, /aim-stereotype="Contract"/);
  });

  test('reduced for a chip, a Shape is the same drawing at 1.3', () => {
    const chip = renderShapeFigureSvg(getShapeFigure('law'), { x: 0, y: 0, scale: 0.4 });
    assert.ok(chip.includes('scale(0.4)'));
    assert.ok(chip.includes(`d="${getShapeFigure('law').line}"`));
    assert.ok(chip.includes('stroke-width="3.25"'), '1.3 once the 0.4 scale is applied');
  });
});
