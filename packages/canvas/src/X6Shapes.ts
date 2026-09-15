/**
 * @file X6Shapes.ts
 * @description Custom AntV X6 shape registrations for the AOAIM ontological contract.
 *
 * Implements:
 * - 4-way orthogonal ports (top, right, bottom, left) with magnet snap points.
 * - Manhattan orthogonal routing with rounded corners (radius: 8).
 * - Entity archetypes: UseCase (uc), Activity (act), Class (cls), Object (obj), Person (per).
 * - Cascais Heraldry design tokens.
 */

import { Graph, Node, Edge } from '@antv/x6';
import type {
  AimEdgeKind,
  RaidNodeData,
  RaidEdgeData,
  OrthogonalPortId,
} from './types.js';

/**
 * Cascais Heraldry color palette constants.
 */
export const CascaisPalette = {
  NetGold: '#F59E0B',
  HeraldicGreen: '#10B981',
  WarmGraphite: '#1F2937',
  GraphiteMuted: '#4B5563',
  SilverLine: '#E5E7EB',
  SilverLineDark: '#D1D5DB',
  ChalkWhite: '#FFFFFF',
  CanvasCream: '#F8FAFC',
  AccentBlue: '#3B82F6',
  TextPrimary: '#111827',
  TextSecondary: '#4B5563',
} as const;

/**
 * Port configuration generating 4 orthogonal snap anchors.
 */
export function createOrthogonalPorts() {
  const portMarkup = [
    {
      tagName: 'circle',
      selector: 'portBody',
    },
  ];

  const portAttrs = {
    portBody: {
      r: 4,
      magnet: true,
      stroke: CascaisPalette.WarmGraphite,
      fill: CascaisPalette.ChalkWhite,
      strokeWidth: 1.5,
      style: {
        visibility: 'hidden',
      },
    },
  };

  return {
    groups: {
      top: {
        position: 'top',
        markup: portMarkup,
        attrs: portAttrs,
      },
      right: {
        position: 'right',
        markup: portMarkup,
        attrs: portAttrs,
      },
      bottom: {
        position: 'bottom',
        markup: portMarkup,
        attrs: portAttrs,
      },
      left: {
        position: 'left',
        markup: portMarkup,
        attrs: portAttrs,
      },
    },
    items: [
      { id: 'port-top' satisfies OrthogonalPortId, group: 'top' },
      { id: 'port-right' satisfies OrthogonalPortId, group: 'right' },
      { id: 'port-bottom' satisfies OrthogonalPortId, group: 'bottom' },
      { id: 'port-left' satisfies OrthogonalPortId, group: 'left' },
    ],
  };
}

/**
 * Guard flag to ensure shapes are registered only once per runtime.
 */
let shapesRegistered = false;

/**
 * Register all AOAIM ontological shapes with AntV X6.
 * Safe to call multiple times (idempotent).
 */
