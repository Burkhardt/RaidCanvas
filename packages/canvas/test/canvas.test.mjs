import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CascaisPalette,
  createOrthogonalPorts,
  createAimNode,
  createAimEdge,
  RaiBridge,
  AimSvgContract,
  wrapAimText,
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

    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('id="RaidDiagram"'));
  });

  test('registered AOAIM shapes define valid SVG markup in X6 registry', async () => {
    const { Node, Edge } = await import('@antv/x6');
    const kinds = ['aim-uc', 'aim-act', 'aim-cls', 'aim-obj', 'aim-per'];
    for (const kind of kinds) {
      const Ctor = Node.registry.get(kind);
      assert.ok(Ctor, `Shape ${kind} should be registered in Node registry`);
      const instance = new Ctor();
      assert.ok(instance.markup, `Shape ${kind} must have defined markup`);
      assert.ok(Array.isArray(instance.markup), `Shape ${kind} markup must be an array`);
      assert.ok(instance.markup.length > 0, `Shape ${kind} markup must not be empty`);
    }

    const EdgeCtor = Edge.registry.get('aim-edge');
    assert.ok(EdgeCtor, 'aim-edge should be registered in Edge registry');
    const edgeInstance = new EdgeCtor();
    assert.ok(edgeInstance.markup, 'aim-edge must have defined markup');
  });

  test('createAimEdge respects routing modes (manhattan, normal, smooth)', async () => {
    const edgeManhattan = createAimEdge({
      id: 'e1',
      kind: 'association',
      sourceId: 'n1',
      targetId: 'n2',
      routing: 'manhattan',
      bendPoints: [],
    });
    assert.equal(edgeManhattan.router?.name, 'manhattan');
    assert.equal(edgeManhattan.connector?.name, 'rounded');

    const edgeNormal = createAimEdge({
      id: 'e2',
      kind: 'association',
      sourceId: 'n1',
      targetId: 'n2',
      routing: 'normal',
      bendPoints: [],
    });
    assert.equal(edgeNormal.router?.name, 'normal');
    assert.equal(edgeNormal.connector?.name, 'normal');

    const edgeSmooth = createAimEdge({
      id: 'e3',
      kind: 'association',
      sourceId: 'n1',
      targetId: 'n2',
      routing: 'smooth',
      bendPoints: [],
    });
    assert.equal(edgeSmooth.router?.name, 'normal');
    assert.equal(edgeSmooth.connector?.name, 'smooth');
  });

  test('RaiBridge serializes aim-routing and port attributes into SVG', () => {
    const bridge = new RaiBridge();
    const model = {
      diagramId: 'TestDiagram',
      archetype: 'InteractiveCanvas',
      nodes: [
        {
          id: 'A',
          kind: 'act',
          displayName: 'Step A',
          bounds: { x: 10, y: 10, width: 100, height: 50 },
        },
        {
          id: 'B',
          kind: 'act',
          displayName: 'Step B',
          bounds: { x: 200, y: 10, width: 100, height: 50 },
        },
      ],
      edges: [
        {
          id: 'edge_normal',
          kind: 'association',
          sourceId: 'A',
          targetId: 'B',
          sourcePort: 'port-right',
          targetPort: 'port-left',
          routing: 'normal',
          bendPoints: [],
        },
      ],
    };

    const svg = bridge.serializeToSvg({
      getNodes: () => [],
      getEdges: () => [],
    }, undefined, {});

    // Directly test fresh SVG generation with edge data
    const freshSvg = bridge.generateFreshSvg
      ? bridge.generateFreshSvg(model, {})
      : bridge.serializeToSvg({
          getNodes: () => model.nodes.map(n => ({
            id: n.id,
            shape: 'aim-act',
            getPosition: () => ({ x: n.bounds.x, y: n.bounds.y }),
            getSize: () => ({ width: n.bounds.width, height: n.bounds.height }),
            getData: () => n,
          })),
          getEdges: () => model.edges.map(e => ({
            id: e.id,
            getSourceCell: () => ({ id: e.sourceId }),
            getTargetCell: () => ({ id: e.targetId }),
            getSourcePortId: () => e.sourcePort,
            getTargetPortId: () => e.targetPort,
            getVertices: () => [],
            getLabels: () => [],
            getRouter: () => ({ name: 'normal' }),
            getConnector: () => ({ name: 'normal' }),
            getData: () => e,
          })),
        });

    assert.ok(freshSvg.includes('aim-routing="normal"'));
    assert.ok(freshSvg.includes('aim-source-port="port-right"'));
    assert.ok(freshSvg.includes('aim-target-port="port-left"'));
  });

  test('wrapAimText wraps on spaces and breaks explicitly on <wbr>', () => {
    // 1. Long text with spaces wraps at maxLineLength
    const longText = 'AIA Platform Genesis & Bootstrap';
    const wrappedSpaces = wrapAimText(longText, 18);
    assert.deepEqual(wrappedSpaces.split('\n'), [
      'AIA Platform',
      'Genesis &',
      'Bootstrap',
    ]);

    // 2. Text with <wbr> breaks immediately on <wbr>
    const wbrText = 'AIA<wbr>Platform<wbr>Genesis';
    const wrappedWbr = wrapAimText(wbrText);
    assert.deepEqual(wrappedWbr.split('\n'), [
      'AIA',
      'Platform',
      'Genesis',
    ]);

    // 3. Mixed spaces and <wbr>
    const mixed = 'Create<wbr>User Account';
    const wrappedMixed = wrapAimText(mixed, 20);
    assert.deepEqual(wrappedMixed.split('\n'), [
      'Create',
      'User Account',
    ]);

    // 4. Empty text returns empty string
    assert.equal(wrapAimText(''), '');
  });

  test('createAimNode creates Person glyph with head, torso and initiating color', () => {
    const actor = createAimNode({
      id: 'Actor_1',
      kind: 'per',
      displayName: 'Customer Role',
      stereotype: '«initiates»',
      bounds: { x: 50, y: 50, width: 90, height: 90 },
    });

    assert.equal(actor.shape, 'aim-per');
    // Initiating actor gets NetGold accent
    assert.equal(actor.attrs?.torso?.stroke, CascaisPalette.NetGold);
    assert.equal(actor.attrs?.head?.stroke, CascaisPalette.NetGold);
    assert.ok(actor.attrs?.label?.text?.includes('«initiates»'));
    assert.ok(actor.attrs?.label?.text?.includes('Customer'));

    const standardActor = createAimNode({
      id: 'Actor_2',
      kind: 'per',
      displayName: 'Staff',
      bounds: { x: 50, y: 50, width: 90, height: 90 },
    });
    assert.equal(standardActor.attrs?.torso?.stroke, CascaisPalette.WarmGraphite);
  });

  test('createAimNode configures textDecoration underline for Activity and Object instances', () => {
    const actNode = createAimNode({
      id: 'Act_1',
      kind: 'act',
      displayName: 'Sign Document',
      bounds: { x: 0, y: 0, width: 150, height: 60 },
    });
    assert.equal(actNode.attrs?.label?.textDecoration, 'underline');

    const objNode = createAimNode({
      id: 'Obj_1',
      kind: 'obj',
      displayName: 'invoice: Invoice',
      bounds: { x: 0, y: 0, width: 160, height: 80 },
    });
    assert.equal(objNode.attrs?.label?.textDecoration, 'underline');
  });

  test('RaiBridge does not infer ports by default (inferPorts: false)', () => {
    const bridge = new RaiBridge();
    const svgSource = `
      <svg xmlns="http://www.w3.org/2000/svg" aim-routing="curved">
        <g aim-node="true" aim-id="NodeA" aim-kind="act" aim-display-name="A" transform="translate(100, 100)">
          <rect width="100" height="50" />
        </g>
        <g aim-node="true" aim-id="NodeB" aim-kind="act" aim-display-name="B" transform="translate(300, 100)">
          <rect width="100" height="50" />
        </g>
        <g aim-edge="true" aim-id="Edge1" aim-source="NodeA" aim-target="NodeB" />
      </svg>
    `;

    // Simulated DOM element for test environment
    const fakeDoc = {
      querySelectorAll: (sel) => {
        if (sel.includes('aim-node')) {
          return [
            {
              tagName: 'g',
              getAttribute: (k) => (k === 'aim-id' ? 'NodeA' : k === 'aim-kind' ? 'act' : null),
              querySelector: () => null,
            },
            {
              tagName: 'g',
              getAttribute: (k) => (k === 'aim-id' ? 'NodeB' : k === 'aim-kind' ? 'act' : null),
              querySelector: () => null,
            },
          ];
        }
        if (sel.includes('aim-edge')) {
          return [
            {
              getAttribute: (k) => {
                if (k === 'aim-id') return 'Edge1';
                if (k === 'aim-source') return 'NodeA';
                if (k === 'aim-target') return 'NodeB';
                return null;
              },
              querySelector: () => null,
            },
          ];
        }
        return [];
      },
      getAttribute: (k) => (k === 'aim-routing' ? 'curved' : null),
    };

    const modelDefault = bridge.extractMetamodel(fakeDoc, {});
    // By default, terminals are unpinned (dynamic center-aiming)
    assert.equal(modelDefault.edges[0]?.sourcePort, undefined);
    assert.equal(modelDefault.edges[0]?.targetPort, undefined);
    // Diagram-level routing normalized from "curved" to "smooth"
    assert.equal(modelDefault.routing, 'smooth');

    // With explicit inferPorts: true, ports are inferred
    const modelInferred = bridge.extractMetamodel(fakeDoc, { inferPorts: true });
    assert.equal(modelInferred.edges[0]?.sourcePort, 'port-right');
    assert.equal(modelInferred.edges[0]?.targetPort, 'port-left');
  });

  test('RaiBridge serializes diagram-level routing and Person glyph into SVG', () => {
    const bridge = new RaiBridge();
    const model = {
      diagramId: 'TestDiag',
      archetype: 'InteractiveCanvas',
      routing: 'smooth',
      nodes: [
        {
          id: 'Per_1',
          kind: 'per',
          displayName: 'User<wbr>Operator',
          bounds: { x: 50, y: 50, width: 90, height: 90 },
        },
        {
          id: 'Act_1',
          kind: 'act',
          displayName: 'Approve',
          bounds: { x: 200, y: 50, width: 140, height: 60 },
        },
      ],
      edges: [
        {
          id: 'E1',
          kind: 'association',
          sourceId: 'Per_1',
          targetId: 'Act_1',
          // Unpinned (no sourcePort or targetPort)
          bendPoints: [],
        },
      ],
    };

    const svg = bridge.generateFreshSvg(model, {});
    // 1. Diagram root has aim-routing="smooth"
    assert.ok(svg.includes('aim-routing="smooth"'));
    // 2. Person glyph markup is generated
    assert.ok(svg.includes('<circle cx="45" cy="22" r="8"'));
    assert.ok(svg.includes('M 61 50 v -4 a 8 8 0 0 0 -8 -8 H 37 a 8 8 0 0 0 -8 8 v 4'));
    // 3. Underline applied to Activity
    assert.ok(svg.includes('text-decoration="underline"'));
    // 4. Multi-line tspan generated from <wbr>
    assert.ok(svg.includes('<tspan x="45"'));
    assert.ok(svg.includes('User</tspan>'));
    assert.ok(svg.includes('Operator</tspan>'));
    // 5. Unpinned edge does NOT output port attributes
    assert.ok(!svg.includes('aim-source-port'));
    assert.ok(!svg.includes('aim-target-port'));
  });
});

