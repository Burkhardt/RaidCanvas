/**
 * @file semanticRules.ts
 * @description Anti-entropy semantic connection validation and wiring rules
 * for the AOAIM (Activity-Object-AI Model) graphical modeling contract.
 *
 * Enforces ontological integrity during edge creation:
 * - 'per' -> 'uc'  : 'association' («initiates», «owns» [0..1], «participates» [0..*])
 * - 'per' -> 'act' : 'association' («executes»)
 * - 'uc'  -> 'uc'  : 'dependency'  («includes», «extends», «dependsOn»)
 * - 'uc'  -> 'act' : 'dependency'  («includes»)
 * - 'act' -> 'act' : 'association' («sequence» / process flow)
 * - 'cls' -> 'cls' : 'association' («relatesTo»), 'generalization', 'composition', 'aggregation'
 * - 'cls' -> 'obj' : 'dependency'  («instantiates»)
 * - 'obj' -> 'obj' : 'association' («link»)
 */

import type { AimOntologyKind, AimEdgeKind } from './types.js';

export interface StereotypeOption {
  readonly stereotype: string;
  readonly defaultCardinality?: string;
  readonly description: string;
}

export interface SemanticRule {
  readonly valid: boolean;
  readonly defaultEdgeKind: AimEdgeKind;
  readonly defaultStereotype: string;
  readonly defaultCardinality?: string;
  readonly availableStereotypes: readonly StereotypeOption[];
  readonly description: string;
}

/**
 * Ontological connection rules matrix.
 * Key: `${sourceKind}->${targetKind}`
 */
export const SEMANTIC_RULES_MATRIX: Readonly<Record<string, SemanticRule>> = {
  'per->uc': {
    valid: true,
    defaultEdgeKind: 'association',
    defaultStereotype: '«initiates»',
    description: 'Actor initiates, owns, or participates in UseCase',
    availableStereotypes: [
      {
        stereotype: '«initiates»',
        defaultCardinality: '1',
        description: 'Initiating role triggering the UseCase flow',
      },
      {
        stereotype: '«owns»',
        defaultCardinality: '0..1',
        description: 'Ownership relationship representing responsible party (cardinality 0..1)',
      },
      {
        stereotype: '«participates»',
        defaultCardinality: '0..*',
        description: 'Participating role supporting the UseCase execution (cardinality 0..*)',
      },
    ],
  },
  'per->act': {
    valid: true,
    defaultEdgeKind: 'association',
    defaultStereotype: '«executes»',
    description: 'Actor directly performs or executes Activity',
    availableStereotypes: [
      {
        stereotype: '«executes»',
        description: 'Actor performs this process step',
      },
      {
        stereotype: '«approves»',
        description: 'Actor reviews or approves activity completion',
      },
    ],
  },
  'uc->uc': {
    valid: true,
    defaultEdgeKind: 'dependency',
    defaultStereotype: '«includes»',
    description: 'UseCase includes or extends sub-UseCase',
    availableStereotypes: [
      {
        stereotype: '«includes»',
        description: 'Mandatory sub-flow inclusion dependency',
      },
      {
        stereotype: '«extends»',
        description: 'Optional conditional extension point',
      },
      {
        stereotype: '«dependsOn»',
        description: 'Prerequisite functional dependency',
      },
    ],
  },
  'uc->act': {
    valid: true,
    defaultEdgeKind: 'dependency',
    defaultStereotype: '«includes»',
    description: 'UseCase elaborates downflow process Activity',
    availableStereotypes: [
      {
        stereotype: '«includes»',
        description: 'Process activity required by UseCase',
      },
      {
        stereotype: '«triggers»',
        description: 'UseCase execution triggers activity',
      },
    ],
  },
  'act->act': {
    valid: true,
    defaultEdgeKind: 'association',
    defaultStereotype: '«sequence»',
    description: 'Activity transitions to next process step',
    availableStereotypes: [
      {
        stereotype: '«sequence»',
        description: 'Sequential process transition',
      },
      {
        stereotype: '«branch»',
        description: 'Conditional decision branch',
      },
    ],
  },
  'cls->cls': {
    valid: true,
    defaultEdgeKind: 'association',
    defaultStereotype: '«relatesTo»',
    description: 'Domain structural relationship between Classes',
    availableStereotypes: [
      {
        stereotype: '«relatesTo»',
        defaultCardinality: '1..*',
        description: 'General domain association',
      },
      {
        stereotype: '«generalization»',
        description: 'Inheritance classification (subclass is-a superclass)',
      },
      {
        stereotype: '«composition»',
        defaultCardinality: '1',
        description: 'Composite whole-part lifecycle binding',
      },
      {
        stereotype: '«aggregation»',
        defaultCardinality: '0..*',
        description: 'Shared aggregation relationship',
      },
    ],
  },
  'cls->obj': {
    valid: true,
    defaultEdgeKind: 'dependency',
    defaultStereotype: '«instantiates»',
    description: 'Class specifies runtime Object instance',
    availableStereotypes: [
      {
        stereotype: '«instantiates»',
        description: 'Class defines schema for runtime instance',
      },
    ],
  },
  'obj->obj': {
    valid: true,
    defaultEdgeKind: 'association',
    defaultStereotype: '«link»',
    description: 'Runtime communication link between Objects',
    availableStereotypes: [
      {
        stereotype: '«link»',
        description: 'Runtime object collaboration message link',
      },
    ],
  },
};

/**
 * Validates whether an edge connection between source and target archetypes is ontologically allowed.
 */
export function validateSemanticConnection(
  sourceKind: AimOntologyKind | string,
  targetKind: AimOntologyKind | string,
): boolean {
  if (!sourceKind || !targetKind) return false;
  const key = `${sourceKind}->${targetKind}`;
  return SEMANTIC_RULES_MATRIX[key]?.valid ?? false;
}

/**
 * Determines the canonical default relationship edge kind for a connected pair.
 */
export function getSemanticEdgeKind(
  sourceKind: AimOntologyKind | string,
  targetKind: AimOntologyKind | string,
): AimEdgeKind {
  const key = `${sourceKind}->${targetKind}`;
  return SEMANTIC_RULES_MATRIX[key]?.defaultEdgeKind ?? 'association';
}

/**
 * Determines the canonical default stereotype annotation for a connected pair.
 */
export function getSemanticEdgeStereotype(
  sourceKind: AimOntologyKind | string,
  targetKind: AimOntologyKind | string,
): string {
  const key = `${sourceKind}->${targetKind}`;
  return SEMANTIC_RULES_MATRIX[key]?.defaultStereotype ?? '';
}

/**
 * Returns available ontological stereotypes and their default cardinalities for a pair.
 */
export function getAvailableStereotypes(
  sourceKind: AimOntologyKind | string,
  targetKind: AimOntologyKind | string,
): readonly StereotypeOption[] {
  const key = `${sourceKind}->${targetKind}`;
  return SEMANTIC_RULES_MATRIX[key]?.availableStereotypes ?? [];
}

/**
 * Returns a human-readable description explaining the ontological relationship.
 */
export function getSemanticRuleDescription(
  sourceKind: AimOntologyKind | string,
  targetKind: AimOntologyKind | string,
): string {
  const key = `${sourceKind}->${targetKind}`;
  return SEMANTIC_RULES_MATRIX[key]?.description ?? 'Invalid ontological connection';
}
