import { RaiBridge, type RaidNodeData, type RaidEdgeData, type RaidMetamodel } from '@dr2rai/raid-canvas';
import type { DiagramPreset } from './presets';
const node = (id: string, kind: RaidNodeData['kind'], displayName: string, x: number, y: number, extra: Partial<RaidNodeData> = {}): RaidNodeData => ({
  id, kind, displayName, bounds: { x, y, width: kind === 'rol' || kind === 'rf' ? 22 : 180, height: kind === 'rol' || kind === 'rf' ? 22 : 76 },
  ...(['obj', 'rf'].includes(kind) ? { instance: true } : {}), ...extra,
});
const edge = (id: string, sourceId: string, targetId: string, kind: RaidEdgeData['kind'] = 'association', directed = true, extra: Partial<RaidEdgeData> = {}): RaidEdgeData => ({ id, sourceId, targetId, kind, directed, routing: 'normal', bendPoints: [], ...extra });
const preset = (id: string, name: string, description: string, model: RaidMetamodel): DiagramPreset => ({ id, name, description, archetype: model.archetype, svg: new RaiBridge().generateFreshSvg(model, {}) });
export const ROLE_PRESETS: DiagramPreset[] = [
  preset('role-fillers', 'Roles & RoleFillers · AIA / AfricaStage / RAI', 'One role definition, two contextual bindings, one shared filler. Select a hollow or filled circle to inspect its connections.', {
    diagramId: 'RoleFillers', archetype: 'ClassObjectDiagram', routing: 'normal',
    nodes: [
      node('system', 'cls', 'System', 80, 60),
      node('person', 'cls', 'Person', 790, 60),
      node('admin', 'rol', 'Admin', 469, 87),
      node('aia', 'obj', 'AIA', 80, 310, { qualifier: 'System' }),
      node('africastage', 'obj', 'AfricaStage', 80, 510, { qualifier: 'System' }),
      node('rai', 'obj', 'RAI', 790, 410, { qualifier: 'Person' }),
      node('aia-admin', 'rf', 'Admin', 469, 337, { properties: { color: '#059669' } }),
      node('africastage-admin', 'rf', 'Admin', 619, 537, { properties: { color: '#2563EB' } }),
    ],
    edges: [
      edge('system-admin', 'system', 'admin', 'association', false),
      edge('admin-type', 'admin', 'person'),
      edge('aia-binding', 'aia', 'aia-admin', 'association', false),
      edge('aia-filler', 'aia-admin', 'rai'),
      edge('africastage-binding', 'africastage', 'africastage-admin', 'association', false),
      edge('africastage-filler', 'africastage-admin', 'rai'),
      edge('aia-role', 'aia-admin', 'admin', 'dependency'),
      edge('africastage-role', 'africastage-admin', 'admin', 'dependency', true, { bendPoints: [{ x: 630, y: 200 }] }),
      edge('aia-class', 'aia', 'system', 'dependency'),
      edge('africastage-class', 'africastage', 'system', 'dependency', true, { sourcePort: 'port-left', targetPort: 'port-left', bendPoints: [{ x: 25, y: 548 }, { x: 25, y: 98 }] }),
      edge('rai-class', 'rai', 'person', 'dependency'),
    ],
  }),
  preset('participant-roles', 'Use Cases · Roles in System context', 'Definition view: participant roles and UseCases only. The runtime System object supplies the activity context.', {
    diagramId: 'SystemUseCases', archetype: 'UseCaseDiagram', routing: 'normal', metadata: { context: 'System' },
    nodes: [node('director', 'per', 'ProjectDirector', 80, 100, { qualifier: 'Person', bounds: { x: 80, y: 100, width: 140, height: 110 } }), node('sign', 'uc', 'Sign Contract', 380, 110, { qualifier: 'System context', namespace: 'System' }), node('verify', 'uc', 'Verify Identity', 710, 110), node('diva', 'per', 'FadoDiva', 80, 340, { qualifier: 'Person', bounds: { x: 80, y: 340, width: 140, height: 110 } }), node('perform', 'uc', 'Perform Show', 380, 350, { qualifier: 'System context', namespace: 'System' })],
    edges: [edge('director-sign', 'director', 'sign', 'association', true, { label: '«initiates»' }), edge('sign-verify', 'sign', 'verify', 'dependency', true, { label: '«includes»' }), edge('diva-perform', 'diva', 'perform', 'association', true, { label: '«participates»' })],
  }),
  preset('wrapped-description', 'Object · Description wrapping', 'Editable Description wraps at 40 characters and grows vertically. The inspector supports widths from 32 to 50 characters.', {
    diagramId: 'DescriptionDemo', archetype: 'ObjectDiagram', routing: 'normal',
    nodes: [node('show', 'obj', 'AfricaPicnic26', 100, 80, { description: 'An African music festival in Schwäbisch Hall, bringing together live performances, art, culture and hospitality.\n\nThe Description wraps into readable lines. Edit this text or change the character width in the inspector; the card grows with its content.', descriptionWidth: 40 }), node('venue-binding', 'rf', 'Venue', 560, 209), node('venue', 'obj', 'SchwäbischHall', 700, 182, { qualifier: 'Place' })],
    edges: [edge('venue-owner', 'show', 'venue-binding', 'association', false), edge('venue-filler', 'venue-binding', 'venue')],
  }),
];
