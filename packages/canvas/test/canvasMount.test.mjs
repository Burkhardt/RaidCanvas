/**
 * Mounts the real RaidCanvas in JSDOM: the onNodeArchetypeChange veto, the inspectedNodeId mark and
 * how updateNode re-renders a node (stereotype lists, archetype changes, unbound slots).
 * Runs in its own process under `node --test`, so the DOM globals below stay local to this file.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<div id="c"></div>', { pretendToBeVisual: true });
globalThis.window = dom.window;
for (const key of Object.getOwnPropertyNames(dom.window)) {
  if (key in globalThis) continue;
  try { globalThis[key] = dom.window[key]; } catch { /* read-only */ }
}

// JSDOM has no SVG geometry; X6 only needs these to exist for layout.
const matrix = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, inverse() { return this; }, multiply() { return this; }, translate() { return this; }, scale() { return this; }, scaleNonUniform() { return this; }, rotate() { return this; }, skewX() { return this; }, skewY() { return this; } });
const svg = dom.window.SVGSVGElement.prototype;
svg.createSVGPoint = () => ({ x: 0, y: 0, matrixTransform() { return this; } });
svg.createSVGMatrix = matrix;
svg.createSVGTransform = () => ({ matrix: matrix(), setMatrix() {}, setTranslate() {}, setScale() {}, setRotate() {} });
svg.createSVGTransformFromMatrix = (m) => ({ matrix: m });
dom.window.SVGElement.prototype.getBBox = function () { return { x: 0, y: 0, width: Number(this.getAttribute('width')) || 0, height: Number(this.getAttribute('height')) || 0 }; };
dom.window.SVGElement.prototype.getScreenCTM = matrix;
dom.window.SVGElement.prototype.getCTM = matrix;

const { Graph } = await import('@antv/x6');
dom.window.HTMLElement.prototype.getBoundingClientRect = () => ({ x: 0, y: 0, top: 0, left: 0, right: 800, bottom: 600, width: 800, height: 600 });
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { RaidCanvas } = await import('../dist/index.js');

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" id="Guard_UCD" aim-archetype="OneUseCaseDiagram">
  <g aim-node="true" aim-id="Signer" aim-kind="obj" aim-slot="true" aim-restriction="Person" aim-display-name="Signer" transform="translate(40,40)"><rect width="160" height="80"/></g>
  <g aim-node="true" aim-id="Approver" aim-kind="rol" aim-display-name="Approver" transform="translate(400,40)"><rect width="22" height="22"/></g>
