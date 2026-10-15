import { RaiBridge, type RaidEdgeData, type RaidNodeData } from '@dr2rai/raid-canvas';
import type { DiagramPreset } from './presets';

const activity = (id: string, displayName: string, qualifier: string, x: number, y: number): RaidNodeData => ({
  id, kind: 'act', displayName, qualifier, instance: true, bounds: { x, y, width: 190, height: 64 },
});
const relation = (id: string, sourceId: string, targetId: string, stereotype: string): RaidEdgeData => ({
  id, sourceId, targetId, kind: 'association', stereotype, directed: true, routing: 'normal', bendPoints: [],
});

/** The Triad of Activity relationships (Ontology Compendium v1.9 §10.2), with the Compendium's own examples. */
export const CHAIN_PRESETS: DiagramPreset[] = [
  {
    id: 'activity-chaining',
    name: 'Activity Chaining · «invokes» «spawns» «precedes»',
    archetype: 'ActivityDiagram',
    description: '«invokes»: the parent delegates and stays in Doing (dashed, open arrow). «spawns»: the parent concludes and hands over to a successor it mints (dashed, hook at the start, open arrow). «precedes»: a derived causal sequence through shared object state, no pointer between the two (solid, open arrow).',
    svg: new RaiBridge().generateFreshSvg({
      diagramId: 'ActivityChaining',
      archetype: 'ActivityDiagram',
      routing: 'normal',
      nodes: [
        activity('schedule-rehearsal', 'ScheduleRehearsal', 'Coordinator', 80, 80),
        activity('find-rehearsal-time', 'FindRehearsalTime', 'Sub-task', 480, 80),
        activity('schedule-meeting', 'ScheduleMeeting', 'Concluding', 80, 240),
        activity('hold-meeting', 'HoldMeeting', 'Successor', 480, 240),
        activity('import-photos', 'ImportPhotos', 'Show → Ingested', 80, 400),
        activity('pick-web-images', 'PickWebImages', 'Show [Ingested]', 480, 400),
      ],
      edges: [
        relation('invokes', 'schedule-rehearsal', 'find-rehearsal-time', 'invokes'),
        relation('spawns', 'schedule-meeting', 'hold-meeting', 'spawns'),
        relation('precedes', 'import-photos', 'pick-web-images', 'precedes'),
      ],
    }, {}),
  },
];
