import React from 'react';
import type { AimRoutingMode } from './types.js';

export interface RaidCanvasToolbarProps {
  /** Application-owned projection controls and status, docked in the same row. */
  start?: React.ReactNode;
  end?: React.ReactNode;
  routing: AimRoutingMode | 'mixed';
  readOnly?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onRoutingChange: (mode: AimRoutingMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFit: () => void;
  onCenter: () => void;
  className?: string;
}

/** DaisyUI single-row controls; usable above or independently of RaidCanvas. */
export function RaidCanvasToolbar({ start, end, routing, readOnly = false, canUndo = false, canRedo = false, onRoutingChange, onUndo, onRedo, onZoomOut, onZoomIn, onFit, onCenter, className = '' }: RaidCanvasToolbarProps) {
  const actions = [
    { name: 'Undo', glyph: '↶', action: onUndo, disabled: readOnly || !canUndo },
    { name: 'Redo', glyph: '↷', action: onRedo, disabled: readOnly || !canRedo },
    { name: 'Zoom out', glyph: '−', action: onZoomOut },
    { name: 'Zoom in', glyph: '+', action: onZoomIn },
    { name: 'Fit view', glyph: '⛶', action: onFit },
    { name: 'Center', glyph: '◎', action: onCenter },
  ];
  return <div className={`raid-ui raid-canvas-controls flex min-h-11 shrink-0 items-center gap-2 overflow-x-auto border-b border-base-300 bg-base-100 px-2 py-1 ${className}`} role="toolbar" aria-label="Canvas tools">
    {start && <div className="shrink-0">{start}</div>}
    <div className="flex flex-1 items-center justify-center gap-1">
      <select className="select select-xs w-24 shrink-0" aria-label="Edge routing" disabled={readOnly} value={routing} onChange={event => onRoutingChange(event.target.value as AimRoutingMode)}>
        {routing === 'mixed' && <option value="mixed" disabled>Mixed</option>}
        <option value="manhattan">Orthogonal</option><option value="normal">Straight</option><option value="smooth">Curved</option>
      </select>
      {actions.map(({ name, glyph, action, disabled }) => <button type="button" key={name} className="btn btn-ghost btn-xs btn-square shrink-0" title={name} aria-label={name} onClick={action} disabled={disabled}>{glyph}</button>)}
    </div>
    {end && <div className="shrink-0">{end}</div>}
  </div>;
}
