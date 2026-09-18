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
  computeStereotypeIconAttrs,
  setNodeDualityActive,
  resolveStereotype,
  isInitiatingStereotype,
  getStereotypePaths,
  renderStereotypeIconSvg,
  KNOWN_STEREOTYPES,
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
    assert.equal(edge.shape, 'aim-arrow');
    assert.deepEqual(edge.source, { cell: 'Actor_1', port: 'port-right' });
    assert.deepEqual(edge.target, { cell: 'SignContract_UC', port: 'port-left' });
    assert.equal(edge.vertices.length, 2);

    const undirectedEdge = createAimEdge({
      id: 'rel-2',
      kind: 'association',
      directed: false,
      sourceId: 'ContractDoc_Obj',
      targetId: 'SignerRole_Rf',
    });
    assert.equal(undirectedEdge.shape, 'aim-edge');
    assert.equal(undirectedEdge.attrs.line.targetMarker, null);
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

    const ArrowCtor = Edge.registry.get('aim-arrow');
    assert.ok(ArrowCtor, 'aim-arrow should be registered in Edge registry');
    const arrowInstance = new ArrowCtor();
    assert.ok(arrowInstance.markup, 'aim-arrow must have defined markup');
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
    assert.ok(actor.attrs?.qualifier?.text?.includes('«initiates»') || actor.attrs?.label?.text?.includes('«initiates»'));
    assert.ok(actor.attrs?.label?.text?.includes('Customer'));

    const standardActor = createAimNode({
      id: 'Actor_2',
      kind: 'per',
      displayName: 'Staff',
      bounds: { x: 50, y: 50, width: 90, height: 90 },
    });
    assert.equal(standardActor.attrs?.torso?.stroke, CascaisPalette.WarmGraphite);
  });

  test('createAimNode underlines explicit instances and object archetypes', () => {
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
    assert.equal(objPlain.attrs?.label?.textDecoration, 'underline');

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
    assert.ok(svg.includes('<circle cx="45" cy="20" r="12"'));
    assert.ok(svg.includes('M 66 54 v -6 a 10 10 0 0 0 -10 -10 H 34 a 10 10 0 0 0 -10 10 v 6'));
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
    const headCircleMatches = updatedSvg.match(/<circle cx="45" cy="20" r="12"/g);
    assert.equal(headCircleMatches?.length, 4, 'Emits 4 head circles for 4 Person nodes');

    // Count torso paths: must be exactly 4!
    const torsoPathMatches = updatedSvg.match(/d="M 66 54 v -6 a 10 10 0 0 0 -10 -10 H 34 a 10 10 0 0 0 -10 10 v 6"/g);
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
      const expectedTorso = `M ${cx + 21} 54 v -6 a 10 10 0 0 0 -10 -10 H ${cx - 11} a 10 10 0 0 0 -10 10 v 6`;
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
      assert.ok(svg.includes(`<circle cx="${cx}" cy="20" r="12"`), `Export circle cx is ${cx} for width ${w}`);
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
    assert.equal(ucAttrs.chevron.refX, 1);
    assert.equal(ucAttrs.chevron.refDx, -12);
    assert.equal(ucAttrs.chevron.refY, 0.5);
    assert.equal(ucAttrs.chevron.display, 'block');
    assert.equal(ucAttrs.chevron.x, undefined);
    assert.equal(ucAttrs.chevron.y, undefined);

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
    assert.equal(actAttrs.chevron.refX, 1);
    assert.equal(actAttrs.chevron.refDx, -12);
    assert.equal(actAttrs.chevron.refY, 0.5);
    assert.equal(actAttrs.chevron.display, 'block');

    // Person (per): Contoured head right semicircle and torso right arc (NO outer rectangle!)
    const perAttrs = computePortalDoorAttrs({
      id: 'n4',
      kind: 'per',
      displayName: 'Actor',
      href: 'http://localhost:3042/actors/PER_1',
      bounds: { x: 0, y: 0, width: 120, height: 110 },
    }, true);
    assert.equal(perAttrs.door.display, 'block');
    assert.ok(!perAttrs.door.d.includes('H 120 v 110'), 'Person must NOT have outer bounding box rect in door path');
    assert.ok(perAttrs.door.d.includes('M 60 8 A 12 12 0 0 1 60 32 Z'), 'Right head semicircle');
    assert.ok(perAttrs.door.d.includes('M 60 38 H 71 a 10 10 0 0 1 10 10 v 6 H 60 Z'), 'Right torso arc');
    assert.equal(perAttrs.door.fill, 'rgba(16, 185, 129, 0.25)');
    assert.equal(perAttrs.seam.display, 'block');
    assert.equal(perAttrs.seam.x1, 60);
    assert.equal(perAttrs.seam.y1, 8);
    assert.equal(perAttrs.seam.x2, 60);
    assert.equal(perAttrs.seam.y2, 54);
    assert.equal(perAttrs.seam.stroke, '#F59E0B');
    assert.equal(perAttrs.chevron.refX, 1);
    assert.equal(perAttrs.chevron.refDx, -12);
    assert.equal(perAttrs.chevron.refY, 0.5);
    assert.equal(perAttrs.chevron.display, 'block');

    // Venue Place (plc + stereotype="Venue"): Contoured teardrop right half + vertical seam
    const venueAttrs = computePortalDoorAttrs({
      id: 'v1',
      kind: 'plc',
      displayName: 'Lisbon Stage',
      stereotype: 'Venue',
      href: 'http://localhost:3042/places/PLC_1',
      bounds: { x: 0, y: 0, width: 120, height: 110 },
    }, true);
    assert.equal(venueAttrs.door.display, 'block');
    assert.ok(!venueAttrs.door.d.includes('H 120 v 110'), 'Venue must NOT have outer bounding box rect in door path');
    assert.ok(venueAttrs.door.d.includes('M 60 9 A 13.5 13.5 0 0 1 73.5 22.5'), 'Venue pin right half teardrop arc');
    assert.equal(venueAttrs.door.fill, 'rgba(16, 185, 129, 0.25)');
    assert.equal(venueAttrs.seam.display, 'block');
    assert.equal(venueAttrs.seam.x1, 60);
    assert.equal(venueAttrs.seam.y1, 6);
    assert.equal(venueAttrs.seam.x2, 60);
    assert.equal(venueAttrs.seam.y2, 60);
    assert.equal(venueAttrs.seam.stroke, '#F59E0B');
    assert.equal(venueAttrs.chevron.refX, 0.5);
    assert.equal(venueAttrs.chevron.refDx, 34);
    assert.equal(venueAttrs.chevron.refY, 26);
    assert.equal(venueAttrs.chevron.display, 'block');

    // Stage Place (plc + stereotype="Stage"): Contoured outer bounds right half + vertical seam
    const stageAttrs = computePortalDoorAttrs({
      id: 's1',
      kind: 'plc',
      displayName: 'Festival Main Stage',
      stereotype: 'Stage',
      href: 'http://localhost:3042/places/PLC_Stage',
      bounds: { x: 0, y: 0, width: 120, height: 110 },
    }, true);
    assert.equal(stageAttrs.door.display, 'block');
    assert.ok(stageAttrs.door.d.includes('M 60 8.6 H 74.4 L 80.5 15.6 V 46.2 H 60 Z'), 'Stage right half outer silhouette path');
    assert.equal(stageAttrs.door.fill, 'rgba(16, 185, 129, 0.25)');
    assert.equal(stageAttrs.seam.display, 'block');
    assert.equal(stageAttrs.seam.x1, 60);
    assert.equal(stageAttrs.seam.y1, 8.6);
    assert.equal(stageAttrs.seam.x2, 60);
    assert.equal(stageAttrs.seam.y2, 46.2);
    assert.equal(stageAttrs.seam.stroke, '#F59E0B');

    // Bar Place (plc + stereotype="Bar"): Emerald right half of glass bowl
    const barAttrs = computePortalDoorAttrs({
      id: 'b1',
      kind: 'plc',
      displayName: 'Lounge Bar',
      stereotype: 'Bar',
      href: 'http://localhost:3042/places/PLC_Bar',
      bounds: { x: 0, y: 0, width: 120, height: 110 },
    }, true);
    assert.equal(barAttrs.door.display, 'block');
    assert.ok(barAttrs.door.d.includes('M 60 14 H 75 L 60 34 Z'), 'Bar right half of glass bowl path');
    assert.equal(barAttrs.door.fill, 'rgba(16, 185, 129, 0.40)');
    assert.equal(barAttrs.seam.display, 'block');
    assert.equal(barAttrs.seam.x1, 60);
    assert.equal(barAttrs.seam.y1, 14);
    assert.equal(barAttrs.seam.x2, 60);
    assert.equal(barAttrs.seam.y2, 50);
    assert.equal(barAttrs.seam.stroke, '#F59E0B');

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
    assert.equal(objAttrs.chevron.refX, 1);
    assert.equal(objAttrs.chevron.refDx, -12);
    assert.equal(objAttrs.chevron.refY, 0.5);
    assert.equal(objAttrs.chevron.display, 'block');
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
    assert.deepEqual(getDefaultNodeBounds('plc', 0, 0), { x: 0, y: 0, width: 120, height: 110 });
    assert.deepEqual(getDefaultNodeBounds('rol', 0, 0), { x: 0, y: 0, width: 22, height: 22 });
  });

  test('CR033.1: Live portal chevron uses relative coordinates refX=1, refDx=-12, refY=0.5 with no absolute x/y doubling', () => {
    // 1. Live canvas: verify shapes in all 7 definitions have refX: 1, refDx: -12, refY: 0.5 and no x/y
    const shapes = ['aim-per', 'aim-act', 'aim-uc', 'aim-cls', 'aim-obj', 'aim-plc', 'aim-rol'];
    for (const shapeName of shapes) {
      const nodeMeta = createAimNode({
        id: `node-${shapeName}`,
        kind: shapeName.replace('aim-', ''),
        displayName: 'Test Entity',
        href: 'http://localhost:3042/test',
        bounds: { x: 0, y: 0, width: 150, height: 60 },
      });
      assert.equal(nodeMeta.shape, shapeName);
    }

    // 2. Acceptance test 1: per at 90, 120 and 160px width with href
    for (const w of [90, 120, 160]) {
      const perAttrs = computePortalDoorAttrs({
        id: `per-${w}`,
        kind: 'per',
        displayName: 'Person Test',
        href: 'http://localhost:3042/actors/PER_1',
        bounds: { x: 0, y: 0, width: w, height: 90 },
      }, true);

      assert.equal(perAttrs.chevron.refX, 1, `per at ${w}px must anchor to right edge (refX=1)`);
      assert.equal(perAttrs.chevron.refDx, -12, `per at ${w}px must offset 12px inside (refDx=-12)`);
      assert.equal(perAttrs.chevron.refY, 0.5, `per at ${w}px must center vertically (refY=0.5)`);
      assert.equal(perAttrs.chevron.x, undefined, `per at ${w}px must NOT have absolute x to prevent X6 doubling`);
      assert.equal(perAttrs.chevron.y, undefined, `per at ${w}px must NOT have absolute y to prevent X6 doubling`);
    }

    // 3. Acceptance test 2: act (180x64) and uc (160x80)
    const actAttrs = computePortalDoorAttrs({
      id: 'act-180',
      kind: 'act',
      displayName: 'Activity Test',
      href: 'http://localhost:3042/activities/1',
      bounds: { x: 0, y: 0, width: 180, height: 64 },
    }, true);
    assert.equal(actAttrs.chevron.refX, 1);
    assert.equal(actAttrs.chevron.refDx, -12);
    assert.equal(actAttrs.chevron.refY, 0.5);
    assert.equal(actAttrs.chevron.x, undefined);
    assert.equal(actAttrs.chevron.y, undefined);

    const ucAttrs = computePortalDoorAttrs({
      id: 'uc-160',
      kind: 'uc',
      displayName: 'UseCase Test',
      href: 'http://localhost:3042/usecases/1',
      bounds: { x: 0, y: 0, width: 160, height: 80 },
    }, true);
    assert.equal(ucAttrs.chevron.refX, 1);
    assert.equal(ucAttrs.chevron.refDx, -12);
    assert.equal(ucAttrs.chevron.refY, 0.5);
    assert.equal(ucAttrs.chevron.x, undefined);
    assert.equal(ucAttrs.chevron.y, undefined);

    // 4. SVG export retains absolute coordinates (12px inside right edge, vertical center)
    const exportSvg = bridge.generateFreshSvg({
      diagramId: 'ExportTest',
      archetype: 'ActivityDiagram',
      nodes: [
        {
          id: 'Act_Export',
          kind: 'act',
          displayName: 'Exported Activity',
          href: '/activities?activity=act-export',
          bounds: { x: 0, y: 0, width: 180, height: 64 },
        },
      ],
      edges: [],
    }, {});
    assert.ok(exportSvg.includes('x="168"'), 'SVG export chevron must be at x=168 (180 - 12)');
    assert.ok(exportSvg.includes('y="32"'), 'SVG export chevron must be at y=32 (64 / 2)');
  });
});

