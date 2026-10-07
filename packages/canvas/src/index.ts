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
  STATEMENT_KEY_PATTERN,
  type AimOntologyKind,
  type AimRoutingMode,
  type AimEdgeKind,
  type AimExpressionColor,
  type SpeechActStatement,
  type Point,
  type SvgBendPoint,
  type Bounds,
  type OrthogonalPortId,
  type RaidNodeData,
  type RaidEdgeData,
  type RaidBoundaryData,
  type RaidMetamodel,
  type HydrationOptions,
  type SerializationOptions,
} from './types.js';

// Cascais theme: the single source of every heraldic colour (CR055)
export { CascaisPalette, DualityWashStrength, HeraldicWash, withAlpha } from './CascaisTheme.js';

// AntV X6 Custom Shapes & Port Registrations
export {
  createOrthogonalPorts,
  registerAimShapes,
  configureAimGraph,
  createAimNode,
  createAimEdge,
  createAimBoundary,
  computeExpressionPillColors,
  type ExpressionPillColors,
  applyEdgeRouting,
  getDefaultNodeBounds,
  getDefaultNodeName,
  computePortalDoorAttrs,
  computeStereotypeIconAttrs,
  computeStereotypeGlyphAttrs,
  setNodeDualityActive,
  wrapAimText,
  computeMaxLineLength,
} from './X6Shapes.js';

// Stereotype Iconography & Vasco Ontology v1.3 / OTW Library
export {
  KNOWN_STEREOTYPES,
  resolveStereotype,
  isInitiatingStereotype,
  getStereotypePaths,
  renderStereotypeIconSvg,
  type StereotypeId,
  type StereotypeDefinition,
  type StereotypePaths,
} from './StereotypeIcons.js';

// CR053 Stereotype Pictogram Library (artwork shipped in `assets/stereotypes/`, served by the host)
export {
  STEREOTYPE_GLYPH_CATALOG,
  STEREOTYPE_GLYPH_CATEGORIES,
  GLYPH_SILHOUETTE_BAND,
  GLYPH_BADGE_SIZE,
  GLYPH_EDGE_SIZE,
  resolveStereotypeGlyph,
  resolveStereotypeGlyphs,
  splitStereotypeGlyphRefs,
  hasStereotypeGlyph,
  getStereotypeGlyphUrl,
  getStereotypeGlyphBaseUrl,
  setStereotypeGlyphBaseUrl,
  setStereotypeGlyphResolver,
  searchStereotypeGlyphs,
  computeStereotypeGlyphPlacement,
  computeStereotypeGlyphLayout,
  STEREOTYPE_GLYPH_LIMIT,
  type StereotypeGlyphEntry,
  type StereotypeGlyphCategory,
  type StereotypeGlyphUrlResolver,
  type StereotypeGlyphPlacement,
} from './StereotypeGlyphs.js';

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

// Bidirectional SVG <-> X6 Synchronization Bridge & XML Escaping
export { RaiBridge, escapeXmlText, escapeXmlAttr } from './RaiBridge.js';

// Reusable React Canvas Component & Ref Handle
export {
  RaidCanvas,
  type RaidCanvasProps,
  type RaidCanvasState,
  type RaidWaypointSelection,
  type RaidCanvasHandle,
} from './RaidCanvas.js';

export {
  RaidInspector,
  type RaidInspectorProps,
  type RaidInspectorSelection,
} from './RaidInspector.js';

export {
  RaidPalette,
  type RaidPaletteProps,
  type RaidPaletteItem,
  CANONICAL_PALETTE_ITEMS,
  getPaletteItemsForArchetype,
  GENERIC_ROLE_LABEL,
} from './RaidPalette.js';

export { isNodeAllowedInDiagram, validateDiagramConnection } from './semanticRules.js';

export { projectRoleAttributes, classAttributeLines, isInstanceNode, restrictionTag } from './RoleModel.js';

export { wrapDescription, layoutDescription } from './X6Shapes.js';

export { RaidPropertyTree, type RaidPropertyTreeProps } from './RaidPropertyTree.js';
export { RaidCanvasToolbar, type RaidCanvasToolbarProps } from './RaidCanvasToolbar.js';