export function registerAimShapes(): void {
  if (shapesRegistered) {
    return;
  }

  // 1. AimUseCaseNode ('uc') — Ellipse with Net Gold border
  Node.define({
    shape: 'aim-uc',
    inherit: 'ellipse',
    width: 140,
    height: 70,
    attrs: {
      body: {
        fill: CascaisPalette.ChalkWhite,
        stroke: CascaisPalette.NetGold,
        strokeWidth: 2,
        rx: 70,
        ry: 35,
        class: 'aim-node aim-uc',
      },
      label: {
        text: 'UseCase',
        fill: CascaisPalette.TextPrimary,
        fontSize: 13,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
      },
    },
    ports: createOrthogonalPorts(),
  });

  // 2. AimActivityNode ('act') — Rounded rectangle with Heraldic Green border
  Node.define({
    shape: 'aim-act',
    inherit: 'rect',
    width: 150,
    height: 60,
    attrs: {
      body: {
        fill: CascaisPalette.CanvasCream,
        stroke: CascaisPalette.HeraldicGreen,
        strokeWidth: 2,
        rx: 12,
        ry: 12,
        class: 'aim-node aim-act',
      },
      label: {
        text: 'Activity',
        fill: CascaisPalette.TextPrimary,
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
      },
    },
    ports: createOrthogonalPorts(),
  });

  // 3. AimClassNode ('cls') — Compartmentalized class card
  Node.define({
    shape: 'aim-cls',
    inherit: 'rect',
    width: 180,
    height: 100,
    markup: [
      {
        tagName: 'rect',
        selector: 'body',
      },
      {
        tagName: 'rect',
        selector: 'header',
      },
      {
        tagName: 'text',
        selector: 'title',
      },
      {
        tagName: 'line',
        selector: 'divider1',
      },
      {
        tagName: 'text',
        selector: 'attributes',
      },
      {
        tagName: 'line',
        selector: 'divider2',
      },
      {
        tagName: 'text',
        selector: 'methods',
      },
    ],
    attrs: {
      body: {
        fill: CascaisPalette.ChalkWhite,
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.5,
        class: 'aim-node aim-cls',
      },
      header: {
        fill: CascaisPalette.CanvasCream,
        stroke: 'none',
        height: 28,
      },
      title: {
        text: 'Class',
        fill: CascaisPalette.TextPrimary,
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        refX: 0.5,
        refY: 14,
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
      },
      divider1: {
        stroke: CascaisPalette.SilverLine,
        strokeWidth: 1,
        refX: 0,
        refY: 28,
        refWidth: '100%',
      },
      attributes: {
        text: '+ id: string\n+ state: string',
        fill: CascaisPalette.TextSecondary,
        fontSize: 11,
        fontFamily: 'JetBrains Mono, Menlo, monospace',
        refX: 8,
        refY: 34,
        textAnchor: 'start',
        textVerticalAnchor: 'top',
      },
      divider2: {
        stroke: CascaisPalette.SilverLine,
        strokeWidth: 1,
        refX: 0,
        refY: 65,
        refWidth: '100%',
      },
      methods: {
        text: '+ execute(): void',
        fill: CascaisPalette.TextSecondary,
        fontSize: 11,
        fontFamily: 'JetBrains Mono, Menlo, monospace',
        refX: 8,
        refY: 71,
        textAnchor: 'start',
        textVerticalAnchor: 'top',
      },
    },
    ports: createOrthogonalPorts(),
  });

  // 4. AimObjectNode ('obj') — Instance card with underlined title
  Node.define({
    shape: 'aim-obj',
    inherit: 'rect',
    width: 160,
    height: 80,
    attrs: {
      body: {
        fill: CascaisPalette.ChalkWhite,
        stroke: CascaisPalette.SilverLineDark,
        strokeWidth: 1.5,
        class: 'aim-node aim-obj',
      },
      label: {
        text: '<u>instance: Type</u>',
        fill: CascaisPalette.TextPrimary,
        fontSize: 12,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
      },
    },
    ports: createOrthogonalPorts(),
  });

  // 5. AimPersonNode ('per') — Person / Actor role card
  Node.define({
    shape: 'aim-per',
    inherit: 'rect',
    width: 120,
    height: 70,
    attrs: {
      body: {
        fill: CascaisPalette.CanvasCream,
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.5,
        rx: 6,
        ry: 6,
        class: 'aim-node aim-per',
      },
      label: {
        text: '«actor»\nOperator',
        fill: CascaisPalette.TextPrimary,
        fontSize: 12,
        fontWeight: '500',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
      },
    },
    ports: createOrthogonalPorts(),
  });

  // 6. AimEdge — Orthogonal Manhattan edge with rounded corners
  Edge.define({
    shape: 'aim-edge',
    inherit: 'edge',
    router: {
      name: 'manhattan',
      args: {
        padding: 20,
        startDirections: ['top', 'right', 'bottom', 'left'],
        endDirections: ['top', 'right', 'bottom', 'left'],
      },
    },
    connector: {
      name: 'rounded',
      args: {
        radius: 8,
      },
    },
    attrs: {
      line: {
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.5,
        targetMarker: {
          name: 'classic',
          size: 7,
        },
        class: 'aim-edge',
      },
    },
  });

  shapesRegistered = true;
}

/**
 * Configure an AntV X6 Graph instance with default AOAIM canvas settings:
 * Manhattan routing, orthogonal connection rules, port hover visibility.
 */
export function configureAimGraph(graph: Graph): void {
  registerAimShapes();

  // Show ports on node mouseenter, hide on mouseleave
  graph.on('node:mouseenter', ({ node }) => {
    const ports = node.getPorts();
    for (const port of ports) {
      if (port.id) {
        node.portProp(port.id, 'attrs/portBody/style/visibility', 'visible');
      }
    }
  });

  graph.on('node:mouseleave', ({ node }) => {
    const ports = node.getPorts();
    for (const port of ports) {
      if (port.id) {
        node.portProp(port.id, 'attrs/portBody/style/visibility', 'hidden');
      }
    }
  });
}

