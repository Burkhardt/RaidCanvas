/**
 * @file index.ts
 * @description Main public entry point for @burkhardt/raid-canvas.
 *
 * Provides:
 * - AntV X6 custom shape registrations for AOAIM ontological entities.
 * - 4-way orthogonal ports and Manhattan router integration.
 * - Cascais Heraldry design tokens and theme styling.
 * - Bidirectional RaiBridge for hydrating from and serializing to the aim-* SVG contract.
 */

// Core Metamodel & SVG Contract Types
export {
  AimSvgContract,
  type AimOntologyKind,
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
} from './X6Shapes.js';

// Bidirectional SVG <-> X6 Synchronization Bridge
export { RaiBridge } from './RaiBridge.js';
