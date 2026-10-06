import type { RaidMetamodel, RaidNodeData } from './types.js';

/** The edges are authoritative: class attributes are a second projection of the role. */
export function projectRoleAttributes(model: RaidMetamodel): RaidMetamodel {
  const byId = new Map(model.nodes.map(node => [node.id, node]));
  const nodes = model.nodes.map(node => {
    if (node.kind !== 'cls') return node;
    const roleAttributes = model.edges.flatMap(ownerEdge => {
      if (ownerEdge.sourceId !== node.id) return [];
      const role = byId.get(ownerEdge.targetId);
      if (role?.kind !== 'rol') return [];
      const typeEdge = model.edges.find(edge => edge.sourceId === role.id && byId.get(edge.targetId)?.kind === 'cls');
      const type = typeEdge && byId.get(typeEdge.targetId);
      return type ? [`${role.visibility ?? '+'} ${role.displayName}: ${type.displayName}`] : [];
    });
    return { ...node, roleAttributes };
  });
  return { ...model, nodes };
}

export function classAttributeLines(node: RaidNodeData): readonly string[] {
  return [...new Set([...(node.attributes ?? []), ...(node.roleAttributes ?? [])])];
}

/**
 * A 1UCC role slot is type-level and never underlined. Otherwise an Object (and the legacy
 * RoleFiller circle) is always an instance; other kinds are instances when they say so.
 */
export function isInstanceNode(node: Pick<RaidNodeData, 'kind' | 'instance' | 'slot'>): boolean {
  if (node.slot === true) return false;
  return node.instance === true || node.kind === 'obj' || node.kind === 'rf';
}

/** The quiet second line of a role slot: its expected Class, e.g. `: Person`. */
export function restrictionTag(restriction: string | undefined): string | undefined {
  const value = restriction?.trim();
  return value ? `: ${value}` : undefined;
}
