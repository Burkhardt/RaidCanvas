import { RaiBridge, type RaidNodeData, type RaidEdgeData, type RaidMetamodel } from '@dr2rai/raid-canvas';
import type { DiagramPreset } from './presets';
const node = (id: string, kind: RaidNodeData['kind'], displayName: string, x: number, y: number, extra: Partial<RaidNodeData> = {}): RaidNodeData => ({
  id, kind, displayName, bounds: { x, y, width: kind === 'rol' || kind === 'rf' ? 22 : 180, height: kind === 'rol' || kind === 'rf' ? 22 : 76 },
  ...(['obj', 'rf'].includes(kind) ? { instance: true } : {}), ...extra,
});
const edge = (id: string, sourceId: string, targetId: string, kind: RaidEdgeData['kind'] = 'association', directed = true, extra: Partial<RaidEdgeData> = {}): RaidEdgeData => ({ id, sourceId, targetId, kind, directed, routing: 'normal', bendPoints: [], ...extra });
const preset = (id: string, name: string, description: string, model: RaidMetamodel): DiagramPreset => ({ id, name, description, archetype: model.archetype, svg: new RaiBridge().generateFreshSvg(model, {}) });
export const ROLE_PRESETS: DiagramPreset[] = [
  preset('role-fillers', 'Roles & RoleFillers (Legacy)', 'Legacy regression view: historical rf circles still load and render. One role definition, two contextual bindings, one shared filler. Select a hollow or filled circle to inspect its connections.', {
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
  // The Vasco / RAI handover pair: one UseCase signature (1UCC) and one running Activity that fills it (1AOC / _RFD).
  preset('negotiate-contract-1ucc', 'Roles · NegotiateContract (1UCC slots)', 'Type level: the UseCase declares its formal parameters. Each Who / What / Where role wears its category glyph inside a dashed slot ring, with the expected Class as a quiet `: <Class>` tag. Nothing is underlined.', {
    diagramId: 'NegotiateContract_UCD', archetype: 'OneUseCaseDiagram', routing: 'normal',
    nodes: [
      node('negotiate', 'uc', 'NegotiateContract', 360, 190),
      node('signer', 'per', 'Signer', 80, 60, { slot: true, restriction: 'Person', instance: false, bounds: { x: 80, y: 60, width: 120, height: 110 } }),
      node('contract', 'obj', 'Contract', 680, 60, { slot: true, restriction: 'Document', instance: false, bounds: { x: 680, y: 60, width: 160, height: 80 } }),
      node('venue', 'plc', 'Venue', 80, 300, { slot: true, restriction: 'Place', instance: false, bounds: { x: 80, y: 300, width: 120, height: 110 } }),
      node('approver', 'rol', 'Approver', 750, 330),
    ],
    edges: [
      edge('signer-negotiate', 'signer', 'negotiate', 'association', true, { label: '«initiates»' }),
      edge('negotiate-contract', 'negotiate', 'contract', 'association', false),
      edge('venue-negotiate', 'venue', 'negotiate', 'association', false),
      edge('approver-negotiate', 'approver', 'negotiate', 'association', false),
    ],
  }),
  preset('negotiate-contract-rfd', 'RoleFillers · NegotiateContract4711 (_RFD)', 'Instance level: the Activity is the running scope in the centre; its local variables are bound to concrete instances. Each instance is solid and underlined with its Class on top, and the edge names the role it fills.', {
    diagramId: 'NegotiateContract4711_RFD', archetype: 'OneActivityDiagram', routing: 'normal',
    nodes: [
      node('negotiate4711', 'act', 'NegotiateContract4711', 340, 200, { instance: true, qualifier: 'NegotiateContract', bounds: { x: 340, y: 200, width: 210, height: 65 } }),
      node('rai', 'per', 'RAI', 80, 60, { instance: true, qualifier: 'Person', bounds: { x: 80, y: 60, width: 120, height: 110 } }),
      node('contract4711', 'obj', 'Contract4711', 690, 60, { qualifier: 'Contract' }),
      node('winstons', 'plc', 'WinstonsOB', 80, 320, { instance: true, qualifier: 'Place', bounds: { x: 80, y: 320, width: 120, height: 110 } }),
    ],
    edges: [
      edge('rai-fills', 'rai', 'negotiate4711', 'association', true, { label: 'fills: Signer' }),
      edge('contract-fills', 'contract4711', 'negotiate4711', 'association', true, { label: 'fills: Contract' }),
      edge('winstons-fills', 'winstons', 'negotiate4711', 'association', true, { label: 'fills: Venue' }),
    ],
  }),
  preset('wrapped-description', 'Object · Description wrapping', 'Editable Description wraps at 40 characters and grows vertically. The inspector supports widths from 32 to 50 characters.', {
    diagramId: 'DescriptionDemo', archetype: 'ObjectDiagram', routing: 'normal',
    nodes: [node('show', 'obj', 'AfricaPicnic26', 100, 80, { description: 'An African music festival in Schwäbisch Hall, bringing together live performances, art, culture and hospitality.\n\nThe Description wraps into readable lines. Edit this text or change the character width in the inspector; the card grows with its content.', descriptionWidth: 40 }), node('venue-binding', 'rf', 'Venue', 560, 209), node('venue', 'obj', 'SchwäbischHall', 700, 182, { qualifier: 'Place' })],
    edges: [edge('venue-owner', 'show', 'venue-binding', 'association', false), edge('venue-filler', 'venue-binding', 'venue')],
  }),
];
