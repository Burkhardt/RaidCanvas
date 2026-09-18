import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSemanticConnection,
  getSemanticEdgeKind,
  getSemanticEdgeStereotype,
  getSemanticRuleDescription,
  getAvailableStereotypes,
  getDefaultNodeBounds,
  getDefaultNodeName,
} from '../dist/index.js';

describe('AOAIM Semantic Connection Rules (Anti-Entropy Wiring)', () => {
  test('validates ontologically allowed connections', () => {
    // Actor -> UseCase («initiates»)
    assert.equal(validateSemanticConnection('per', 'uc'), true);
    assert.equal(getSemanticEdgeKind('per', 'uc'), 'association');
    assert.equal(getSemanticEdgeStereotype('per', 'uc'), '«initiates»');

    // Actor -> Activity («executes»)
    assert.equal(validateSemanticConnection('per', 'act'), true);
    assert.equal(getSemanticEdgeKind('per', 'act'), 'association');
    assert.equal(getSemanticEdgeStereotype('per', 'act'), '«executes»');

    // UseCase -> UseCase («includes»)
    assert.equal(validateSemanticConnection('uc', 'uc'), true);
    assert.equal(getSemanticEdgeKind('uc', 'uc'), 'dependency');
    assert.equal(getSemanticEdgeStereotype('uc', 'uc'), '«includes»');

    // UseCase -> Activity («includes»)
    assert.equal(validateSemanticConnection('uc', 'act'), true);
    assert.equal(getSemanticEdgeKind('uc', 'act'), 'dependency');

    // Activity -> Activity («sequence»)
    assert.equal(validateSemanticConnection('act', 'act'), true);
    assert.equal(getSemanticEdgeKind('act', 'act'), 'association');
    assert.equal(getSemanticEdgeStereotype('act', 'act'), '«sequence»');

    // Class -> Class («relatesTo»)
    assert.equal(validateSemanticConnection('cls', 'cls'), true);
    assert.equal(getSemanticEdgeKind('cls', 'cls'), 'association');

    // Object -> Class («instantiates»)
    assert.equal(validateSemanticConnection('obj', 'cls'), true);
    assert.equal(getSemanticEdgeKind('obj', 'cls'), 'dependency');
    assert.equal(getSemanticEdgeStereotype('obj', 'cls'), '«instantiates»');

    // Object -> Object («link»)
    assert.equal(validateSemanticConnection('obj', 'obj'), true);
    assert.equal(getSemanticEdgeKind('obj', 'obj'), 'association');
  });

  test('rejects ontologically invalid connections', () => {
    // Disallowed self-connections or cross-category violations
    assert.equal(validateSemanticConnection('per', 'per'), false);
    assert.equal(validateSemanticConnection('act', 'cls'), false);
    assert.equal(validateSemanticConnection('obj', 'per'), false);
    assert.equal(validateSemanticConnection('uc', 'obj'), false);
    assert.equal(validateSemanticConnection('cls', 'act'), false);
    assert.equal(validateSemanticConnection('', 'uc'), false);
    assert.equal(validateSemanticConnection('unknown', 'unknown'), false);
  });

  test('provides human-readable rule descriptions', () => {
    const desc = getSemanticRuleDescription('per', 'uc');
    assert.ok(desc.includes('Actor'));
    assert.ok(desc.includes('UseCase'));

    const invalidDesc = getSemanticRuleDescription('invalid', 'target');
    assert.equal(invalidDesc, 'Invalid ontological connection');
  });

  test('provides «initiates», «owns» (0..1), and «participates» (0..*) for per->uc', () => {
    const options = getAvailableStereotypes('per', 'uc');
    assert.equal(options.length, 3);

    const initiates = options.find((o) => o.stereotype === '«initiates»');
    assert.ok(initiates);

    const owns = options.find((o) => o.stereotype === '«owns»');
    assert.ok(owns);
    assert.equal(owns.defaultCardinality, '0..1');
    assert.ok(owns.description.includes('0..1'));

    const participates = options.find((o) => o.stereotype === '«participates»');
    assert.ok(participates);
    assert.equal(participates.defaultCardinality, '0..*');
    assert.ok(participates.description.includes('0..*'));
  });
});

describe('AOAIM Stencil Sizing & Defaults', () => {
  test('returns canonical bounds per archetype', () => {
    const ucBounds = getDefaultNodeBounds('uc', 50, 60);
    assert.deepEqual(ucBounds, { x: 50, y: 60, width: 140, height: 70 });

    const actBounds = getDefaultNodeBounds('act', 10, 20);
    assert.deepEqual(actBounds, { x: 10, y: 20, width: 150, height: 60 });

    const clsBounds = getDefaultNodeBounds('cls', 0, 0);
    assert.deepEqual(clsBounds, { x: 0, y: 0, width: 180, height: 110 });

    const objBounds = getDefaultNodeBounds('obj', 100, 100);
    assert.deepEqual(objBounds, { x: 100, y: 100, width: 160, height: 80 });

    const perBounds = getDefaultNodeBounds('per', 200, 200);
    assert.deepEqual(perBounds, { x: 200, y: 200, width: 120, height: 110 });
  });

  test('returns standard default display names per archetype', () => {
    assert.equal(getDefaultNodeName('uc'), 'New UseCase');
    assert.equal(getDefaultNodeName('act'), 'New Activity');
    assert.equal(getDefaultNodeName('cls'), 'NewClass');
    assert.equal(getDefaultNodeName('obj'), 'new Object');
    assert.equal(getDefaultNodeName('per'), 'Actor');
  });
});

describe('Diagram-specific role semantics', () => {
  test('mixed diagrams admit the complete role pattern and instance-to-class direction', async () => {
    const { validateDiagramConnection } = await import('../dist/index.js');
    for (const [source, target] of [['cls', 'rol'], ['rol', 'cls'], ['obj', 'rf'], ['rf', 'obj'], ['rf', 'rol'], ['obj', 'cls'], ['per', 'cls']]) {
      assert.equal(validateDiagramConnection({ kind: source }, { kind: target }, 'ClassObjectDiagram'), true);
    }
    assert.equal(validateDiagramConnection({ kind: 'cls' }, { kind: 'obj' }, 'ClassObjectDiagram'), false);
    assert.equal(validateDiagramConnection({ kind: 'obj' }, { kind: 'rol' }, 'ClassObjectDiagram'), false);
  });
  test('UseCase views exclude instances and prohibit actor-to-actor and actor-to-class wiring', async () => {
    const { isNodeAllowedInDiagram, validateDiagramConnection } = await import('../dist/index.js');
    const allowed = (a, b) => validateDiagramConnection(a, b, 'UseCaseDiagram');
    assert.equal(allowed({ kind: 'per' }, { kind: 'uc' }), true);
    assert.equal(allowed({ kind: 'uc' }, { kind: 'cls' }), true);
    assert.equal(allowed({ kind: 'uc' }, { kind: 'uc' }), true);
    assert.equal(allowed({ kind: 'per', instance: true }, { kind: 'uc' }), false);
    assert.equal(allowed({ kind: 'per' }, { kind: 'per' }), false);
    assert.equal(allowed({ kind: 'per' }, { kind: 'cls' }), false);
    for (const kind of ['obj', 'rf', 'act', 'plc']) assert.equal(isNodeAllowedInDiagram({ kind }, 'OneUseCaseDiagram'), false);
  });
});
