/**
 * @file RaiBridge.ts
 * @description Bidirectional synchronization bridge between the SVG `aim-*` ontological
 * contract and AntV X6 Graph models.
 *
 * Capabilities:
 * - Hydrate: Ingests an SVG containing `aim-*` semantic attributes and inflates an interactive
 *   AntV X6 graph with orthogonal ports and Manhattan-routed edges.
 * - Serialize: Extracts updated coordinates, node dimensions, and user-dragged bend points from
 *   the X6 graph, serializing them back into the SVG document while preserving semantic fidelity.
 */

import { Graph } from '@antv/x6';
import {
  AimSvgContract,
  type AimOntologyKind,
  type AimEdgeKind,
  type RaidNodeData,
  type RaidEdgeData,
  type RaidMetamodel,
  type SvgBendPoint,
  type Bounds,
  type HydrationOptions,
  type SerializationOptions,
} from './types.js';
import { createAimNode, createAimEdge, configureAimGraph, CascaisPalette } from './X6Shapes.js';

export class RaiBridge {
  /**
   * Hydrates an AntV X6 graph from an SVG source string or DOM Element.
   *
   * @param svgSource Raw SVG markup string or SVGSVGElement DOM node.
   * @param graph The AntV X6 Graph instance to populate.
   * @param options Hydration options.
   * @returns The extracted RaidMetamodel representation.
   */
  public hydrateFromSvg(
    svgSource: string | Element,
    graph: Graph,
    options: HydrationOptions = {},
  ): RaidMetamodel {
    configureAimGraph(graph);

    if (options.clearGraph !== false) {
      graph.clearCells();
    }

    const doc = this.resolveSvgElement(svgSource);
    const metamodel = this.extractMetamodel(doc, options);

    // 1. Add all nodes to graph
    for (const nodeData of metamodel.nodes) {
      const nodeMeta = createAimNode(nodeData);
      graph.addNode(nodeMeta);
    }

    // 2. Add all edges to graph
    for (const edgeData of metamodel.edges) {
      const edgeMeta = createAimEdge(edgeData);
      graph.addEdge(edgeMeta);
    }

    return metamodel;
  }

  /**
   * Serializes current X6 graph layout (positions, bounds, bend points) back into an SVG document.
   *
   * @param graph The AntV X6 Graph instance.
   * @param baseSvg Optional base SVG string to update in-place.
   * @param options Serialization options.
   * @returns The updated SVG markup string adhering to the aim-* contract.
   */
  public serializeToSvg(
    graph: Graph,
    baseSvg?: string,
    options: SerializationOptions = {},
  ): string {
    const metamodel = this.metamodelFromGraph(graph);

    if (baseSvg) {
      return this.updateExistingSvg(baseSvg, metamodel, options);
    }

    return this.generateFreshSvg(metamodel, options);
  }

