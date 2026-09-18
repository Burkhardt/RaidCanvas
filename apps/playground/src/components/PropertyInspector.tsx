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
  onAwakenDuality?: (id: string) => void;
  onNavigatePortal?: (href: string) => void;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  selection,
  onUpdateNode,
  onUpdateEdge,
  onDeleteSelected,
  onAwakenDuality,
  onNavigatePortal,
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
          {isNode ? (node?.kind === 'rf' ? 'RoleFiller' : node?.kind === 'rol' ? 'Role' : 'Node Properties') : 'Edge Properties'}
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
          {isNode ? node?.kind?.toUpperCase() ?? 'NODE' : edge?.directed === false ? 'AIM-EDGE' : 'AIM-ARROW'}
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
              <option value="plc">Place / Stage (aim-plc)</option>
              <option value="rol">Role (hollow circle)</option>
              <option value="rf">RoleFiller (filled circle)</option>
            </select>
          </div>

          {node.kind !== 'rol' && node.kind !== 'rf' && <>
          {/* Ontological Deep Link & Portuguese Bicolor Heraldic Duality (CR033) */}
          <div style={{ padding: '10px 12px', background: node.href ? '#064E3B20' : '#1E293B60', border: `1px solid ${node.href ? '#10B98150' : '#334155'}`, borderRadius: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Ontological Deep Link (aim-href)</label>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 3,
                  background: node.href ? '#10B98130' : '#47556940',
                  color: node.href ? '#34D399' : '#94A3B8',
                }}
              >
                {node.href ? '🟢 DUALITY ACTIVE' : '⚪ MONOLITHIC'}
              </span>
            </div>

            <input
              type="text"
              value={node.href ?? ''}
              onChange={(e) => onUpdateNode(selection.id, { href: e.target.value })}
              style={inputStyle}
              placeholder="e.g. /actors?select=7010 or /activities?activity=123"
            />

            {node.href && node.href.trim().length > 0 ? (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 10, color: '#A7F3D0', lineHeight: 1.4, marginBottom: 8 }}>
                  <strong>Dynabook 2-Tap Model:</strong><br />
                  • <em>Tap 1:</em> Awakens Duality (Gold Seam &amp; Green Door).<br />
                  • <em>Tap 2 (Left):</em> Inspects persona without leaving.<br />
                  • <em>Tap 2 (Right / ›):</em> Steps through portal door.
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => onAwakenDuality?.(selection.id)}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      fontSize: 10,
                      fontWeight: 600,
                      background: '#F59E0B25',
                      color: '#FBBF24',
                      border: '1px solid #F59E0B60',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    ⚡ Awaken Duality
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigatePortal?.(node.href!)}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      fontSize: 10,
                      fontWeight: 600,
                      background: '#10B98130',
                      color: '#6EE7B7',
                      border: '1px solid #10B98160',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    🚪 Step Through
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 10, color: '#94A3B8', lineHeight: 1.3, marginBottom: 6 }}>
                  Entity is currently monolithic (no underlying record link). Add an ontological address to awaken the Portuguese Bicolor Seam.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const defaultPaths: Record<string, string> = {
                      per: `/actors?select=${selection.id}`,
                      act: `/activities?activity=${selection.id}`,
                      uc: `/usecases?select=${selection.id}`,
                      plc: `/places?select=${selection.id}`,
                      rol: `/roles?select=${selection.id}`,
                      rf: `/rolefillers?select=${selection.id}`,
                      cls: `/classes?select=${selection.id}`,
                      obj: `/objects?select=${selection.id}`,
                    };
                    const generatedHref = defaultPaths[node.kind ?? 'act'] || `/entities?select=${selection.id}`;
                    onUpdateNode(selection.id, { href: generatedHref });
                    setTimeout(() => {
                      onAwakenDuality?.(selection.id);
                    }, 50);
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    background: '#10B98125',
                    color: '#34D399',
                    border: '1px solid #10B98150',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  ✨ Enable Heraldic Duality (Add Link)
                </button>
              </div>
            )}
          </div>

          {/* Stereotype (OTW & Vasco Ontology v1.3) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Stereotype Icon / Facet</label>
              <span style={{ fontSize: 10, color: '#94A3B8' }}>WWWA v1.3 / OTW</span>
            </div>
            <input
              type="text"
              value={Array.isArray(node.stereotype) ? node.stereotype.join(', ') : (node.stereotype ?? '')}
              onChange={(e) => onUpdateNode(selection.id, { stereotype: e.target.value })}
              style={inputStyle}
              placeholder="e.g. Stage, Venue, Bar, Headliner, AI, «initiates»"
            />
            {/* Quick-toggle preset badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {(() => {
                const rawStereo = node.stereotype;
                const stereoTokens: string[] = [];
                if (Array.isArray(rawStereo)) {
                  for (const s of rawStereo) {
                    if (typeof s === 'string') {
                      stereoTokens.push(...s.replace(/[«»"]/g, '').split(/[\s,]+/).filter(Boolean));
                    }
                  }
                } else if (typeof rawStereo === 'string') {
                  stereoTokens.push(...rawStereo.replace(/[«»"]/g, '').split(/[\s,]+/).filter(Boolean));
                }

                const hasInitiates = stereoTokens.some(
                  (t) => t.toLowerCase() === 'initiates' || t.toLowerCase() === 'initiator',
                );
                const DOMAIN_IDS = ['customer', 'headliner', 'ai', 'system', 'stage', 'venue', 'bar'];
                const currentDomainToken = stereoTokens.find((t) => DOMAIN_IDS.includes(t.toLowerCase()));
                const currentDomain = currentDomainToken?.toLowerCase();

                const badges = [
                  { id: 'Customer', label: '👑 Customer', desc: 'Customer with Crown on Head' },
                  { id: 'Headliner', label: '⭐ Headliner', desc: 'Artist Performer with Star on Chest' },
                  { id: 'AI', label: '🤖 AI', desc: 'Autonomous Machine Actor' },
                  { id: 'System', label: '🖥️ System', desc: 'System / Server Stack Actor' },
                  { id: 'Stage', label: '🎪 Stage', desc: 'Live Performance Stage' },
                  { id: 'Venue', label: '📍 Venue', desc: 'Cascais Location Pin' },
                  { id: 'Bar', label: '🍸 Bar', desc: 'Hospitality / Bar' },
                  { id: 'initiates', label: '⚡ Initiates', desc: 'Initiating Actor' },
                ];

                return badges.map((st) => {
                  const isInitiatesBadge = st.id.toLowerCase() === 'initiates';
                  const isActive = isInitiatesBadge
                    ? hasInitiates
                    : currentDomain === st.id.toLowerCase();

                  const handleBadgeClick = () => {
                    if (isInitiatesBadge) {
                      if (hasInitiates) {
                        const next = currentDomainToken ? currentDomainToken : '';
                        onUpdateNode(selection.id, { stereotype: next });
                      } else {
                        const next = currentDomainToken ? [currentDomainToken, 'initiates'] : 'initiates';
                        onUpdateNode(selection.id, { stereotype: next });
                      }
                    } else {
                      if (isActive) {
                        const next = hasInitiates ? 'initiates' : '';
                        onUpdateNode(selection.id, { stereotype: next });
                      } else {
                        const next = hasInitiates ? [st.id, 'initiates'] : st.id;
                        onUpdateNode(selection.id, { stereotype: next });
                      }
                    }
                  };

                  return (
                    <button
                      key={st.id}
                      type="button"
                      title={st.desc}
                      onClick={handleBadgeClick}
                      style={{
                        padding: '3px 8px',
                        fontSize: 10,
                        fontWeight: 600,
                        borderRadius: 4,
                        border: `1px solid ${isActive ? '#F59E0B' : '#334155'}`,
                        background: isActive ? '#F59E0B25' : '#1E293B',
                        color: isActive ? '#FBBF24' : '#94A3B8',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {st.label}
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          </>}
          {(node.kind === 'rol' || node.kind === 'rf') && <div style={{ color: '#CBD5E1', fontSize: 12, lineHeight: 1.8 }}>
            <strong>{node.kind === 'rol' ? 'Role definition' : 'Contextual role binding'}</strong>
            {(node.properties?.connections as string[] | undefined)?.map((line, i) => <div key={i}>{line}</div>)}
            {node.kind === 'rol' && <label>Visibility <select value={node.visibility ?? '+'} onChange={e => onUpdateNode(selection.id, { visibility: e.target.value as '+' | '-' })} style={inputStyle}><option value="+">+ public</option><option value="-">- private</option></select></label>}
          </div>}
          {node.kind === 'obj' && <div>
            <label style={labelStyle}>Description</label>
            <textarea rows={5} value={node.description ?? ''} onChange={e => onUpdateNode(selection.id, { description: e.target.value })} style={textareaStyle} />
            <label style={labelStyle}>Description width (32–50 characters)</label>
            <input type="number" min={32} max={50} value={node.descriptionWidth ?? 40} onChange={e => onUpdateNode(selection.id, { descriptionWidth: Math.max(32, Math.min(50, Number(e.target.value) || 40)) })} style={inputStyle} />
          </div>}
          {node.kind !== 'cls' && node.kind !== 'uc' && node.kind !== 'rol' && <label style={labelStyle}>
            <input type="checkbox" checked={node.instance === true || node.kind === 'obj' || node.kind === 'rf'} disabled={node.kind === 'obj' || node.kind === 'rf'} onChange={e => onUpdateNode(selection.id, { instance: e.target.checked })} /> Instance (underlined name)
          </label>}
          {/* Class Attributes & Methods */}
          {node.kind === 'cls' && (
            <>
              {node.roleAttributes?.length ? <div style={{ color: '#CBD5E1', fontSize: 12 }}><label style={labelStyle}>Roles (edit their hollow circles)</label>{node.roleAttributes.map(line => <div key={line}>{line}</div>)}</div> : null}
              <div>
                <label style={labelStyle}>Additional attributes (1 per line)</label>
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
              <option value="association">Association (aim-edge / aim-arrow)</option>
              <option value="dependency">Dependency (dashed)</option>
              <option value="generalization">Generalization (inheritance)</option>
              <option value="composition">Composition (filled diamond)</option>
              <option value="aggregation">Aggregation (hollow diamond)</option>
            </select>
          </div>

          {/* Edge Directionality Switch (aim-edge without arrow vs aim-arrow with classic arrowhead) */}
          <div>
            <label style={labelStyle}>Edge Directionality</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => onUpdateEdge(selection.id, { directed: false })}
                style={{
                  ...chipStyle,
                  justifyContent: 'center',
                  padding: '6px 10px',
                  fontWeight: edge.directed === false ? 700 : 400,
                  background: edge.directed === false ? '#2563EB25' : '#1E293B',
                  borderColor: edge.directed === false ? '#3B82F6' : '#334155',
                  color: edge.directed === false ? '#60A5FA' : '#94A3B8',
                }}
                title="Undirected line segment (aim-edge, no arrowhead) - used for Role owner bindings"
              >
                — Undirected (aim-edge)
              </button>
              <button
                type="button"
                onClick={() => onUpdateEdge(selection.id, { directed: true })}
                style={{
                  ...chipStyle,
                  justifyContent: 'center',
                  padding: '6px 10px',
                  fontWeight: edge.directed !== false ? 700 : 400,
                  background: edge.directed !== false ? '#10B98125' : '#1E293B',
                  borderColor: edge.directed !== false ? '#10B981' : '#334155',
                  color: edge.directed !== false ? '#34D399' : '#94A3B8',
                }}
                title="Directed arrow (aim-arrow, classic arrowhead) - used for flow and dependencies"
              >
                ➔ Directed (aim-arrow)
              </button>
            </div>
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

          {/* Bend Points (Vertices) Management */}
          {edge.bendPoints && edge.bendPoints.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>
                  Bend Points ({edge.bendPoints.length})
                </label>
                <button
                  type="button"
                  onClick={() => onUpdateEdge(selection.id, { bendPoints: [] })}
                  style={{
                    ...chipStyle,
                    fontSize: 11,
                    padding: '2px 8px',
                    color: '#F59E0B',
                    borderColor: '#F59E0B50',
                    background: '#F59E0B15',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  title="Remove all bend points and straighten the edge curve"
                >
                  ⟲ Reset All Points
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {edge.bendPoints.map((pt, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#1E293B',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      color: '#94A3B8',
                    }}
                  >
                    <span>
                      Point #{idx + 1}: <code style={{ color: '#38BDF8' }}>({pt.x}, {pt.y})</code>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextPoints = edge.bendPoints?.filter((_, i) => i !== idx) ?? [];
                        onUpdateEdge(selection.id, { bendPoints: nextPoints });
                      }}
                      style={{
                        background: '#EF444420',
                        border: '1px solid #EF444450',
                        color: '#F87171',
                        borderRadius: 3,
                        cursor: 'pointer',
                        fontSize: 11,
                        padding: '1px 6px',
                        fontWeight: 700,
                      }}
                      title={`Remove bend point #${idx + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connection Ports (Origin & Destination) */}
          <div>
            <label style={labelStyle}>Origin Connector Port</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
              {[
                { id: 'auto', label: 'Auto' },
                { id: 'port-top', label: 'Top' },
                { id: 'port-right', label: 'Right' },
                { id: 'port-bottom', label: 'Bottom' },
                { id: 'port-left', label: 'Left' },
              ].map((p) => {
                const active =
                  p.id === 'auto'
                    ? !edge.sourcePort || edge.sourcePort === 'auto' || edge.sourcePort === ''
                    : edge.sourcePort === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onUpdateEdge(selection.id, { sourcePort: p.id === 'auto' ? '' : p.id })}
                    style={{
                      ...chipStyle,
                      textAlign: 'center',
                      background: active ? '#10B98130' : '#1E293B',
                      borderColor: active ? '#34D399' : '#334155',
                      color: active ? '#34D399' : '#94A3B8',
                      fontWeight: active ? 700 : 500,
                    }}
                    title={p.id === 'auto' ? 'Auto: Unpinned terminal, dynamic center-aiming' : `Dock to ${p.label} port`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Destination Connector Port</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
              {[
                { id: 'auto', label: 'Auto' },
                { id: 'port-top', label: 'Top' },
                { id: 'port-right', label: 'Right' },
                { id: 'port-bottom', label: 'Bottom' },
                { id: 'port-left', label: 'Left' },
              ].map((p) => {
                const active =
                  p.id === 'auto'
                    ? !edge.targetPort || edge.targetPort === 'auto' || edge.targetPort === ''
                    : edge.targetPort === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onUpdateEdge(selection.id, { targetPort: p.id === 'auto' ? '' : p.id })}
                    style={{
                      ...chipStyle,
                      textAlign: 'center',
                      background: active ? '#10B98130' : '#1E293B',
                      borderColor: active ? '#34D399' : '#334155',
                      color: active ? '#34D399' : '#94A3B8',
                      fontWeight: active ? 700 : 500,
                    }}
                    title={p.id === 'auto' ? 'Auto: Unpinned terminal, dynamic center-aiming' : `Dock to ${p.label} port`}
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
              <span>
                <strong>Origin:</strong> {edge.sourceId ?? 'None'}{' '}
                {edge.sourcePort && edge.sourcePort !== 'auto' ? `(${edge.sourcePort.replace('port-', '')})` : '(Auto)'}
              </span>
              {edge.sourceCardinality && <span style={{ color: '#38BDF8', fontWeight: 600 }}>[{edge.sourceCardinality}]</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8' }}>
              <span>
                <strong>Destination:</strong> {edge.targetId ?? 'None'}{' '}
                {edge.targetPort && edge.targetPort !== 'auto' ? `(${edge.targetPort.replace('port-', '')})` : '(Auto)'}
              </span>
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
