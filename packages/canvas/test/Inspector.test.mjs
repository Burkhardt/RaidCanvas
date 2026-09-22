import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { RaidInspector, RaidPropertyTree, RaidCanvasToolbar } from '../dist/index.js';
const dom = element => new JSDOM(renderToStaticMarkup(element)).window.document;

describe('Published Living Stage components', () => {
  test('inspector places consumer actions beside native Pin and owns context/footer layout', () => {
    const document = dom(React.createElement(RaidInspector, {
      selection: { id: 'uc', type: 'node', nodeData: { kind: 'uc', displayName: 'Meeting' } },
      headerActions: React.createElement('button', null, 'Duplicate Use Case'),
      contextPanel: React.createElement('section', { 'aria-label': 'Declared roles' }, 'Host'),
      footer: React.createElement('p', null, 'Validated'),
      onTogglePin() {}, isPinned: true,
    }));
    const header = document.querySelector('.raid-inspector-header');
    assert.match(header.textContent, /Duplicate Use Case/);
    assert.equal(header.querySelector('[aria-label="Unpin Inspector"]').getAttribute('aria-pressed'), 'true');
    assert.ok(document.querySelector('aside [aria-label="Declared roles"]'));
    assert.match(document.querySelector('aside').textContent, /Validated/);
  });
  test('tree distinguishes projected attributes and preserves sparse open values with escaped markup', () => {
    const document = dom(React.createElement(RaidPropertyTree, { value: { Attributes: { Owner: 'Person', Auditor: '<script>bad</script>', Enabled: false, Count: 0, Empty: null } }, projectedNames: ['Owner'] }));
    const labels = [...document.querySelectorAll('span')];
    assert.ok(labels.find(node => node.textContent === 'Owner').className.includes('text-[#D4AF37]'));
    assert.ok(labels.find(node => node.textContent === 'Auditor').className.includes('text-[#23231F]'));
    assert.equal(document.querySelectorAll('script').length, 0);
    assert.match(document.body.textContent, /false/);
    assert.match(document.body.textContent, /null/);
    assert.ok(document.querySelector('details summary'));
  });
  test('tree permits reference renderers and terminates cycles', () => {
    const value = { Owner: 'Per:RAI' }; value.Self = value;
    const document = dom(React.createElement(RaidPropertyTree, { value, renderValue: (item, path) => path.join('.') === 'Owner' ? React.createElement('a', { href: '/actors?select=RAI' }, item) : undefined }));
    assert.equal(document.querySelector('a').getAttribute('href'), '/actors?select=RAI');
    assert.match(document.body.textContent, /Circular reference/);
  });
  test('toolbar keeps consumer controls in one row and disables mutations in read-only mode', () => {
    const document = dom(React.createElement(RaidCanvasToolbar, { start: '1AOC | 1UCC', end: 'UseCase · blueprint', routing: 'mixed', readOnly: true, canUndo: true, canRedo: true, onRoutingChange() {}, onUndo() {}, onRedo() {}, onZoomOut() {}, onZoomIn() {}, onFit() {}, onCenter() {} }));
    assert.equal(document.querySelectorAll('[role="toolbar"]').length, 1);
    assert.equal(document.querySelectorAll('[aria-label="Edge routing"] button:disabled').length, 3);
    assert.equal(document.querySelectorAll('[aria-label="Edge routing"] [aria-pressed="true"]').length, 0);
    assert.ok(document.querySelector('[aria-label="Undo"]').disabled);
    assert.ok(!document.querySelector('[aria-label="Fit view"]').disabled);
    assert.match(document.querySelector('[role="toolbar"]').textContent, /1AOC/);
  });
});


test('empty collections have no misleading disclosure and manual routing is explicit', () => {
  const document = dom(React.createElement(RaidPropertyTree, { value: { bendPoints: [], Roles: [] } }));
  assert.equal(document.querySelectorAll('details').length, 0);
  assert.match(document.body.textContent, /\(auto\)/);
  assert.match(document.body.textContent, /\[\]/);
});

test('inspector omits absent or malformed provenance and renames the expression tab', () => {
  const inspect = properties => dom(React.createElement(RaidInspector, { selection: { id: 'e', type: 'edge', edgeData: { kind: 'dependency', bendPoints: [], properties } } }));
  assert.doesNotMatch(inspect({ s123: {} }).body.textContent, /Provenance/);
  assert.doesNotMatch(inspect({ s123: { AtUtc: '', Actor: '', RawMessage: '' } }).body.textContent, /Provenance/);
  assert.match(inspect({ s123: { AtUtc: '2026-09-22', Actor: 'RAI', RawMessage: 'Ready' } }).body.textContent, /Provenance/);
  assert.match(inspect({}).body.textContent, /Expression/);
  assert.doesNotMatch(inspect({}).body.textContent, /AST Expression/);
});

test('canvas settings reflect the diagram preference', () => {
  const document = dom(React.createElement(RaidInspector, { selection: null, showExpressions: false, onShowExpressionsChange() {} }));
  assert.equal(document.querySelector('input[type="checkbox"]').checked, false);
});

test('waypoint controls delete the selected point, individual points, or all points', async () => {
  const jsdom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  globalThis.window = jsdom.window;
  globalThis.document = jsdom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(document.getElementById('root'));
  const points = [{ x: 10, y: 20 }, { x: 30, y: 40 }];
  const calls = [];
  await React.act(() => root.render(React.createElement(RaidInspector, {
    selection: { id: 'e', type: 'edge', edgeData: { kind: 'dependency', bendPoints: points } },
    waypoint: { edgeId: 'e', index: 1, ...points[1] },
    onUpdateWaypoints: (id, remaining) => calls.push({ id, remaining }),
  })));
  const clickText = async text => React.act(() => [...document.querySelectorAll('button')].find(button => button.textContent === text).click());
  await clickText('Delete Bend Point');
  await React.act(() => document.querySelector('[aria-label="Delete bend point P1"]').click());
  await clickText('Clear All Bend Points');
  assert.deepEqual(calls, [{ id: 'e', remaining: [points[0]] }, { id: 'e', remaining: [points[1]] }, { id: 'e', remaining: [] }]);
  await React.act(() => root.unmount());
  jsdom.window.close();
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});
