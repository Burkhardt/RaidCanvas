/**
 * The edge grammar: one table for how every edge is drawn, read by the live canvas and the export.
 * The Activity triad (Ontology Compendium v1.9 §10.2): «invokes» dashed with an open arrow, «spawns»
 * dashed with a hooked arrow, «precedes» solid with an open arrow.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  RaiBridge,
  EDGE_KIND_LINES,
  EDGE_STEREOTYPE_LINES,
  ACTIVITY_RELATIONS,
  createAimEdge,
  edgeHeadMarkerId,
  edgeTailMarkerId,
  edgeLabelOf,
  edgeLineOf,
  edgeStereotypeOf,
} from '../dist/index.js';

const jsdom = new JSDOM();
globalThis.DOMParser = jsdom.window.DOMParser;
globalThis.XMLSerializer = jsdom.window.XMLSerializer;

const edge = (extra = {}) => ({ id: 'e', sourceId: 'A', targetId: 'B', kind: 'association', bendPoints: [], ...extra });
const activity = (id, x) => ({ id, kind: 'act', displayName: id, bounds: { x, y: 40, width: 160, height: 60 } });
const model = (...edges) => ({ diagramId: 'Chain', archetype: 'ActivityDiagram', nodes: [activity('A', 40), activity('B', 400)], edges });

describe('reading the stereotype off an edge', () => {
  test('from the stereotype or the label, as a whole word, in any case, with or without guillemets', () => {
    assert.equal(edgeStereotypeOf({ stereotype: 'invokes' }), 'invokes');
    assert.equal(edgeStereotypeOf({ label: '«precedes»' }), 'precedes');
    assert.equal(edgeStereotypeOf({ stereotype: 'Spawns' }), 'spawns');
    assert.equal(edgeStereotypeOf({ label: 'observes' }), 'observes');
    assert.equal(edgeStereotypeOf({ label: 'reinvokes later' }), undefined, 'not inside another word');
    assert.equal(edgeStereotypeOf({ label: 'fills: Signer' }), undefined);
    assert.equal(edgeStereotypeOf({ stereotype: 'precedes', label: 'invokes' }), 'precedes', 'the stereotype is read first');
  });
});

describe('the line each edge gets', () => {
  test('the Activity triad', () => {
    assert.deepEqual(edgeLineOf(edge({ stereotype: 'invokes' })), { dash: '5,5', head: 'open' });
    assert.deepEqual(edgeLineOf(edge({ stereotype: 'spawns' })), { dash: '5,5', head: 'open', tail: 'hook' }, 'the hook sits at the start, like ↪');
    assert.deepEqual(edgeLineOf(edge({ stereotype: 'precedes' })), { head: 'open' });
    assert.deepEqual(ACTIVITY_RELATIONS, ['invokes', 'spawns', 'precedes']);
  });

  test('a stereotype wins over the kind; an undirected edge loses its head', () => {
    assert.deepEqual(edgeLineOf(edge({ kind: 'dependency', stereotype: 'precedes' })), { head: 'open' }, '«precedes» is solid even on a dependency');
    assert.equal(edgeLineOf(edge({ stereotype: 'invokes', directed: false })).head, 'none');
    assert.deepEqual(edgeLineOf(edge({ kind: 'generalization' })), { head: 'hollow' });
    assert.deepEqual(edgeLineOf(edge({ label: 'observes' })), { dash: '6,3,2,3', head: 'filled' }, 'ADR-0008 unchanged');
  });

  test('every dash in the table is distinct from the other dashed lines on the canvas', () => {
    const dashes = [...new Set([...Object.values(EDGE_KIND_LINES), ...Object.values(EDGE_STEREOTYPE_LINES)].map((line) => line.dash).filter(Boolean))];
    // 5,4 is an unfilled role's outline and 3,3 the Generic Role's ring: no edge may borrow them.
    assert.ok(!dashes.includes('5,4') && !dashes.includes('3,3'));
  });
});

describe('the text on the line', () => {
  test('an Activity relation is named when the host gives no label; the host label always wins', () => {
    assert.equal(edgeLabelOf({ stereotype: 'invokes' }), '«invokes»');
    assert.equal(edgeLabelOf({ stereotype: 'spawns' }), '«spawns»');
    assert.equal(edgeLabelOf({ stereotype: 'precedes', label: 'after ingestion' }), 'after ingestion');
    assert.equal(edgeLabelOf({ stereotype: 'observes' }), undefined, 'only the Activity relations are named automatically');
    assert.equal(edgeLabelOf({}), undefined);
  });
});

describe('the live canvas', () => {
  test('draws each relation with its dash, its head and its name', () => {
    const line = (data) => createAimEdge(edge(data)).attrs.line;
    assert.equal(line({ stereotype: 'invokes' }).strokeDasharray, '5,5');
    assert.equal(line({ stereotype: 'invokes' }).targetMarker.d, 'M 9 4 L 0 0 L 9 -4', 'an open V, tip at the target');
    assert.equal(line({ stereotype: 'invokes' }).targetMarker.fill, 'none');
    assert.equal(line({ stereotype: 'invokes' }).targetMarker.name, null, "X6's default classic head is cleared");
    assert.equal(line({ stereotype: 'spawns' }).targetMarker.d, 'M 9 4 L 0 0 L 9 -4', '«spawns» has the open head of a delegation');
    assert.equal(line({ stereotype: 'spawns' }).sourceMarker.d, 'M 0 0 L 6 0 C 10 0 10 -6 6 -6', 'and the hook at its start');
    assert.equal(line({ stereotype: 'invokes' }).sourceMarker, null, '«invokes» has none');
    assert.equal(line({ stereotype: 'precedes' }).strokeDasharray, 'none');
    assert.equal(line({ stereotype: 'precedes' }).targetMarker.d, 'M 9 4 L 0 0 L 9 -4');
    assert.equal(line({ stereotype: 'invokes', directed: false }).targetMarker, null);
    assert.equal(createAimEdge(edge({ stereotype: 'invokes' })).labels[0].attrs.text.text, '«invokes»');
  });

  test('keeps the UML kinds as they were', () => {
    assert.equal(createAimEdge(edge({ kind: 'aggregation' })).attrs.line.sourceMarker.d, 'M 10 0 L 5 3 L 0 0 L 5 -3 Z');
    assert.equal(createAimEdge(edge({ kind: 'aggregation' })).attrs.line.sourceMarker.fill, '#FFFFFF');
    assert.equal(createAimEdge(edge({ kind: 'composition' })).attrs.line.sourceMarker.fill, '#1F2937');
    assert.equal(createAimEdge(edge({ kind: 'generalization' })).attrs.line.targetMarker.fill, '#FFFFFF');
    assert.equal(createAimEdge(edge()).attrs.line.targetMarker.fill, '#1F2937', 'an association keeps its filled head');
  });
});

describe('the export', () => {
  const bridge = new RaiBridge();
  const exported = bridge.generateFreshSvg(model(
    edge({ id: 'i', stereotype: 'invokes' }),
    edge({ id: 's', stereotype: 'spawns' }),
    edge({ id: 'p', stereotype: 'precedes' }),
  ), {});
  const pathOf = (id) => exported.match(new RegExp(`aim-id="${id}"[\\s\\S]*?<path [^>]*class="aim-edge"[^>]*>`))[0];

  test('carries a marker for every head and tail in the grammar', () => {
    for (const head of ['filled', 'open', 'hollow']) assert.ok(exported.includes(`<marker id="${edgeHeadMarkerId(head)}"`), head);
    for (const tail of ['diamond-open', 'diamond-filled', 'hook']) assert.ok(exported.includes(`<marker id="${edgeTailMarkerId(tail)}"`), tail);
  });

  test('«spawns» carries its hook at the start; aggregation and composition finally carry their diamonds', () => {
    assert.ok(pathOf('s').includes('marker-start="url(#tail-hook)"'));
    assert.ok(!pathOf('i').includes('marker-start'));
    const svg = bridge.generateFreshSvg(model(edge({ kind: 'composition' })), {});
    assert.match(svg, /class="aim-edge"[^>]*marker-start="url\(#tail-diamond-filled\)"/);
  });

  test('draws each relation exactly as the live canvas does', () => {
    for (const [id, stereotype] of [['i', 'invokes'], ['s', 'spawns'], ['p', 'precedes']]) {
      const line = edgeLineOf(edge({ stereotype }));
      const path = pathOf(id);
      assert.ok(path.includes(`marker-end="url(#${edgeHeadMarkerId(line.head)})"`), `${stereotype} head`);
      assert.equal(path.includes('stroke-dasharray'), Boolean(line.dash), `${stereotype} dash`);
      if (line.dash) assert.ok(path.includes(`stroke-dasharray="${line.dash}"`));
      assert.ok(exported.includes(`>«${stereotype}»</text>`), `${stereotype} is named`);
    }
  });

  test('a plain dependency now has the same open head as on the live canvas', () => {
    const svg = bridge.generateFreshSvg(model(edge({ kind: 'dependency' })), {});
    assert.match(svg, /class="aim-edge"[^>]*stroke-dasharray="5,5" marker-end="url\(#arrow-open\)"/);
  });

  test('keeps the stereotype through a round trip, and an older file gains the markers it now needs', () => {
    const [back] = bridge.extractMetamodel(exported).edges.filter((candidate) => candidate.id === 'i');
    assert.equal(back.stereotype, 'invokes');

    const older = exported.replace(/<marker id="(arrow-open|tail-[a-z-]+)"[\s\S]*?<\/marker>/g, '');
    assert.ok(!older.includes('id="arrow-open"') && !older.includes('id="tail-hook"'));
    const updated = bridge.updateExistingSvg(older, model(edge({ id: 's', stereotype: 'spawns' })), {});
    assert.ok(updated.includes('id="arrow-open"') && updated.includes('id="tail-hook"'));
    assert.match(updated, /marker-end="url\(#arrow-open\)"/);
    assert.match(updated, /marker-start="url\(#tail-hook\)"/);
  });
});
