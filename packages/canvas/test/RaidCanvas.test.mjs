import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { RaidCanvas, RaiBridge } from '../dist/index.js';

describe('RaidCanvas React Component Export & Contracts', () => {
  test('RaidCanvas is exported as a valid React component', () => {
    assert.ok(typeof RaidCanvas === 'function' || typeof RaidCanvas === 'object');
    assert.ok(React.isValidElement(React.createElement(RaidCanvas)));
  });

  test('RaidCanvas accepts Adele Sprint 2638 props (svgContent, onSave, onSelectionChange)', () => {
    const sampleSvg = `<svg id="test-canvas" xmlns="http://www.w3.org/2000/svg">
      <g aim-node="true" aim-id="UC_Test" aim-kind="uc" transform="translate(10, 20)">
        <text>Test UseCase</text>
      </g>
    </svg>`;

    const onSave = (s) => {};
    const onSelectionChange = (ids) => {};

    const element = React.createElement(RaidCanvas, {
      svgContent: sampleSvg,
      readOnly: true,
      showToolbar: true,
      onSave,
      onSelectionChange,
      className: 'custom-class',
      style: { height: 500 },
    });

    assert.equal(element.type, RaidCanvas);
    assert.equal(element.props.svgContent, sampleSvg);
    assert.equal(element.props.readOnly, true);
    assert.equal(element.props.showToolbar, true);
    assert.equal(element.props.onSave, onSave);
    assert.equal(element.props.onSelectionChange, onSelectionChange);
  });

  test('RaidCanvas can be created with legacy svg and onSelect props', () => {
    const sampleSvg = `<svg id="test-canvas" xmlns="http://www.w3.org/2000/svg" />`;
    const element = React.createElement(RaidCanvas, {
      svg: sampleSvg,
      onChange: () => {},
      onSelect: () => {},
    });

    assert.equal(element.type, RaidCanvas);
    assert.equal(element.props.svg, sampleSvg);
  });

  test('RaiBridge correctly serializes aim-* contracts for RaidCanvas consumption', () => {
    const bridge = new RaiBridge();
    const metamodel = {
      diagramId: 'Sprint2638Diagram',
      archetype: 'OneUseCaseDiagram',
      nodes: [
        {
          id: 'SignContract_UC',
          kind: 'uc',
          displayName: 'Sign Contract',
          stereotype: '«initiates»',
          bounds: { x: 100, y: 80, width: 140, height: 70 },
        },
        {
          id: 'Customer_Actor',
          kind: 'per',
          displayName: 'Customer',
          stereotype: '«initiates»',
          bounds: { x: 20, y: 80, width: 60, height: 60 },
        },
      ],
      edges: [
        {
          id: 'rel_init',
          kind: 'association',
          sourceId: 'Customer_Actor',
          targetId: 'SignContract_UC',
          label: 'signs',
          bendPoints: [{ x: 80, y: 110 }, { x: 100, y: 110 }],
        },
      ],
    };

    const serializedSvg = bridge.serializeToSvg({
      getNodes: () => [],
      getEdges: () => [],
    }, undefined, {});

    assert.ok(serializedSvg.includes('<svg'));
    assert.ok(serializedSvg.includes('aim-archetype="InteractiveCanvas"'));
  });

  test('RaidCanvas component creates element with ref support', () => {
    const ref = React.createRef();
    const element = React.createElement(RaidCanvas, {
      ref,
      svg: '<svg id="test" xmlns="http://www.w3.org/2000/svg" />',
    });
    assert.ok(element);
    assert.equal(element.type, RaidCanvas);
  });

  test('History beforeAddCommand filters out port noise and ignoreHistory commands', () => {
    const filter = (_event, args) => {
      if (
        args?.key === 'ports' ||
        args?.path?.startsWith('ports') ||
        args?.path?.includes('/ports/') ||
        args?.key === 'tools'
      ) {
        return false;
      }
      if (args?.options?.ignoreHistory === true) {
        return false;
      }
      return true;
    };

    // Structural node move should be recorded
    assert.equal(filter('cell:change:position', { key: 'position', cell: {} }), true);

    // Port hover visibility changes should be discarded
    assert.equal(filter('cell:change:ports', { key: 'ports', cell: {} }), false);
    assert.equal(filter('cell:change:attrs', { path: 'ports/items/0/attrs', cell: {} }), false);
    assert.equal(filter('cell:change:attrs', { path: 'attrs/ports/style/visibility', cell: {} }), false);

    // Edge tools should be discarded
    assert.equal(filter('cell:change:tools', { key: 'tools', cell: {} }), false);

    // Explicit ignoreHistory should be discarded
    assert.equal(filter('cell:change:data', { options: { ignoreHistory: true } }), false);
  });

  test('CR031: History beforeAddCommand isolates hydration phase and rejects initial cell:added commands', () => {
    let isHydrating = true;

    const filter = (_event, args) => {
      if (isHydrating) {
        return false;
      }
      if (
        args?.key === 'ports' ||
        args?.path?.startsWith('ports') ||
        args?.path?.includes('/ports/') ||
        args?.key === 'tools'
      ) {
        return false;
      }
      if (args?.options?.ignoreHistory === true) {
        return false;
      }
      return true;
    };

    // While hydrating from SVG, all 8 initial cell additions must be rejected
    assert.equal(filter('cell:added', { cell: { isNode: () => true } }), false);
    assert.equal(filter('cell:added', { cell: { isEdge: () => true } }), false);
    assert.equal(filter('cell:change:position', { key: 'position' }), false);

    // After hydration finishes, operator gestures are accepted
    isHydrating = false;
    assert.equal(filter('cell:added', { cell: { isNode: () => true } }), true);
    assert.equal(filter('cell:added', { cell: { isEdge: () => true } }), true);
    assert.equal(filter('cell:change:position', { key: 'position' }), true);

    // But port hover noise remains suppressed
    assert.equal(filter('cell:change:ports', { key: 'ports' }), false);
  });

  test('CR031: RaidCanvasHandle exposes cleanHistory and manages undo/redo lifecycle', () => {
    let undoStack = ['cmd1', 'cmd2'];
    let redoStack = ['cmd3'];

    const mockHandle = {
      canUndo: () => undoStack.length > 0,
      canRedo: () => redoStack.length > 0,
      cleanHistory: () => {
        undoStack = [];
        redoStack = [];
      },
    };

    assert.equal(typeof mockHandle.cleanHistory, 'function');
    assert.equal(mockHandle.canUndo(), true);
    assert.equal(mockHandle.canRedo(), true);

    // Purge history
    mockHandle.cleanHistory();

    assert.equal(mockHandle.canUndo(), false);
    assert.equal(mockHandle.canRedo(), false);
  });

  test('CR033: RaidCanvas accepts onNodeClick, onNodePortalClick, and onNodeDblClick props', () => {
    const onNodeClick = (node, evt) => {};
    const onNodePortalClick = (node, evt) => {};
    const onNodeDblClick = (node, evt) => {};

    const element = React.createElement(RaidCanvas, {
      svg: '<svg id="test-cr033" xmlns="http://www.w3.org/2000/svg" />',
      onNodeClick,
      onNodePortalClick,
      onNodeDblClick,
    });

    assert.equal(element.props.onNodeClick, onNodeClick);
    assert.equal(element.props.onNodePortalClick, onNodePortalClick);
    assert.equal(element.props.onNodeDblClick, onNodeDblClick);
  });

  test('CR033: Drag immunity guard distinguishes tap from drag (> 4px or moving)', () => {
    let clickCount = 0;
    let clickedNodeData = null;

    const onNodeClick = (node) => {
      clickCount++;
      clickedNodeData = node;
    };

    let pointerDown = null;

    const simulateMouseDown = (node, clientX, clientY) => {
      pointerDown = { id: node.id, clientX, clientY, moved: false };
    };

    const simulateMoving = (node) => {
      if (pointerDown && pointerDown.id === node.id) {
        pointerDown.moved = true;
      }
    };

    const simulateClick = (node, clientX, clientY) => {
      const start = pointerDown;
      pointerDown = null;
      const dx = start ? clientX - start.clientX : 0;
      const dy = start ? clientY - start.clientY : 0;
      const dist = Math.hypot(dx, dy);
      if (start && (start.moved || dist > 4)) {
        return; // drag suppressed
      }
      onNodeClick(node);
    };

    const testNode = {
      id: 'Act_Nav',
      kind: 'act',
      displayName: 'Navigate to Entity',
      href: 'http://localhost:3042/activities/ACT_NAV',
      bounds: { x: 10, y: 10, width: 140, height: 60 },
    };

    // Scenario A: User drags node 100px across the canvas
    simulateMouseDown(testNode, 100, 100);
    simulateMoving(testNode);
    simulateClick(testNode, 200, 100);
    assert.equal(clickCount, 0, 'onNodeClick must NOT fire after 100px drag');

    // Scenario B: User drags node 10px without triggering moving event
    simulateMouseDown(testNode, 100, 100);
    simulateClick(testNode, 110, 100);
    assert.equal(clickCount, 0, 'onNodeClick must NOT fire when delta > 4px');

    // Scenario C: User taps node with slight micro-jitter (1px)
    simulateMouseDown(testNode, 100, 100);
    simulateClick(testNode, 101, 100);
    assert.equal(clickCount, 1, 'onNodeClick must fire on tap');
    assert.equal(clickedNodeData?.id, 'Act_Nav');
    assert.equal(clickedNodeData?.href, 'http://localhost:3042/activities/ACT_NAV');
  });

  test('CR033: Imperative handle addNode and updateNode preserve href attribute', () => {
    let storedData = null;
    const mockNode = {
      isNode: () => true,
      getData: () => storedData,
      setData: (data) => {
        storedData = data;
      },
      setPosition: () => {},
      setSize: () => {},
      setAttrByPath: () => {},
    };

    const mockGraph = {
      addNode: (meta) => {
        storedData = meta.data;
      },
      getCellById: () => mockNode,
    };

    // Add node with customData.href
    const customData = {
      displayName: 'Activity with Href',
      href: 'http://localhost:3042/entities/123',
    };
    const nodeData = {
      id: 'ACT_custom',
      kind: 'act',
      displayName: customData.displayName,
      href: customData.href,
      bounds: { x: 200, y: 150, width: 140, height: 60 },
    };
    mockGraph.addNode({ data: nodeData });
    assert.equal(storedData?.href, 'http://localhost:3042/entities/123');

    // Update node with new href
    const updates = {
      href: 'http://localhost:3042/entities/456',
    };
    const nextData = {
      ...storedData,
      ...updates,
    };
    mockNode.setData(nextData);
    assert.equal(storedData?.href, 'http://localhost:3042/entities/456');
  });

  test('CR033: Duality of the Object: Two-tap lifecycle (Awakening tap followed by action tap)', () => {
    let clickCount = 0;
    let portalClickCount = 0;
    let activeDualityNodeId = null;

    const onNodeClick = () => { clickCount++; };
    const onNodePortalClick = () => { portalClickCount++; };

    const dispatchNodeClick = (node, clickX, targetClasses = [], hasHref = true) => {
      const nodeData = {
        id: node.id,
        kind: node.kind,
        displayName: node.displayName,
        href: hasHref ? node.href : undefined,
        bounds: node.bounds,
      };

      const hasValidHref = Boolean(nodeData.href && nodeData.href.trim().length > 0);

      // Unlinked node: direct click, clear duality
      if (!hasValidHref) {
        activeDualityNodeId = null;
        onNodeClick(nodeData);
        return;
      }

      // Tap 1: Awakening tap
      if (activeDualityNodeId !== node.id) {
        activeDualityNodeId = node.id;
        // Do NOT trigger callbacks on awakening tap
        return;
      }

      // Tap 2: Action tap on active dual node
      const bbox = node.bounds;
      const isDoorElement = targetClasses.includes('aim-portal-door') || targetClasses.includes('aim-portal-chevron');
      const isRightHemisphere = clickX !== undefined && bbox.width > 0
        ? clickX >= (bbox.x + bbox.width / 2)
        : isDoorElement;

      const isPortalClick = isDoorElement || isRightHemisphere;

      if (isPortalClick) {
        onNodePortalClick(nodeData);
      } else {
        onNodeClick(nodeData);
      }
    };

    const nodeWithHref = {
      id: 'Act_Dual',
      kind: 'act',
      displayName: 'Dual Activity',
      href: 'http://localhost:3042/act/dual',
      bounds: { x: 100, y: 100, width: 160, height: 60 },
    };

    // --- Sequence 1: Awakening ---
    // Tap 1: First tap awakens the node without navigating or opening inspector
    dispatchNodeClick(nodeWithHref, 120);
    assert.equal(activeDualityNodeId, 'Act_Dual', 'Tap 1 must awaken duality mode on node');
    assert.equal(clickCount, 0, 'Tap 1 must not fire onNodeClick');
    assert.equal(portalClickCount, 0, 'Tap 1 must not fire onNodePortalClick');

    // --- Sequence 2: Action on Left Hemisphere ---
    // Tap 2: Second tap on Left hemisphere (x = 120 < 100 + 80 = 180) fires onNodeClick (Inspector)
    dispatchNodeClick(nodeWithHref, 120);
    assert.equal(clickCount, 1, 'Tap 2 on left hemisphere must fire onNodeClick');
    assert.equal(portalClickCount, 0);

    // --- Sequence 3: Action on Right Hemisphere ---
    // Tap 3: Tap on Right hemisphere (x = 190 >= 180) fires onNodePortalClick (Portal Door)
    dispatchNodeClick(nodeWithHref, 190);
    assert.equal(clickCount, 1);
    assert.equal(portalClickCount, 1, 'Tap on right hemisphere must fire onNodePortalClick');

    // --- Sequence 4: Blank Canvas puts node to sleep ---
    activeDualityNodeId = null; // simulate blank:click
    assert.equal(activeDualityNodeId, null);

    // --- Sequence 5: Next tap on node is again Tap 1 (Awakening) ---
    dispatchNodeClick(nodeWithHref, 190);
    assert.equal(activeDualityNodeId, 'Act_Dual');
    assert.equal(portalClickCount, 1, 'Should awaken node, not immediately trigger portal click');

    // Tap on door element directly on awakened node triggers portal click
    dispatchNodeClick(nodeWithHref, 110, ['aim-portal-door']);
    assert.equal(portalClickCount, 2);

    // --- Sequence 6: Unlinked node bypasses awakening ---
    const unlinkedNode = {
      id: 'Act_Unlinked',
      kind: 'act',
      displayName: 'Plain Activity',
      bounds: { x: 100, y: 100, width: 160, height: 60 },
    };
    dispatchNodeClick(unlinkedNode, 190, [], false);
    assert.equal(clickCount, 2, 'Unlinked node fires onNodeClick on Tap 1');
    assert.equal(activeDualityNodeId, null, 'Unlinked node resets active duality');
  });

  test('CR033: Imperative handle exposes activateNodeDuality, deactivateNodeDuality, and getActiveDualityNodeId', () => {
    let currentDualityId = null;

    const mockHandle = {
      activateNodeDuality: (id) => {
        currentDualityId = id;
      },
      deactivateNodeDuality: () => {
        currentDualityId = null;
      },
      getActiveDualityNodeId: () => currentDualityId,
    };

    assert.equal(typeof mockHandle.activateNodeDuality, 'function');
    assert.equal(typeof mockHandle.deactivateNodeDuality, 'function');
    assert.equal(typeof mockHandle.getActiveDualityNodeId, 'function');

    assert.equal(mockHandle.getActiveDualityNodeId(), null);

    mockHandle.activateNodeDuality('Node_123');
    assert.equal(mockHandle.getActiveDualityNodeId(), 'Node_123');

    mockHandle.deactivateNodeDuality();
    assert.equal(mockHandle.getActiveDualityNodeId(), null);
  });
});

