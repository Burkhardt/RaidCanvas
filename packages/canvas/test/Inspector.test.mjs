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

test('inspector sanitizes <wbr> tags from display name input field', () => {
  const document = dom(React.createElement(RaidInspector, {
    selection: { id: 'node-1', type: 'node', nodeData: { kind: 'obj', displayName: 'Samstag<wbr>26' } },
  }));
  const input = document.querySelector('input[placeholder="e.g. Schedule Meeting"]');
  assert.ok(input, 'Display name input should exist');
  assert.equal(input.value, 'Samstag26');
});

test('CR053 node glyph picker selects several glyphs, and the stereotype text stays in sync', async () => {
  const jsdom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  globalThis.window = jsdom.window;
  globalThis.document = jsdom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(document.getElementById('root'));
  const calls = [];
  const render = nodeData => React.act(() => root.render(React.createElement(RaidInspector, {
    selection: { id: 'n', type: 'node', nodeData },
    onUpdateNode: (id, updates) => calls.push({ id, updates }),
  })));
  const query = selector => document.querySelector(selector);
  const setValue = Object.getOwnPropertyDescriptor(jsdom.window.HTMLInputElement.prototype, 'value').set;
  const type = (input, value) => React.act(() => { setValue.call(input, value); input.dispatchEvent(new jsdom.window.Event('input', { bubbles: true })); });
  const field = () => query('[aria-label="Stereotypes"]');
  const search = () => query('[aria-label="Search stereotype glyphs"]');

  await render({ kind: 'obj', displayName: 'Server' });
  assert.equal(query('[aria-label="Clear stereotype glyph"]'), null);
  await React.act(() => query('[aria-label="Choose stereotype glyph"]').click());
  assert.ok(query('[role="dialog"][aria-label="Stereotype glyphs"]'));
  assert.ok(document.querySelectorAll('[role="dialog"] img').length > 100, 'All tab lists the whole library');

  await type(search(), 'computer');
  const hit = query('[role="dialog"] [aria-label="Computer"]');
  assert.ok(hit, 'search finds Computer');
  assert.match(hit.querySelector('img').getAttribute('src'), /\/stereotypes\/Computer\.svg$/);
  await React.act(() => hit.click());
  assert.deepEqual(calls.pop(), { id: 'n', updates: { stereotypeGlyph: 'Computer.svg' } }, 'only the pictogram; the text shows it by itself');
  assert.ok(query('[role="dialog"]'), 'the flyout stays open for more');

  // The glyphs show in the text after the stereotype words, and on the badge.
  await render({ kind: 'per', displayName: 'Ana', stereotype: 'Customer', stereotypeGlyph: 'computer' });
  assert.equal(field().value, 'Customer, Computer.svg');
  assert.match(query('[aria-label="Choose stereotype glyph"] img').getAttribute('src'), /Computer\.svg$/);
  assert.equal(query('[role="dialog"] [aria-pressed="true"]').getAttribute('aria-label'), 'Computer', 'active glyph is marked in the grid');

  // A second pick adds; picking a selected one removes only that one.
  await type(search(), 'artist');
  await React.act(() => query('[role="dialog"] [aria-label="Artist"]').click());
  assert.deepEqual(calls.pop().updates, { stereotypeGlyph: 'Computer.svg, Artist.svg' });
  await render({ kind: 'per', displayName: 'Ana', stereotype: 'Customer', stereotypeGlyph: 'Computer.svg, Artist.svg' });
  assert.equal(field().value, 'Customer, Computer.svg, Artist.svg');
  assert.equal(document.querySelectorAll('[aria-label="Choose stereotype glyph"] img').length, 2);
  await React.act(() => query('[role="dialog"] [aria-label="Artist"]').click());
  assert.deepEqual(calls.pop().updates, { stereotypeGlyph: 'Computer.svg' });

  // Typing edits the same list: a glyph id or file selects it; a built-in word stays a stereotype.
  await React.act(() => field().focus());
  await type(field(), 'Customer, Lead, Artist, Bridge, Computer.svg');
  assert.deepEqual(calls.pop().updates, { stereotype: 'Customer, Lead, Artist', stereotypeGlyph: 'Bridge.svg, Computer.svg' });
  await type(field(), 'Customer, ');
  assert.equal(field().value, 'Customer, ', 'what is typed stays while the field has focus');
  assert.deepEqual(calls.pop().updates, { stereotype: 'Customer', stereotypeGlyph: '' });
  await React.act(() => field().blur());
  assert.equal(field().value, 'Customer, Computer.svg, Artist.svg', 'then it shows the stored list again');

  // A chip edits the stereotype words; the field lists them before the glyphs.
  const chip = [...document.querySelectorAll('button')].find(button => button.textContent.endsWith(' Lead'));
  await React.act(() => chip.click());
  assert.deepEqual(calls.pop().updates, { stereotype: ['Customer', 'Lead'] });
  await render({ kind: 'per', displayName: 'Ana', stereotype: ['Customer', 'Lead'], stereotypeGlyph: 'Computer.svg, Artist.svg' });
  assert.equal(field().value, 'Customer, Lead, Computer.svg, Artist.svg');

  // Category tabs narrow the grid; a query with no match in that category says so.
  await type(search(), 'computer');
  await React.act(() => query('[role="tab"]:nth-child(2)').click());
  assert.match(query('[role="dialog"]').textContent, /No glyph matches “computer”/);
  await type(search(), '');
  const roles = document.querySelectorAll('[role="dialog"] img').length;
  assert.ok(roles > 0 && roles < 100, `roles tab lists a subset (${roles})`);
  await React.act(() => query('[aria-label="Clear stereotype glyph"]').click());
  assert.deepEqual(calls.pop(), { id: 'n', updates: { stereotypeGlyph: '' } });

  // Unknown references stay visible verbatim; archetypes without glyph rendering get no picker.
  await render({ kind: 'per', stereotypeGlyph: 'Custom/Mascot.svg' });
  assert.match(query('[aria-label="Choose stereotype glyph"]').textContent, /Unknown: Custom\/Mascot\.svg/);
  assert.equal(field().value, 'Custom/Mascot.svg');
  assert.ok(query('[aria-label="Clear stereotype glyph"]'));
  await render({ kind: 'rol', displayName: 'Host' });
  assert.equal(query('[aria-label="Choose stereotype glyph"]'), null);

  await React.act(() => root.unmount());
  jsdom.window.close();
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

test('CR053 edge glyph picker assigns only the pictogram and clears it', async () => {
  const jsdom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  globalThis.window = jsdom.window;
  globalThis.document = jsdom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(document.getElementById('root'));
  const calls = [];
  const render = edgeData => React.act(() => root.render(React.createElement(RaidInspector, {
    selection: { id: 'e', type: 'edge', edgeData: { kind: 'association', bendPoints: [], ...edgeData } },
    onUpdateEdge: (id, updates) => calls.push({ id, updates }),
  })));
  const query = selector => document.querySelector(selector);

  await render({ label: 'ships' });
  await React.act(() => query('[aria-label="Choose stereotype glyph"]').click());
  await React.act(() => query('[role="dialog"] [aria-label="Semi Truck (right)"]').click());
  assert.deepEqual(calls.pop(), { id: 'e', updates: { stereotypeGlyph: 'SemiR.svg' } });

  await render({ label: 'ships', stereotypeGlyph: 'SemiR.svg' });
  assert.match(query('[aria-label="Choose stereotype glyph"] img').getAttribute('src'), /SemiR\.svg$/);
  await React.act(() => query('[aria-label="Clear stereotype glyph"]').click());
  assert.deepEqual(calls.pop(), { id: 'e', updates: { stereotypeGlyph: '' } });

  await React.act(() => root.unmount());
  jsdom.window.close();
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

test('a role slot offers Who / What / Where / Generic and its restriction; a Generic Role is named so', async () => {
  const markup = nodeData => dom(React.createElement(RaidInspector, { selection: { id: 'Signer', type: 'node', nodeData } }));
  const generic = markup({ kind: 'rol', displayName: 'Approver' });
  assert.match(generic.querySelector('.raid-inspector-header').textContent, /Generic Role/);
  assert.ok(generic.querySelector('[data-testid="role-category"]'));
  assert.equal(generic.querySelector('input[placeholder="e.g. Person, Document, Venue"]'), null, 'no restriction before a category is chosen');
  const options = [...generic.querySelectorAll('option')].map(option => option.value);
  assert.ok(options.includes('rol') && !options.includes('rf'), 'RoleFiller is not offered');
  const binding = markup({ kind: 'rf', displayName: 'Old' });
  assert.ok([...binding.querySelectorAll('option')].some(option => option.value === 'rf'), 'an rf binding node keeps its option');
  const instance = markup({ kind: 'per', displayName: 'RAI', instance: true });
  assert.equal(instance.querySelector('[data-testid="role-category"]'), null, 'an instance has no role category');

  const jsdom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  globalThis.window = jsdom.window;
  globalThis.document = jsdom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(document.getElementById('root'));
  const calls = [];
  await React.act(() => root.render(React.createElement(RaidInspector, {
    selection: { id: 'Signer', type: 'node', nodeData: { kind: 'obj', displayName: 'Signer', slot: true, restriction: 'Person' } },
    onUpdateNode: (id, updates) => calls.push({ id, updates }),
  })));
  assert.equal(document.querySelector('input[placeholder="e.g. Person, Document, Venue"]').value, 'Person');
  assert.equal([...document.querySelectorAll('label span')].some(span => /Instance/.test(span.textContent)), false, 'a slot is never an instance');
  const category = label => [...document.querySelectorAll('[data-testid="role-category"] button')].find(button => button.textContent === label);
  assert.equal(category('What').getAttribute('aria-pressed'), 'true');
  await React.act(() => category('What').click());
  await React.act(() => category('Who').click());
  await React.act(() => category('Generic').click());
  assert.deepEqual(calls, [
    { id: 'Signer', updates: { kind: 'per', slot: true } },
    { id: 'Signer', updates: { kind: 'rol', slot: false } },
  ]);
  await React.act(() => root.unmount());
  jsdom.window.close();
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});
