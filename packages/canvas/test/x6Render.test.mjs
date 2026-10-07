/**
 * Renders AIM cells through a real AntV X6 Graph in JSDOM, catching failures that only surface
 * inside X6's attribute pipeline (e.g. label markup inheriting `Edge.defaultLabel` attrs).
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
const { createAimNode, createAimEdge } = await import('../dist/index.js');

function graphWithEdge(edge) {
  const errors = [];
  const original = console.error;
  console.error = (error) => errors.push(String(error?.message ?? error));
  try {
    const graph = new Graph({ container: document.getElementById('c'), width: 800, height: 400, async: false });
    graph.addNode(createAimNode({ id: 'A', kind: 'act', displayName: 'Prepare', bounds: { x: 0, y: 0, width: 160, height: 70 } }));
    graph.addNode(createAimNode({ id: 'B', kind: 'act', displayName: 'Conclude', bounds: { x: 400, y: 0, width: 160, height: 70 } }));
    graph.addEdge(createAimEdge({ id: 'E', kind: 'association', sourceId: 'A', targetId: 'B', bendPoints: [], routing: 'normal', ...edge }));
    return { graph, errors };
  } finally {
    console.error = original;
  }
}

test('X6 renders the CR053 edge glyph beside a label and an expression pill', () => {
  const { graph, errors } = graphWithEdge({ label: 'ships', expression: 'Truck != null', stereotypeGlyph: 'SemiR.svg' });
  try {
    assert.deepEqual(errors, []);
    const image = document.querySelector('.x6-edge-label image.aim-stereotype-glyph-edge');
    assert.ok(image, 'the glyph label is rendered');
    assert.equal(image.getAttribute('href'), '/stereotypes/SemiR.svg');
    assert.equal(image.getAttribute('width'), '20');
    assert.equal(document.querySelectorAll('.x6-edge-label').length, 3, 'label, pill and glyph');
  } finally {
    graph.dispose();
  }
});

test('X6 renders a lone edge glyph and drops it when cleared', () => {
  const { graph, errors } = graphWithEdge({ stereotypeGlyph: 'Eye.svg' });
  try {
    assert.deepEqual(errors, []);
    assert.equal(document.querySelector('.x6-edge-label image')?.getAttribute('href'), '/stereotypes/Eye.svg');
    const edge = graph.getCellById('E');
    edge.setLabels(createAimEdge({ ...edge.getData(), stereotypeGlyph: undefined }).labels ?? []);
    assert.equal(document.querySelector('.x6-edge-label image'), null);
  } finally {
    graph.dispose();
  }
});

test('X6 renders the CR055 Verde persona mirrored across the seam when the duality awakens', async () => {
  const { setNodeDualityActive, HeraldicWash } = await import('../dist/index.js');
  const graph = new Graph({ container: document.getElementById('c'), width: 800, height: 400, async: false });
  try {
    const node = graph.addNode(createAimNode({ id: 'L', kind: 'act', displayName: 'Linked', href: '/d/1', bounds: { x: 0, y: 0, width: 160, height: 70 } }));
    setNodeDualityActive(node, true);
    const persona = graph.findViewByCell(node).container.querySelector('path.aim-portal-persona');
    assert.ok(persona, 'persona path rendered');
    assert.notEqual(persona.getAttribute('display'), 'none');
    assert.equal(persona.getAttribute('transform'), 'matrix(-1 0 0 1 160 0)');
    assert.equal(persona.getAttribute('fill'), HeraldicWash.verde(0.1));
    assert.equal(persona.getAttribute('d'), graph.findViewByCell(node).container.querySelector('path.aim-portal-door').getAttribute('d'));
  } finally {
    graph.dispose();
  }
});

test('X6 raises the whole flag on an awakened Person, mirrored across head and torso', async () => {
  const { setNodeDualityActive, HeraldicWash } = await import('../dist/index.js');
  const graph = new Graph({ container: document.getElementById('c'), width: 800, height: 400, async: false });
  try {
    const node = graph.addNode(createAimNode({ id: 'P', kind: 'per', displayName: 'Actor', href: '/a/P', bounds: { x: 0, y: 0, width: 120, height: 110 } }));
    setNodeDualityActive(node, true);
    const view = graph.findViewByCell(node).container;
    const persona = view.querySelector('path.aim-portal-persona');
    const door = view.querySelector('path.aim-portal-door');
    assert.notEqual(persona.getAttribute('display'), 'none');
    assert.equal(persona.getAttribute('fill'), HeraldicWash.verde(0.1));
    assert.equal(persona.getAttribute('d'), door.getAttribute('d'));
    assert.equal(door.getAttribute('fill'), HeraldicWash.vermelho(0.1));
    assert.notEqual(view.querySelector('.aim-portal-seam').getAttribute('display'), 'none');

    // Becoming a System rack takes the silhouette wash
    node.setData({ ...node.getData(), stereotype: 'System' });
    setNodeDualityActive(node, true);
    assert.equal(door.getAttribute('fill'), HeraldicWash.vermelho(0.15));
  } finally {
    graph.dispose();
  }
});

test('X6 renders a dormant persona on every archetype until the duality awakens', () => {
  const graph = new Graph({ container: document.getElementById('c'), width: 800, height: 400, async: false });
  try {
    for (const kind of ['act', 'uc', 'per', 'cls', 'obj', 'plc']) {
      const node = graph.addNode(createAimNode({ id: kind, kind, displayName: kind, bounds: { x: 0, y: 0, width: 120, height: 110 } }));
      const persona = graph.findViewByCell(node).container.querySelector('path.aim-portal-persona');
      assert.ok(persona, `${kind} carries the persona markup`);
      assert.equal(persona.getAttribute('display'), 'none', `${kind} persona dormant`);
    }
  } finally {
    graph.dispose();
  }
});

test('X6 renders a 1UCC role slot with its `: <Class>` tag and no underline, ring or dash', () => {
  const graph = new Graph({ container: document.getElementById('c'), width: 800, height: 400, async: false });
  try {
    graph.addNode(createAimNode({ id: 'Signer', kind: 'per', displayName: 'Signer', slot: true, restriction: 'Person', bounds: { x: 0, y: 0, width: 120, height: 110 } }));
    graph.addNode(createAimNode({ id: 'Contract', kind: 'obj', displayName: 'Contract', slot: true, restriction: 'Document', bounds: { x: 200, y: 0, width: 160, height: 80 } }));
    graph.addNode(createAimNode({ id: 'Approver', kind: 'rol', displayName: 'Approver', bounds: { x: 400, y: 0, width: 22, height: 22 } }));
    for (const id of ['Signer', 'Contract', 'Approver']) {
      const view = document.querySelector(`[data-cell-id="${id}"]`);
      assert.equal(view.querySelector('.aim-slot-ring'), null, `${id} has no ring`);
      assert.ok(![...view.querySelectorAll('[stroke-dasharray]')].some(e => !['none', '0', ''].includes(e.getAttribute('stroke-dasharray'))), `${id} has no dashed outline`);
    }
    const obj = document.querySelector('[data-cell-id="Contract"]');
    // X6 writes spaces as U+00A0, so normalise before matching.
    assert.ok([...obj.querySelectorAll('text')].some(t => t.textContent.replace(/\u00A0/g, ' ').includes(': Document')));
    assert.ok(![...obj.querySelectorAll('text')].some(t => t.getAttribute('text-decoration') === 'underline'));
  } finally {
    graph.dispose();
  }
});
