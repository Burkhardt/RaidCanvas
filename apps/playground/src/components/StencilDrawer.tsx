import React, { useState } from 'react';
import {
  getPaletteItemsForArchetype,
  type RaidPaletteItem,
  type AimOntologyKind,
  type RaidNodeData,
} from '@dr2rai/raid-canvas';

export interface StencilItem {
  kind: AimOntologyKind;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  iconSvg: React.ReactNode;
}

export const AOAIM_STENCILS: StencilItem[] = [
  {
    kind: 'per',
    name: 'Actor / Person',
    badge: 'ACTOR',
    badgeColor: '#F59E0B',
    description: 'Initiating role or external persona interacting with system',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    kind: 'uc',
    name: 'UseCase',
    badge: 'USECASE',
    badgeColor: '#F59E0B',
    description: 'High-level functional boundary service or user goal',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
        <ellipse cx="12" cy="12" rx="10" ry="6" />
      </svg>
    ),
  },
  {
    kind: 'act',
    name: 'Activity',
    badge: 'PROCESS',
    badgeColor: '#EF4444',
    description: 'Discrete executable action step in an orchestrated workflow',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="5" width="18" height="14" rx="4" />
      </svg>
    ),
  },
  {
    kind: 'cls',
    name: 'Class',
    badge: 'STRUCTURE',
    badgeColor: '#475569',
    description: 'Domain schema with attributes and methods compartments',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
      </svg>
    ),
  },
  {
    kind: 'obj',
    name: 'Object',
    badge: 'INSTANCE',
    badgeColor: '#6366F1',
    description: 'Runtime instantiated entity card with underlined title',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
        <rect x="3" y="4" width="18" height="16" rx="2" strokeDasharray="3 2" />
        <line x1="7" y1="10" x2="17" y2="10" />
      </svg>
    ),
  },
  {
    kind: 'plc',
    name: 'Place / Venue',
    badge: 'WHERE',
    badgeColor: '#1F2937',
    description: 'Spatial venue or architectural stage anchoring the activity',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 12 18 C 8 13.8 5 10.6 5 7.5 A 7 7 0 1 1 19 7.5 C 19 10.6 16 13.8 12 18 Z" />
        <circle cx="12" cy="7.5" r="2.5" />
        <ellipse cx="12" cy="20.5" rx="6.5" ry="1.8" />
      </svg>
    ),
  },
  {
    kind: 'rol',
    name: 'Role',
    badge: 'KL-ONE',
    badgeColor: '#8B5CF6',
    description: 'Hollow circle: a typed role defined by its owner',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
        <circle cx="12" cy="12" r="7" />
      </svg>
    ),
  },
  {
    kind: 'rf',
    name: 'RoleFiller',
    badge: 'BINDING',
    badgeColor: '#2563EB',
    description: 'Filled circle: an object’s binding of a role to a filler',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="7" fill="#2563EB" />
      </svg>
    ),
  },
];

export interface BoundaryStencilItem {
  id: string;
  kind: 'Class' | 'Package';
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  iconSvg: React.ReactNode;
}

export const BOUNDARY_STENCILS: BoundaryStencilItem[] = [
  {
    id: 'boundary-class',
    kind: 'Class',
    name: 'Class Boundary',
    badge: 'CLASS BOX',
    badgeColor: '#C59B27',
    description: 'Resizable outer frame with inset badge for UseCases inside a class',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C59B27" strokeWidth="1.6">
        <rect x="2" y="2" width="20" height="20" rx="3" strokeDasharray="3 2" />
        <rect x="4" y="4" width="8" height="4" fill="#C59B2730" stroke="#C59B27" strokeWidth="0.8" rx="1" />
      </svg>
    ),
  },
  {
    id: 'boundary-package',
    kind: 'Package',
    name: 'Package Folder',
    badge: 'PACKAGE',
    badgeColor: '#1E293B',
    description: 'Canonical UML hanging folder notation with top-left protruding tab',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="1.6">
        <path d="M 2 7 L 10 7 L 12 9 L 22 9 L 22 21 L 2 21 Z" />
        <path d="M 2 9 L 22 9" />
      </svg>
    ),
  },
];

