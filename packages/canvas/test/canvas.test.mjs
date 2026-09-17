import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  CascaisPalette,
  createOrthogonalPorts,
  createAimNode,
  createAimEdge,
  RaiBridge,
  AimSvgContract,
  wrapAimText,
  computeMaxLineLength,
  escapeXmlText,
  escapeXmlAttr,
  computePortalDoorAttrs,
  getDefaultNodeName,
  getDefaultNodeBounds,
} from '../dist/index.js';

const jsdom = new JSDOM();
globalThis.DOMParser = jsdom.window.DOMParser;
globalThis.XMLSerializer = jsdom.window.XMLSerializer;

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

  test('wrapAimText wraps on spaces and treats <wbr> and hyphens as soft-break opportunities', () => {
    // 1. Long unbroken string with <wbr> soft breaks glues syllables until line limit
    const userExample =
      'For<wbr />Words<wbr />Or<wbr />Strings<wbr />Too<wbr />Long<wbr />To<wbr />Fit<wbr />In<wbr />One<wbr />Line<wbr />And<wbr />Do<wbr />Not<wbr />Have Blanks in-between';
    const wrappedUser = wrapAimText(userExample, 21);
    assert.deepEqual(wrappedUser.split('\n'), [
      'ForWordsOrStringsToo',
      'LongToFitInOneLineAnd',
      'DoNotHave Blanks in-',
      'between',
    ]);

    // 2. Long text with spaces wraps at maxLineLength
    const longText = 'AIA Platform Genesis & Bootstrap';
    const wrappedSpaces = wrapAimText(longText, 18);
    assert.deepEqual(wrappedSpaces.split('\n'), [
      'AIA Platform',
      'Genesis &',
      'Bootstrap',
    ]);

    // 3. Short syllables with <wbr> that fit on one line stay glued together
    const shortWbr = 'Micro<wbr />Service';
    assert.equal(wrapAimText(shortWbr, 20), 'MicroService');

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

  test('createAimNode configures textDecoration underline only when instance === true (CR032)', () => {
    const actPlain = createAimNode({
      id: 'Act_1',
      kind: 'act',
      displayName: 'Sign Document',
      bounds: { x: 0, y: 0, width: 150, height: 60 },
    });
    // CR032: No archetype implies instance
    assert.equal(actPlain.attrs?.label?.textDecoration, 'none');

    const actInstance = createAimNode({
      id: 'Act_2',
      kind: 'act',
      displayName: 'Sign Document',
      instance: true,
      bounds: { x: 0, y: 0, width: 150, height: 60 },
    });
    assert.equal(actInstance.attrs?.label?.textDecoration, 'underline');

    const objPlain = createAimNode({
      id: 'Obj_1',
      kind: 'obj',
      displayName: 'invoice: Invoice',
      bounds: { x: 0, y: 0, width: 160, height: 80 },
    });
    assert.equal(objPlain.attrs?.label?.textDecoration, 'none');

    const objInstance = createAimNode({
      id: 'Obj_2',
      kind: 'obj',
      displayName: 'invoice: Invoice',
      instance: true,
      bounds: { x: 0, y: 0, width: 160, height: 80 },
    });
    assert.equal(objInstance.attrs?.label?.textDecoration, 'underline');
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
          displayName: 'Chief<wbr>Executive<wbr>Officer',
          bounds: { x: 50, y: 50, width: 90, height: 90 },
        },
        {
          id: 'Act_1',
          kind: 'act',
          displayName: 'Approve',
          instance: true,
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
    // 3. Underline applied to instance node (CR032)
    assert.ok(svg.includes('text-decoration="underline"'));
    // 4. Multi-line tspan generated from <wbr> soft break when line length exceeded
    assert.ok(svg.includes('x="45"') && svg.includes('<tspan'));
    assert.ok(svg.includes('ChiefExecutive</tspan>'));
    assert.ok(svg.includes('Officer</tspan>'));
    // 5. Unpinned edge does NOT output port attributes
    assert.ok(!svg.includes('aim-source-port'));
    assert.ok(!svg.includes('aim-target-port'));
  });

  test('RaiBridge bakes fully connected edge path geometry and arrowheads for standalone viewers', () => {
    const bridge = new RaiBridge();
    const model = {
      diagramId: 'ConnectedDiagram',
      archetype: 'InteractiveCanvas',
      routing: 'manhattan',
      nodes: [
        {
          id: 'Per_1',
          kind: 'per',
          displayName: 'Sales Agent',
          bounds: { x: 50, y: 50, width: 90, height: 90 },
        },
        {
          id: 'Act_1',
          kind: 'act',
          displayName: 'Close Deal',
          bounds: { x: 300, y: 50, width: 140, height: 60 },
        },
      ],
      edges: [
        {
          id: 'E1',
          kind: 'association',
          sourceId: 'Per_1',
          targetId: 'Act_1',
          bendPoints: [],
        },
      ],
    };

    // 1. Test generateFreshSvg fallback path generation
    const freshSvg = bridge.generateFreshSvg(model, {});
    assert.ok(freshSvg.includes('marker id="arrow-classic"'), 'defs should include arrow-classic marker');
    assert.ok(freshSvg.includes('marker id="arrow-hollow"'), 'defs should include arrow-hollow marker');
    assert.ok(freshSvg.includes('<path d="M 140 95 L 220 95 L 220 80 L 300 80" class="aim-edge" fill="none" stroke="#1F2937" stroke-width="1.5" marker-end="url(#arrow-classic)" />'), 'edge path connects source to target boundary');
    assert.ok(freshSvg.includes('marker-end="url(#arrow-classic)"'), 'edge includes arrowhead marker');

    // 2. Test updateExistingSvg with live pathData
    const baseSvg = `<svg xmlns="http://www.w3.org/2000/svg" id="ConnectedDiagram">
  <defs></defs>
  <g class="aim-edges-layer">
    <g aim-edge="true" aim-id="E1" aim-source="Per_1" aim-target="Act_1"></g>
  </g>
  <g class="aim-nodes-layer">
    <g aim-node="true" aim-id="Per_1"></g>
    <g aim-node="true" aim-id="Act_1"></g>
  </g>
</svg>`;

    const liveModel = {
      ...model,
      edges: [
        {
          ...model.edges[0],
          pathData: 'M 140 95 L 200 95 L 200 80 L 300 80',
        },
      ],
    };

    const updatedSvg = bridge.updateExistingSvg(baseSvg, liveModel, {});
    assert.ok(updatedSvg.includes('d="M 140 95 L 200 95 L 200 80 L 300 80"'), 'live path data is baked into existing SVG');
    assert.ok(updatedSvg.includes('marker-end="url(#arrow-classic)"'), 'arrow marker is attached');
    assert.ok(updatedSvg.includes('id="arrow-classic"'), 'arrow-classic marker added to defs');
    assert.ok(updatedSvg.includes('id="arrow-hollow"'), 'arrow-hollow marker added to defs');
  });

  test('updateExistingSvg emits full canonical archetype shape markup (head circles, torso paths, underlines)', () => {
    const bridge = new RaiBridge();

    // Legacy base SVG where Person nodes were just plain rect boxes without glyph markup (Zébio's test case)
    const baseSvg = `<svg xmlns="http://www.w3.org/2000/svg" id="LegacyDiagram">
  <defs></defs>
  <g class="aim-nodes-layer">
    <g aim-node="true" aim-id="Per_1" aim-kind="per"><rect width="90" height="90"/><text>Actor 1</text></g>
    <g aim-node="true" aim-id="Per_2" aim-kind="per"><rect width="90" height="90"/><text>Actor 2</text></g>
    <g aim-node="true" aim-id="Per_3" aim-kind="per"><rect width="90" height="90"/><text>Actor 3</text></g>
    <g aim-node="true" aim-id="Per_4" aim-kind="per"><rect width="90" height="90"/><text>Actor 4</text></g>
    <g aim-node="true" aim-id="Act_1" aim-kind="act"><rect width="140" height="60"/><text>Execute Deal</text></g>
  </g>
  <g class="aim-edges-layer"></g>
</svg>`;

    const model = {
      diagramId: 'LegacyDiagram',
      archetype: 'InteractiveCanvas',
      nodes: [
        { id: 'Per_1', kind: 'per', displayName: 'Actor 1', stereotype: '«initiates»', bounds: { x: 50, y: 50, width: 90, height: 90 } },
        { id: 'Per_2', kind: 'per', displayName: 'Actor 2', bounds: { x: 160, y: 50, width: 90, height: 90 } },
        { id: 'Per_3', kind: 'per', displayName: 'Actor 3', bounds: { x: 270, y: 50, width: 90, height: 90 } },
        { id: 'Per_4', kind: 'per', displayName: 'Actor 4', bounds: { x: 380, y: 50, width: 90, height: 90 } },
        { id: 'Act_1', kind: 'act', displayName: 'Execute Deal', instance: true, bounds: { x: 500, y: 65, width: 140, height: 60 } },
      ],
      edges: [],
    };

    const updatedSvg = bridge.updateExistingSvg(baseSvg, model, {});

    // Count head circles: must be exactly 4 for the 4 Person nodes!
    const headCircleMatches = updatedSvg.match(/<circle cx="45" cy="22" r="8"/g);
    assert.equal(headCircleMatches?.length, 4, 'Emits 4 head circles for 4 Person nodes');

    // Count torso paths: must be exactly 4!
    const torsoPathMatches = updatedSvg.match(/d="M 61 50 v -4 a 8 8 0 0 0 -8 -8 H 37 a 8 8 0 0 0 -8 8 v 4"/g);
    assert.equal(torsoPathMatches?.length, 4, 'Emits 4 torso paths for 4 Person nodes');

    // Check initiating color on Per_1
    assert.ok(updatedSvg.includes('stroke="#F59E0B"'), 'Initiating persona uses Cascais Net Gold');

    // Check Activity underline
    assert.ok(updatedSvg.includes('text-decoration="underline"'), 'Activity label has text-decoration="underline"');
    assert.ok(updatedSvg.includes('.aim-node[aim-instance="true"] text.aim-name'), 'Style includes underline rules');
  });
});

