/**
 * Handover (RAI & Vasco): a 1UCC role is a slot of its category archetype (per / obj / plc) with the role
 * name prominent and the expected Class as a quiet `: <Class>` tag; a 1AOC / _RFD filler is an instance.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { RaiBridge, AimSvgContract, createAimNode, isInstanceNode, restrictionTag } from '../dist/index.js';

const jsdom = new JSDOM();
globalThis.DOMParser = jsdom.window.DOMParser;
globalThis.XMLSerializer = jsdom.window.XMLSerializer;

const bounds = { x: 0, y: 0, width: 160, height: 80 };
const slotModel = {
  diagramId: 'NegotiateContract_UCD',
  archetype: 'OneUseCaseDiagram',
  nodes: [
    { id: 'Signer', kind: 'per', displayName: 'Signer', slot: true, restriction: 'Person', bounds: { x: 0, y: 0, width: 120, height: 110 } },
    { id: 'Contract', kind: 'obj', displayName: 'Contract', slot: true, restriction: 'Document', bounds: { x: 200, y: 0, width: 160, height: 80 } },
    { id: 'Venue', kind: 'plc', displayName: 'Venue', slot: true, restriction: 'Place', bounds: { x: 400, y: 0, width: 160, height: 70 } },
    { id: 'Contract4711', kind: 'obj', displayName: 'Contract4711', qualifier: 'Document', bounds: { x: 0, y: 200, width: 160, height: 80 } },
  ],
  edges: [],
};

describe('Role slots (1UCC) and instances (1AOC / _RFD)', () => {
  test('isInstanceNode: a slot is never an instance; an Object is one unless it is a slot', () => {
    assert.equal(isInstanceNode({ kind: 'obj' }), true);
    assert.equal(isInstanceNode({ kind: 'obj', slot: true }), false);
    assert.equal(isInstanceNode({ kind: 'per', instance: true, slot: true }), false);
    assert.equal(isInstanceNode({ kind: 'per' }), false);
    assert.equal(isInstanceNode({ kind: 'rf' }), true, 'RoleFiller binding circles load as instances');
    assert.equal(restrictionTag(' Person '), ': Person');
    assert.equal(restrictionTag(''), undefined);
  });

  test('slot and restriction round-trip through fresh SVG and extraction', () => {
    const bridge = new RaiBridge();
    const svg = bridge.generateFreshSvg(slotModel, {});
    assert.match(svg, /aim-id="Contract" aim-kind="obj"[^>]*aim-slot="true" aim-restriction="Document"/);
    const contractGroup = svg.match(/<g [^>]*aim-id="Contract" [^>]*>/)[0];
    assert.ok(!contractGroup.includes(AimSvgContract.ATTR_INSTANCE), 'an Object slot is not an instance');
    assert.match(svg.match(/<g [^>]*aim-id="Contract4711" [^>]*>/)[0], /aim-instance="true"/);

    const back = bridge.extractMetamodel(svg);
    const byId = Object.fromEntries(back.nodes.map(n => [n.id, n]));
    for (const [id, restriction] of [['Signer', 'Person'], ['Contract', 'Document'], ['Venue', 'Place']]) {
      assert.equal(byId[id].slot, true, `${id} keeps its slot`);
      assert.equal(byId[id].restriction, restriction);
      assert.notEqual(byId[id].instance, true);
    }
    assert.equal(byId.Contract4711.instance, true);
    assert.equal(byId.Contract4711.slot, undefined);
  });

  test('updateExistingSvg writes and clears aim-slot / aim-restriction', () => {
    const bridge = new RaiBridge();
    const base = bridge.generateFreshSvg(slotModel, {});
    const promoted = { ...slotModel, nodes: slotModel.nodes.map(n => n.id === 'Contract' ? { ...n, kind: 'per', restriction: 'Person' } : n.id === 'Venue' ? { ...n, slot: undefined, restriction: undefined } : n) };
    const updated = bridge.updateExistingSvg(base, promoted, {});
    const back = Object.fromEntries(bridge.extractMetamodel(updated).nodes.map(n => [n.id, n]));
    assert.equal(back.Contract.kind, 'per', 'a What-role moved to Who keeps its id');
    assert.equal(back.Contract.displayName, 'Contract');
    assert.equal(back.Contract.restriction, 'Person');
    assert.equal(back.Venue.slot, undefined);
    assert.equal(back.Venue.restriction, undefined);
  });

  test('exported slots wear the quiet `: <Class>` tag, never an underline, ring or dash', () => {
    const bridge = new RaiBridge();
    for (const node of slotModel.nodes.slice(0, 3)) {
      const inner = bridge.renderNodeInnerSvg(node);
      assert.ok(!inner.includes('aim-slot-ring'), `${node.id} has no ring`);
      assert.ok(!inner.includes('stroke-dasharray'), `${node.id} has no dashed outline`);
      assert.match(inner, new RegExp(`class="aim-restriction"[^>]*>: ${node.restriction}<`));
      assert.ok(!inner.includes('underline'), `${node.id} is not underlined`);
    }
    const instance = bridge.renderNodeInnerSvg(slotModel.nodes[3]);
    assert.match(instance, /text-decoration="underline"[^>]*>Contract4711</);
  });

  test('a fresh export no longer drops aim-unbound', () => {
    const svg = new RaiBridge().generateFreshSvg({ ...slotModel, nodes: [{ id: 'X', kind: 'per', displayName: 'Host', unbound: true, bounds }] }, {});
    assert.match(svg, /aim-unbound="true"/);
  });

  test('createAimNode: a slot has the role name plain and the restriction in the quiet line, no ring', () => {
    const per = createAimNode(slotModel.nodes[0]);
    assert.equal(per.attrs.slotRing, undefined);
    assert.equal(per.attrs.label.text, 'Signer');
    assert.equal(per.attrs.label.textDecoration, 'none');
    assert.equal(per.attrs.qualifier.text, ': Person');

    const obj = createAimNode(slotModel.nodes[1]);
    assert.equal(obj.attrs.slotHalo, undefined);
    assert.equal(obj.attrs.label.textDecoration, 'none', 'an Object slot is not underlined');
    assert.equal(obj.attrs.qualifier.text, ': Document');
    assert.ok(obj.attrs.qualifier.refY2 > obj.attrs.label.refY2, 'the tag sits below the role name');

    const filler = createAimNode(slotModel.nodes[3]);
    assert.equal(filler.attrs.label.textDecoration, 'underline');
    assert.equal(filler.attrs.qualifier.text, 'Document');
  });

  test('aim-kind="rf" binding nodes load and render', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><g aim-node="true" aim-id="RF1" aim-kind="rf" aim-display-name="Signer" transform="translate(0, 0)"></g></svg>`;
    const bridge = new RaiBridge();
    const [node] = bridge.extractMetamodel(svg).nodes;
    assert.equal(node.kind, 'rf');
    assert.equal(node.instance, true);
    assert.match(bridge.renderNodeInnerSvg(node), /<circle /);
    assert.equal(createAimNode(node).shape, 'aim-rf');
  });
});
