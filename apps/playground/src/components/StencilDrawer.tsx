import React, { useState } from 'react';
import type { AimOntologyKind } from '@dr2rai/raid-canvas';

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
    badgeColor: '#2563EB',
    description: 'High-level functional boundary service or user goal',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
        <ellipse cx="12" cy="12" rx="10" ry="6" />
      </svg>
    ),
  },
  {
    kind: 'act',
    name: 'Activity',
    badge: 'PROCESS',
    badgeColor: '#10B981',
    description: 'Discrete executable action step in an orchestrated workflow',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round">
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
];

interface StencilDrawerProps {
  onAddNode: (kind: AimOntologyKind) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const StencilDrawer: React.FC<StencilDrawerProps> = ({
  onAddNode,
  collapsed,
  onToggleCollapse,
}) => {
  const [hoveredKind, setHoveredKind] = useState<AimOntologyKind | null>(null);

  const handleDragStart = (e: React.DragEvent, kind: AimOntologyKind) => {
    e.dataTransfer.setData('application/aoaim-kind', kind);
    e.dataTransfer.setData('text/plain', kind);
    e.dataTransfer.effectAllowed = 'copy';
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
          gap: 12,
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
        <div style={{ width: 24, height: 1, background: '#E2E8F0' }} />
        {AOAIM_STENCILS.map((s) => (
          <div
            key={s.kind}
            draggable
            onDragStart={(e) => handleDragStart(e, s.kind)}
            onClick={() => onAddNode(s.kind)}
            title={`Drag or click to add ${s.name}`}
            style={{
              cursor: 'grab',
              padding: 6,
              borderRadius: 6,
              transition: 'background 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {s.iconSvg}
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
        {AOAIM_STENCILS.map((s) => {
          const isHovered = hoveredKind === s.kind;
          return (
            <div
              key={s.kind}
              draggable
              onDragStart={(e) => handleDragStart(e, s.kind)}
              onMouseEnter={() => setHoveredKind(s.kind)}
              onMouseLeave={() => setHoveredKind(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 8,
                border: `1px solid ${isHovered ? s.badgeColor : '#E2E8F0'}`,
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
                  {s.iconSvg}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>
                      {s.name}
                    </span>
                    <span
                      style={{
                        padding: '1px 5px',
                        fontSize: 9,
                        fontWeight: 700,
                        borderRadius: 3,
                        background: `${s.badgeColor}15`,
                        color: s.badgeColor,
                      }}
                    >
                      {s.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, maxWidth: 140 }}>
                    {s.description}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddNode(s.kind);
                }}
                title={`Add ${s.name} to canvas`}
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