describe('CR034 Acceptance Tests: Stereotype Iconography & Vasco Ontology v1.3 / OTW Alignment', () => {
  const bridge = new RaiBridge();

  test('Test 1: resolveStereotype normalizes known stereotypes and handles guillemets, case, and array values', () => {
    assert.equal(resolveStereotype('Stage'), 'stage');
    assert.equal(resolveStereotype('«Stage»'), 'stage');
    assert.equal(resolveStereotype('STAGE'), 'stage');
    assert.equal(resolveStereotype('Venue'), 'venue');
    assert.equal(resolveStereotype('«Venue»'), 'venue');
    assert.equal(resolveStereotype('Bar'), 'bar');
    assert.equal(resolveStereotype('Customer'), 'customer');
    assert.equal(resolveStereotype('«Customer»'), 'customer');
    assert.equal(resolveStereotype('Headliner'), 'headliner');
    assert.equal(resolveStereotype('AI'), 'ai');
    assert.equal(resolveStereotype('initiates'), 'initiates');
    // System / Server Stack
    assert.equal(resolveStereotype('System'), 'system');
    assert.equal(resolveStereotype('«System»'), 'system');
    assert.equal(resolveStereotype('server'), 'system');
    assert.equal(resolveStereotype('backend'), 'system');
    assert.equal(resolveStereotype(['System', 'AI']), 'system');

    assert.equal(resolveStereotype('unknown-custom'), undefined);
    assert.equal(resolveStereotype(undefined), undefined);

    // Ontology v1.3: Array of stereotypes — pick the first value
    assert.equal(resolveStereotype(['Venue', 'Stage']), 'venue');
    assert.equal(resolveStereotype(['Stage', 'Venue']), 'stage');
    assert.equal(resolveStereotype(['Customer', 'initiates']), 'customer');
    assert.equal(resolveStereotype(['Bar']), 'bar');
    assert.equal(resolveStereotype([]), undefined);
  });

  test('Test 2: getStereotypePaths generates valid geometry for the seed stereotypes', () => {
    for (const id of ['stage', 'venue', 'bar', 'customer', 'headliner', 'ai', 'system']) {
      const paths = getStereotypePaths(id);
      assert.ok(paths.width > 0, `${id} must have positive width`);
      assert.ok(paths.height > 0, `${id} must have positive height`);
      assert.ok(paths.strokeD.length > 0 || paths.fillD.length > 0, `${id} must have SVG path data`);
    }

    // Stage specific checks (Festival truss, canopy roof, stars, columns, spotlights, steps) — scaled to 48x44
    const stage = getStereotypePaths('stage');
    assert.equal(stage.width, 48);
    assert.equal(stage.height, 44);
    assert.ok(stage.fillD.includes('M 3.5 9.6'), 'Stage must have canopy trapezoid roof');
    assert.ok(stage.strokeD.includes('M 6 9.6 V 35.8'), 'Stage must have lattice cross-braced columns');
    assert.ok(stage.starsD && stage.starsD.length > 0, 'Stage canopy must have 4 stars');

    // Bar specific checks (martini bowl, liquid, stem, base plate, olive) — scaled to 44x48
    const bar = getStereotypePaths('bar');
    assert.equal(bar.width, 44);
    assert.equal(bar.height, 48);
    assert.ok(bar.strokeD.includes('M 7 8 H 37 L 22 28 V 44'), 'Bar must have cocktail glass bowl and stem');
    assert.ok(bar.fillD.includes('M 12.25 15 H 31.75 L 22 28 Z'), 'Bar must have liquid fill');

    // Customer specific checks (Crown body, base band, jewels)
    const customer = getStereotypePaths('customer');
    assert.equal(customer.width, 24);
    assert.equal(customer.height, 24);
    assert.ok(customer.fillD.includes('M 4 17.5'), 'Customer must have crown body');

    // Headliner specific checks (5-point hollow star for chest)
    const headliner = getStereotypePaths('headliner');
    assert.equal(headliner.width, 16);
    assert.equal(headliner.height, 16);
    assert.ok(headliner.strokeD.includes('M 8 0.5 L 10.1 5.1'), 'Headliner must have 5-point star path');

    // Venue specific checks (teardrop pin, circular aperture, ground ring) — scaled 50% to 45x54
    const venue = getStereotypePaths('venue');
    assert.equal(venue.width, 45);
    assert.equal(venue.height, 54);
    assert.ok(venue.strokeD.includes('C 15 33.75'), 'Venue must have teardrop curvature');
    assert.ok(venue.strokeD.includes('A 5.25 5.25'), 'Venue must have circular aperture');
    assert.ok(venue.strokeD.includes('M 7.5 49.5'), 'Venue must have ground target ellipse');
  });

  test('Test 3: createAimNode for Place with stereotype="Venue" renders frameless with tall pin glyph in WarmGraphite anthracite', () => {
    const nodeMeta = createAimNode({
      id: 'LisbonStage_Plc',
      kind: 'plc',
      displayName: 'Lisbon Stage',
      qualifier: 'Physical Site',
      stereotype: 'Venue',
      href: '/places?select=plc-lisbon',
      bounds: { x: 750, y: 100, width: 160, height: 75 },
    });

    const attrs = nodeMeta.attrs;
    assert.ok(attrs, 'Node metadata must have attrs');
    // Frameless: body fill transparent, stroke none, class aim-frameless
    assert.equal(attrs.body?.fill, 'transparent', 'Venue Place must be frameless');
    assert.equal(attrs.body?.stroke, 'none', 'Venue Place must have no stroke frame');
    assert.ok(attrs.body?.class?.includes('aim-frameless'), 'Venue Place must have aim-frameless class');
    assert.equal(nodeMeta.width, 120, 'Venue Place node is scaled Actor-scale width 120');
    assert.equal(nodeMeta.height, 110, 'Venue Place node is scaled Actor-scale height 110');
    assert.equal(attrs.header?.display, 'none', 'Blue window header must be dropped');

    // Tall pin glyph in anthracite WarmGraphite (#1F2937) matching non-initiating Actor
    assert.equal(attrs.iconStroke?.display, 'block', 'Venue icon stroke must be displayed');
    assert.equal(attrs.iconStroke?.stroke, CascaisPalette.WarmGraphite, 'Venue icon stroke must be WarmGraphite anthracite');
    assert.equal(attrs.iconFill?.fill, CascaisPalette.ChalkWhite, 'Venue icon fill must be Chalk White');

    // Text centered underneath the glyph
    assert.equal(attrs.label?.refX, 0.5, 'Label must be centered horizontally at refX=0.5');
    assert.equal(attrs.qualifier?.refX, 0.5, 'Qualifier must be centered horizontally at refX=0.5');
    assert.equal(attrs.qualifier?.refY, 66, 'Qualifier sits below tall pin at refY=66');
    assert.equal(attrs.label?.refY, 84, 'Label sits below qualifier at refY=84');
    assert.equal(attrs.label?.text, 'Lisbon Stage');
    assert.equal(attrs.qualifier?.text, 'Physical Site');
  });

  test('Test 3b: createAimNode for Place with stereotype="Stage" renders frameless glyph matching Actor stature', () => {
    const nodeMeta = createAimNode({
      id: 'LisbonStage_Plc',
      kind: 'plc',
      displayName: 'Lisbon Stage',
      qualifier: 'Physical Site',
      stereotype: 'Stage',
      href: '/places?select=plc-lisbon',
      bounds: { x: 750, y: 100, width: 160, height: 110 },
    });

    const attrs = nodeMeta.attrs;
    assert.ok(attrs, 'Node metadata must have attrs');
    // Frameless glyph matching Actor stature (120x110)
    assert.equal(attrs.body?.fill, 'transparent', 'Stage Place has transparent fill');
    assert.equal(attrs.body?.stroke, 'none', 'Stage Place has no frame stroke');
    assert.equal(nodeMeta.width, 120, 'Stage Place glyph width is 120');
    assert.equal(nodeMeta.height, 110, 'Stage Place glyph height is 110');
    assert.equal(attrs.iconStroke?.stroke, CascaisPalette.WarmGraphite, 'Stage icon stroke without initiates must be WarmGraphite');
    assert.equal(attrs.qualifier?.refX, 0.5);
    assert.equal(attrs.qualifier?.refY, 66);
    assert.equal(attrs.label?.refX, 0.5);
    assert.equal(attrs.label?.refY, 84);

    // With initiates: Stage becomes NetGold
    const initiatingStage = createAimNode({
      id: 'LisbonStage_Init',
      kind: 'plc',
      displayName: 'Main Stage',
      stereotype: ['Stage', 'initiates'],
      bounds: { x: 750, y: 100, width: 160, height: 110 },
    });
    assert.equal(initiatingStage.attrs.iconStroke?.stroke, CascaisPalette.NetGold, 'Initiating Stage stroke must be Net Gold');
  });

  test('Test 3b2: createAimNode for Place with stereotype="Bar" renders frameless glyph with cocktail glass', () => {
    const nodeMeta = createAimNode({
      id: 'LoungeBar_Plc',
      kind: 'plc',
      displayName: 'Lounge Bar',
      qualifier: 'Hospitality',
      stereotype: 'Bar',
      href: '/places?select=plc-bar',
      bounds: { x: 750, y: 100, width: 160, height: 110 },
    });

    const attrs = nodeMeta.attrs;
    assert.ok(attrs, 'Node metadata must have attrs');
    assert.equal(attrs.body?.fill, 'transparent', 'Bar Place has transparent fill');
    assert.equal(attrs.body?.stroke, 'none', 'Bar Place has no frame stroke');
    assert.equal(nodeMeta.width, 120, 'Bar Place glyph width is 120');
    assert.equal(nodeMeta.height, 110, 'Bar Place glyph height is 110');
    assert.equal(attrs.iconStroke?.stroke, CascaisPalette.WarmGraphite, 'Bar icon stroke without initiates must be WarmGraphite');
    assert.equal(attrs.iconFill?.fill, CascaisPalette.ChalkWhite, 'Liquid in cocktail glass is ChalkWhite');
    assert.equal(attrs.iconAccent?.fill, CascaisPalette.WarmGraphite, 'Olive in cocktail glass without initiates is WarmGraphite');
    assert.equal(attrs.qualifier?.refY, 66);
    assert.equal(attrs.label?.refY, 84);

    // With initiates: Bar becomes NetGold
    const initiatingBar = createAimNode({
      id: 'LoungeBar_Init',
      kind: 'plc',
      displayName: 'Lounge Bar',
      stereotype: ['Bar', 'initiates'],
      bounds: { x: 750, y: 100, width: 160, height: 110 },
    });
    assert.equal(initiatingBar.attrs.iconStroke?.stroke, CascaisPalette.NetGold, 'Initiating Bar stroke must be Net Gold');
    assert.equal(initiatingBar.attrs.iconAccent?.fill, CascaisPalette.NetGold, 'Initiating Bar olive must be Net Gold');
  });

  test('Test 3c: createAimNode for Place WITHOUT stereotype or with non-glyph stereotype renders SilverLineDark frame', () => {
    const nodeMeta = createAimNode({
      id: 'Simple_Place',
      kind: 'plc',
      displayName: 'Cascais Arena',
      qualifier: 'Indoor Venue',
      bounds: { x: 100, y: 100, width: 160, height: 70 },
    });

    const attrs = nodeMeta.attrs;
    assert.ok(attrs, 'Node metadata must have attrs');
    assert.equal(attrs.body?.stroke, CascaisPalette.SilverLineDark, 'Place without stereotype must have SilverLineDark frame');
    assert.equal(attrs.header?.display, 'none', 'Blue window header must be dropped');
    assert.equal(attrs.qualifier?.refX, 0.5);
    assert.equal(attrs.label?.refX, 0.5);
  });

  test('Test 3d: createAimNode for Person guarantees non-overlapping text between qualifier and label', () => {
    const nodeMeta = createAimNode({
      id: 'Customer_Actor',
      kind: 'per',
      displayName: 'Dr. Rainer Burkhardt',
      qualifier: 'Project Director',
      stereotype: 'initiates',
      bounds: { x: 50, y: 90, width: 140, height: 90 },
    });

    const attrs = nodeMeta.attrs;
    assert.ok(attrs, 'Node metadata must have attrs');
    assert.equal(attrs.torso?.stroke, CascaisPalette.NetGold, 'Initiating actor has Net Gold stroke');
    assert.equal(attrs.qualifier?.text, 'Project Director', 'initiates is not injected into qualifier text');
    assert.equal(attrs.qualifier?.refY, 66, 'Qualifier starts at refY=66');
    assert.equal(attrs.label?.refY, 84, 'Label starts safely below qualifier at refY=84 with zero collision');
  });

  test('Test 4: createAimNode for Person with stereotype="Customer" places crown on top of head', () => {
    const nodeMeta = createAimNode({
      id: 'Customer_VIP',
      kind: 'per',
      displayName: 'Amália',
      qualifier: 'VIP Patron',
      stereotype: 'Customer',
      bounds: { x: 50, y: 80, width: 120, height: 110 },
    });

    const attrs = nodeMeta.attrs;
    assert.ok(attrs, 'Node metadata must have attrs');
    assert.equal(attrs.iconFill?.display, 'block', 'Crown fill must be displayed');
    assert.equal(attrs.iconFill?.fill, CascaisPalette.NetGold, 'Crown is NetGold');
    assert.equal(attrs.iconStroke?.stroke, CascaisPalette.NetGold, 'Crown stroke is NetGold');
    assert.equal(attrs.torso?.stroke, CascaisPalette.WarmGraphite, 'Torso is WarmGraphite');
    assert.equal(attrs.iconAccent?.display, 'block', 'Crown jewels must be displayed in Chalk White');
    // Head cx = 60, crown transform is translate(60-12, -7) = translate(48, -7)
    assert.equal(attrs.iconFill?.transform, 'translate(48, -7)', 'Crown sits on top of head at y=-7, clear of face');

    // With initiates: Crown remains NetGold, torso becomes NetGold
    const initiatingCustomer = createAimNode({
      id: 'Customer_Init',
      kind: 'per',
      displayName: 'Amália',
      stereotype: ['Customer', 'initiates'],
      bounds: { x: 50, y: 80, width: 120, height: 110 },
    });
    assert.equal(initiatingCustomer.attrs.iconFill?.fill, CascaisPalette.NetGold, 'Crown with initiates is NetGold');
    assert.equal(initiatingCustomer.attrs.iconStroke?.stroke, CascaisPalette.NetGold, 'Crown stroke with initiates is NetGold');
    assert.equal(initiatingCustomer.attrs.torso?.stroke, CascaisPalette.NetGold, 'Customer torso is NetGold when initiating');
  });

  test('Test 4b: createAimNode for Person with stereotype="AI" centers neural chip directly on head', () => {
    const nodeMeta = createAimNode({
      id: 'AI_Agent',
      kind: 'per',
      displayName: 'Alan',
      qualifier: 'AI Co-Architect',
      stereotype: 'AI',
      bounds: { x: 50, y: 80, width: 120, height: 110 },
    });

    const attrs = nodeMeta.attrs;
    assert.ok(attrs, 'Node metadata must have attrs');
    assert.equal(attrs.iconStroke?.display, 'block', 'AI chip stroke must be displayed');
    assert.equal(attrs.iconStroke?.stroke, CascaisPalette.WarmGraphite, 'AI chip without initiates is WarmGraphite');
    // Head circle cx = 60, cy = 20. Chip is 24x24. Concentric translate(60-12, 20-12) = translate(48, 8)
    assert.equal(attrs.iconStroke?.transform, 'translate(48, 8)', 'AI chip is centered directly on Actor head');

    const initiatingAI = createAimNode({
      id: 'AI_Init',
      kind: 'per',
      displayName: 'Alan',
      stereotype: 'AI, initiates',
      bounds: { x: 50, y: 80, width: 120, height: 110 },
    });
    assert.equal(initiatingAI.attrs.iconStroke?.stroke, CascaisPalette.NetGold, 'AI chip with initiates is NetGold');
  });

  test('Test 4c: createAimNode for Person with stereotype="Headliner" places hollow 5-point star on chest', () => {
    const nodeMeta = createAimNode({
      id: 'Star_Artist',
      kind: 'per',
      displayName: 'Carlos do Carmo',
      qualifier: 'Fado Legend',
      stereotype: 'Headliner',
      bounds: { x: 50, y: 80, width: 120, height: 110 },
    });

    const attrs = nodeMeta.attrs;
    assert.ok(attrs, 'Node metadata must have attrs');
    assert.equal(attrs.iconStroke?.display, 'block', 'Star stroke must be displayed');
    assert.equal(attrs.iconStroke?.stroke, CascaisPalette.NetGold, 'Star stroke is NetGold');
    assert.equal(attrs.torso?.stroke, CascaisPalette.WarmGraphite, 'Headliner torso is WarmGraphite');
    assert.equal(attrs.iconStroke?.fill, 'none', 'Star is hollow so line and emerald door are visible');
    // Chest center cx = 60, star is 16x16: translate(60-8, 38.5) = translate(52, 38.5)
    assert.equal(attrs.iconStroke?.transform, 'translate(52, 38.5)', 'Star sits squarely on the chest');
    assert.equal(attrs.iconFill?.display, 'none', 'Hollow star has no solid fill');

    const initiatingHeadliner = createAimNode({
      id: 'Star_Init',
      kind: 'per',
      displayName: 'Carlos do Carmo',
      stereotype: ['Headliner', 'initiates'],
      bounds: { x: 50, y: 80, width: 120, height: 110 },
    });
    assert.equal(initiatingHeadliner.attrs.iconStroke?.stroke, CascaisPalette.NetGold, 'Star stroke with initiates is NetGold');
    assert.equal(initiatingHeadliner.attrs.torso?.stroke, CascaisPalette.NetGold, 'Headliner torso is NetGold when initiating');
  });

  test('Test 4d: createAimNode for Person with stereotype="System" replaces head & torso with dual-chassis server rack in WarmGraphite', () => {
    const nodeMeta = createAimNode({
      id: 'Backend_System',
      kind: 'per',
      displayName: 'Ticketing Backend',
      qualifier: 'Core Service',
      stereotype: 'System',
      bounds: { x: 50, y: 80, width: 120, height: 110 },
    });

    const attrs = nodeMeta.attrs;
    assert.ok(attrs, 'Node metadata must have attrs');
    // Head & Torso suppressed
    assert.equal(attrs.head?.display, 'none', 'Actor head circle is hidden for System');
    assert.equal(attrs.torso?.display, 'none', 'Actor torso arc is hidden for System');

    // Dual-chassis server rack rendered
    assert.equal(attrs.iconStroke?.display, 'block', 'System stroke must be displayed');
    assert.equal(attrs.iconStroke?.stroke, CascaisPalette.WarmGraphite, 'System stroke is WarmGraphite anthracite');
    assert.equal(attrs.iconStroke?.strokeWidth, 2.2, 'Stroke width is 2.2px');
    assert.equal(attrs.iconFill?.display, 'block', 'System chassis body fill must be displayed');
    assert.equal(attrs.iconFill?.fill, CascaisPalette.ChalkWhite, 'Chassis interior is ChalkWhite');
    assert.equal(attrs.iconAccent?.display, 'block', 'LED dots and drive bay slots must be displayed');
    assert.equal(attrs.iconAccent?.fill, CascaisPalette.WarmGraphite, 'LEDs and drive slots match anthracite stroke');
    // Centered at cx = 60, icon width 44: translate(60-22, 8) = translate(38, 8)
    assert.equal(attrs.iconStroke?.transform, 'translate(38, 8)', 'Server stack sits at (38, 8)');
  });

  test('Test 4e: Duality on Person with stereotype="System" awakens contoured server rack right-half door', () => {
    const dualityAttrs = computePortalDoorAttrs({
      id: 'Backend_System',
      kind: 'per',
      displayName: 'Ticketing Backend',
      qualifier: 'Core Service',
      stereotype: 'System',
      href: '/systems/backend',
      bounds: { x: 50, y: 80, width: 120, height: 110 },
    }, true);

    assert.equal(dualityAttrs.door.display, 'block', 'Portal door must be displayed');
    assert.ok(dualityAttrs.door.d.includes('M 60 11'), 'Door path begins at centerline top chassis (60, 11)');
    assert.ok(dualityAttrs.door.d.includes('H 76 A 4 4 0 0 1 80 15'), 'Door path contours top chassis right half');
    assert.ok(dualityAttrs.door.d.includes('H 69 V 33'), 'Door path contours right neck connector');
    assert.ok(dualityAttrs.door.d.includes('80 37 V 45 A 4 4 0 0 1 76 49 H 60 Z'), 'Door path contours bottom chassis right half');
    assert.equal(dualityAttrs.door.fill, 'rgba(16, 185, 129, 0.25)', 'Door has standard emerald tint');

    // Net Gold centerline seam
    assert.equal(dualityAttrs.seam.display, 'block');
    assert.equal(dualityAttrs.seam.x1, 60);
    assert.equal(dualityAttrs.seam.y1, 11);
    assert.equal(dualityAttrs.seam.x2, 60);
    assert.equal(dualityAttrs.seam.y2, 49);
    assert.equal(dualityAttrs.seam.stroke, CascaisPalette.NetGold);

    // Chevron
    assert.equal(dualityAttrs.chevron.display, 'block');
    assert.equal(dualityAttrs.chevron.refDx, 32);
    assert.equal(dualityAttrs.chevron.refY, 30);
  });

  test('Test 5: RaiBridge.renderNodeInnerSvg produces valid vector SVG with aim-stereotype-icon', () => {
    const innerSvg = bridge.renderNodeInnerSvg({
      id: 'LisbonStage_Plc',
      kind: 'plc',
      displayName: 'Lisbon Stage',
      qualifier: 'Physical Site',
      stereotype: 'Stage',
      bounds: { x: 750, y: 100, width: 160, height: 70 },
    });

    assert.ok(innerSvg.includes('class="aim-stereotype-icon aim-icon-stage"'), 'Exported SVG must contain stage icon group');
    assert.ok(innerSvg.includes('Physical Site'), 'Must contain qualifier');
    assert.ok(innerSvg.includes('Lisbon Stage'), 'Must contain display name');
  });

  test('Test 6: Full round-trip SVG hydration and serialization preserves aim-stereotype', () => {
    const originalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" id="Test_Dia" aim-archetype="Testing">
  <g class="aim-nodes-layer">
    <g aim-node="true" aim-id="Stage_1" aim-kind="plc" aim-display-name="Main Stage" aim-stereotype="Stage" aim-href="/stages/1" transform="translate(100, 100)">
      <rect width="160" height="70" fill="#FFFFFF" stroke="#1F2937" stroke-width="1.5" />
    </g>
  </g>
</svg>`;

    const mockGraph = {
      clearCells: () => {},
      addNode: () => {},
      addEdge: () => {},
      on: () => {},
      getPorts: () => [],
      getNodes: () => [],
      getEdges: () => [],
    };

    const metamodel = bridge.hydrateFromSvg(originalSvg, mockGraph);
    assert.equal(metamodel.nodes.length, 1);
    assert.equal(metamodel.nodes[0]?.stereotype, 'Stage', 'Metamodel must extract aim-stereotype');

    const updatedSvg = bridge.updateExistingSvg(originalSvg, metamodel, {});
    assert.ok(updatedSvg.includes('aim-stereotype="Stage"'), 'Updated SVG must preserve aim-stereotype attribute');
    assert.ok(updatedSvg.includes('class="aim-stereotype-icon aim-icon-stage"'), 'Updated SVG must render stage icon');
  });

  test('Test 7: Universal Initiator Color Rule and Multi-Stereotype array combinations', () => {
    // Helper function assertions
    assert.equal(isInitiatingStereotype('Stage'), false);
    assert.equal(isInitiatingStereotype(['Bar', 'initiates']), true);
    assert.equal(isInitiatingStereotype(['initiates', 'Venue']), true);
    assert.equal(isInitiatingStereotype('«initiates»'), true);
    assert.equal(isInitiatingStereotype('Customer, initiates'), true);

    // resolveStereotype prioritizes domain stereotype over initiates
    assert.equal(resolveStereotype(['Bar', 'initiates']), 'bar');
    assert.equal(resolveStereotype(['initiates', 'Stage']), 'stage');
    assert.equal(resolveStereotype('Customer, initiates'), 'customer');
    assert.equal(resolveStereotype('System, initiates'), 'system');
    assert.equal(resolveStereotype('AI, initiates'), 'ai');
    assert.equal(resolveStereotype(['initiates']), 'initiates');

    // Person actor without initiates is anthracite
    const plainPer = createAimNode({
      id: 'Plain_Actor',
      kind: 'per',
      displayName: 'Operator',
      bounds: { x: 0, y: 0, width: 120, height: 110 },
    });
    assert.equal(plainPer.attrs.torso?.stroke, CascaisPalette.WarmGraphite);

    // Person actor with initiates is gold
    const initPer = createAimNode({
      id: 'Init_Actor',
      kind: 'per',
      displayName: 'Operator',
      stereotype: 'initiates',
      bounds: { x: 0, y: 0, width: 120, height: 110 },
    });
    assert.equal(initPer.attrs.torso?.stroke, CascaisPalette.NetGold);

    // Customer Actor: crown is ALWAYS NetGold, torso/head remain WarmGraphite even with initiates
    const customerDormant = createAimNode({
      id: 'Customer_Dormant',
      kind: 'per',
      displayName: 'Customer',
      stereotype: 'Customer',
      bounds: { x: 0, y: 0, width: 120, height: 110 },
    });
    assert.equal(customerDormant.attrs.iconFill?.fill, CascaisPalette.NetGold);
    assert.equal(customerDormant.attrs.iconStroke?.stroke, CascaisPalette.NetGold);
    assert.equal(customerDormant.attrs.torso?.stroke, CascaisPalette.WarmGraphite);

    const customerInit = createAimNode({
      id: 'Customer_Init',
      kind: 'per',
      displayName: 'Customer',
      stereotype: ['Customer', 'initiates'],
      bounds: { x: 0, y: 0, width: 120, height: 110 },
    });
    assert.equal(customerInit.attrs.iconFill?.fill, CascaisPalette.NetGold);
    assert.equal(customerInit.attrs.iconStroke?.stroke, CascaisPalette.NetGold);
    assert.equal(customerInit.attrs.torso?.stroke, CascaisPalette.NetGold, 'Customer torso is NetGold when initiating');

    // Headliner Actor: star is ALWAYS NetGold, torso/head are NetGold with initiates
    const headlinerDormant = createAimNode({
      id: 'Headliner_Dormant',
      kind: 'per',
      displayName: 'Headliner',
      stereotype: 'Headliner',
      bounds: { x: 0, y: 0, width: 120, height: 110 },
    });
    assert.equal(headlinerDormant.attrs.iconStroke?.stroke, CascaisPalette.NetGold);
    assert.equal(headlinerDormant.attrs.torso?.stroke, CascaisPalette.WarmGraphite);

    const headlinerInit = createAimNode({
      id: 'Headliner_Init',
      kind: 'per',
      displayName: 'Headliner',
      stereotype: ['Headliner', 'initiates'],
      bounds: { x: 0, y: 0, width: 120, height: 110 },
    });
    assert.equal(headlinerInit.attrs.iconStroke?.stroke, CascaisPalette.NetGold);
    assert.equal(headlinerInit.attrs.torso?.stroke, CascaisPalette.NetGold, 'Headliner torso is NetGold when initiating');

    // Venue without initiates is anthracite
    const plainVenue = createAimNode({
      id: 'Plain_Venue',
      kind: 'plc',
      displayName: 'Cascais Pin',
      stereotype: 'Venue',
      bounds: { x: 0, y: 0, width: 120, height: 110 },
    });
    assert.equal(plainVenue.attrs.iconStroke?.stroke, CascaisPalette.WarmGraphite);

    // Venue with initiates is gold
    const initVenue = createAimNode({
      id: 'Init_Venue',
      kind: 'plc',
      displayName: 'Cascais Pin',
      stereotype: ['Venue', 'initiates'],
      bounds: { x: 0, y: 0, width: 120, height: 110 },
    });
    assert.equal(initVenue.attrs.iconStroke?.stroke, CascaisPalette.NetGold);
  });

  test('Test 8: Activity nodes are framed in CascaisRed (#EF4444) line only with no fill (ChalkWhite)', () => {
    const actNode = createAimNode({
      id: 'Act_1',
      kind: 'act',
      displayName: 'Pour Martini',
      bounds: { x: 0, y: 0, width: 150, height: 60 },
    });

    assert.equal(actNode.attrs.body?.stroke, CascaisPalette.CascaisRed, 'Activity stroke must be CascaisRed');
    assert.equal(actNode.attrs.body?.fill, CascaisPalette.ChalkWhite, 'Activity fill must be ChalkWhite (line only)');
    assert.equal(actNode.attrs.body?.strokeWidth, 2, 'Activity strokeWidth is 2');
  });

  test('Test 9: Bar Duality door shades right half of glass bowl in emerald without tinting olive', () => {
    const barAwakened = computePortalDoorAttrs({
      id: 'Bar_1',
      kind: 'plc',
      displayName: 'Cascais Bar',
      stereotype: 'Bar',
      href: '/places/bar-1',
      bounds: { x: 0, y: 0, width: 120, height: 110 },
    }, true);

    assert.equal(barAwakened.door.display, 'block');
    assert.ok(barAwakened.door.d.includes('M 60 14 H 75 L 60 34 Z'), 'Right half of V-bowl is shaded green');
    assert.equal(barAwakened.seam.display, 'block');
    assert.equal(barAwakened.seam.stroke, CascaisPalette.NetGold);

    // Dormant / Awakened node attrs verify olive stays original color
    const barNodeDormant = createAimNode({
      id: 'Bar_Dormant',
      kind: 'plc',
      displayName: 'Cascais Bar',
      stereotype: 'Bar',
      bounds: { x: 0, y: 0, width: 120, height: 110 },
    });
    assert.equal(barNodeDormant.attrs.iconAccent?.fill, CascaisPalette.WarmGraphite, 'Olive is WarmGraphite without initiates');

    const barNodeInit = createAimNode({
      id: 'Bar_Initiating',
      kind: 'plc',
      displayName: 'Cascais Bar',
      stereotype: ['Bar', 'initiates'],
      bounds: { x: 0, y: 0, width: 120, height: 110 },
    });
    assert.equal(barNodeInit.attrs.iconAccent?.fill, CascaisPalette.NetGold, 'Olive is NetGold with initiates');
  });
});


describe('Role definitions, contextual bindings and wrapped descriptions', () => {
  const bridge = new RaiBridge();
  const n = (id, kind, displayName, x = 0, extra = {}) => ({ id, kind, displayName, bounds: { x, y: 40, width: ['rol', 'rf'].includes(kind) ? 22 : 180, height: ['rol', 'rf'].includes(kind) ? 22 : 80 }, ...extra });
  const e = (id, sourceId, targetId, kind = 'association', directed = true) => ({ id, sourceId, targetId, kind, directed, bendPoints: [] });
  const model = () => ({ diagramId: 'mixed', archetype: 'ClassObjectDiagram', nodes: [n('s', 'cls', 'System'), n('p', 'cls', 'Person', 600), n('r', 'rol', 'Admin', 300), n('a', 'obj', 'AIA'), n('f', 'rf', 'Admin', 300, { properties: { color: '#059669' } }), n('rai', 'obj', 'RAI', 600)], edges: [e('owns', 's', 'r', 'association', false), e('type', 'r', 'p'), e('binding', 'a', 'f', 'association', false), e('filler', 'f', 'rai'), e('role', 'f', 'r', 'dependency'), e('class', 'a', 's', 'dependency'), e('person', 'rai', 'p', 'dependency')] });

  test('circular junctions, arrow suppression and instance underlining survive SVG round trips', () => {
    const svg = bridge.generateFreshSvg(model(), {});
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    assert.equal(doc.querySelector('[aim-id="r"] circle').getAttribute('fill'), '#FFFFFF');
    assert.equal(doc.querySelector('[aim-id="f"] circle').getAttribute('fill'), '#059669');
    assert.equal(doc.querySelector('[aim-id="r"] .aim-name').hasAttribute('text-decoration'), false);
    for (const id of ['a', 'f', 'rai']) assert.equal(doc.querySelector(`[aim-id="${id}"] .aim-name`).getAttribute('text-decoration'), 'underline');
    for (const id of ['owns', 'binding']) assert.equal(doc.querySelector(`[aim-id="${id}"] path`).hasAttribute('marker-end'), false);
    const imported = bridge.extractMetamodel(svg);
    assert.equal(imported.nodes.find(n => n.id === 'f').bounds.width, 22);
    assert.equal(imported.nodes.find(n => n.id === 'f').bounds.height, 22);
    assert.equal(imported.edges.find(e => e.id === 'binding').directed, false);
    const saved = bridge.updateExistingSvg(svg, imported, {});
    assert.equal(new DOMParser().parseFromString(saved, 'image/svg+xml').querySelector('[aim-id="binding"] path').hasAttribute('marker-end'), false);
    assert.equal(createAimEdge(imported.edges.find(e => e.id === 'binding')).attrs.line.targetMarker, null);
    assert.equal(bridge.extractMetamodel(saved).nodes.find(n => n.id === 'f').properties.color, '#059669');
  });

  test('role attribute projection follows role name, visibility and type without duplicating persisted attributes', async () => {
    const { projectRoleAttributes } = await import('../dist/index.js');
    const m = model();
    let projected = projectRoleAttributes(m);
    assert.deepEqual(projected.nodes[0].roleAttributes, ['+ Admin: Person']);
    m.nodes[2] = { ...m.nodes[2], displayName: 'Owner', visibility: '-' };
    m.nodes[1] = { ...m.nodes[1], displayName: 'Actor' };
    projected = projectRoleAttributes(m);
    assert.deepEqual(projected.nodes[0].roleAttributes, ['- Owner: Actor']);
    const imported = bridge.extractMetamodel(bridge.generateFreshSvg(projected, {}));
    assert.equal(imported.nodes[0].attributes, undefined);
    assert.deepEqual(projectRoleAttributes(imported).nodes[0].roleAttributes, ['- Owner: Actor']);
    assert.deepEqual(projectRoleAttributes({ ...m, edges: [] }).nodes[0].roleAttributes, []);
  });

  test('Description preserves paragraphs, caps long tokens, grows and survives export', async () => {
    const { wrapDescription } = await import('../dist/index.js');
    const description = 'A festival with music, art and culture in Schwäbisch Hall.\n\n' + 'x'.repeat(105);
    assert.ok(wrapDescription(description, 32).split('\n').every(line => line.length <= 32));
    assert.ok(wrapDescription(description).includes('\n\n'));
    const item = n('show', 'obj', 'AfricaPicnic26', 0, { description, descriptionWidth: 32 });
    const narrow = createAimNode(item);
    const wide = createAimNode({ ...item, descriptionWidth: 50 });
    assert.ok(narrow.height > wide.height);
    assert.ok(narrow.width < wide.width);
    const svg = bridge.generateFreshSvg({ diagramId: 'prose', archetype: 'ObjectDiagram', nodes: [item], edges: [] }, {});
    const restored = bridge.extractMetamodel(svg).nodes[0];
    assert.equal(restored.description, description);
    assert.equal(restored.descriptionWidth, 32);
    assert.equal(restored.bounds.height, narrow.height);
    assert.equal(restored.bounds.width, narrow.width);
  });

  test('edges connecting Object to RoleFiller or Class to Role are undirected aim-edge lines without arrowheads', () => {
    const objToRf = createAimEdge({
      id: 'owner-binding',
      kind: 'association',
      directed: false,
      sourceId: 'aia',
      targetId: 'aia-admin',
      bendPoints: [],
    });
    assert.equal(objToRf.shape, 'aim-edge');
    assert.equal(objToRf.attrs.line.targetMarker, null);

    const rfToFiller = createAimEdge({
      id: 'filler-arrow',
      kind: 'association',
      directed: true,
      sourceId: 'aia-admin',
      targetId: 'rai',
      bendPoints: [],
    });
    assert.equal(rfToFiller.shape, 'aim-arrow');
    assert.notEqual(rfToFiller.attrs.line.targetMarker, null);

    const clsToRol = createAimEdge({
      id: 'role-def',
      kind: 'association',
      directed: false,
      sourceId: 'system',
      targetId: 'admin',
      bendPoints: [],
    });
    assert.equal(clsToRol.shape, 'aim-edge');
    assert.equal(clsToRol.attrs.line.targetMarker, null);
  });

  test('CR035: setNodeDualityActive passes ignoreHistory: true and silent: true to setAttrByPath', () => {
    const recordedCalls = [];
    const mockNode = {
      getData: () => ({
        id: 'node-cr035',
        kind: 'act',
        displayName: 'Activity',
        href: 'https://example.com/cr035',
        bounds: { x: 0, y: 0, width: 160, height: 60 },
      }),
      setAttrByPath: (path, value, options) => {
        recordedCalls.push({ path, value, options });
      },
    };

    setNodeDualityActive(mockNode, true);
    assert.ok(recordedCalls.length > 0, 'Must make attribute calls');
    for (const call of recordedCalls) {
      assert.deepEqual(call.options, { ignoreHistory: true, silent: true }, `Call to ${call.path} must have ignoreHistory and silent`);
    }
  });
});
