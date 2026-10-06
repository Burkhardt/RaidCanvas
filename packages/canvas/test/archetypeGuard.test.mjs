/**
 * Mounts the real RaidCanvas in JSDOM and checks the onNodeArchetypeChange veto.
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

async function mount(onNodeArchetypeChange) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const ref = React.createRef();
  const root = createRoot(host);
  await React.act(() => root.render(React.createElement(RaidCanvas, { ref, svgContent: SVG, onNodeArchetypeChange, style: { width: 800, height: 600 } })));
  await React.act(() => new Promise(resolve => setTimeout(resolve, 20)));
  const data = id => ref.current.getGraph().getCellById(id).getData();
  return { ref, data, unmount: () => React.act(() => root.unmount()) };
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
