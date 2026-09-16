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
  escapeXmlText,
  escapeXmlAttr,
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
          displayName: 'Chief<wbr>Executive<wbr>Officer',
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
    // 4. Multi-line tspan generated from <wbr> soft break when line length exceeded
    assert.ok(svg.includes('<tspan x="45"'));
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
        { id: 'Act_1', kind: 'act', displayName: 'Execute Deal', bounds: { x: 500, y: 65, width: 140, height: 60 } },
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
    assert.ok(updatedSvg.includes('.aim-act text, .aim-obj text { text-decoration: underline; }'), 'Style includes underline rules');
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