export interface StencilDrawerProps {
  archetype?: string;
  onAddNode: (kind: AimOntologyKind, customData?: Partial<RaidNodeData>) => void;
  onAddBoundary?: (kind: 'Class' | 'Package', name: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const StencilDrawer: React.FC<StencilDrawerProps> = ({
  onAddNode,
  onAddBoundary,
  archetype = '',
  collapsed,
  onToggleCollapse,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const items = getPaletteItemsForArchetype(archetype);

  const handleDragStart = (e: React.DragEvent, item: RaidPaletteItem) => {
    if (item.isBoundary) {
      e.dataTransfer.setData('application/aim-boundary', item.boundaryKind ?? 'Class');
      e.dataTransfer.setData('text/plain', item.boundaryKind ?? 'Class');
    } else if (item.kind) {
      e.dataTransfer.setData('application/aoaim-kind', item.kind);
      e.dataTransfer.setData('application/aim-stencil', item.kind);
      if (item.unbound) {
        e.dataTransfer.setData('application/aim-unbound', 'true');
      }
      if (item.customData) {
        e.dataTransfer.setData('application/aim-custom-data', JSON.stringify(item.customData));
      }
      e.dataTransfer.setData('text/plain', item.kind);
    }
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleClickItem = (item: RaidPaletteItem) => {
    if (item.isBoundary) {
      const defaultName = item.boundaryKind === 'Package' ? 'Namespace' : 'DomainClass';
      onAddBoundary?.(item.boundaryKind ?? 'Class', defaultName);
    } else if (item.kind) {
      const customData: Record<string, any> = { ...(item.customData ?? {}) };
      if (item.unbound) {
        customData.unbound = true;
        customData.displayName = `[${item.name.replace(/[\[\]]/g, '')}]`;
      }
      onAddNode(item.kind, customData as Partial<RaidNodeData>);
    }
  };

  if (collapsed) {
    return (
      <aside
        style={{
          width: 48,
          background: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 0',
          gap: 8,
          userSelect: 'none',
        }}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Expand Stencil Palette"
          style={iconBtnStyle}
        >
          ▶
        </button>
        <div style={{ width: 24, height: 1, background: '#E2E8F0', margin: '2px 0' }} />
        {items.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onClick={() => handleClickItem(item)}
            title={`${item.name} (${item.badge})\n${item.description}\nDrag or click to insert`}
            style={{
              cursor: 'grab',
              padding: 6,
              borderRadius: 6,
              transition: 'background 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F1F5F9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {item.iconSvg}
          </div>
        ))}
      </aside>
    );
  }

  return (
    <aside
      style={{
        width: 260,
        background: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        transition: 'width 0.2s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #F1F5F9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🧩</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
            AOAIM Palette
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Collapse Palette"
          style={iconBtnStyle}
        >
          ◀
        </button>
      </div>

      {/* Instructions */}
      <div
        style={{
          padding: '8px 16px',
          background: '#F8FAFC',
          borderBottom: '1px solid #F1F5F9',
          fontSize: 11,
          color: '#64748B',
          lineHeight: 1.4,
        }}
      >
        Drag any stencil onto the canvas or click <strong>+</strong> to instantiate.
      </div>

      {/* Stencils List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {items.map((item) => {
          const isHovered = hoveredId === item.id;
          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 8,
                border: `1px solid ${isHovered ? item.badgeColor : '#E2E8F0'}`,
                background: isHovered ? '#F8FAFC' : '#FFFFFF',
                boxShadow: isHovered
                  ? '0 4px 12px rgba(0, 0, 0, 0.05)'
                  : '0 1px 2px rgba(0, 0, 0, 0.02)',
                cursor: 'grab',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.iconSvg}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>
                      {item.name}
                    </span>
                    <span
                      style={{
                        padding: '1px 5px',
                        fontSize: 9,
                        fontWeight: 700,
                        borderRadius: 3,
                        background: `${item.badgeColor}15`,
                        color: item.badgeColor,
                      }}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, maxWidth: 140 }}>
                    {item.description}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClickItem(item);
                }}
                title={`Add ${item.name} to canvas`}
                style={{
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontSize: 14,
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'background 0.15s ease',
                }}
              >
                +
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

const iconBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  padding: 0,
  border: 'none',
  background: 'transparent',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 11,
  color: '#64748B',
};