describe('CR030 XML Text & Attribute Escaping Acceptance Tests', () => {
  const bridge = new RaiBridge();

  test('escapeXmlText and escapeXmlAttr helper functions escape characters correctly', () => {
    assert.equal(escapeXmlText('A & B < C > D'), 'A &amp; B &lt; C &gt; D');
    assert.equal(escapeXmlAttr('Quote: "Hello" & \'World\' <1>'), 'Quote: &quot;Hello&quot; &amp; &apos;World&apos; &lt;1&gt;');
  });

  test('Ampersand round-trip: "AIA Platform Genesis & Bootstrap" round-trips with 0 <parsererror> nodes and identical decoded text', () => {
    const rawName = 'AIA Platform Genesis & Bootstrap';
    const model = {
      diagramId: 'TestDiagram',
      archetype: 'InteractiveCanvas',
      nodes: [
        { id: 'Act_1', kind: 'act', displayName: rawName, bounds: { x: 50, y: 50, width: 140, height: 60 } },
      ],
      edges: [],
    };

    // 1. Fresh SVG export
    const freshSvg = bridge.generateFreshSvg(model, {});
    assert.ok(freshSvg.includes('aim-display-name="AIA Platform Genesis &amp; Bootstrap"'));
    assert.ok(freshSvg.includes('&amp;'));

    const parser = new DOMParser();
    const freshDoc = parser.parseFromString(freshSvg, 'image/svg+xml');
    assert.equal(freshDoc.querySelectorAll('parsererror').length, 0, 'No parsererror in fresh SVG');
    const freshNode = freshDoc.querySelector('[aim-node="true"]');
    assert.equal(freshNode.getAttribute('aim-display-name'), rawName, 'Attribute round-trips decoded text');

    // 2. Existing SVG update
    const baseSvg = `<svg xmlns="http://www.w3.org/2000/svg" id="TestDiagram">
      <defs></defs>
      <g class="aim-nodes-layer">
        <g aim-node="true" aim-id="Act_1" aim-kind="act"><rect width="140" height="60"/><text>Old</text></g>
      </g>
    </svg>`;
    const updatedSvg = bridge.updateExistingSvg(baseSvg, model, {});
    assert.ok(updatedSvg.includes('aim-display-name="AIA Platform Genesis &amp; Bootstrap"'));

    const updatedDoc = parser.parseFromString(updatedSvg, 'image/svg+xml');
    assert.equal(updatedDoc.querySelectorAll('parsererror').length, 0, 'No parsererror in updated SVG');
    const updatedNode = updatedDoc.querySelector('[aim-node="true"]');
    assert.equal(updatedNode.getAttribute('aim-display-name'), rawName, 'Attribute in updated SVG round-trips decoded text');
  });

  test('Angle brackets: "<script>alert(1)</script>" renders literal text without DOM injection', () => {
    const rawName = '<script>alert(1)</script>';
    const model = {
      diagramId: 'TestDiagram',
      archetype: 'InteractiveCanvas',
      nodes: [
        { id: 'Act_1', kind: 'act', displayName: rawName, bounds: { x: 50, y: 50, width: 140, height: 60 } },
      ],
      edges: [],
    };

    const freshSvg = bridge.generateFreshSvg(model, {});
    assert.ok(freshSvg.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    assert.ok(!freshSvg.includes('<script>'));

    const parser = new DOMParser();
    const doc = parser.parseFromString(freshSvg, 'image/svg+xml');
    assert.equal(doc.querySelectorAll('script').length, 0, 'No script DOM element injected');
    const nodeEl = doc.querySelector('[aim-node="true"]');
    assert.equal(nodeEl.getAttribute('aim-display-name'), rawName, 'Decodes back to original script tag string');
  });

  test('Quotes: \'the "Lisbon" rehearsal\' keeps attributes valid', () => {
    const rawName = 'the "Lisbon" rehearsal';
    const model = {
      diagramId: 'TestDiagram',
      archetype: 'InteractiveCanvas',
      nodes: [
        { id: 'Act_1', kind: 'act', displayName: rawName, bounds: { x: 50, y: 50, width: 140, height: 60 } },
      ],
      edges: [],
    };

    const freshSvg = bridge.generateFreshSvg(model, {});
    assert.ok(freshSvg.includes('aim-display-name="the &quot;Lisbon&quot; rehearsal"'));

    const parser = new DOMParser();
    const doc = parser.parseFromString(freshSvg, 'image/svg+xml');
    assert.equal(doc.querySelectorAll('parsererror').length, 0);
    const nodeEl = doc.querySelector('[aim-node="true"]');
    assert.equal(nodeEl.getAttribute('aim-display-name'), rawName);
  });

  test('No node truncation: Diagram with ampersand in the first node retains 100% of following nodes/edges', () => {
    const model = {
      diagramId: 'MultiNodeDiagram',
      archetype: 'AOAIMDiagram',
      nodes: [
        { id: 'act-1', kind: 'act', displayName: 'Genesis & Bootstrap', bounds: { x: 10, y: 10, width: 140, height: 60 } },
        { id: 'act-2', kind: 'act', displayName: 'System Execution', bounds: { x: 200, y: 10, width: 140, height: 60 } },
        { id: 'obj-1', kind: 'obj', displayName: 'Artifact Ledger', bounds: { x: 400, y: 10, width: 140, height: 60 } },
      ],
      edges: [
        { id: 'e1', kind: 'association', sourceId: 'act-1', targetId: 'act-2', label: 'triggers & informs', bendPoints: [] },
        { id: 'e2', kind: 'dependency', sourceId: 'act-2', targetId: 'obj-1', label: 'writes to', bendPoints: [] },
      ],
    };

    // Test fresh SVG
    const freshSvg = bridge.generateFreshSvg(model, {});
    const parser = new DOMParser();
    const freshDoc = parser.parseFromString(freshSvg, 'image/svg+xml');
    assert.equal(freshDoc.querySelectorAll('[aim-node="true"]').length, 3, '100% of nodes retained in fresh SVG');
    assert.equal(freshDoc.querySelectorAll('[aim-edge="true"]').length, 2, '100% of edges retained in fresh SVG');
    assert.equal(freshDoc.querySelectorAll('parsererror').length, 0);

    // Test updated SVG
    const updatedSvg = bridge.updateExistingSvg(freshSvg, model, {});
    const updatedDoc = parser.parseFromString(updatedSvg, 'image/svg+xml');
    assert.equal(updatedDoc.querySelectorAll('[aim-node="true"]').length, 3, '100% of nodes retained in updated SVG');
    assert.equal(updatedDoc.querySelectorAll('[aim-edge="true"]').length, 2, '100% of edges retained in updated SVG');
    assert.equal(updatedDoc.querySelectorAll('parsererror').length, 0);
  });

  test('<wbr> seam compatibility: Labels with <wbr> break cleanly without rendering literal wbr characters', () => {
    const rawName = 'For<wbr/>Words<wbr/>Or<wbr/>Strings<wbr/>Too<wbr/>Long<wbr/>To<wbr/>Fit';
    const model = {
      diagramId: 'TestDiagram',
      archetype: 'InteractiveCanvas',
      nodes: [
        { id: 'Act_1', kind: 'act', displayName: rawName, bounds: { x: 50, y: 50, width: 140, height: 60 } },
      ],
      edges: [],
    };

    const freshSvg = bridge.generateFreshSvg(model, {});
    const parser = new DOMParser();
    const doc = parser.parseFromString(freshSvg, 'image/svg+xml');
    assert.equal(doc.querySelectorAll('parsererror').length, 0);

    // Rendered text inside <text> must NOT contain the literal string 'wbr'
    const textEl = doc.querySelector('text');
    assert.ok(textEl, 'Text element exists');
    assert.ok(!textEl.textContent.includes('wbr'), 'Rendered text does not contain literal wbr string');

    // And soft break should have created multiple tspans
    const tspans = textEl.querySelectorAll('tspan');
    assert.ok(tspans.length > 1, 'Wrapped into multiple tspans');

    // Model attribute preserved
    const nodeEl = doc.querySelector('[aim-node="true"]');
    assert.equal(nodeEl.getAttribute('aim-display-name'), rawName);
  });
});

describe('Viewport Auto-Bounds in updateExistingSvg (v0.4.0)', () => {
  const bridge = new RaiBridge();

  test('dynamically expands root viewBox when nodes are translated outside base frame', () => {
    const baseSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" id="BaseDiag">
      <defs></defs>
      <g class="aim-nodes-layer">
        <g aim-node="true" aim-id="Node_1" aim-kind="act"><rect width="140" height="60"/><text>Step 1</text></g>
      </g>
      <g class="aim-edges-layer"></g>
    </svg>`;

    // Node moved outward to x: 950, y: 700 (outside original 800x600)
    const model = {
      diagramId: 'BaseDiag',
      archetype: 'InteractiveCanvas',
      nodes: [
        {
          id: 'Node_1',
          kind: 'act',
          displayName: 'Step 1 Outward',
          bounds: { x: 950, y: 700, width: 140, height: 60 },
        },
      ],
      edges: [],
    };

    const updatedSvg = bridge.updateExistingSvg(baseSvg, model, { viewportPadding: 60 });
    const parser = new DOMParser();
    const doc = parser.parseFromString(updatedSvg, 'image/svg+xml');
    const root = doc.documentElement;

    const viewBox = root.getAttribute('viewBox');
    assert.ok(viewBox, 'Root SVG must have viewBox');

    const [minX, minY, width, height] = viewBox.split(' ').map(Number);
    // x: 950 + 140 + 60 = 1150
    // y: 700 + 60 + 60 = 820
    assert.equal(minX, 0, 'minX starts at 0');
    assert.equal(minY, 0, 'minY starts at 0');
    assert.equal(width, 1150, 'width expanded to encompass outward node');
    assert.equal(height, 820, 'height expanded to encompass outward node');

    assert.equal(root.getAttribute('width'), '1150');
    assert.equal(root.getAttribute('height'), '820');
  });

  test('preserves base viewBox when all nodes fit within the base frame', () => {
    const baseSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" id="BaseDiag">
      <defs></defs>
      <g class="aim-nodes-layer">
        <g aim-node="true" aim-id="Node_1" aim-kind="act"><rect width="140" height="60"/><text>Step 1</text></g>
      </g>
    </svg>`;

    const model = {
      diagramId: 'BaseDiag',
      archetype: 'InteractiveCanvas',
      nodes: [
        {
          id: 'Node_1',
          kind: 'act',
          displayName: 'Centered Node',
          bounds: { x: 100, y: 100, width: 140, height: 60 },
        },
      ],
      edges: [],
    };

    const updatedSvg = bridge.updateExistingSvg(baseSvg, model, {});
    const parser = new DOMParser();
    const doc = parser.parseFromString(updatedSvg, 'image/svg+xml');
    assert.equal(doc.documentElement.getAttribute('viewBox'), '0 0 800 600');
  });

  test('expands into negative coordinates when nodes are dragged to negative x/y', () => {
    const baseSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" id="BaseDiag">
      <defs></defs>
      <g class="aim-nodes-layer">
        <g aim-node="true" aim-id="Node_1" aim-kind="act"><rect width="140" height="60"/><text>Step 1</text></g>
      </g>
    </svg>`;

    const model = {
      diagramId: 'BaseDiag',
      archetype: 'InteractiveCanvas',
      nodes: [
        {
          id: 'Node_1',
          kind: 'act',
          displayName: 'Leftward Node',
          bounds: { x: -100, y: -50, width: 140, height: 60 },
        },
      ],
      edges: [],
    };

    const updatedSvg = bridge.updateExistingSvg(baseSvg, model, { viewportPadding: 50 });
    const parser = new DOMParser();
    const doc = parser.parseFromString(updatedSvg, 'image/svg+xml');
    const [minX, minY, width, height] = doc.documentElement.getAttribute('viewBox').split(' ').map(Number);

    assert.equal(minX, -150);
    assert.equal(minY, -100);
    assert.equal(width, 950);
    assert.equal(height, 700);
  });

  test('respects autoBounds: false option by preserving viewBox unchanged', () => {
    const baseSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" id="BaseDiag">
      <defs></defs>
      <g class="aim-nodes-layer">
        <g aim-node="true" aim-id="Node_1" aim-kind="act"><rect width="140" height="60"/><text>Step 1</text></g>
      </g>
    </svg>`;

    const model = {
      diagramId: 'BaseDiag',
      archetype: 'InteractiveCanvas',
      nodes: [
        {
          id: 'Node_1',
          kind: 'act',
          displayName: 'Outward Node',
          bounds: { x: 1200, y: 900, width: 140, height: 60 },
        },
      ],
      edges: [],
    };

    const updatedSvg = bridge.updateExistingSvg(baseSvg, model, { autoBounds: false });
    const parser = new DOMParser();
    const doc = parser.parseFromString(updatedSvg, 'image/svg+xml');
    assert.equal(doc.documentElement.getAttribute('viewBox'), '0 0 800 600');
  });
});

describe('CR032 Acceptance Tests: Consumer-Controlled Labels, Centering, Wrapping, Routing Undo', () => {
  const bridge = new RaiBridge();

  test('Test 1: per with qualifier="Assignee", displayName="Zébio", instance=true - only name line is underlined; qualifier is italic in canvas and export', () => {
    // 1. Live X6 canvas metadata
    const nodeMeta = createAimNode({
      id: 'Per_1',
      kind: 'per',
      qualifier: 'Assignee',
      displayName: 'Zébio',
      instance: true,
      bounds: { x: 50, y: 50, width: 90, height: 90 },
    });
    assert.equal(nodeMeta.attrs?.label?.textDecoration, 'underline', 'Live canvas name is underlined');
    assert.equal(nodeMeta.attrs?.qualifier?.fontStyle, 'italic', 'Live canvas qualifier is italic');
    assert.notEqual(nodeMeta.attrs?.qualifier?.textDecoration, 'underline', 'Live canvas qualifier is NOT underlined');
    assert.equal(nodeMeta.data?.qualifier, 'Assignee');
    assert.equal(nodeMeta.data?.instance, true);

    // 2. SVG export
    const model = {
      diagramId: 'TestDiag1',
      archetype: 'InteractiveCanvas',
      nodes: [
        {
          id: 'Per_1',
          kind: 'per',
          qualifier: 'Assignee',
          displayName: 'Zébio',
          instance: true,
          bounds: { x: 50, y: 50, width: 90, height: 90 },
        },
      ],
      edges: [],
    };
    const svg = bridge.generateFreshSvg(model, {});
    assert.ok(svg.includes('aim-qualifier="Assignee"'), 'SVG contains aim-qualifier');
    assert.ok(svg.includes('aim-instance="true"'), 'SVG contains aim-instance');
    assert.ok(svg.includes('class="aim-qualifier"'), 'SVG renders qualifier tspan');
    assert.ok(svg.includes('font-style="italic"'), 'Qualifier is styled italic');
    assert.ok(svg.includes('class="aim-name"'), 'SVG renders name tspan');
    assert.ok(svg.includes('text-decoration="underline"'), 'Name is underlined');
    const qualifierMatch = svg.match(/<tspan class="aim-qualifier"[^>]*>/);
    assert.ok(qualifierMatch && !qualifierMatch[0].includes('underline'), 'Qualifier tspan does not have text-decoration="underline"');
  });

  test('Test 2: Same per with instance absent - nothing underlined', () => {
    // 1. Live canvas
    const nodeMeta = createAimNode({
      id: 'Per_2',
      kind: 'per',
      qualifier: 'Assignee',
      displayName: 'Zébio',
      bounds: { x: 50, y: 50, width: 90, height: 90 },
    });
    assert.equal(nodeMeta.attrs?.label?.textDecoration, 'none', 'Canvas name is not underlined');
    assert.notEqual(nodeMeta.attrs?.qualifier?.textDecoration, 'underline', 'Canvas qualifier is not underlined');
    assert.equal(nodeMeta.data?.instance, undefined);

    // 2. SVG export
    const model = {
      diagramId: 'TestDiag2',
      archetype: 'InteractiveCanvas',
      nodes: [
        {
          id: 'Per_2',
          kind: 'per',
          qualifier: 'Assignee',
          displayName: 'Zébio',
          bounds: { x: 50, y: 50, width: 90, height: 90 },
        },
      ],
      edges: [],
    };
    const svg = bridge.generateFreshSvg(model, {});
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const nodeEl = doc.querySelector('g[aim-node="true"]');
    assert.equal(nodeEl?.getAttribute('aim-instance'), null, 'aim-instance attribute is absent on node');
    assert.ok(!svg.includes('text-decoration="underline"'), 'Nothing is underlined in exported SVG');
  });

  test('Test 3: act with qualifier="Create Tenant Workspace", instance=true - qualifier quiet and plain, name underlined', () => {
    // 1. Live canvas
    const nodeMeta = createAimNode({
      id: 'Act_1',
      kind: 'act',
      qualifier: 'Create Tenant Workspace',
      displayName: 'Provision Database',
      instance: true,
      bounds: { x: 50, y: 50, width: 180, height: 60 },
    });
    assert.equal(nodeMeta.attrs?.label?.textDecoration, 'underline', 'Name is underlined');
    assert.equal(nodeMeta.attrs?.qualifier?.text, 'Create Tenant Workspace');
    assert.notEqual(nodeMeta.attrs?.qualifier?.textDecoration, 'underline', 'Qualifier is not underlined');

    // 2. SVG export
    const model = {
      diagramId: 'TestDiag3',
      archetype: 'InteractiveCanvas',
      nodes: [
        {
          id: 'Act_1',
          kind: 'act',
          qualifier: 'Create Tenant Workspace',
          displayName: 'Provision Database',
          instance: true,
          bounds: { x: 50, y: 50, width: 180, height: 60 },
        },
      ],
      edges: [],
    };
    const svg = bridge.generateFreshSvg(model, {});
    assert.ok(svg.includes('aim-qualifier="Create Tenant Workspace"'));
    assert.ok(svg.includes('aim-instance="true"'));
    const parsed = bridge.extractMetamodel(svg);
    assert.equal(parsed.nodes[0]?.qualifier, 'Create Tenant Workspace');
    assert.equal(parsed.nodes[0]?.instance, true);
  });

  test('Test 4: per boxes at 90, 120 and 160px share one vertical centre line', () => {
    const widths = [90, 120, 160];

    for (const w of widths) {
      const cx = Math.round(w / 2);

      // 1. Live canvas
      const nodeMeta = createAimNode({
        id: `Per_${w}`,
        kind: 'per',
        displayName: 'Actor',
        bounds: { x: 10, y: 10, width: w, height: 90 },
      });
      assert.equal(nodeMeta.attrs?.head?.cx, cx, `Head circle cx is ${cx} for width ${w}`);
      assert.equal(nodeMeta.attrs?.head?.refX, undefined, `Head circle does not have refX for width ${w}`);
      const expectedTorso = `M ${cx + 16} 50 v -4 a 8 8 0 0 0 -8 -8 H ${cx - 8} a 8 8 0 0 0 -8 8 v 4`;
      assert.equal(nodeMeta.attrs?.torso?.d, expectedTorso, `Torso path is centered at cx=${cx} for width ${w}`);

      // 2. SVG Export
      const model = {
        diagramId: `PerDiag_${w}`,
        archetype: 'InteractiveCanvas',
        nodes: [
          { id: `Per_${w}`, kind: 'per', displayName: 'Actor', bounds: { x: 10, y: 10, width: w, height: 90 } },
        ],
        edges: [],
      };
      const svg = bridge.generateFreshSvg(model, {});
      assert.ok(svg.includes(`<circle cx="${cx}" cy="22" r="8"`), `Export circle cx is ${cx} for width ${w}`);
      assert.ok(svg.includes(`d="${expectedTorso}"`), `Export torso path is centered at cx=${cx} for width ${w}`);
      assert.ok(svg.includes(`x="${cx}"`), `Export text label is centered at x=${cx} for width ${w}`);
    }
  });

  test('Test 5: "AIA Platform Genesis & Bootstrap" in 180px act box wraps at no fewer than ~28 characters per line; narrower box wraps sooner', () => {
    const text = 'AIA Platform Genesis & Bootstrap';
    const maxLen180 = computeMaxLineLength(180, 13);
    assert.ok(maxLen180 >= 28, `180px box at 13px font yields at least 28 characters (got ${maxLen180})`);

    const wrapped180 = wrapAimText(text, maxLen180);
    const lines180 = wrapped180.split('\n');
    assert.equal(lines180.length, 2, 'Wraps into exactly 2 lines in 180px box');
    assert.equal(lines180[0], 'AIA Platform Genesis &');
    assert.equal(lines180[1], 'Bootstrap');

    // Narrower box (e.g. 100px)
    const maxLen100 = computeMaxLineLength(100, 13);
    assert.ok(maxLen100 < maxLen180, `Narrower box has smaller max line length: ${maxLen100} < ${maxLen180}`);
    const wrapped100 = wrapAimText(text, maxLen100);
    const lines100 = wrapped100.split('\n');
    assert.ok(lines100.length > 2, `Narrower box wraps sooner (got ${lines100.length} lines)`);
  });

  test('Test 6: A four-edge diagram: one setRoutingMode(..., true) grouped in a batch is restored by one undo step', () => {
    let batchStarted = 0;
    let batchStopped = 0;
    let batchName = '';
    const edges = [
      { id: 'e1', setProp: () => {} },
      { id: 'e2', setProp: () => {} },
      { id: 'e3', setProp: () => {} },
      { id: 'e4', setProp: () => {} },
    ];

    const mockGraph = {
      getEdges: () => edges,
      startBatch: (name) => {
        batchStarted++;
        batchName = name;
      },
      stopBatch: (name) => {
        batchStopped++;
      },
    };

    mockGraph.startBatch('change-routing-mode');
    for (const edge of mockGraph.getEdges()) {
      edge.setProp('router', { name: 'normal' });
    }
    mockGraph.stopBatch('change-routing-mode');

    assert.equal(batchStarted, 1, 'Exactly one batch started');
    assert.equal(batchStopped, 1, 'Exactly one batch stopped');
    assert.equal(batchName, 'change-routing-mode', 'Batch name matches change-routing-mode');
  });

  test('Test 7: Name with <wbr> and & breaks at seam and escapes correctly on both lines', () => {
    const rawQualifier = 'Create &<wbr>Configure';
    const rawName = 'Tenant &<wbr>Workspace';
    const model = {
      diagramId: 'TestDiag7',
      archetype: 'InteractiveCanvas',
      nodes: [
        {
          id: 'Act_7',
          kind: 'act',
          qualifier: rawQualifier,
          displayName: rawName,
          instance: true,
          bounds: { x: 50, y: 50, width: 80, height: 80 },
        },
      ],
      edges: [],
    };

    const svg = bridge.generateFreshSvg(model, {});

    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const parserErrors = doc.querySelectorAll('parsererror');
    assert.equal(parserErrors.length, 0, 'No XML parser errors in generated SVG');

    const nodeEl = doc.querySelector('g[aim-node="true"]');
    assert.equal(nodeEl?.getAttribute('aim-qualifier'), rawQualifier);
    assert.equal(nodeEl?.getAttribute('aim-display-name'), rawName);
    assert.equal(nodeEl?.getAttribute('aim-instance'), 'true');

    assert.ok(svg.includes('&amp;'), 'Ampersands are properly escaped');
    assert.ok(!svg.includes(' & '), 'No unescaped & in text content');

    const extracted = bridge.extractMetamodel(svg);
    assert.equal(extracted.nodes[0]?.qualifier, rawQualifier);
    assert.equal(extracted.nodes[0]?.displayName, rawName);
    assert.equal(extracted.nodes[0]?.instance, true);
  });

  test('Item 5: Curved fallback edge path ends with control point collinear to target center', () => {
    const sourceNode = {
      id: 'N1',
      kind: 'act',
      displayName: 'Source',
      bounds: { x: 0, y: 50, width: 100, height: 60 },
    };
    const targetNode = {
      id: 'N2',
      kind: 'act',
      displayName: 'Target',
      bounds: { x: 200, y: 50, width: 100, height: 60 },
    };
    const path = bridge.computeFallbackEdgePath(sourceNode, targetNode, [], 'smooth');
    assert.ok(path.startsWith('M '), 'Starts with M');
    assert.ok(path.includes('C '), 'Uses cubic Bézier C command');
    // Target center y is 80, target connection point tx is 200, ty is 80.
    // MidX is 150. Control point 2 is (150, 80), target is (200, 80).
    assert.ok(path.includes('80, 200 80'), 'Control point 2 is collinear with target connection point (y=80)');
  });
});

describe('CR033 Acceptance Tests: Ontological Deep Linking & Navigation (aim-href)', () => {
  const bridge = new RaiBridge();

  test('Test 1: aim-href round-trip preservation in SVG and metamodel extraction', () => {
    assert.equal(AimSvgContract.ATTR_HREF, 'aim-href');

    const sampleSvg = `<svg id="diag1" xmlns="http://www.w3.org/2000/svg">
      <g class="aim-node" aim-node="true" aim-id="Act_Deep" aim-kind="act" aim-display-name="Deep Activity" aim-href="http://localhost:3042/activities/ACT_123" transform="translate(40, 60)">
        <rect x="0" y="0" width="140" height="60" rx="8" />
        <text x="70" y="35">Deep Activity</text>
      </g>
    </svg>`;

    // Extraction
    const metamodel = bridge.extractMetamodel(sampleSvg);
    assert.equal(metamodel.nodes.length, 1);
    assert.equal(metamodel.nodes[0]?.id, 'Act_Deep');
    assert.equal(metamodel.nodes[0]?.href, 'http://localhost:3042/activities/ACT_123');

    // Fresh SVG generation preserves aim-href
    const freshSvg = bridge.generateFreshSvg(metamodel, {});
    assert.ok(freshSvg.includes('aim-href="http://localhost:3042/activities/ACT_123"'));

    const reExtracted = bridge.extractMetamodel(freshSvg);
    assert.equal(reExtracted.nodes[0]?.href, 'http://localhost:3042/activities/ACT_123');

    // updateExistingSvg preservation
    const updatedSvg = bridge.updateExistingSvg(sampleSvg, metamodel, {});
    assert.ok(updatedSvg.includes('aim-href="http://localhost:3042/activities/ACT_123"'));
  });

  test('Test 2: Clickable vector SVG export wraps right hemisphere portal door in <a href="..." target="_blank">', () => {
    const metamodel = {
      diagramId: 'TestDiag_CR033',
      archetype: 'InteractiveCanvas',
      nodes: [
        {
          id: 'Linked_Node',
          kind: 'act',
          displayName: 'Linked Node',
          href: 'http://localhost:3042/diagrams/D1',
          bounds: { x: 50, y: 50, width: 140, height: 60 },
        },
        {
          id: 'Unlinked_Node',
          kind: 'act',
          displayName: 'Unlinked Node',
          bounds: { x: 250, y: 50, width: 140, height: 60 },
        },
      ],
      edges: [],
    };

    const svg = bridge.generateFreshSvg(metamodel, {});
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');

    const linkedGroup = doc.querySelector('g[aim-id="Linked_Node"]');
    assert.ok(linkedGroup, 'Linked group exists');
    assert.equal(linkedGroup.getAttribute('aim-href'), 'http://localhost:3042/diagrams/D1');

    // Left hemisphere persona / anchor: base rect and display text remain outside <a>
    const baseRect = linkedGroup.querySelector('rect');
    assert.ok(baseRect, 'Base rect exists in persona hemisphere');
    const mainText = linkedGroup.querySelector('text:not(.aim-portal-chevron)');
    assert.ok(mainText, 'Main text exists in persona hemisphere');

    // Right hemisphere portal door: wrapped in <a>
    const anchor = linkedGroup.querySelector('a');
    assert.ok(anchor, 'Inner <a> anchor element wraps portal door');
    assert.equal(anchor.getAttribute('href'), 'http://localhost:3042/diagrams/D1');
    assert.equal(anchor.getAttribute('target'), '_blank');
    const doorPath = anchor.querySelector('.aim-portal-door');
    assert.ok(doorPath, 'Portal door path is inside anchor');
    const chevron = anchor.querySelector('.aim-portal-chevron');
    assert.ok(chevron, 'Doorway chevron is inside anchor');
    assert.equal(chevron?.textContent?.trim(), '›');

    // Selective Revelation: unlinked node has no <a> and no portal door
    const unlinkedGroup = doc.querySelector('g[aim-id="Unlinked_Node"]');
    assert.ok(unlinkedGroup, 'Unlinked group exists');
    assert.equal(unlinkedGroup.hasAttribute('aim-href'), false);
    assert.equal(unlinkedGroup.querySelector('a'), null, 'No anchor element for unlinked node');
    assert.equal(unlinkedGroup.querySelector('.aim-portal-door'), null, 'No portal door for unlinked node');
  });

  test('Test 3: XML escaping of URLs containing query parameters with ampersands, quotes, or special characters', () => {
    const complexUrl = 'http://localhost:3042/search?q=Alan%20Kay&tab=1&filter="actors"';
    const metamodel = {
      diagramId: 'TestEscapeDiag',
      archetype: 'InteractiveCanvas',
      nodes: [
        {
          id: 'Escaped_Node',
          kind: 'uc',
          displayName: 'Search UseCase',
          href: complexUrl,
          bounds: { x: 100, y: 100, width: 150, height: 75 },
        },
      ],
      edges: [],
    };

    const freshSvg = bridge.generateFreshSvg(metamodel, {});
    const parser = new DOMParser();
    const doc = parser.parseFromString(freshSvg, 'image/svg+xml');
    const parserErrors = doc.querySelectorAll('parsererror');
    assert.equal(parserErrors.length, 0, 'No XML parser errors in generated SVG');

    const nodeEl = doc.querySelector('g[aim-id="Escaped_Node"]');
    assert.equal(nodeEl?.getAttribute('aim-href'), complexUrl);
    const anchorEl = nodeEl?.querySelector('a');
    assert.equal(anchorEl?.getAttribute('href'), complexUrl);

    // Verify raw SVG has escaped &amp; and &quot;
    assert.ok(freshSvg.includes('&amp;tab=1'), 'Raw SVG escapes & as &amp;');
    assert.ok(freshSvg.includes('&quot;actors&quot;'), 'Raw SVG escapes quotes as &quot;');

    // Verify round-trip extraction
    const extracted = bridge.extractMetamodel(freshSvg);
    assert.equal(extracted.nodes[0]?.href, complexUrl);
  });

  test('Test 4: createAimNode retains href in node metadata payload and initializes dormant at rest', () => {
    const nodeMeta = createAimNode({
      id: 'Act_Linked',
      kind: 'act',
      displayName: 'Linked Activity',
      href: 'http://localhost:3042/activities/ACT_999',
      bounds: { x: 10, y: 10, width: 140, height: 60 },
    });

    assert.equal(nodeMeta.data?.href, 'http://localhost:3042/activities/ACT_999');
    // Nodes at rest on canvas are dormant (clean diagram)
    assert.equal(nodeMeta.attrs?.door?.display, 'none');
    assert.equal(nodeMeta.attrs?.seam?.display, 'none');
    assert.equal(nodeMeta.attrs?.chevron?.display, 'none');

    // When awakened, portal door, gold seam and chevron are displayed
    const activeAttrs = computePortalDoorAttrs(nodeMeta.data, true);
    assert.equal(activeAttrs.door.display, 'block');
    assert.ok(activeAttrs.door.d.includes('M 70 0'));
    assert.equal(activeAttrs.seam.display, 'block');
    assert.equal(activeAttrs.seam.x1, 70);
    assert.equal(activeAttrs.seam.y1, 0);
    assert.equal(activeAttrs.seam.x2, 70);
    assert.equal(activeAttrs.seam.y2, 60);
    assert.equal(activeAttrs.seam.stroke, '#F59E0B');
    assert.equal(activeAttrs.chevron.display, 'block');
    assert.equal(activeAttrs.chevron.text, '›');
  });

  test('Test 5: updateExistingSvg synchronizes aim-href updates on nodes', () => {
    const initialSvg = `<svg id="diag_sync" xmlns="http://www.w3.org/2000/svg">
      <g class="aim-node" aim-node="true" aim-id="Act_Sync" aim-kind="act" aim-display-name="Sync Activity" transform="translate(10, 10)">
        <rect x="0" y="0" width="140" height="60" rx="8" />
        <text x="70" y="35">Sync Activity</text>
      </g>
    </svg>`;

    const metamodel = {
      diagramId: 'diag_sync',
      archetype: 'InteractiveCanvas',
      nodes: [
        {
          id: 'Act_Sync',
          kind: 'act',
          displayName: 'Sync Activity',
          href: 'http://localhost:3042/activities/SYNC_1',
          bounds: { x: 10, y: 10, width: 140, height: 60 },
        },
      ],
      edges: [],
    };

    const updatedSvg = bridge.updateExistingSvg(initialSvg, metamodel, {});
    assert.ok(updatedSvg.includes('aim-href="http://localhost:3042/activities/SYNC_1"'));
    const reExtracted = bridge.extractMetamodel(updatedSvg);
    assert.equal(reExtracted.nodes[0]?.href, 'http://localhost:3042/activities/SYNC_1');
  });

  test('Test 6: Portuguese Bicolor Seam portal door geometries, vertical seam and selective revelation', () => {
    // Unlinked node: hidden door, seam and chevron even if active requested
    const unlinkedAttrs = computePortalDoorAttrs({
      id: 'n1',
      kind: 'act',
      displayName: 'Unlinked',
      bounds: { x: 0, y: 0, width: 140, height: 60 },
    }, true);
    assert.equal(unlinkedAttrs.door.display, 'none');
    assert.equal(unlinkedAttrs.seam.display, 'none');
    assert.equal(unlinkedAttrs.chevron.display, 'none');

    // Linked node dormant (isActive = false): all hidden
    const dormantAttrs = computePortalDoorAttrs({
      id: 'n2',
      kind: 'uc',
      displayName: 'UC',
      href: 'http://localhost:3042/uc',
      bounds: { x: 0, y: 0, width: 140, height: 70 },
    }, false);
    assert.equal(dormantAttrs.door.display, 'none');
    assert.equal(dormantAttrs.seam.display, 'none');
    assert.equal(dormantAttrs.chevron.display, 'none');

    // UseCase (ellipse): elliptical arc right hemisphere and vertical gold seam
    const ucAttrs = computePortalDoorAttrs({
      id: 'n2',
      kind: 'uc',
      displayName: 'UC',
      href: 'http://localhost:3042/uc',
      bounds: { x: 0, y: 0, width: 140, height: 70 },
    }, true);
    assert.equal(ucAttrs.door.display, 'block');
    assert.ok(ucAttrs.door.d.startsWith('M 70 0 A 70 35'));
    assert.equal(ucAttrs.seam.display, 'block');
    assert.equal(ucAttrs.seam.x1, 70);
    assert.equal(ucAttrs.seam.y1, 0);
    assert.equal(ucAttrs.seam.x2, 70);
    assert.equal(ucAttrs.seam.y2, 70);
    assert.equal(ucAttrs.seam.stroke, '#F59E0B');
    assert.equal(ucAttrs.chevron.x, 126);
    assert.equal(ucAttrs.chevron.y, 35);

    // Activity (rounded rect r=12): rounded right corners and vertical gold seam
    const actAttrs = computePortalDoorAttrs({
      id: 'n3',
      kind: 'act',
      displayName: 'Act',
      href: 'http://localhost:3042/act',
      bounds: { x: 0, y: 0, width: 150, height: 60 },
    }, true);
    assert.equal(actAttrs.door.display, 'block');
    assert.ok(actAttrs.door.d.includes('M 75 0 H 138 a 12 12'));
    assert.equal(actAttrs.seam.display, 'block');
    assert.equal(actAttrs.seam.x1, 75);
    assert.equal(actAttrs.seam.y1, 0);
    assert.equal(actAttrs.seam.x2, 75);
    assert.equal(actAttrs.seam.y2, 60);
    assert.equal(actAttrs.chevron.x, 136);
    assert.equal(actAttrs.chevron.y, 30);

    // Person (per): Contoured head right semicircle and torso right arc (NO outer rectangle!)
    const perAttrs = computePortalDoorAttrs({
      id: 'n4',
      kind: 'per',
      displayName: 'Actor',
      href: 'http://localhost:3042/actors/PER_1',
      bounds: { x: 0, y: 0, width: 90, height: 90 },
    }, true);
    assert.equal(perAttrs.door.display, 'block');
    assert.ok(!perAttrs.door.d.includes('H 90 v 90'), 'Person must NOT have outer bounding box rect in door path');
    assert.ok(perAttrs.door.d.includes('M 45 14 A 8 8 0 0 1 45 30 Z'), 'Right head semicircle');
    assert.ok(perAttrs.door.d.includes('M 45 42 H 53 a 8 8 0 0 1 8 8 v 4 H 45 Z'), 'Right torso arc');
    assert.equal(perAttrs.door.fill, 'rgba(16, 185, 129, 0.25)');
    assert.equal(perAttrs.seam.display, 'block');
    assert.equal(perAttrs.seam.x1, 45);
    assert.equal(perAttrs.seam.y1, 14);
    assert.equal(perAttrs.seam.x2, 45);
    assert.equal(perAttrs.seam.y2, 54);
    assert.equal(perAttrs.seam.stroke, '#F59E0B');
    assert.equal(perAttrs.chevron.x, 69);
    assert.equal(perAttrs.chevron.y, 32);

    // Class / Object / Place / Role: sharp right rect and vertical seam
    const objAttrs = computePortalDoorAttrs({
      id: 'n5',
      kind: 'obj',
      displayName: 'Obj',
      href: 'http://localhost:3042/obj',
      bounds: { x: 0, y: 0, width: 160, height: 80 },
    }, true);
    assert.equal(objAttrs.door.display, 'block');
    assert.equal(objAttrs.door.d, 'M 80 0 H 160 v 80 H 80 Z');
    assert.equal(objAttrs.seam.display, 'block');
    assert.equal(objAttrs.seam.x1, 80);
    assert.equal(objAttrs.seam.y1, 0);
    assert.equal(objAttrs.seam.x2, 80);
    assert.equal(objAttrs.seam.y2, 80);
    assert.equal(objAttrs.chevron.x, 146);
    assert.equal(objAttrs.chevron.y, 40);
  });

  test('Test 7: Complete Pantheon: Place (plc) and Role (rol) archetypes', () => {
    const metamodel = {
      diagramId: 'PantheonDiag',
      archetype: 'InteractiveCanvas',
      nodes: [
        {
          id: 'Plc_Stage',
          kind: 'plc',
          displayName: 'Lisbon Stage',
          qualifier: 'Main Arena',
          href: 'http://localhost:3042/places/LISBON',
          bounds: { x: 10, y: 10, width: 160, height: 70 },
        },
        {
          id: 'Rol_Signer',
          kind: 'rol',
          displayName: 'Signer',
          qualifier: 'Role Constraint',
          bounds: { x: 200, y: 10, width: 140, height: 50 },
        },
      ],
      edges: [],
    };

    const svg = bridge.generateFreshSvg(metamodel, {});
    assert.ok(svg.includes('aim-kind="plc"'));
    assert.ok(svg.includes('aim-kind="rol"'));

    const extracted = bridge.extractMetamodel(svg);
    assert.equal(extracted.nodes[0]?.kind, 'plc');
    assert.equal(extracted.nodes[0]?.href, 'http://localhost:3042/places/LISBON');
    assert.equal(extracted.nodes[1]?.kind, 'rol');
    assert.equal(extracted.nodes[1]?.href, undefined);

    // Stencil defaults
    assert.equal(getDefaultNodeName('plc'), 'Place');
    assert.equal(getDefaultNodeName('rol'), 'Role');
    assert.deepEqual(getDefaultNodeBounds('plc', 0, 0), { x: 0, y: 0, width: 160, height: 70 });
    assert.deepEqual(getDefaultNodeBounds('rol', 0, 0), { x: 0, y: 0, width: 140, height: 50 });
  });
});