</svg>`;

async function mount(onNodeArchetypeChange, props = {}) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const ref = React.createRef();
  const root = createRoot(host);
  const render = extra => React.act(() => root.render(React.createElement(RaidCanvas, { ref, svgContent: SVG, onNodeArchetypeChange, style: { width: 800, height: 600 }, ...props, ...extra })));
  await render();
  await React.act(() => new Promise(resolve => setTimeout(resolve, 20)));
  const data = id => ref.current.getGraph().getCellById(id).getData();
  const inspected = id => host.querySelector(`[data-cell-id="${id}"]`).classList.contains('aim-inspected');
  return { ref, data, inspected, render, unmount: () => React.act(() => root.unmount()) };
}

test('a synchronous veto leaves the role slot untouched', async () => {
  const calls = [];
  const { ref, data, unmount } = await mount((node, from, to) => { calls.push([node.id, from, to]); return false; });
  try {
    assert.equal(data('Signer').kind, 'obj');
    await React.act(() => ref.current.updateNode('Signer', { kind: 'per', slot: true }));
    assert.deepEqual(calls, [['Signer', 'obj', 'per']]);
    assert.equal(data('Signer').kind, 'obj');
    assert.equal(data('Signer').displayName, 'Signer');
    // Non-kind edits never consult the guard.
    await React.act(() => ref.current.updateNode('Signer', { restriction: 'Document' }));
    assert.equal(calls.length, 1);
    assert.equal(data('Signer').restriction, 'Document');
  } finally {
    await unmount();
  }
});

test('an accepted category change keeps id, name and restriction', async () => {
  const { ref, data, unmount } = await mount(() => true);
  try {
    await React.act(() => ref.current.updateNode('Signer', { kind: 'per', slot: true }));
    const signer = data('Signer');
    assert.equal(signer.kind, 'per');
    assert.equal(signer.id, 'Signer');
    assert.equal(signer.displayName, 'Signer');
    assert.equal(signer.restriction, 'Person');
    assert.equal(signer.slot, true);
  } finally {
    await unmount();
  }
});

test('an asynchronous refusal reverts the Generic Role, slot flag included', async () => {
  let refuse;
  const { ref, data, unmount } = await mount(() => new Promise(resolve => { refuse = () => resolve(false); }));
  try {
    await React.act(() => ref.current.updateNode('Approver', { kind: 'per', slot: true }));
    assert.equal(data('Approver').kind, 'per', 'the change shows at once');
    await React.act(async () => { refuse(); await Promise.resolve(); });
    assert.equal(data('Approver').kind, 'rol');
    assert.notEqual(data('Approver').slot, true);
    assert.equal(data('Approver').displayName, 'Approver');
  } finally {
    await unmount();
  }
});

test('only the node the Inspector already shows is marked aim-inspected, also after it is re-created', async () => {
  const { ref, inspected, render, unmount } = await mount(() => true, { onNodeClick() {}, inspectedNodeId: 'Signer' });
  try {
    assert.ok(inspected('Signer'));
    assert.ok(!inspected('Approver'));
    await render({ inspectedNodeId: 'Approver' });
    assert.ok(!inspected('Signer'));
    assert.ok(inspected('Approver'));
    // A category change re-creates the node's view; the mark follows it.
    await React.act(() => ref.current.updateNode('Approver', { kind: 'per', slot: true }));
    await React.act(() => new Promise(resolve => setTimeout(resolve, 20)));
    assert.ok(inspected('Approver'));
    await render({ inspectedNodeId: null });
    assert.ok(!inspected('Signer') && !inspected('Approver'));
  } finally {
    await unmount();
  }
});

test('a refused category change restores the old size as well as the kind', async () => {
  let refuse;
  const { ref, unmount } = await mount(() => new Promise(resolve => { refuse = () => resolve(false); }));
  try {
    const signer = ref.current.getGraph().getCellById('Signer');
    const before = { ...signer.getPosition(), ...signer.getSize() };
    await React.act(() => ref.current.updateNode('Signer', { kind: 'per', slot: true }));
    assert.notDeepEqual(signer.getSize(), { width: before.width, height: before.height });
    await React.act(async () => { refuse(); await Promise.resolve(); });
    assert.deepEqual({ ...signer.getPosition(), ...signer.getSize() }, before);
  } finally {
    await unmount();
  }
});

const KINDS = ['act', 'uc', 'cls', 'obj', 'per', 'plc', 'rol', 'rf'];
const host = (graph, id) => graph.findViewByCell(graph.getCellById(id)).container;
// X6 paints on the next frame.
const settle = () => React.act(() => new Promise(resolve => setTimeout(resolve, 20)));
const kindsSvg = stereotype => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" id="Kinds_OD" aim-archetype="ObjectDiagram">${KINDS.map((k, i) =>
  `<g aim-node="true" aim-id="N_${k}" aim-kind="${k}" aim-display-name="Agent" aim-qualifier="Authorised Agent"${stereotype ? ` aim-stereotype="${stereotype}"` : ''} transform="translate(${40 + i * 10},40)"><rect width="100" height="60"/></g>`).join('')}</svg>`;

test('setting a stereotype list replaces it: removed items never come back', async () => {
  const { ref, data, unmount } = await mount(() => true, { svgContent: kindsSvg('') });
  try {
    await React.act(() => ref.current.updateNode('N_plc', { stereotype: ['Stage', 'Lead', 'Customer'] }));
    await React.act(() => ref.current.updateNode('N_plc', { stereotype: ['Lead'] }));
    assert.deepEqual(data('N_plc').stereotype, ['Lead']);
  } finally {
    await unmount();
  }
});

