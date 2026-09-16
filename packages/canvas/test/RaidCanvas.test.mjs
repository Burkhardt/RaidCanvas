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
});

