import React from 'react';
import type { DiagramPreset } from '../presets';

interface StudioToolbarProps {
  presets: DiagramPreset[];
  selectedPresetId: string;
  onSelectPreset: (id: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDeleteSelected: () => void;
  onClear: () => void;
  onCenter: () => void;
  onFit: () => void;
  onDownloadSvg: () => void;
  onExportPng: () => void;
  onCopySvg: () => void;
  copied: boolean;
  routingMode: 'manhattan' | 'normal' | 'smooth';
  onChangeRoutingMode: (mode: 'manhattan' | 'normal' | 'smooth') => void;
  readOnly: boolean;
  onToggleReadOnly: (val: boolean) => void;
}

export const StudioToolbar: React.FC<StudioToolbarProps> = ({
  presets,
  selectedPresetId,
  onSelectPreset,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDeleteSelected,
  onClear,
  onCenter,
  onFit,
  onDownloadSvg,
  onExportPng,
  onCopySvg,
  copied,
  routingMode,
  onChangeRoutingMode,
  readOnly,
  onToggleReadOnly,
}) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        userSelect: 'none',
      }}
    >
      {/* Left: Branding & Presets */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🎨</span>
          <div>
            <h1 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              RaidCanvas Studio
            </h1>
            <span style={{ fontSize: 10, color: '#64748B', fontWeight: 500 }}>
              AOAIM • Dynabook Visual Engine
            </span>
          </div>
        </div>

        <div style={{ width: 1, height: 24, background: '#E2E8F0' }} />

        {/* Preset Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label htmlFor="preset-select" style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}>
            Preset:
          </label>
          <select
            id="preset-select"
            value={selectedPresetId}
            onChange={(e) => onSelectPreset(e.target.value)}
            style={{
              padding: '4px 8px',
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 6,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center: Canvas History & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          style={{ ...btnStyle, opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'not-allowed' }}
        >
          ↶ Undo
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          style={{ ...btnStyle, opacity: canRedo ? 1 : 0.4, cursor: canRedo ? 'pointer' : 'not-allowed' }}
        >
          ↷ Redo
        </button>

        <div style={{ width: 1, height: 16, background: '#E2E8F0', margin: '0 4px' }} />

        <button
          type="button"
          onClick={onDeleteSelected}
          title="Delete Selected Entity (Del / Backspace)"
          style={btnStyle}
        >
          🗑 Delete
        </button>
        <button
          type="button"
          onClick={onClear}
          title="Clear Canvas"
          style={btnStyle}
        >
          🧹 Clear
        </button>

        <div style={{ width: 1, height: 16, background: '#E2E8F0', margin: '0 4px' }} />

        <button
          type="button"
          onClick={onCenter}
          title="Center Canvas View"
          style={btnStyle}
        >
          🎯 Center
        </button>
        <button
          type="button"
          onClick={onFit}
          title="Fit All Content into View"
          style={btnStyle}
        >
          ⛶ Fit
        </button>

        <div style={{ width: 1, height: 16, background: '#E2E8F0', margin: '0 4px' }} />

        {/* Routing Mode Switch */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#F1F5F9',
            padding: '2px',
            borderRadius: 6,
            border: '1px solid #E2E8F0',
            gap: 2,
          }}
        >
          <button
            type="button"
            onClick={() => onChangeRoutingMode('manhattan')}
            title="Manhattan Routing: Obstacle-avoiding 90° orthogonal bends"
            style={{
              ...routingBtnStyle,
              background: routingMode === 'manhattan' ? '#FFFFFF' : 'transparent',
              color: routingMode === 'manhattan' ? '#0F172A' : '#64748B',
              boxShadow: routingMode === 'manhattan' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              fontWeight: routingMode === 'manhattan' ? 700 : 500,
            }}
          >
            ⮡ Manhattan
          </button>
          <button
            type="button"
            onClick={() => onChangeRoutingMode('normal')}
            title="Straight Routing: Direct point-to-point lines"
            style={{
              ...routingBtnStyle,
              background: routingMode === 'normal' ? '#FFFFFF' : 'transparent',
              color: routingMode === 'normal' ? '#0F172A' : '#64748B',
              boxShadow: routingMode === 'normal' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              fontWeight: routingMode === 'normal' ? 700 : 500,
            }}
          >
            ╲ Straight
          </button>
          <button
            type="button"
            onClick={() => onChangeRoutingMode('smooth')}
            title="Curved Routing: Smooth cubic bezier splines"
            style={{
              ...routingBtnStyle,
              background: routingMode === 'smooth' ? '#FFFFFF' : 'transparent',
              color: routingMode === 'smooth' ? '#0F172A' : '#64748B',
              boxShadow: routingMode === 'smooth' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              fontWeight: routingMode === 'smooth' ? 700 : 500,
            }}
          >
            ∿ Curved
          </button>
        </div>
      </div>

      {/* Right: Export Suite & Modes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={onCopySvg}
          title="Copy SVG XML to Clipboard"
          style={{
            ...btnStyle,
            color: copied ? '#16A34A' : '#334155',
            borderColor: copied ? '#86EFAC' : '#E2E8F0',
            background: copied ? '#F0FDF4' : '#F8FAFC',
          }}
        >
          {copied ? '✓ Copied' : '📋 Copy SVG'}
        </button>

        <button
          type="button"
          onClick={onDownloadSvg}
          title="Download .svg Document"
          style={{ ...btnStyle, background: '#EFF6FF', color: '#2563EB', borderColor: '#BFDBFE' }}
        >
          ⬇ .SVG
        </button>

        <button
          type="button"
          onClick={onExportPng}
          title="Export high-resolution .png image"
          style={{ ...btnStyle, background: '#F0FDF4', color: '#16A34A', borderColor: '#BBF7D0' }}
        >
          🖼 .PNG
        </button>

        <div style={{ width: 1, height: 20, background: '#E2E8F0' }} />

        {/* Read-Only Toggle */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 500,
            color: '#475569',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={readOnly}
            onChange={(e) => onToggleReadOnly(e.target.checked)}
            style={{ cursor: 'pointer', accentColor: '#2563EB' }}
          />
          Read-Only
        </label>
      </div>
    </header>
  );
};

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '5px 10px',
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 6,
  border: '1px solid #E2E8F0',
  background: '#F8FAFC',
  color: '#334155',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const routingBtnStyle: React.CSSProperties = {
  border: 'none',
  padding: '4px 8px',
  fontSize: 11,
  borderRadius: 4,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};
