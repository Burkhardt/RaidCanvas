import React from 'react';
import type { AimRoutingMode } from './types.js';

export interface RaidCanvasToolbarProps {
  /** Application-owned projection controls and status, docked in the same row. */
  start?: React.ReactNode;
  end?: React.ReactNode;
  routing: AimRoutingMode | 'mixed';
  readOnly?: boolean;
  showExpressions?: boolean;
  onShowExpressionsChange?: (visible: boolean) => void;
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
export function RaidCanvasToolbar({ start, end, routing, readOnly = false, showExpressions = true, onShowExpressionsChange, canUndo = false, canRedo = false, onRoutingChange, onUndo, onRedo, onZoomOut, onZoomIn, onFit, onCenter, className = '' }: RaidCanvasToolbarProps) {
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
      <div className="join shrink-0" role="group" aria-label="Edge routing">
        {([{ mode: 'manhattan', glyph: '⮡', label: 'Orthogonal' }, { mode: 'normal', glyph: '╲', label: 'Straight' }, { mode: 'smooth', glyph: '∿', label: 'Curved' }] as const).map(({mode,glyph,label}) => <button type="button" key={mode} className={`btn btn-xs btn-square join-item ${routing === mode ? 'btn-active' : 'btn-ghost'}`} title={label} aria-label={`${label} routing`} aria-pressed={routing === mode} disabled={readOnly} onClick={() => onRoutingChange(mode)}>{glyph}</button>)}
      </div>
      {onShowExpressionsChange && <button type="button" className={`btn btn-xs btn-square ${showExpressions ? 'btn-active' : 'btn-ghost'}`} aria-label="Show expressions" aria-pressed={showExpressions} title="Show expression capsules" disabled={readOnly} onClick={() => onShowExpressionsChange(!showExpressions)}>ƒ(x)</button>}
      {actions.map(({ name, glyph, action, disabled }) => <button type="button" key={name} className="btn btn-ghost btn-xs btn-square shrink-0" title={name} aria-label={name} onClick={action} disabled={disabled}>{glyph}</button>)}
    </div>
    {end && <div className="shrink-0">{end}</div>}
  </div>;
}