for (const stereotype of ['', 'Customer, initiates', 'Lead, Stage']) {
  test(`a new archetype looks the same whatever it replaced (stereotype "${stereotype}")`, async () => {
    const { ref, unmount } = await mount(() => true, { svgContent: kindsSvg(stereotype) });
    try {
      const graph = ref.current.getGraph();
      const look = id => {
        const cell = graph.getCellById(id);
        const { id: _id, bounds, ...data } = cell.getData();
        return JSON.stringify({ shape: cell.shape, size: cell.getSize(), data, attrs: cell.getAttrs(), markup: cell.getMarkup() });
      };
      for (const to of KINDS) {
        const looks = new Map();
        for (const from of KINDS.filter(k => k !== to)) {
          await React.act(() => ref.current.updateNode(`N_${from}`, { kind: to }));
          looks.set(from, look(`N_${from}`));
          await React.act(() => ref.current.updateNode(`N_${from}`, { kind: from }));
        }
        assert.equal(new Set(looks.values()).size, 1, `${to} depends on the archetype it replaced`);
      }
    } finally {
      await unmount();
    }
  });
}

test('on a Place, Lead or Headliner never takes the Stage shape away', async () => {
  const { ref, unmount } = await mount(() => true, { svgContent: kindsSvg('') });
  try {
    const place = ref.current.getGraph().getCellById('N_plc');
    for (const stereotype of [['Stage'], ['Stage', 'Headliner'], ['Headliner', 'Lead', 'Stage']]) {
      await React.act(() => ref.current.updateNode('N_plc', { stereotype }));
      assert.match(place.getAttrs().body.class, /aim-frameless/, stereotype.join(', '));
      assert.deepEqual(place.getSize(), { width: 120, height: 110 });
    }
  } finally {
    await unmount();
  }
});

test('ticking Unbound brackets the label at once and keeps the size', async () => {
  const { ref, unmount } = await mount(() => true, { svgContent: kindsSvg('') });
  try {
    const place = ref.current.getGraph().getCellById('N_plc');
    const size = place.getSize();
    await React.act(() => ref.current.updateNode('N_plc', { unbound: true }));
    assert.equal(place.getAttrs().label.text, '[Agent]');
    assert.deepEqual(place.getSize(), size);
  } finally {
    await unmount();
  }
});

test('several glyphs render on the live node, removing one hides it, and a Stage keeps its shape', async () => {
  const { ref, unmount } = await mount(() => true, { svgContent: kindsSvg('') });
  try {
    const graph = ref.current.getGraph();
    const drawn = id => [...host(graph, id).querySelectorAll('image.aim-stereotype-glyph')]
      .filter(image => image.getAttribute('display') !== 'none')
      .map(image => image.getAttribute('aim-stereotype-glyph'));
    await React.act(() => ref.current.updateNode('N_per', { stereotypeGlyph: 'Artist.svg, Computer.svg' }));
    await settle();
    assert.deepEqual(drawn('N_per'), ['Artist.svg', 'Computer.svg']);
    await React.act(() => ref.current.updateNode('N_per', { stereotypeGlyph: 'Computer.svg' }));
    await settle();
    assert.deepEqual(drawn('N_per'), ['Computer.svg']);

    await React.act(() => ref.current.updateNode('N_plc', { stereotype: ['Stage'], stereotypeGlyph: 'Artist.svg, Computer.svg' }));
    await settle();
    const place = graph.getCellById('N_plc');
    assert.notEqual(place.getAttrs().iconStroke.display, 'none', 'the Stage stays');
    assert.deepEqual(drawn('N_plc'), ['Artist.svg', 'Computer.svg']);
  } finally {
    await unmount();
  }
});

test('the wrapper is .aim-dragging only while a node is dragged', async () => {
  const { ref, unmount } = await mount(() => true);
  try {
    const graph = ref.current.getGraph();
    const node = graph.getCellById('Signer');
    const wrapper = document.querySelector('.raid-canvas-wrapper');
    assert.ok(!wrapper.classList.contains('aim-dragging'));
    graph.trigger('node:moving', { node, e: {} });
    assert.ok(wrapper.classList.contains('aim-dragging'));
    graph.trigger('node:moved', { node, e: {} });
    assert.ok(!wrapper.classList.contains('aim-dragging'));
  } finally {
    await unmount();
  }
});
