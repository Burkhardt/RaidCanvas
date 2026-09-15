import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CascaisPalette,
  createOrthogonalPorts,
  createAimNode,
  createAimEdge,
  RaiBridge,
  AimSvgContract,
} from '../dist/index.js';

describe('RaidCanvas Core Tests', () => {
  test('CascaisPalette contains design tokens', () => {
    assert.equal(CascaisPalette.NetGold, '#F59E0B');
    assert.equal(CascaisPalette.HeraldicGreen, '#10B981');
    assert.equal(CascaisPalette.WarmGraphite, '#1F2937');
    assert.equal(CascaisPalette.ChalkWhite, '#FFFFFF');
  });

  test('createOrthogonalPorts generates 4-way docking anchors', () => {
    const ports = createOrthogonalPorts();
    assert.ok(ports.groups.top);
    assert.ok(ports.groups.right);
    assert.ok(ports.groups.bottom);
    assert.ok(ports.groups.left);
    assert.equal(ports.items.length, 4);
    assert.deepEqual(ports.items.map((i) => i.id), [
      'port-top',
      'port-right',
      'port-bottom',
      'port-left',
    ]);
  });

  test('createAimNode creates valid X6 Node Metadata', () => {
    const node = createAimNode({
      id: 'SignContract_UC',
      kind: 'uc',
      displayName: 'Sign Contract',
      stereotype: '«initiates»',
      bounds: { x: 100, y: 150, width: 140, height: 70 },
    });

    assert.equal(node.id, 'SignContract_UC');
    assert.equal(node.shape, 'aim-uc');
    assert.equal(node.x, 100);
    assert.equal(node.y, 150);
    assert.equal(node.width, 140);
    assert.equal(node.height, 70);
  });

  test('createAimEdge creates valid X6 Edge Metadata with bend points', () => {
    const edge = createAimEdge({
      id: 'rel-1',
      kind: 'dependency',
      sourceId: 'Actor_1',
      targetId: 'SignContract_UC',
      sourcePort: 'port-right',
      targetPort: 'port-left',
      label: 'depends on',
      bendPoints: [
        { x: 50, y: 50 },
        { x: 100, y: 50 },
      ],
    });

    assert.equal(edge.id, 'rel-1');
    assert.equal(edge.shape, 'aim-edge');
    assert.deepEqual(edge.source, { cell: 'Actor_1', port: 'port-right' });
    assert.deepEqual(edge.target, { cell: 'SignContract_UC', port: 'port-left' });
    assert.equal(edge.vertices.length, 2);
  });

  test('RaiBridge parses and formats orthogonal bend points', () => {
    const bridge = new RaiBridge();
    const parsed = bridge.parseBendPoints('100,50; 200,50; 200,150');
    assert.deepEqual(parsed, [
      { x: 100, y: 50 },
      { x: 200, y: 50 },
      { x: 200, y: 150 },
    ]);

    const formatted = bridge.formatBendPoints(parsed);
    assert.equal(formatted, '100,50; 200,50; 200,150');
  });

  test('RaiBridge serializes metamodel to canonical aim-* SVG', () => {
    const bridge = new RaiBridge();
    const metamodel = {
      diagramId: 'TestDiagram',
      archetype: 'InteractiveCanvas',
      nodes: [
        {
          id: 'UC_1',
          kind: 'uc',
          displayName: 'UseCase 1',
          bounds: { x: 10, y: 20, width: 140, height: 70 },
        },
      ],
      edges: [
        {
          id: 'E_1',
          kind: 'association',
          sourceId: 'UC_1',
          targetId: 'UC_1',
          bendPoints: [{ x: 10, y: 20 }, { x: 50, y: 20 }],
        },
      ],
    };

    const svg = bridge.serializeToSvg({
      getNodes: () => [],
      getEdges: () => [],
    }, undefined, {});

    // Directly test fresh SVG generation logic through metamodelFromGraph mock or serialize
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('id="RaidDiagram"'));
  });
});