  /**
   * Extracts a pure RaidMetamodel from an active AntV X6 Graph.
   */
  public metamodelFromGraph(graph: Graph): RaidMetamodel {
    const nodes: RaidNodeData[] = [];
    const edges: RaidEdgeData[] = [];

    // Extract nodes
    const x6Nodes = graph.getNodes();
    for (const node of x6Nodes) {
      const pos = node.getPosition();
      const size = node.getSize();
      const customData = (node.getData() ?? {}) as Partial<RaidNodeData>;

      const id = node.id;
      const kind = (customData.kind ?? this.kindFromShape(node.shape)) as AimOntologyKind;
      const displayName = customData.displayName ?? (node.getAttrByPath('label/text') as string) ?? id;

      const nodeData: RaidNodeData = {
        id,
        kind,
        displayName,
        ...(customData.stereotype !== undefined ? { stereotype: customData.stereotype } : {}),
        ...(customData.namespace !== undefined ? { namespace: customData.namespace } : {}),
        ...(customData.attributes !== undefined ? { attributes: customData.attributes } : {}),
        ...(customData.methods !== undefined ? { methods: customData.methods } : {}),
        bounds: {
          x: pos.x,
          y: pos.y,
          width: size.width,
          height: size.height,
        },
        ...(customData.properties !== undefined ? { properties: customData.properties } : {}),
      };

      nodes.push(nodeData);
    }

    // Extract edges
    const x6Edges = graph.getEdges();
    for (const edge of x6Edges) {
      const source = edge.getSourceCell();
      const target = edge.getTargetCell();
      if (!source || !target) continue;

      const vertices = edge.getVertices();
      const bendPoints: SvgBendPoint[] = vertices.map((v) => ({ x: v.x, y: v.y }));
      const customData = (edge.getData() ?? {}) as Partial<RaidEdgeData>;

      const sourcePort = edge.getSourcePortId();
      const targetPort = edge.getTargetPortId();
      const label = (edge.getLabels()?.[0]?.attrs?.['text']?.['text'] as string | undefined) ?? customData.label;

      const edgeData: RaidEdgeData = {
        id: edge.id,
        kind: customData.kind ?? 'association',
        sourceId: source.id,
        targetId: target.id,
        ...(sourcePort !== undefined ? { sourcePort } : {}),
        ...(targetPort !== undefined ? { targetPort } : {}),
        ...(label !== undefined ? { label } : {}),
        ...(customData.stereotype !== undefined ? { stereotype: customData.stereotype } : {}),
        ...(customData.sourceCardinality !== undefined ? { sourceCardinality: customData.sourceCardinality } : {}),
        ...(customData.targetCardinality !== undefined ? { targetCardinality: customData.targetCardinality } : {}),
        bendPoints,
      };

      edges.push(edgeData);
    }

    return {
      diagramId: 'RaidDiagram',
      archetype: 'InteractiveCanvas',
      nodes,
      edges,
    };
  }

  /**
   * Parses semicolon-separated bend points: "100,50; 200,50; 200,150"
   */
  public parseBendPoints(bendsStr: string): SvgBendPoint[] {
    if (!bendsStr || bendsStr.trim().length === 0) {
      return [];
    }

    return bendsStr
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((part) => {
        const [xStr, yStr] = part.split(',');
        const x = parseFloat(xStr?.trim() ?? '0');
        const y = parseFloat(yStr?.trim() ?? '0');
        return { x: Number.isNaN(x) ? 0 : x, y: Number.isNaN(y) ? 0 : y };
      });
  }

  /**
   * Formats bend points into the canonical aim-bends format: "x1,y1; x2,y2"
   */
  public formatBendPoints(points: readonly SvgBendPoint[]): string {
    return points.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join('; ');
  }

  // --------------------------------------------------------------------------
  // Private Helper Implementation
  // --------------------------------------------------------------------------

  private resolveSvgElement(source: string | Element): Element {
    if (typeof source !== 'string') {
      return source;
    }

    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const parsed = parser.parseFromString(source, 'image/svg+xml');
      const root = parsed.documentElement;
      if (root.tagName.toLowerCase() === 'parsererror') {
        throw new Error('Failed to parse SVG: XML Parser Error');
      }
      return root;
    }

