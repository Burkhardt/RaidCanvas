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
