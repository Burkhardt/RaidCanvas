/**
 * @file index.ts
 * @description Main public entry point for @dr2rai/raid-canvas.
 *
 * Provides:
 * - AntV X6 custom shape registrations for AOAIM ontological entities.
 * - 4-way orthogonal ports and Manhattan router integration.
 * - Cascais Heraldry design tokens and theme styling.
 * - Bidirectional RaiBridge for hydrating from and serializing to the aim-* SVG contract.
 * - Anti-entropy semantic connection validation and wiring rules.
 * - Reusable <RaidCanvas /> React component with Dnd and imperative control handle.
 */

// Core Metamodel & SVG Contract Types
export {
  AimSvgContract,
  type AimOntologyKind,
  type AimRoutingMode,
  type AimEdgeKind,
  type Point,
  type SvgBendPoint,
  type Bounds,
  type OrthogonalPortId,
  type RaidNodeData,
  type RaidEdgeData,
  type RaidMetamodel,
  type HydrationOptions,
  type SerializationOptions,
} from './types.js';

// AntV X6 Custom Shapes & Port Registrations
export {
  CascaisPalette,
  createOrthogonalPorts,
  registerAimShapes,
  configureAimGraph,
  createAimNode,
  createAimEdge,
  applyEdgeRouting,
  getDefaultNodeBounds,
  getDefaultNodeName,
} from './X6Shapes.js';

// Anti-Entropy Semantic Connection Rules
export {
  SEMANTIC_RULES_MATRIX,
  validateSemanticConnection,
  getSemanticEdgeKind,
  getSemanticEdgeStereotype,
  getSemanticRuleDescription,
  getAvailableStereotypes,
  type SemanticRule,
  type StereotypeOption,
} from './semanticRules.js';

// Bidirectional SVG <-> X6 Synchronization Bridge
export { RaiBridge } from './RaiBridge.js';

// Reusable React Canvas Component & Ref Handle
export {
  RaidCanvas,
  type RaidCanvasProps,
  type RaidCanvasHandle,
} from './RaidCanvas.js';
