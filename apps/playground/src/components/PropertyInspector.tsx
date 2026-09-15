import React from 'react';
import type { AimOntologyKind, AimEdgeKind, RaidNodeData, RaidEdgeData } from '@dr2rai/raid-canvas';

export interface SelectedEntityData {
  id: string;
  type: 'node' | 'edge';
  nodeData?: Partial<RaidNodeData>;
  edgeData?: Partial<RaidEdgeData>;
}

interface PropertyInspectorProps {
  selection: SelectedEntityData | null;
  onUpdateNode: (id: string, updates: Partial<RaidNodeData>) => void;
  onUpdateEdge: (id: string, updates: Partial<RaidEdgeData>) => void;
  onDeleteSelected: () => void;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  selection,
  onUpdateNode,
  onUpdateEdge,
  onDeleteSelected,
}) => {
  if (!selection) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px', color: '#64748B', fontSize: 13 }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>🎯</div>
        <div style={{ fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>No Entity Selected</div>
        <div style={{ fontSize: 11, lineHeight: 1.4 }}>
          Click on any node, actor, class, or edge on the canvas to inspect and edit its ontological properties.
        </div>
      </div>
    );
  }

  const isNode = selection.type === 'node';
  const node = selection.nodeData;
  const edge = selection.edgeData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, userSelect: 'none' }}>
      {/* Title & Type Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>
          {isNode ? 'Node Properties' : 'Edge Properties'}
        </span>
        <span
          style={{
            padding: '2px 8px',
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 4,
            background: isNode ? '#2563EB20' : '#10B98120',
            color: isNode ? '#38BDF8' : '#34D399',
          }}
        >
          {isNode ? node?.kind?.toUpperCase() ?? 'NODE' : edge?.kind?.toUpperCase() ?? 'EDGE'}
        </span>
      </div>

      {/* ID Field (Read-only reference) */}
      <div>
        <label style={labelStyle}>Entity Identifier (ID)</label>
        <input
          type="text"
          value={selection.id}
          readOnly
          style={{ ...inputStyle, background: '#1E293B', color: '#94A3B8', cursor: 'not-allowed' }}
        />
      </div>

      {isNode && node && (
        <>
          {/* Display Name / Label */}
          <div>
            <label style={labelStyle}>Display Name / Label</label>
            <input
              type="text"
              value={node.displayName ?? ''}
              onChange={(e) => onUpdateNode(selection.id, { displayName: e.target.value })}
              style={inputStyle}
              placeholder="e.g. Sign Contract"
            />
          </div>

          {/* Archetype Kind */}
          <div>
            <label style={labelStyle}>Ontological Archetype</label>
            <select
              value={node.kind ?? 'act'}
              onChange={(e) => onUpdateNode(selection.id, { kind: e.target.value as AimOntologyKind })}
              style={selectStyle}
            >
              <option value="per">Actor / Person (aim-per)</option>
              <option value="uc">UseCase (aim-uc)</option>
              <option value="act">Activity (aim-act)</option>
              <option value="cls">Class (aim-cls)</option>
              <option value="obj">Object / Instance (aim-obj)</option>
            </select>
          </div>

          {/* Stereotype */}
          <div>
            <label style={labelStyle}>Stereotype Annotation</label>
            <input
              type="text"
              value={node.stereotype ?? ''}
              onChange={(e) => onUpdateNode(selection.id, { stereotype: e.target.value })}
              style={inputStyle}
              placeholder="e.g. «initiates», «entity»"
            />
          </div>

          {/* Class Attributes & Methods */}
          {node.kind === 'cls' && (
            <>
              <div>
                <label style={labelStyle}>Attributes (1 per line)</label>
                <textarea
                  rows={3}
                  value={node.attributes?.join('\n') ?? ''}
                  onChange={(e) =>
                    onUpdateNode(selection.id, {
                      attributes: e.target.value.split('\n').filter((l) => l.trim().length > 0),
                    })
                  }
                  style={textareaStyle}
                  placeholder="+ id: string&#10;+ state: string"
                />
              </div>

              <div>
                <label style={labelStyle}>Methods (1 per line)</label>
                <textarea
                  rows={3}
                  value={node.methods?.join('\n') ?? ''}
                  onChange={(e) =>
                    onUpdateNode(selection.id, {
                      methods: e.target.value.split('\n').filter((l) => l.trim().length > 0),
                    })
                  }
                  style={textareaStyle}
                  placeholder="+ execute(): void&#10;+ cancel(): void"
                />
              </div>
            </>
          )}

          {/* Node Dimensions */}
          {node.bounds && (
            <div>
              <label style={labelStyle}>Geometry (Width × Height)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input
                  type="number"
                  value={node.bounds.width}
                  onChange={(e) =>
                    onUpdateNode(selection.id, {
                      bounds: { ...node.bounds!, width: parseInt(e.target.value, 10) || 100 },
                    })
                  }
                  style={inputStyle}
                  title="Width"
                />
                <input
                  type="number"
                  value={node.bounds.height}
                  onChange={(e) =>
                    onUpdateNode(selection.id, {
                      bounds: { ...node.bounds!, height: parseInt(e.target.value, 10) || 60 },
                    })
                  }
                  style={inputStyle}
                  title="Height"
                />
              </div>
            </div>
          )}
        </>
      )}

      {!isNode && edge && (
        <>
          {/* Relationship Kind */}
          <div>
            <label style={labelStyle}>Relationship Kind</label>
            <select
              value={edge.kind ?? 'association'}
              onChange={(e) => onUpdateEdge(selection.id, { kind: e.target.value as AimEdgeKind })}
              style={selectStyle}
            >
              <option value="association">Association (aim-edge)</option>
              <option value="dependency">Dependency (dashed)</option>
              <option value="generalization">Generalization (inheritance)</option>
              <option value="composition">Composition (filled diamond)</option>
              <option value="aggregation">Aggregation (hollow diamond)</option>
            </select>
          </div>

          {/* Edge Label / Stereotype */}
          <div>
            <label style={labelStyle}>Edge Label / Stereotype</label>
            <input
              type="text"
              value={edge.label ?? edge.stereotype ?? ''}
              onChange={(e) =>
                onUpdateEdge(selection.id, {
                  label: e.target.value,
                  stereotype: e.target.value,
                })
              }
              style={inputStyle}
              placeholder="e.g. «includes», «extends», «owns»"
            />

            {/* Quick-Pick Stereotype Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              <button
                type="button"
                onClick={() =>
                  onUpdateEdge(selection.id, {
                    label: '«initiates»',
                    stereotype: '«initiates»',
                    sourceCardinality: '1',
                  })
                }
                style={chipStyle}
                title="Actor initiates UseCase"
              >
                «initiates»
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateEdge(selection.id, {
                    label: '«owns»',
                    stereotype: '«owns»',
                    targetCardinality: '0..1',
                  })
                }
                style={chipStyle}
                title="Ownership cardinality 0..1"
              >
                «owns» (0..1)
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateEdge(selection.id, {
                    label: '«participates»',
                    stereotype: '«participates»',
                    targetCardinality: '0..*',
                  })
                }
                style={chipStyle}
                title="Participation cardinality 0..*"
              >
                «participates» (0..*)
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateEdge(selection.id, {
                    label: '«includes»',
                    stereotype: '«includes»',
                    kind: 'dependency',
                  })
                }
                style={chipStyle}
                title="UseCase inclusion"
              >
                «includes»
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateEdge(selection.id, {
                    label: '«extends»',
                    stereotype: '«extends»',
                    kind: 'dependency',
                  })
                }
                style={chipStyle}
                title="UseCase extension"
              >
                «extends»
              </button>
            </div>
          </div>

          {/* Cardinality Specifications */}
          <div>
            <label style={labelStyle}>Cardinality Multiplicity (Source → Target)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <span style={{ fontSize: 10, color: '#64748B', display: 'block', marginBottom: 2 }}>
                  Source (e.g. 1, 0..1)
                </span>
                <input
                  type="text"
                  value={edge.sourceCardinality ?? ''}
                  onChange={(e) => onUpdateEdge(selection.id, { sourceCardinality: e.target.value })}
                  style={inputStyle}
                  placeholder="Source"
                />
              </div>
              <div>
                <span style={{ fontSize: 10, color: '#64748B', display: 'block', marginBottom: 2 }}>
                  Target (e.g. 0..1, 0..*)
                </span>
                <input
                  type="text"
                  value={edge.targetCardinality ?? ''}
                  onChange={(e) => onUpdateEdge(selection.id, { targetCardinality: e.target.value })}
                  style={inputStyle}
                  placeholder="Target"
                />
              </div>
            </div>
          </div>

          {/* Edge Routing Style */}
          <div>
            <label style={labelStyle}>Routing Style</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
              <button
                type="button"
                onClick={() => onUpdateEdge(selection.id, { routing: 'manhattan' })}
                style={{
                  ...chipStyle,
                  textAlign: 'center',
                  background: (edge.routing ?? 'manhattan') === 'manhattan' ? '#2563EB30' : '#1E293B',
                  borderColor: (edge.routing ?? 'manhattan') === 'manhattan' ? '#38BDF8' : '#334155',
                  color: (edge.routing ?? 'manhattan') === 'manhattan' ? '#38BDF8' : '#94A3B8',
                  fontWeight: (edge.routing ?? 'manhattan') === 'manhattan' ? 700 : 500,
                }}
              >
                ⮡ Manhattan
              </button>
              <button
                type="button"
                onClick={() => onUpdateEdge(selection.id, { routing: 'normal' })}
                style={{
                  ...chipStyle,
                  textAlign: 'center',
                  background: edge.routing === 'normal' ? '#2563EB30' : '#1E293B',
                  borderColor: edge.routing === 'normal' ? '#38BDF8' : '#334155',
                  color: edge.routing === 'normal' ? '#38BDF8' : '#94A3B8',
                  fontWeight: edge.routing === 'normal' ? 700 : 500,
                }}
              >
                ╲ Straight
              </button>
              <button
                type="button"
                onClick={() => onUpdateEdge(selection.id, { routing: 'smooth' })}
                style={{
                  ...chipStyle,
                  textAlign: 'center',
                  background: edge.routing === 'smooth' ? '#2563EB30' : '#1E293B',
                  borderColor: edge.routing === 'smooth' ? '#38BDF8' : '#334155',
                  color: edge.routing === 'smooth' ? '#38BDF8' : '#94A3B8',
                  fontWeight: edge.routing === 'smooth' ? 700 : 500,
                }}
              >
                ∿ Curved
              </button>
            </div>
          </div>

          {/* Connection Ports (Origin & Destination) */}
          <div>
            <label style={labelStyle}>Origin Connector Port</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
              {[
                { id: 'port-top', label: 'Top' },
                { id: 'port-right', label: 'Right' },
                { id: 'port-bottom', label: 'Bottom' },
                { id: 'port-left', label: 'Left' },
              ].map((p) => {
                const active = edge.sourcePort === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onUpdateEdge(selection.id, { sourcePort: p.id })}
                    style={{
                      ...chipStyle,
                      textAlign: 'center',
                      background: active ? '#10B98130' : '#1E293B',
                      borderColor: active ? '#34D399' : '#334155',
                      color: active ? '#34D399' : '#94A3B8',
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Destination Connector Port</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
              {[
                { id: 'port-top', label: 'Top' },
                { id: 'port-right', label: 'Right' },
                { id: 'port-bottom', label: 'Bottom' },
                { id: 'port-left', label: 'Left' },
              ].map((p) => {
                const active = edge.targetPort === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onUpdateEdge(selection.id, { targetPort: p.id })}
                    style={{
                      ...chipStyle,
                      textAlign: 'center',
                      background: active ? '#10B98130' : '#1E293B',
                      borderColor: active ? '#34D399' : '#334155',
                      color: active ? '#34D399' : '#94A3B8',
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Terminals Info */}
          <div style={{ background: '#1E293B', padding: '8px 12px', borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
              <span><strong>Origin:</strong> {edge.sourceId ?? 'None'} {edge.sourcePort ? `(${edge.sourcePort.replace('port-', '')})` : ''}</span>
              {edge.sourceCardinality && <span style={{ color: '#38BDF8', fontWeight: 600 }}>[{edge.sourceCardinality}]</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8' }}>
              <span><strong>Destination:</strong> {edge.targetId ?? 'None'} {edge.targetPort ? `(${edge.targetPort.replace('port-', '')})` : ''}</span>
              {edge.targetCardinality && <span style={{ color: '#38BDF8', fontWeight: 600 }}>[{edge.targetCardinality}]</span>}
            </div>
          </div>
        </>
      )}

      {/* Delete Action Button */}
      <button
        type="button"
        onClick={onDeleteSelected}
        style={{
          marginTop: 8,
          padding: '8px 12px',
          background: '#EF444418',
          border: '1px solid #EF4444',
          borderRadius: 6,
          color: '#F87171',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background 0.15s ease',
        }}
      >
        🗑 Delete {isNode ? 'Node' : 'Edge'}
      </button>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: '#94A3B8',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  fontSize: 12,
  fontFamily: 'Inter, system-ui, sans-serif',
  background: '#0F172A',
  border: '1px solid #334155',
  borderRadius: 6,
  color: '#F8FAFC',
  boxSizing: 'border-box',
  outline: 'none',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  fontFamily: '"JetBrains Mono", Consolas, monospace',
  fontSize: 11,
  resize: 'vertical',
};

const chipStyle: React.CSSProperties = {
  padding: '2px 8px',
  fontSize: 10,
  fontWeight: 600,
  borderRadius: 4,
  border: '1px solid #334155',
  background: '#1E293B',
  color: '#38BDF8',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};