/**
 * Factory creating an AntV X6 Node model from a RaidNodeData specification.
 */
export function createAimNode(data: RaidNodeData): Node.Metadata {
  registerAimShapes();

  const shapeName = `aim-${data.kind}`;
  const baseMetadata: Node.Metadata = {
    id: data.id,
    shape: shapeName,
    x: data.bounds.x,
    y: data.bounds.y,
    width: data.bounds.width,
    height: data.bounds.height,
    data,
  };

  // Archetype-specific customization
  switch (data.kind) {
    case 'uc':
      return {
        ...baseMetadata,
        attrs: {
          label: {
            text: data.stereotype ? `${data.stereotype}\n${data.displayName}` : data.displayName,
          },
        },
      };

    case 'act':
      return {
        ...baseMetadata,
        attrs: {
          label: {
            text: data.stereotype ? `${data.stereotype}\n${data.displayName}` : data.displayName,
          },
        },
      };

    case 'cls':
      return {
        ...baseMetadata,
        attrs: {
          title: {
            text: data.displayName,
          },
          attributes: {
            text: data.attributes && data.attributes.length > 0 ? data.attributes.join('\n') : '',
          },
          methods: {
            text: data.methods && data.methods.length > 0 ? data.methods.join('\n') : '',
          },
        },
      };

    case 'obj':
      return {
        ...baseMetadata,
        attrs: {
          label: {
            text: data.displayName,
          },
        },
      };

    case 'per': {
      const isInitiating = data.stereotype?.toLowerCase().includes('initiates') ?? false;
      return {
        ...baseMetadata,
        attrs: {
          body: {
            stroke: isInitiating ? CascaisPalette.NetGold : CascaisPalette.WarmGraphite,
            strokeWidth: isInitiating ? 2 : 1.5,
          },
          label: {
            text: data.stereotype ? `${data.stereotype}\n${data.displayName}` : data.displayName,
          },
        },
      };
    }

    default:
      return baseMetadata;
  }
}

/**
 * Factory creating an AntV X6 Edge model from a RaidEdgeData specification.
 */
export function createAimEdge(data: RaidEdgeData): Edge.Metadata {
  registerAimShapes();

  const edgeAttrs = getEdgeStyling(data.kind);

  return {
    id: data.id,
    shape: 'aim-edge',
    source: {
      cell: data.sourceId,
      ...(data.sourcePort !== undefined ? { port: data.sourcePort } : {}),
    },
    target: {
      cell: data.targetId,
      ...(data.targetPort !== undefined ? { port: data.targetPort } : {}),
    },
    vertices: data.bendPoints.map((pt) => ({ x: pt.x, y: pt.y })),
    labels: data.label
      ? [
          {
            attrs: {
              text: {
                text: data.label,
                fill: CascaisPalette.TextSecondary,
                fontSize: 11,
              },
            },
            position: 0.5,
          },
        ]
      : undefined,
    attrs: {
      line: edgeAttrs,
    },
    data,
  };
}

/**
 * Returns SVG path stroke and marker attributes based on AimEdgeKind.
 */
function getEdgeStyling(kind: AimEdgeKind): Record<string, unknown> {
  switch (kind) {
    case 'dependency':
      return {
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.5,
        strokeDasharray: '5,5',
        targetMarker: {
          name: 'open',
          size: 8,
        },
      };

    case 'generalization':
      return {
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.5,
        targetMarker: {
          name: 'classic',
          size: 10,
          fill: CascaisPalette.ChalkWhite,
        },
      };

    case 'realization':
      return {
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.5,
        strokeDasharray: '5,5',
        targetMarker: {
          name: 'classic',
          size: 10,
          fill: CascaisPalette.ChalkWhite,
        },
      };

    case 'aggregation':
      return {
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.5,
        sourceMarker: {
          name: 'diamond',
          size: 10,
          fill: CascaisPalette.ChalkWhite,
        },
        targetMarker: null,
      };

    case 'composition':
      return {
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.5,
        sourceMarker: {
          name: 'diamond',
          size: 10,
          fill: CascaisPalette.WarmGraphite,
        },
        targetMarker: null,
      };

    case 'association':
    default:
      return {
        stroke: CascaisPalette.WarmGraphite,
        strokeWidth: 1.5,
        targetMarker: {
          name: 'classic',
          size: 7,
        },
      };
  }
}
