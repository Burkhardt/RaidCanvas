/**
 * Activity lifecycle on the canvas (0.13.0): one table, read by the live canvas and the export.
 * A run's Activity shows Done (Emerald fill, gold border); a successor whose preconditions now hold
 * shows Ready (Emerald frame). No state keeps the frame Activities always had.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { RaiBridge, CascaisPalette, ACTIVITY_DEFAULT_LOOK, ACTIVITY_STATE_LOOKS, activityLookOf, createAimNode } from '../dist/index.js';

const jsdom = new JSDOM();
globalThis.DOMParser = jsdom.window.DOMParser;
globalThis.XMLSerializer = jsdom.window.XMLSerializer;

const activity = (id, state) => ({ id, kind: 'act', displayName: id, bounds: { x: 40, y: 40, width: 160, height: 60 }, ...(state ? { state } : {}) });
const model = (...nodes) => ({ diagramId: 'Chain', archetype: 'ActivityDiagram', nodes, edges: [] });

describe('the look of each state', () => {
  test('Done is filled and framed in gold; Ready is framed in Emerald; Doing and no state keep the old frame', () => {
    assert.deepEqual(
      [activityLookOf('Done').fill, activityLookOf('Done').stroke],
      [CascaisPalette.EmeraldPale, CascaisPalette.NetGoldStroke],
    );
    assert.equal(activityLookOf('Unblocked').stroke, CascaisPalette.EmeraldDeep);
    assert.equal(activityLookOf('Ready'), activityLookOf('Unblocked'), 'Ready is a name for Unblocked');
    assert.equal(activityLookOf('Doing'), ACTIVITY_DEFAULT_LOOK);
    assert.equal(activityLookOf(undefined), ACTIVITY_DEFAULT_LOOK);
    assert.equal(activityLookOf('SomethingNew'), ACTIVITY_DEFAULT_LOOK);
    assert.equal(ACTIVITY_DEFAULT_LOOK.stroke, CascaisPalette.CascaisRed);
  });

  test('status colours only: no state borrows the duality colours of the flag', () => {
    for (const look of Object.values(ACTIVITY_STATE_LOOKS)) {
      for (const flag of [CascaisPalette.HeraldicGreen, CascaisPalette.BandeiraVermelho]) {
        assert.notEqual(look.fill, flag);
        assert.notEqual(look.stroke, flag);
      }
    }
  });

  test('states that could be confused differ in line as well as colour', () => {
    assert.ok(activityLookOf('Blocked').dash, 'Blocked is dashed');
    assert.ok(activityLookOf('Archived').dash, 'Archived is dotted');
    assert.notEqual(activityLookOf('Blocked').dash, activityLookOf('Archived').dash);
    assert.ok(activityLookOf('Done').strokeWidth > ACTIVITY_DEFAULT_LOOK.strokeWidth, 'the finished states carry a heavier border');
    assert.ok(activityLookOf('Concluded').strokeWidth > ACTIVITY_DEFAULT_LOOK.strokeWidth);
  });
});

describe('the live canvas', () => {
  test('frames the Activity body by its state', () => {
    const body = (state) => createAimNode(activity('A', state)).attrs.body;
    assert.equal(body('Done').fill, CascaisPalette.EmeraldPale);
    assert.equal(body('Done').stroke, CascaisPalette.NetGoldStroke);
    assert.equal(body('Blocked').strokeDasharray, '6,4');
    assert.equal(body(undefined).stroke, CascaisPalette.CascaisRed);
    assert.equal(body(undefined).strokeDasharray, null, 'a solid line unless the state says otherwise');
  });
});

describe('the export', () => {
  const bridge = new RaiBridge();
  const svg = bridge.generateFreshSvg(model(activity('Imported', 'Done'), activity('Next', 'Unblocked'), activity('Plain')), {});
  const rectOf = (id) => svg.match(new RegExp(`aim-id="${id}"[\\s\\S]*?<rect [^>]*>`))[0];

  test('draws the same looks, names the state, and keeps it for the round trip', () => {
    assert.match(rectOf('Imported'), new RegExp(`fill="${CascaisPalette.EmeraldPale}" stroke="${CascaisPalette.NetGoldStroke}" stroke-width="3"`));
    assert.match(svg, /<title>Done<\/title>/);
    assert.match(rectOf('Next'), new RegExp(`stroke="${CascaisPalette.EmeraldDeep}"`));
    assert.match(svg, /<title>Ready<\/title>/);
    assert.match(rectOf('Plain'), new RegExp(`stroke="${CascaisPalette.CascaisRed}" stroke-width="2"`));
    const states = Object.fromEntries(bridge.extractMetamodel(svg).nodes.map((n) => [n.id, n.state]));
    assert.deepEqual(states, { Imported: 'Done', Next: 'Unblocked', Plain: undefined });
  });
});