    throw new Error('DOMParser unavailable in current execution environment');
  }

  private extractMetamodel(svgRoot: Element, options: HydrationOptions): RaidMetamodel {
    const nodes: RaidNodeData[] = [];
    const edges: RaidEdgeData[] = [];

    // 1. Locate all node elements
    const nodeElements = Array.from(
      svgRoot.querySelectorAll(AimSvgContract.SELECTOR_NODE),
    );

    for (const el of nodeElements) {
      const id =
        el.getAttribute(AimSvgContract.ATTR_ID) ??
        el.getAttribute('data-node') ??
        el.getAttribute('data-element-id') ??
        el.getAttribute('id');

      if (!id) continue;

      const rawKind = el.getAttribute(AimSvgContract.ATTR_KIND) ?? 'act';
      const kind = this.normalizeKind(rawKind);

      const displayName =
        el.getAttribute(AimSvgContract.ATTR_DISPLAY_NAME) ??
        el.querySelector('text')?.textContent?.trim() ??
        id;

      const stereotype = el.getAttribute(AimSvgContract.ATTR_STEREOTYPE) ?? undefined;
      const bounds = this.extractBounds(el, options.defaultNodeSize);

      nodes.push({
        id,
        kind,
        displayName,
        ...(stereotype !== undefined ? { stereotype } : {}),
        bounds,
      });
    }

    // 2. Locate all edge elements
    const edgeElements = Array.from(
      svgRoot.querySelectorAll(AimSvgContract.SELECTOR_EDGE),
    );

    for (const el of edgeElements) {
      const id = el.getAttribute(AimSvgContract.ATTR_ID) ?? el.getAttribute('id') ?? `edge-${edges.length + 1}`;
      const sourceId = el.getAttribute(AimSvgContract.ATTR_SOURCE);
      const targetId = el.getAttribute(AimSvgContract.ATTR_TARGET);

      if (!sourceId || !targetId) continue;

      const rawEdgeKind = el.getAttribute(AimSvgContract.ATTR_EDGE_KIND) ?? 'association';
      const kind = this.normalizeEdgeKind(rawEdgeKind);

      const bendsAttr = el.getAttribute(AimSvgContract.ATTR_BENDS) ?? '';
      const bendPoints = this.parseBendPoints(bendsAttr);

      const label =
        el.getAttribute('aim-label') ??
        el.querySelector('text')?.textContent?.trim() ??
        undefined;

      let sourcePort = el.getAttribute(AimSvgContract.ATTR_SOURCE_PORT) ?? undefined;
      let targetPort = el.getAttribute(AimSvgContract.ATTR_TARGET_PORT) ?? undefined;

      const sourceNode = nodes.find((n) => n.id === sourceId);
      const targetNode = nodes.find((n) => n.id === targetId);

      // Infer optimal orthogonal docking ports if not explicitly declared
      if (sourceNode && targetNode) {
        const dx =
          targetNode.bounds.x +
          targetNode.bounds.width / 2 -
          (sourceNode.bounds.x + sourceNode.bounds.width / 2);
        const dy =
          targetNode.bounds.y +
          targetNode.bounds.height / 2 -
          (sourceNode.bounds.y + sourceNode.bounds.height / 2);

        if (!sourcePort) {
          sourcePort =
            Math.abs(dx) >= Math.abs(dy)
              ? dx >= 0
                ? 'port-right'
                : 'port-left'
              : dy >= 0
                ? 'port-bottom'
                : 'port-top';
        }
        if (!targetPort) {
          targetPort =
            Math.abs(dx) >= Math.abs(dy)
              ? dx >= 0
                ? 'port-left'
                : 'port-right'
              : dy >= 0
                ? 'port-top'
                : 'port-bottom';
        }
      }

      // If bendPoints contains only the 2 terminal endpoints of a straight connector,
      // clear them so the orthogonal router doesn't treat the terminals as obstacle waypoints
      const isTerminalOnly =
        bendPoints.length === 2 &&
        sourceNode &&
        targetNode &&
        ((Math.abs(bendPoints[0]!.y - bendPoints[1]!.y) < 2 &&
          Math.abs(bendPoints[0]!.y - (sourceNode.bounds.y + sourceNode.bounds.height / 2)) < 40) ||
          (Math.abs(bendPoints[0]!.x - bendPoints[1]!.x) < 2 &&
            Math.abs(bendPoints[0]!.x - (sourceNode.bounds.x + sourceNode.bounds.width / 2)) < 40));
      const effectiveBendPoints = isTerminalOnly ? [] : bendPoints;

      const sourceCardinality =
        el.getAttribute('aim-source-cardinality') ?? undefined;
      const targetCardinality =
        el.getAttribute('aim-target-cardinality') ?? undefined;

      edges.push({
        id,
        kind,
        sourceId,
        targetId,
        ...(sourcePort !== undefined ? { sourcePort } : {}),
        ...(targetPort !== undefined ? { targetPort } : {}),
        ...(label !== undefined ? { label } : {}),
        ...(sourceCardinality !== undefined ? { sourceCardinality } : {}),
        ...(targetCardinality !== undefined ? { targetCardinality } : {}),
        bendPoints: effectiveBendPoints,
      });
    }

    return {
      diagramId: svgRoot.getAttribute('id') ?? 'ImportedDiagram',
      archetype: svgRoot.getAttribute('aim-archetype') ?? 'AOAIMDiagram',
      nodes,
      edges,
    };
  }

  private extractBounds(
    el: Element,
    defaultSize: { width: number; height: number } = { width: 140, height: 60 },
  ): Bounds {
    let x = 0;
    let y = 0;
    let width = defaultSize.width;
    let height = defaultSize.height;

    // Check transform matrix or translate
    const transform = el.getAttribute('transform');
    if (transform) {
      const match = /translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/.exec(transform);
      if (match && match[1] && match[2]) {
        x = parseFloat(match[1]);
        y = parseFloat(match[2]);
      }
    }

    // Check direct geometry attributes (rect, ellipse, circle)
    const rect = el.querySelector('rect') ?? (el.tagName.toLowerCase() === 'rect' ? el : null);
    if (rect) {
      if (!transform && rect.getAttribute('x')) x = parseFloat(rect.getAttribute('x')!);
      if (!transform && rect.getAttribute('y')) y = parseFloat(rect.getAttribute('y')!);
      if (rect.getAttribute('width')) width = parseFloat(rect.getAttribute('width')!);
      if (rect.getAttribute('height')) height = parseFloat(rect.getAttribute('height')!);
    }

    const ellipse =
      el.querySelector('ellipse') ?? (el.tagName.toLowerCase() === 'ellipse' ? el : null);
    if (ellipse) {
      const rx = parseFloat(ellipse.getAttribute('rx') ?? `${width / 2}`);
      const ry = parseFloat(ellipse.getAttribute('ry') ?? `${height / 2}`);
      width = rx * 2;
      height = ry * 2;
      if (!transform) {
        const cx = parseFloat(ellipse.getAttribute('cx') ?? '0');
        const cy = parseFloat(ellipse.getAttribute('cy') ?? '0');
        x = cx - rx;
        y = cy - ry;
      }
    }

    return { x, y, width, height };
  }

  private updateExistingSvg(
    baseSvg: string,
    model: RaidMetamodel,
    _options: SerializationOptions,
  ): string {
    if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
      return this.generateFreshSvg(model, _options);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(baseSvg, 'image/svg+xml');

    // Update node positions and transforms
    for (const node of model.nodes) {
      const el = doc.querySelector(`[${AimSvgContract.ATTR_ID}="${node.id}"], [id="${node.id}"]`);
      if (el) {
        el.setAttribute('transform', `translate(${node.bounds.x}, ${node.bounds.y})`);
        el.setAttribute(AimSvgContract.ATTR_NODE, 'true');
        el.setAttribute(AimSvgContract.ATTR_KIND, node.kind);

        const rect = el.querySelector('rect');
        if (rect) {
          rect.setAttribute('width', `${node.bounds.width}`);
          rect.setAttribute('height', `${node.bounds.height}`);
        }
      }
    }

    // Update edge bend points and aim-bends attributes
    for (const edge of model.edges) {
      const el = doc.querySelector(`[${AimSvgContract.ATTR_ID}="${edge.id}"], [id="${edge.id}"]`);
      if (el) {
        const bendsString = this.formatBendPoints(edge.bendPoints);
        el.setAttribute(AimSvgContract.ATTR_BENDS, bendsString);
        el.setAttribute(AimSvgContract.ATTR_EDGE, 'true');
        el.setAttribute(AimSvgContract.ATTR_EDGE_KIND, edge.kind);

        if (edge.stereotype !== undefined) {
          el.setAttribute(AimSvgContract.ATTR_STEREOTYPE, edge.stereotype);
        }
        if (edge.sourceCardinality !== undefined) {
          el.setAttribute('aim-source-cardinality', edge.sourceCardinality);
        }
        if (edge.targetCardinality !== undefined) {
          el.setAttribute('aim-target-cardinality', edge.targetCardinality);
        }
      }
    }

    return new XMLSerializer().serializeToString(doc);
  }

  private generateFreshSvg(model: RaidMetamodel, options: SerializationOptions): string {
    const width = Math.max(800, ...model.nodes.map((n) => n.bounds.x + n.bounds.width + 100));
    const height = Math.max(600, ...model.nodes.map((n) => n.bounds.y + n.bounds.height + 100));

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" id="${model.diagramId}" aim-archetype="${model.archetype}">\n`;

    // Definitions & Markers
    svg += `  <defs>\n`;
    svg += `    <marker id="arrow-classic" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">\n`;
    svg += `      <path d="M 0 0 L 10 5 L 0 10 z" fill="${CascaisPalette.WarmGraphite}" />\n`;
    svg += `    </marker>\n`;
    svg += `    <marker id="arrow-hollow" viewBox="0 0 12 12" refX="12" refY="6" markerWidth="9" markerHeight="9" orient="auto-start-reverse">\n`;
    svg += `      <polygon points="0 0, 12 6, 0 12" fill="${CascaisPalette.ChalkWhite}" stroke="${CascaisPalette.WarmGraphite}" stroke-width="1.5" />\n`;
    svg += `    </marker>\n`;
    if (options.embedStyles !== false) {
      svg += `    <style>\n`;
      svg += `      .aim-node { cursor: pointer; transition: filter 0.15s ease; }\n`;
      svg += `      .aim-node:hover { filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }\n`;
      svg += `      .aim-edge { fill: none; stroke: ${CascaisPalette.WarmGraphite}; stroke-width: 1.5; }\n`;
      svg += `      text { font-family: Inter, system-ui, sans-serif; }\n`;
      svg += `    </style>\n`;
    }
    svg += `  </defs>\n\n`;

    // Render Edges
    svg += `  <!-- Edges -->\n`;
    svg += `  <g class="aim-edges-layer">\n`;
    for (const edge of model.edges) {
      const bendsFormatted = this.formatBendPoints(edge.bendPoints);
      const strokeDash = edge.kind === 'dependency' ? ' stroke-dasharray="5,5"' : '';
      const markerEnd = edge.kind === 'generalization' ? ' marker-end="url(#arrow-hollow)"' : ' marker-end="url(#arrow-classic)"';

      // Path data construction
      let pathD = '';
      if (edge.bendPoints.length > 0) {
        const first = edge.bendPoints[0]!;
        pathD = `M ${first.x} ${first.y} ` + edge.bendPoints.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');
      }

      svg += `    <g ${AimSvgContract.ATTR_EDGE}="true" ${AimSvgContract.ATTR_ID}="${edge.id}" ${AimSvgContract.ATTR_EDGE_KIND}="${edge.kind}" ${AimSvgContract.ATTR_SOURCE}="${edge.sourceId}" ${AimSvgContract.ATTR_TARGET}="${edge.targetId}" ${AimSvgContract.ATTR_BENDS}="${bendsFormatted}">\n`;
      if (pathD) {
        svg += `      <path d="${pathD}" class="aim-edge"${strokeDash}${markerEnd} />\n`;
      }
      if (edge.label) {
        const midPoint = edge.bendPoints[Math.floor(edge.bendPoints.length / 2)] ?? { x: 50, y: 50 };
        svg += `      <text x="${midPoint.x}" y="${midPoint.y - 8}" font-size="11" fill="${CascaisPalette.TextSecondary}" text-anchor="middle">${edge.label}</text>\n`;
      }
      svg += `    </g>\n`;
    }
    svg += `  </g>\n\n`;

    // Render Nodes
    svg += `  <!-- Nodes -->\n`;
    svg += `  <g class="aim-nodes-layer">\n`;
    for (const node of model.nodes) {
      svg += `    <g ${AimSvgContract.ATTR_NODE}="true" ${AimSvgContract.ATTR_ID}="${node.id}" ${AimSvgContract.ATTR_KIND}="${node.kind}" ${AimSvgContract.ATTR_DISPLAY_NAME}="${node.displayName}" transform="translate(${node.bounds.x}, ${node.bounds.y})">\n`;

      if (node.kind === 'uc') {
        const rx = node.bounds.width / 2;
        const ry = node.bounds.height / 2;
        svg += `      <ellipse cx="${rx}" cy="${ry}" rx="${rx}" ry="${ry}" fill="${CascaisPalette.ChalkWhite}" stroke="${CascaisPalette.NetGold}" stroke-width="2" />\n`;
        svg += `      <text x="${rx}" y="${ry}" font-size="13" font-weight="bold" fill="${CascaisPalette.TextPrimary}" text-anchor="middle" dominant-baseline="central">${node.displayName}</text>\n`;
      } else if (node.kind === 'act') {
        svg += `      <rect width="${node.bounds.width}" height="${node.bounds.height}" rx="12" ry="12" fill="${CascaisPalette.CanvasCream}" stroke="${CascaisPalette.HeraldicGreen}" stroke-width="2" />\n`;
        svg += `      <text x="${node.bounds.width / 2}" y="${node.bounds.height / 2}" font-size="13" font-weight="600" fill="${CascaisPalette.TextPrimary}" text-anchor="middle" dominant-baseline="central">${node.displayName}</text>\n`;
      } else {
        svg += `      <rect width="${node.bounds.width}" height="${node.bounds.height}" fill="${CascaisPalette.ChalkWhite}" stroke="${CascaisPalette.WarmGraphite}" stroke-width="1.5" />\n`;
        svg += `      <text x="${node.bounds.width / 2}" y="${node.bounds.height / 2}" font-size="12" fill="${CascaisPalette.TextPrimary}" text-anchor="middle" dominant-baseline="central">${node.displayName}</text>\n`;
      }

      svg += `    </g>\n`;
    }
    svg += `  </g>\n`;
    svg += `</svg>\n`;

    return svg;
  }

  private normalizeKind(kind: string): AimOntologyKind {
    const lower = kind.toLowerCase();
    if (lower === 'uc' || lower === 'usecase') return 'uc';
    if (lower === 'act' || lower === 'activity') return 'act';
    if (lower === 'cls' || lower === 'class') return 'cls';
    if (lower === 'obj' || lower === 'object') return 'obj';
    if (lower === 'per' || lower === 'person' || lower === 'actor') return 'per';
    return 'act';
  }

  private normalizeEdgeKind(kind: string): AimEdgeKind {
    const lower = kind.toLowerCase();
    if (lower.includes('depend')) return 'dependency';
    if (lower.includes('general') || lower.includes('inher')) return 'generalization';
    if (lower.includes('realiz')) return 'realization';
    if (lower.includes('aggreg')) return 'aggregation';
    if (lower.includes('compos')) return 'composition';
    return 'association';
  }

  private kindFromShape(shape: string): AimOntologyKind {
    if (shape.includes('uc')) return 'uc';
    if (shape.includes('act')) return 'act';
    if (shape.includes('cls')) return 'cls';
    if (shape.includes('obj')) return 'obj';
    if (shape.includes('per')) return 'per';
    return 'act';
  }
}
