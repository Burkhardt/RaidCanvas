/**
 * @file RaidInspector.tsx
 * @description Cascais Light Theme Property Inspector for AOAIM entities, boundaries,
 * edges, AST expressions, and Portuguese Bicolor Duality state.
 *
 * Honors Alan Kay's Dynabook vision of dynamic, malleable visual objects
 * and Rainer Burkhardt's C++ GrafObj graphical hierarchy contracts.
 */

import React, { useState } from 'react';
import type {
	AimOntologyKind,
	AimEdgeKind,
	AimRoutingMode,
	RaidNodeData,
	RaidEdgeData,
	RaidBoundaryData,
	SpeechActStatement,
} from './types.js';
import { STATEMENT_KEY_PATTERN } from './types.js';
import type { RaidWaypointSelection } from './RaidCanvas.js';
import { RaidPropertyTree } from './RaidPropertyTree.js';
import { computeExpressionPillColors } from './X6Shapes.js';
import { CascaisPalette, DualityWashStrength, HeraldicWash, withAlpha } from './CascaisTheme.js';
import { GENERIC_ROLE_LABEL } from './RaidPalette.js';
import { hasStereotype, resolveStereotype, type StereotypeId } from './StereotypeIcons.js';
import {
	STEREOTYPE_GLYPH_CATEGORIES,
	getStereotypeGlyphUrl,
	resolveStereotypeGlyph,
	resolveStereotypeGlyphs,
	splitStereotypeGlyphRefs,
	searchStereotypeGlyphs,
	type StereotypeGlyphCategory,
	type StereotypeGlyphEntry,
} from './StereotypeGlyphs.js';

/** Who / What / Where role categories, plus the uncommitted Generic Role. */
const ROLE_CATEGORIES: ReadonlyArray<{ kind: AimOntologyKind; label: string }> = [
	{ kind: 'per', label: 'Who' },
	{ kind: 'obj', label: 'What' },
	{ kind: 'plc', label: 'Where' },
	{ kind: 'rol', label: 'Generic' },
];

/** Archetypes that draw a CR053 pictogram (silhouette or badge). */
const GLYPH_KINDS: ReadonlySet<AimOntologyKind> = new Set(['uc', 'act', 'cls', 'obj', 'per', 'plc']);

export interface RaidInspectorSelection {
	id: string;
	type: 'node' | 'edge' | 'boundary';
	nodeData?: Partial<RaidNodeData>;
	edgeData?: Partial<RaidEdgeData>;
	boundaryData?: Partial<RaidBoundaryData>;
}

export interface RaidInspectorProps {
	/** Diagram archetype classification (e.g. 'OneUseCaseDiagram', 'OneActivityDiagram') */
	archetype?: string;
	/** Currently selected entity (node, edge, or boundary) */
	selection: RaidInspectorSelection | null;
	/** Callback to update properties of the selected node */
	onUpdateNode?: (id: string, updates: Partial<RaidNodeData>) => void;
	/** Callback to update properties of the selected edge */
	onUpdateEdge?: (id: string, updates: Partial<RaidEdgeData>) => void;
	/** Callback to update properties of the selected boundary */
	onUpdateBoundary?: (id: string, updates: Partial<RaidBoundaryData>) => void;
	/** Callback to delete the selected cell */
	onDeleteSelected?: () => void;
	/** Callback to awaken Duality Mode (gold seam & green door) on the selected node */
	onAwakenDuality?: (id: string) => void;
	/** Callback when stepping through a node's portal */
	onNavigatePortal?: (href: string) => void;
	/** Whether the inspector panel is pinned open */
	isPinned?: boolean;
	/** Toggle pinned state */
	onTogglePin?: () => void;
	/** Consumer actions, rendered beside the built-in Pin control. */
    headerActions?: React.ReactNode;
    /** Live vertex selection reported by RaidCanvas.onWaypointSelect. */
    waypoint?: RaidWaypointSelection | null;
    /** Visual editing callback independent of semantic property editing. */
    onUpdateWaypoints?: (edgeId: string, points: { x: number; y: number }[]) => void;
    showExpressions?: boolean;
    onShowExpressionsChange?: (visible: boolean) => void;
    /** Domain context before the standard property fields; the inspector owns layout/scrolling. */
    contextPanel?: React.ReactNode;
    /** Optional status/expression content after the standard inspector. */
    footer?: React.ReactNode;
    /** Gold typography for attributes projected in the active diagram. */
    projectedProperties?: readonly string[];
	/** Optional CSS class name */
	className?: string;
	/** Optional inline styles */
	style?: React.CSSProperties;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ProvenancePanel — Speech-Act Statement Cards (AIA v1.9.1, ExternalAcceptance.cs)
// ═══════════════════════════════════════════════════════════════════════════════

/** Channel-specific pill styling */
const CHANNEL_STYLES: Record<string, { bg: string; color: string; border: string }> = {
	AppleCalendar: { bg: CascaisPalette.EmeraldMist, color: CascaisPalette.EmeraldInk, border: CascaisPalette.EmeraldLine },
	WhatsApp:      { bg: CascaisPalette.EmeraldMist, color: CascaisPalette.EmeraldInk, border: CascaisPalette.EmeraldLine },
	Email:         { bg: '#F1F5F9', color: '#334155', border: '#CBD5E1' },
	Chat:          { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
};

/** Ingestor-specific pill styling */
const INGESTOR_STYLES: Record<string, { bg: string; color: string; border: string }> = {
	Umshadisi: { bg: '#F5F3FF', color: '#5B21B6', border: '#C4B5FD' },
	Cize:      { bg: '#FFF7ED', color: '#9A3412', border: '#FDBA74' },
	System:    { bg: '#F1F5F9', color: '#334155', border: '#CBD5E1' },
};

function formatStatementTimestamp(atUtc: string): string {
	try {
		const d = new Date(atUtc);
		if (isNaN(d.getTime())) return atUtc;
		return d.toLocaleString('en-US', {
			month: 'short', day: 'numeric',
			hour: '2-digit', minute: '2-digit',
			timeZone: 'UTC', timeZoneName: 'short',
		});
	} catch {
		return atUtc;
	}
}

const ProvenancePanel: React.FC<{
	properties?: Readonly<Record<string, unknown>>;
}> = ({ properties }) => {
	// Collect all s<timestamp> keys from properties
	const statements: Array<{ key: string; stamp: number; record: SpeechActStatement }> = [];
	if (properties) {
		for (const [key, value] of Object.entries(properties)) {
			if (STATEMENT_KEY_PATTERN.test(key) && value && typeof value === 'object') {
				const rec = value as SpeechActStatement;
				if (rec.AtUtc && rec.Actor && rec.RawMessage) {
					const stamp = parseInt(key.slice(1), 10) || Date.parse(rec.AtUtc) || 0;
					statements.push({ key, stamp, record: rec });
				}
			}
		}
	}

	// Sort descending by timestamp (newest first)
	statements.sort((a, b) => b.stamp - a.stamp);

	if (statements.length === 0) {
		return (
			<div style={{
				textAlign: 'center',
				padding: '32px 16px',
				color: '#9CA3AF',
				fontSize: 12,
				lineHeight: 1.5,
			}}>
				<div style={{ fontSize: 28, marginBottom: 8 }}>📜</div>
				<div style={{ fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>
					No Provenance Records
				</div>
				<div>
					No external speech-act statements recorded for this entity.
				</div>
			</div>
		);
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
			<div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
				{statements.length} Statement{statements.length !== 1 ? 's' : ''} (newest first)
			</div>
			{statements.map(({ key, record }) => {
				const defaultPill = { bg: '#F1F5F9', color: '#334155', border: '#CBD5E1' };
				const channelStyle = CHANNEL_STYLES[record.Channel] ?? defaultPill;
				const ingestorStyle = INGESTOR_STYLES[record.IngestedBy] ?? defaultPill;

				return (
					<div
						key={key}
						style={{
							background: '#FFFFFF',
							border: '1px solid #E5E7EB',
							borderRadius: 8,
							padding: '10px 12px',
							fontSize: 11,
						}}
					>
						{/* Header: Timestamp + Actor */}
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
							<span style={{ fontSize: 10, color: '#6B7280', fontFamily: 'ui-monospace, monospace' }}>
								{formatStatementTimestamp(record.AtUtc)}
							</span>
							<span style={{
								fontSize: 10,
								fontWeight: 700,
								padding: '1px 6px',
								borderRadius: 4,
								background: '#3B82F615',
								color: '#1D4ED8',
								border: '1px solid #93C5FD',
							}}>
								Actor: {record.Actor}
							</span>
						</div>

						{/* Metadata Badges: Channel + Ingestor */}
						<div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
							<span style={{
								fontSize: 9,
								fontWeight: 700,
								padding: '2px 6px',
								borderRadius: 4,
								background: channelStyle.bg,
								color: channelStyle.color,
								border: `1px solid ${channelStyle.border}`,
							}}>
								{record.Channel}
							</span>
							<span style={{
								fontSize: 9,
								fontWeight: 700,
								padding: '2px 6px',
								borderRadius: 4,
								background: ingestorStyle.bg,
								color: ingestorStyle.color,
								border: `1px solid ${ingestorStyle.border}`,
							}}>
								via {record.IngestedBy}
							</span>
						</div>

						{/* Body Quote: RawMessage */}
						<div style={{
							background: '#F9FAFB',
							borderLeft: '3px solid #D1D5DB',
							padding: '6px 10px',
							borderRadius: '0 4px 4px 0',
							fontSize: 11,
							color: '#374151',
							fontStyle: 'italic',
							lineHeight: 1.4,
						}}>
							{record.RawMessage}
						</div>

						{/* Statement ID footer */}
						<div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 4, fontFamily: 'ui-monospace, monospace' }}>
							{key}
						</div>
					</div>
				);
			})}
		</div>
	);
};

export const RaidInspector: React.FC<RaidInspectorProps> = ({
	archetype = '',
	selection,
	onUpdateNode,
	onUpdateEdge,
	onUpdateBoundary,
	onDeleteSelected,
	onAwakenDuality,
	onNavigatePortal,
	isPinned = false,
	onTogglePin,
    headerActions, contextPanel, footer, projectedProperties, waypoint, onUpdateWaypoints, showExpressions = true, onShowExpressionsChange,
	className,
	style,
}) => {
	const [requestedTab, setActiveTab] = useState<'properties' | 'ast' | 'provenance'>('properties');
    const properties = selection?.nodeData?.properties ?? (selection?.edgeData as { properties?: Record<string, unknown> } | undefined)?.properties ?? selection?.boundaryData?.properties;
    const hasProvenance = Object.entries(properties ?? {}).some(([key, value]) => STATEMENT_KEY_PATTERN.test(key) && value !== null && typeof value === 'object' && 'AtUtc' in value && !!value.AtUtc && 'Actor' in value && !!value.Actor && 'RawMessage' in value && !!value.RawMessage);
    const activeTab = (requestedTab === 'provenance' && !hasProvenance) || (requestedTab === 'ast' && selection?.type !== 'edge') ? 'properties' : requestedTab;
    const expressionSetting = onShowExpressionsChange && <label className="flex items-center justify-between gap-3 text-xs"><span>Show expressions</span><input className="checkbox checkbox-sm" type="checkbox" checked={showExpressions} onChange={event => onShowExpressionsChange(event.target.checked)}/></label>;

	if (!selection) {
		return (
			<aside
				className={`raid-ui card bg-base-100 text-base-content ${className ?? ''}`}
				style={{
					width: 320,
					background: '#F9F9F6',
					borderLeft: '1px solid #E5E5DF',
					display: 'flex',
					flexDirection: 'column',
					padding: '24px 16px',
					color: '#64748B',
					fontSize: 13,
					userSelect: 'none',
					boxSizing: 'border-box',
					overflowY: 'auto',
					...style,
				}}
			>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
					<span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
						Canvas settings
					</span>
					{onTogglePin && (
						<button className="btn btn-xs"
							type="button"
							onClick={onTogglePin}
							aria-label={isPinned ? 'Unpin Inspector' : 'Pin Inspector'} aria-pressed={isPinned}
                            title={isPinned ? 'Unpin Inspector' : 'Pin Inspector (keep open)'}
							style={{
								background: isPinned ? `${CascaisPalette.NetGoldStroke}20` : 'transparent',
								border: `1px solid ${isPinned ? CascaisPalette.NetGoldStroke : '#D1D5DB'}`,
								color: isPinned ? CascaisPalette.AmberDeep : '#6B7280',
								borderRadius: 4,
								padding: '2px 6px',
								cursor: 'pointer',
								fontSize: 12,
							}}
						>
							📌 {isPinned ? 'Pinned' : 'Dock'}
						</button>
					)}
				</div>
				{expressionSetting}
                <div style={{ textAlign: 'center', margin: 'auto 0', padding: '32px 8px' }}>
					<div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
					<div style={{ fontWeight: 600, color: '#334155', marginBottom: 4 }}>No Entity Selected</div>
					<div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
						Click on any actor, use case, boundary box, or connecting edge to inspect and modify its ontological attributes.
					</div>
				</div>
			</aside>
		);
	}

	const isNode = selection.type === 'node';
	const isEdge = selection.type === 'edge';
	const isBoundary = selection.type === 'boundary';
	const node = selection.nodeData;
	const edge = selection.edgeData;
	const boundary = selection.boundaryData;

	const getEntityTitle = () => {
		if (isBoundary) return `${boundary?.kind ?? 'Class'} Boundary`;
		if (isNode) {
			if (node?.kind === 'rf') return 'RoleFiller';
			if (node?.kind === 'rol') return GENERIC_ROLE_LABEL;
			if (node?.slot) return 'Role Slot';
			return 'Node Properties';
		}
		return 'Edge Properties';
	};

	const getBadge = () => {
		if (isBoundary) {
			return {
				text: (boundary?.kind ?? 'CLASS').toUpperCase(),
				bg: boundary?.kind === 'Package' ? '#1E293B15' : `${CascaisPalette.NetGoldStroke}20`,
				color: boundary?.kind === 'Package' ? '#1E293B' : CascaisPalette.AmberDeep,
			};
		}
		if (isNode) {
			return {
				text: (node?.kind ?? 'NODE').toUpperCase(),
				bg: '#3B82F615',
				color: '#2563EB',
			};
		}
		return {
			text: edge?.directed === false ? 'AIM-EDGE' : 'AIM-ARROW',
			bg: `${CascaisPalette.TelemetryGreen}15`,
			color: '#059669',
		};
	};

	const badge = getBadge();

	return (
		<aside
			className={`raid-ui card bg-base-100 text-base-content ${className ?? ''}`}
			style={{
				width: 320,
				background: '#F9F9F6',
				borderLeft: '1px solid #E5E5DF',
				display: 'flex',
				flexDirection: 'column',
				gap: 12,
				padding: '16px',
				color: '#1F2937',
				fontSize: 12,
				userSelect: 'none',
				boxSizing: 'border-box',
				overflowY: 'auto',
				fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
				...style,
			}}
		>
			{/* Top Bar: Title, Badge, and Pin Button */}
			<div className="raid-inspector-header flex shrink-0 items-center justify-between gap-2">
				<div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
					<span className="truncate text-xs font-bold" title={getEntityTitle()}>
						{getEntityTitle()}
					</span>
					<span
						style={{
							padding: '2px 6px',
							fontSize: 10,
							fontWeight: 700,
							borderRadius: 4,
							background: badge.bg,
							color: badge.color,
						}}
					>
						{badge.text}
					</span>
				</div>
                <div className="flex shrink-0 items-center gap-1">{headerActions}
				{onTogglePin && (
					<button className="btn btn-xs"
						type="button"
						onClick={onTogglePin}
						aria-label={isPinned ? 'Unpin Inspector' : 'Pin Inspector'} aria-pressed={isPinned}
                            title={isPinned ? 'Unpin Inspector' : 'Pin Inspector (keep open)'}
						style={{
							background: isPinned ? `${CascaisPalette.NetGoldStroke}20` : 'transparent',
							border: `1px solid ${isPinned ? CascaisPalette.NetGoldStroke : '#D1D5DB'}`,
							color: isPinned ? CascaisPalette.AmberDeep : '#6B7280',
							borderRadius: 4,
							padding: '2px 6px',
							cursor: 'pointer',
							fontSize: 11,
						}}
					>
						📌
					</button>
				)}
                </div>
			</div>

			{/* Tab Bar — shown for all entity types */}
			<div style={{ display: 'flex', borderBottom: '1px solid #E5E5DF', paddingBottom: 4, gap: 8 }}>
				<button className="btn btn-xs"
					type="button"
					onClick={() => setActiveTab('properties')}
					style={{
						background: 'none',
						border: 'none',
						padding: '4px 8px',
						fontSize: 11,
						fontWeight: activeTab === 'properties' ? 700 : 500,
						color: activeTab === 'properties' ? '#2563EB' : '#6B7280',
						borderBottom: activeTab === 'properties' ? '2px solid #2563EB' : 'none',
						cursor: 'pointer',
					}}
				>
					Properties
				</button>
				{isEdge && (
					<button className="btn btn-xs"
						type="button"
						onClick={() => setActiveTab('ast')}
						style={{
							background: 'none',
							border: 'none',
							padding: '4px 8px',
							fontSize: 11,
							fontWeight: activeTab === 'ast' ? 700 : 500,
							color: activeTab === 'ast' ? '#2563EB' : '#6B7280',
							borderBottom: activeTab === 'ast' ? '2px solid #2563EB' : 'none',
							cursor: 'pointer',
						}}
					>
						Expression
					</button>
				)}
				{hasProvenance && <button className="btn btn-xs"
					type="button"
					onClick={() => setActiveTab('provenance')}
					style={{
						background: 'none',
						border: 'none',
						padding: '4px 8px',
						fontSize: 11,
						fontWeight: activeTab === 'provenance' ? 700 : 500,
						color: activeTab === 'provenance' ? '#7C3AED' : '#6B7280',
						borderBottom: activeTab === 'provenance' ? '2px solid #7C3AED' : 'none',
						cursor: 'pointer',
					}}
				>
					Provenance
				</button>}
			</div>

            {activeTab === 'properties' && contextPanel}
            {isEdge && edge && activeTab === 'properties' && <section className="card border border-base-300 bg-base-100 p-3" aria-label="Bend points">
                <h3 className="text-sm font-bold">Bend points</h3>
                {waypoint?.edgeId === selection.id && edge.bendPoints?.[waypoint.index] && <div className="my-2 rounded-box bg-base-200 p-2">
                    <p className="text-xs">Waypoint P{waypoint.index + 1}: ({waypoint.x}, {waypoint.y})</p>
                    <button type="button" className="btn btn-sm btn-error mt-2 w-full" disabled={!onUpdateWaypoints && !onUpdateEdge} onClick={() => (onUpdateWaypoints ? onUpdateWaypoints(selection.id, edge.bendPoints!.filter((_, i) => i !== waypoint.index)) : onUpdateEdge?.(selection.id, { bendPoints: edge.bendPoints!.filter((_, i) => i !== waypoint.index) }))}>Delete Bend Point</button>
                </div>}
                {(edge.bendPoints?.length ?? 0) > 0 ? <>
                    <ul className="menu w-full p-0">{edge.bendPoints!.map((point, index) => <li key={index}><div className="flex justify-between gap-2"><span>P{index + 1}: ({point.x}, {point.y})</span><button type="button" className="btn btn-ghost btn-sm btn-square" aria-label={`Delete bend point P${index + 1}`} disabled={!onUpdateWaypoints && !onUpdateEdge} onClick={() => (onUpdateWaypoints ? onUpdateWaypoints(selection.id, edge.bendPoints!.filter((_, i) => i !== index)) : onUpdateEdge?.(selection.id, { bendPoints: edge.bendPoints!.filter((_, i) => i !== index) }))}>✕</button></div></li>)}</ul>
                    <button type="button" className="btn btn-sm btn-outline mt-2" disabled={!onUpdateWaypoints && !onUpdateEdge} onClick={() => (onUpdateWaypoints ? onUpdateWaypoints(selection.id, []) : onUpdateEdge?.(selection.id, { bendPoints: [] }))}>Clear All Bend Points</button>
                </> : <p className="text-xs text-base-content/60">Automatic routing (no manual bend points)</p>}
            </section>}

            {activeTab === 'properties' && !contextPanel && node?.properties && <RaidPropertyTree value={node.properties} {...(projectedProperties ? { projectedNames: projectedProperties } : {})}/>}
			{/* ═══ PROVENANCE TAB ═══ */}
			{activeTab === 'provenance' && (
				<ProvenancePanel
					properties={
						isNode ? node?.properties :
						isEdge ? (edge as any)?.properties :
						isBoundary ? boundary?.properties :
						undefined
					}
				/>
			)}

			{/* ═══ PROPERTIES / AST TABS ═══ */}
			{activeTab !== 'provenance' && (
			<>
			{/* Identifier */}
			<div>
				<label style={labelStyle}>Identifier (id)</label>
				<input className="input input-sm w-full"
					type="text"
					value={selection.id}
					readOnly
					style={{ ...inputStyle, background: '#EFEFEA', color: '#6B7280', cursor: 'not-allowed' }}
				/>
			</div>

			{/* BOUNDARY INSPECTION */}
			{isBoundary && boundary && (
				<>
					<div>
						<label style={labelStyle}>Boundary Type</label>
						<select className="select select-sm w-full"
							value={boundary.kind ?? 'Class'}
							onChange={(e) => onUpdateBoundary?.(selection.id, { kind: e.target.value as 'Class' | 'Package' })}
							style={selectStyle}
						>
							<option value="Class">Class Scope (aim-boundary-class, Inset Frame)</option>
							<option value="Package">Package Namespace (aim-boundary-package, Folder Tab)</option>
						</select>
					</div>

					<div>
						<label style={labelStyle}>Scope Name</label>
						<input className="input input-sm w-full"
							type="text"
							value={boundary.name ?? ''}
							onChange={(e) => onUpdateBoundary?.(selection.id, { name: e.target.value })}
							style={inputStyle}
							placeholder="e.g. Meeting or AIA Foundation"
						/>
					</div>

					<div>
						<label style={labelStyle}>Package Namespace (optional)</label>
						<input className="input input-sm w-full"
							type="text"
							value={boundary.package ?? ''}
							onChange={(e) => onUpdateBoundary?.(selection.id, { package: e.target.value })}
							style={inputStyle}
							placeholder="e.g. org.aia.core"
						/>
					</div>

					{/* Ontological Deep Link & Portuguese Bicolor Duality (Class Browser Portal) */}
					<div style={{ padding: '10px 12px', background: '#ECECE6', border: `1px solid ${boundary.href ? CascaisPalette.BandeiraVerde : '#DCDCD4'}`, borderRadius: 6 }}>
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
							<label style={{ ...labelStyle, marginBottom: 0 }}>Class Browser Link (aim-href)</label>
							<span
								style={{
									fontSize: 10,
									fontWeight: 700,
									padding: '1px 6px',
									borderRadius: 3,
									...dualityStatusStyle(Boolean(boundary.href)),
								}}
							>
								{boundary.href ? 'DUALITY ACTIVE' : 'MONOLITHIC'}
							</span>
						</div>

						<input className="input input-sm w-full"
							type="text"
							value={boundary.href ?? ''}
							onChange={(e) => onUpdateBoundary?.(selection.id, { href: e.target.value })}
							style={inputStyle}
							placeholder="e.g. /classes?select=Contract"
						/>

						{boundary.href && boundary.href.trim().length > 0 ? (
							<div style={{ marginTop: 8 }}>
								<div style={{ fontSize: 10, color: CascaisPalette.GraphiteMuted, lineHeight: 1.4, marginBottom: 8 }}>
									<strong>Dynabook 2-Tap Model:</strong><br />
									• <em>Tap 1:</em> Awakens Duality (Verde persona, Gold seam, Vermelho door).<br />
									• <em>Tap 2 (Left):</em> Inspects Class in Inspector.<br />
									• <em>Tap 2 (Right / ›):</em> Steps through to Class Browser.
								</div>
								<div style={{ display: 'flex', gap: 6 }}>
									<button className="btn btn-xs"
										type="button"
										onClick={() => onAwakenDuality?.(selection.id)}
										style={{
											flex: 1,
											padding: '5px 8px',
											fontSize: 10,
											fontWeight: 600,
											background: `${CascaisPalette.NetGold}25`,
											color: CascaisPalette.AmberDeep,
											border: `1px solid ${CascaisPalette.NetGold}60`,
											borderRadius: 4,
											cursor: 'pointer',
										}}
									>
										⚡ Awaken Duality
									</button>
									<button className="btn btn-xs"
										type="button"
										onClick={() => onNavigatePortal?.(boundary.href!)}
										style={{
											flex: 1,
											padding: '5px 8px',
											fontSize: 10,
											fontWeight: 600,
											...portalActionStyle,
											borderRadius: 4,
											cursor: 'pointer',
										}}
									>
										🚪 Class Browser
									</button>
								</div>
							</div>
						) : (
							<div style={{ marginTop: 8 }}>
								<button className="btn btn-xs"
									type="button"
									onClick={() => {
										const generatedHref = `/classes?select=${encodeURIComponent(boundary.name || boundary.id || 'Contract')}`;
										onUpdateBoundary?.(selection.id, { href: generatedHref });
										setTimeout(() => {
											onAwakenDuality?.(selection.id);
										}, 50);
									}}
									style={{
										width: '100%',
										padding: '6px 10px',
										fontSize: 11,
										fontWeight: 600,
										background: `${CascaisPalette.TelemetryGreen}20`,
										color: CascaisPalette.EmeraldDeep,
										border: `1px solid ${CascaisPalette.TelemetryGreen}50`,
										borderRadius: 4,
										cursor: 'pointer',
									}}
								>
									✨ Enable Class Duality
								</button>
							</div>
						)}
					</div>

					{/* Spatial Bounds */}
					<div style={{ background: '#ECECE6', padding: '10px 12px', borderRadius: 6, border: '1px solid #DCDCD4' }}>
						<div style={{ fontWeight: 600, color: '#374151', fontSize: 11, marginBottom: 8 }}>
							Spatial Geometry &amp; Bounds:
						</div>
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
							<div>
								<label style={{ ...labelStyle, fontSize: 10 }}>Width (px)</label>
								<input className="input input-sm w-full"
									type="number"
									value={boundary.bounds?.width ?? 320}
									onChange={(e) => onUpdateBoundary?.(selection.id, {
										bounds: { ...boundary.bounds!, width: Math.max(120, parseInt(e.target.value) || 120) }
									})}
									style={inputStyle}
								/>
							</div>
							<div>
								<label style={{ ...labelStyle, fontSize: 10 }}>Height (px)</label>
								<input className="input input-sm w-full"
									type="number"
									value={boundary.bounds?.height ?? 220}
									onChange={(e) => onUpdateBoundary?.(selection.id, {
										bounds: { ...boundary.bounds!, height: Math.max(80, parseInt(e.target.value) || 80) }
									})}
									style={inputStyle}
								/>
							</div>
							<div>
								<label style={{ ...labelStyle, fontSize: 10 }}>Position X</label>
								<input className="input input-sm w-full"
									type="number"
									value={boundary.bounds?.x ?? 0}
									onChange={(e) => onUpdateBoundary?.(selection.id, {
										bounds: { ...boundary.bounds!, x: parseInt(e.target.value) || 0 }
									})}
									style={inputStyle}
								/>
							</div>
							<div>
								<label style={{ ...labelStyle, fontSize: 10 }}>Position Y</label>
								<input className="input input-sm w-full"
									type="number"
									value={boundary.bounds?.y ?? 0}
									onChange={(e) => onUpdateBoundary?.(selection.id, {
										bounds: { ...boundary.bounds!, y: parseInt(e.target.value) || 0 }
									})}
									style={inputStyle}
								/>
							</div>
						</div>
					</div>

					{/* Enclosed Children List */}
					<div style={{ background: '#ECECE6', padding: '8px 10px', borderRadius: 6, border: '1px solid #DCDCD4' }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
							<span style={{ fontWeight: 600, color: '#374151' }}>Enclosed Entities:</span>
							<span style={{ fontWeight: 700, color: '#2563EB' }}>
								{boundary.elementIds?.length ?? 0}
							</span>
						</div>
						{boundary.elementIds && boundary.elementIds.length > 0 ? (
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
								{boundary.elementIds.map((childId) => (
									<span
										key={childId}
										style={{
											background: '#FFFFFF',
											padding: '2px 6px',
											borderRadius: 4,
											border: '1px solid #D1D5DB',
											fontSize: 10,
											color: '#4B5563',
										}}
									>
										{childId}
									</span>
								))}
							</div>
						) : (
							<div style={{ fontSize: 11, color: '#9CA3AF' }}>
								Drag use cases or objects inside this boundary to contain them.
							</div>
						)}
					</div>
				</>
			)}

			{/* NODE INSPECTION */}
			{isNode && node && (
				<>
					{/* Display Name */}
					<div>
						<label style={labelStyle}>Display Name / Label</label>
						<input className="input input-sm w-full"
							type="text"
							value={(node.displayName ?? '').replace(/<wbr\s*\/?>/gi, '')}
							onChange={(e) => onUpdateNode?.(selection.id, { displayName: e.target.value.replace(/<wbr\s*\/?>/gi, '') })}
							style={inputStyle}
							placeholder="e.g. Schedule Meeting"
						/>
					</div>

					{/* Archetype Kind */}
					<div>
						<label style={labelStyle}>Ontological Archetype</label>
						<select className="select select-sm w-full"
							value={node.kind ?? 'act'}
							onChange={(e) => onUpdateNode?.(selection.id, { kind: e.target.value as AimOntologyKind })}
							style={selectStyle}
						>
							<option value="per">Actor / Person (aim-per)</option>
							<option value="uc">UseCase (aim-uc)</option>
							<option value="act">Activity (aim-act)</option>
							<option value="cls">Class (aim-cls)</option>
							<option value="obj">Object / Instance (aim-obj)</option>
							<option value="plc">Place / Stage (aim-plc)</option>
							<option value="rol">{GENERIC_ROLE_LABEL} (hollow circle)</option>
							{/* A RoleFiller is the runtime binding of an instance to a role; shown here when the diagram draws it as a node. */}
							{node.kind === 'rf' && <option value="rf">RoleFiller (binding)</option>}
						</select>
					</div>

					{/* Role category (Who / What / Where): a slot keeps id, name and restriction */}
					{(node.slot || node.kind === 'rol') && (
						<div data-testid="role-category">
							<label style={labelStyle}>Role category</label>
							<div style={{ display: 'flex', gap: 4 }}>
								{ROLE_CATEGORIES.map((category) => {
									const isActive = node.kind === category.kind;
									return (
										<button className="btn btn-xs"
											key={category.kind}
											type="button"
											aria-pressed={isActive}
											onClick={() => {
												if (isActive) return;
												onUpdateNode?.(selection.id, { kind: category.kind, slot: category.kind !== 'rol' });
											}}
											style={{
												flex: 1,
												padding: '2px 6px',
												fontSize: 11,
												borderRadius: 4,
												border: isActive ? `1.5px solid ${CascaisPalette.NetGoldStroke}` : '1px solid #D1D5DB',
												background: isActive ? CascaisPalette.AmberMist : '#FFFFFF',
												color: isActive ? '#92400E' : '#374151',
												fontWeight: isActive ? 600 : 400,
												cursor: 'pointer',
											}}
										>
											{category.label}
										</button>
									);
								})}
							</div>
						</div>
					)}

					{/* Restriction: the expected Class of a role slot, shown as `: <Class>` */}
					{node.slot && (
						<div>
							<label style={labelStyle}>Restriction (expected Class)</label>
							<input className="input input-sm w-full"
								type="text"
								value={node.restriction ?? ''}
								onChange={(e) => onUpdateNode?.(selection.id, { restriction: e.target.value })}
								style={inputStyle}
								placeholder="e.g. Person, Document, Venue"
							/>
						</div>
					)}

					{/* Unbound Role Slot Toggle (Rule 2: No Coining) */}
					<div style={{ background: node.unbound ? CascaisPalette.AmberMist : '#ECECE6', border: `1px solid ${node.unbound ? CascaisPalette.NetGoldStroke : '#DCDCD4'}`, borderRadius: 6, padding: '8px 10px' }}>
						<label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
							<input className="checkbox checkbox-sm"
								type="checkbox"
								checked={Boolean(node.unbound)}
								onChange={(e) => onUpdateNode?.(selection.id, { unbound: e.target.checked })}
							/>
							<span style={{ fontWeight: 600, color: node.unbound ? '#92400E' : '#374151' }}>
								Unbound Role Slot [Slot]
							</span>
						</label>
						<div style={{ fontSize: 10, color: node.unbound ? CascaisPalette.AmberDeep : '#6B7280', marginTop: 4, lineHeight: 1.3 }}>
							Rule 2 (No Coining): Displays dashed perimeter, 70% opacity, and bracketed label awaiting runtime binding.
						</div>
					</div>

					{/* Ontological Deep Link & Portuguese Bicolor Heraldic Duality */}
					{node.kind !== 'rol' && node.kind !== 'rf' && (
						<div
							style={{
								padding: '10px 12px',
								background: '#ECECE6',
								border: `1px solid ${node.href ? CascaisPalette.BandeiraVerde : '#DCDCD4'}`,
								borderRadius: 6,
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
								<label style={{ ...labelStyle, marginBottom: 0 }}>Ontological Deep Link (aim-href)</label>
								<span
									style={{
										fontSize: 9,
										fontWeight: 700,
										padding: '1px 6px',
										borderRadius: 3,
										...dualityStatusStyle(Boolean(node.href)),
									}}
								>
									{node.href ? 'DUALITY ACTIVE' : 'MONOLITHIC'}
								</span>
							</div>

							<input className="input input-sm w-full"
								type="text"
								value={node.href ?? ''}
								onChange={(e) => onUpdateNode?.(selection.id, { href: e.target.value })}
								style={inputStyle}
								placeholder="e.g. /actors?select=7010"
							/>

							{node.href && node.href.trim().length > 0 ? (
								<div style={{ marginTop: 8 }}>
									<div style={{ display: 'flex', gap: 6 }}>
										<button className="btn btn-xs"
											type="button"
											onClick={() => onAwakenDuality?.(selection.id)}
											style={{
												flex: 1,
												padding: '4px 6px',
												fontSize: 10,
												fontWeight: 600,
												background: CascaisPalette.AmberMist,
												color: '#92400E',
												border: '1px solid #FCD34D',
												borderRadius: 4,
												cursor: 'pointer',
											}}
										>
											⚡ Awaken Duality
										</button>
										<button className="btn btn-xs"
											type="button"
											onClick={() => onNavigatePortal?.(node.href!)}
											style={{
												flex: 1,
												padding: '4px 6px',
												fontSize: 10,
												fontWeight: 600,
												...portalActionStyle,
												borderRadius: 4,
												cursor: 'pointer',
											}}
										>
											🚪 Step Through
										</button>
									</div>
								</div>
							) : null}
						</div>
					)}

					{/* Stereotype Icons */}
					<div>
						<label style={labelStyle}>Stereotype / Facet</label>
						{/* Distinct keys: these two are siblings, and sharing the node id left a stale field of the last node behind. */}
						<StereotypeListInput
							key={`list-${selection.id}`}
							stereotype={node.stereotype}
							glyph={node.stereotypeGlyph}
							onChange={(updates) => onUpdateNode?.(selection.id, updates)}
						/>
						{node.kind && GLYPH_KINDS.has(node.kind) && (
							<StereotypeGlyphPicker
								key={`glyphs-${selection.id}`}
								multiple
								glyph={node.stereotypeGlyph}
								onChange={(stereotypeGlyph) => onUpdateNode?.(selection.id, { stereotypeGlyph })}
							/>
						)}
						{/* Preset Quick Badges */}
						<div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
							{[
								{ id: 'Lead', label: '☸️ Lead', stereoId: 'lead' as StereotypeId },
								{ id: 'Customer', label: '👑 Customer', stereoId: 'customer' as StereotypeId },
								{ id: 'Headliner', label: '⭐ Headliner', stereoId: 'headliner' as StereotypeId },
								{ id: 'Observer', label: '👁️ Observer', stereoId: 'observer' as StereotypeId },
								{ id: 'AI', label: '🤖 AI', stereoId: 'ai' as StereotypeId },
								{ id: 'System', label: '🖥️ System', stereoId: 'system' as StereotypeId },
								{ id: 'Stage', label: '🎪 Stage', stereoId: 'stage' as StereotypeId },
								{ id: 'Venue', label: '📍 Venue', stereoId: 'venue' as StereotypeId },
								{ id: 'Bar', label: '🍸 Bar', stereoId: 'bar' as StereotypeId },
								{ id: 'initiates', label: '⚡ Initiates', stereoId: 'initiates' as StereotypeId },
							].map((st) => {
								const isActive = hasStereotype(node.stereotype, st.stereoId);
								return (
									<button className="btn btn-xs"
										key={st.id}
										type="button"
										onClick={() => {
											const raw = node.stereotype;
											const items = Array.isArray(raw)
												? raw.map(String)
												: (raw ? String(raw).split(/[,\s]+/).map((s) => s.trim()).filter(Boolean) : []);
											let next: string[];
											if (isActive) {
												next = items.filter((s) => {
													const cleaned = s.replace(/[«»"]/g, '').toLowerCase().trim();
													if (st.stereoId === 'lead') return !['lead', 'leader', 'helm', 'helmsman', 'rudder', 'captain'].includes(cleaned);
													if (st.stereoId === 'headliner') return !['headliner', 'artist', 'star'].includes(cleaned);
													if (st.stereoId === 'customer') return !['customer', 'client', 'buyer', 'patron'].includes(cleaned);
													if (st.stereoId === 'stage') return cleaned !== 'stage';
													if (st.stereoId === 'venue') return !['venue', 'place', 'pin'].includes(cleaned);
													if (st.stereoId === 'bar') return !['bar', 'hospitality'].includes(cleaned);
													if (st.stereoId === 'ai') return !['ai', 'agent', 'bot'].includes(cleaned);
													if (st.stereoId === 'system') return !['system', 'server', 'service', 'daemon', 'backend'].includes(cleaned);
													if (st.stereoId === 'initiates') return !['initiates', 'initiator'].includes(cleaned);
													return cleaned !== st.id.toLowerCase();
												});
											} else {
												next = [...items, st.id];
											}
											onUpdateNode?.(selection.id, { stereotype: next });
										}}
										style={{
											padding: '2px 8px',
											fontSize: 11,
											borderRadius: 4,
											border: isActive ? `1.5px solid ${CascaisPalette.NetGoldStroke}` : '1px solid #D1D5DB',
											background: isActive ? CascaisPalette.AmberMist : '#FFFFFF',
											color: isActive ? '#92400E' : '#374151',
											fontWeight: isActive ? 600 : 400,
											cursor: 'pointer',
											transition: 'all 0.15s ease',
										}}
									>
										{st.label}
									</button>
								);
							})}
						</div>
					</div>

					{/* Instance Underline */}
					{node.kind !== 'cls' && node.kind !== 'uc' && node.kind !== 'rol' && !node.slot && (
						<label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
							<input className="checkbox checkbox-sm"
								type="checkbox"
								checked={Boolean(node.instance)}
								onChange={(e) => onUpdateNode?.(selection.id, { instance: e.target.checked })}
							/>
							<span>Instance (underlined display name)</span>
						</label>
					)}

					{/* Activity Preconditions & Postconditions (OneActivity Diagram invariant; prohibited in OneUseCaseDiagram) */}
					{node.kind === 'act' && !archetype.toLowerCase().includes('usecase') && (
						<div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4, padding: '10px', background: '#ECECE6', borderRadius: 6, border: '1px solid #DCDCD4' }}>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
								<span style={{ fontSize: 11, fontWeight: 700, color: '#1F2937' }}>Activity Conditions</span>
								<span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: `${CascaisPalette.TelemetryGreen}20`, color: CascaisPalette.EmeraldDeep }}>ONE-ACTIVITY</span>
							</div>

							<div>
								<label style={{ ...labelStyle, fontSize: 10, color: '#374151' }}>Preconditions (1 per line)</label>
								<textarea className="textarea textarea-sm w-full"
									rows={2}
									value={
										Array.isArray(node.properties?.preconditions)
											? (node.properties?.preconditions as string[]).join('\n')
											: (typeof node.properties?.preconditions === 'string' ? node.properties.preconditions : '')
									}
									onChange={(e) => {
										const lines = e.target.value.split('\n').filter((l) => l.trim().length > 0);
										onUpdateNode?.(selection.id, {
											properties: { ...node.properties, preconditions: lines },
										});
									}}
									style={{ ...inputStyle, fontFamily: '"JetBrains Mono", monospace', fontSize: 11 }}
									placeholder="e.g. Customer != null&#10;Contract.State == Draft"
								/>
							</div>

							<div>
								<label style={{ ...labelStyle, fontSize: 10, color: '#374151' }}>Postconditions / DoD (1 per line)</label>
								<textarea className="textarea textarea-sm w-full"
									rows={2}
									value={
										Array.isArray(node.properties?.postconditions)
											? (node.properties?.postconditions as string[]).join('\n')
											: (typeof node.properties?.postconditions === 'string' ? node.properties.postconditions : '')
									}
									onChange={(e) => {
										const lines = e.target.value.split('\n').filter((l) => l.trim().length > 0);
										onUpdateNode?.(selection.id, {
											properties: { ...node.properties, postconditions: lines },
										});
									}}
									style={{ ...inputStyle, fontFamily: '"JetBrains Mono", monospace', fontSize: 11 }}
									placeholder="e.g. Contract.State == Closed"
								/>
							</div>
						</div>
					)}
				</>
			)}

			{/* EDGE INSPECTION */}
			{isEdge && edge && (
				<>
					{activeTab === 'properties' ? (
						<>
							<div>
								<label style={labelStyle}>Relationship Kind</label>
								<select className="select select-sm w-full"
									value={edge.kind ?? 'association'}
									onChange={(e) => onUpdateEdge?.(selection.id, { kind: e.target.value as AimEdgeKind })}
									style={selectStyle}
								>
									<option value="association">Association (aim-edge / aim-arrow)</option>
									<option value="dependency">Dependency (dashed)</option>
									<option value="generalization">Generalization (inheritance)</option>
									<option value="composition">Composition (filled diamond)</option>
									<option value="aggregation">Aggregation (hollow diamond)</option>
								</select>
							</div>

							<div>
								<label style={labelStyle}>Edge Directionality</label>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
									<button className="btn btn-xs"
										type="button"
										onClick={() => onUpdateEdge?.(selection.id, { directed: false })}
										style={{
											...buttonChoiceStyle,
											borderColor: edge.directed === false ? '#2563EB' : '#D1D5DB',
											background: edge.directed === false ? '#EFF6FF' : '#FFFFFF',
											color: edge.directed === false ? '#1D4ED8' : '#4B5563',
											fontWeight: edge.directed === false ? 700 : 500,
										}}
									>
										— Undirected
									</button>
									<button className="btn btn-xs"
										type="button"
										onClick={() => onUpdateEdge?.(selection.id, { directed: true })}
										style={{
											...buttonChoiceStyle,
											borderColor: edge.directed !== false ? CascaisPalette.TelemetryGreen : '#D1D5DB',
											background: edge.directed !== false ? CascaisPalette.EmeraldMist : '#FFFFFF',
											color: edge.directed !== false ? CascaisPalette.EmeraldInk : '#4B5563',
											fontWeight: edge.directed !== false ? 700 : 500,
										}}
									>
										➔ Directed
									</button>
								</div>
							</div>

							<div>
								<label style={labelStyle}>Edge Label / Stereotype</label>
								<input className="input input-sm w-full"
									type="text"
									value={(edge.label ?? edge.stereotype ?? '').replace(/<wbr\s*\/?>/gi, '')}
									onChange={(e) => onUpdateEdge?.(selection.id, { label: e.target.value.replace(/<wbr\s*\/?>/gi, ''), stereotype: e.target.value.replace(/<wbr\s*\/?>/gi, '') })}
									style={inputStyle}
									placeholder="e.g. «initiates», «owns», «participates»"
								/>
								{/* CR053: edges carry the pictogram only; the label above stays the operator's text. */}
								<StereotypeGlyphPicker
									key={selection.id}
									glyph={edge.stereotypeGlyph}
									onChange={(stereotypeGlyph) => onUpdateEdge?.(selection.id, { stereotypeGlyph })}
								/>
							</div>

							<div>
								<label style={labelStyle}>Routing Mode</label>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
									{(['manhattan', 'normal', 'smooth'] as AimRoutingMode[]).map((mode) => (
										<button className="btn btn-xs"
											key={mode}
											type="button"
											onClick={() => onUpdateEdge?.(selection.id, { routing: mode })}
											style={{
												...buttonChoiceStyle,
												borderColor: (edge.routing ?? 'manhattan') === mode ? '#2563EB' : '#D1D5DB',
												background: (edge.routing ?? 'manhattan') === mode ? '#EFF6FF' : '#FFFFFF',
												color: (edge.routing ?? 'manhattan') === mode ? '#1D4ED8' : '#4B5563',
												fontWeight: (edge.routing ?? 'manhattan') === mode ? 700 : 500,
												textTransform: 'capitalize',
											}}
										>
											{mode === 'manhattan' ? '⮡ Grid' : mode === 'normal' ? '╲ Direct' : '∿ Curved'}
										</button>
									))}
								</div>
							</div>
						</>
					) : (
						/* AST Expression Sub-Tab */
						<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
							<div>
								<label style={labelStyle}>Edge AST Infix Expression (aim-expression)</label>
								<input className="input input-sm w-full"
									type="text"
									value={edge.expression ?? ''}
									onChange={(e) => onUpdateEdge?.(selection.id, { expression: e.target.value })}
									style={{ ...inputStyle, fontFamily: '"JetBrains Mono", Consolas, monospace' }}
									placeholder='e.g. Host != null or Meeting.Status := "Scheduled"'
								/>
								<span style={{ fontSize: 10, color: '#6B7280', marginTop: 2, display: 'block' }}>
									Renders interactive capsule pill at edge midpoint.
								</span>
							</div>

							{/* Expression Capsule Color (Cascais Red, Green, Anthracite) */}
							<div>
								<label style={labelStyle}>Capsule Color (Casçais Palette)</label>
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
									{[
										{ id: 'green', label: '🟢 Green', color: CascaisPalette.TelemetryGreen, desc: `Cascais Green (${CascaisPalette.TelemetryGreen})` },
										{ id: 'red', label: '🔴 Red', color: CascaisPalette.CascaisRed, desc: `Cascais Red (${CascaisPalette.CascaisRed})` },
										{ id: 'anthracite', label: '⚫ Anthracite', color: '#1F2937', desc: 'Cascais Anthracite (#1F2937)' },
										{ id: 'auto', label: '⚪ Auto', color: '#64748B', desc: 'Follows Evaluation State' },
									].map((opt) => {
										const active = opt.id === 'auto'
											? !edge.expressionColor || edge.expressionColor === 'auto'
											: edge.expressionColor?.toLowerCase() === opt.id;
										return (
											<button className="btn btn-xs"
												key={opt.id}
												type="button"
												title={opt.desc}
												onClick={() => onUpdateEdge?.(selection.id, { expressionColor: opt.id === 'auto' ? undefined : opt.id })}
												style={{
													...buttonChoiceStyle,
													borderColor: active ? opt.color : '#D1D5DB',
													background: active ? `${opt.color}15` : '#FFFFFF',
													color: active ? opt.color : '#4B5563',
													fontWeight: active ? 700 : 500,
													fontSize: 10,
													padding: '4px 2px',
												}}
											>
												{opt.label}
											</button>
										);
									})}
								</div>
							</div>

							{/* Satisfied Evaluation State */}
							<div>
								<label style={labelStyle}>Live AST Evaluation State (aim-satisfied)</label>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
									<button className="btn btn-xs"
										type="button"
										onClick={() => onUpdateEdge?.(selection.id, { satisfied: true })}
										style={{
											...buttonChoiceStyle,
											borderColor: edge.satisfied === true ? CascaisPalette.TelemetryGreen : '#D1D5DB',
											background: edge.satisfied === true ? CascaisPalette.EmeraldMist : '#FFFFFF',
											color: edge.satisfied === true ? CascaisPalette.EmeraldInk : '#4B5563',
											fontWeight: edge.satisfied === true ? 700 : 500,
										}}
									>
										🟢 True
									</button>
									<button className="btn btn-xs"
										type="button"
										onClick={() => onUpdateEdge?.(selection.id, { satisfied: false })}
										style={{
											...buttonChoiceStyle,
											borderColor: edge.satisfied === false ? CascaisPalette.NetGoldStroke : '#D1D5DB',
											background: edge.satisfied === false ? '#FFFBEB' : '#FFFFFF',
											color: edge.satisfied === false ? '#92400E' : '#4B5563',
											fontWeight: edge.satisfied === false ? 700 : 500,
										}}
									>
										🟡 False
									</button>
									<button className="btn btn-xs"
										type="button"
										onClick={() => onUpdateEdge?.(selection.id, { satisfied: null })}
										style={{
											...buttonChoiceStyle,
											borderColor: edge.satisfied === null || edge.satisfied === undefined ? '#6B7280' : '#D1D5DB',
											background: edge.satisfied === null || edge.satisfied === undefined ? '#F1F5F9' : '#FFFFFF',
											color: edge.satisfied === null || edge.satisfied === undefined ? '#334155' : '#4B5563',
											fontWeight: edge.satisfied === null || edge.satisfied === undefined ? 700 : 500,
										}}
									>
										⚪ None
									</button>
								</div>
							</div>

							{/* Expression Capsule Preview */}
							{edge.expression && (
								<div style={{ marginTop: 8, padding: '10px', background: '#ECECE6', borderRadius: 6, border: '1px solid #DCDCD4' }}>
									<span style={{ fontSize: 10, fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: 6 }}>
										Capsule Preview:
									</span>
									<div style={{ display: 'flex', justifyContent: 'center' }}>
										{(() => {
											const { pillBg, pillBorder, pillText } = computeExpressionPillColors(
												edge.expressionColor,
												edge.satisfied,
											);
											return (
												<div
													style={{
														padding: '4px 12px',
														borderRadius: 12,
														fontSize: 11,
														fontWeight: 600,
														fontFamily: '"JetBrains Mono", Consolas, monospace',
														background: pillBg,
														color: pillText,
														border: `1.5px solid ${pillBorder}`,
													}}
												>
													{edge.expression}
												</div>
											);
										})()}
									</div>
								</div>
							)}
						</div>
					)}
				</>
			)}

			</>
			)}

			{/* Delete Cell Button */}
			{onDeleteSelected && (
				<button className="btn btn-xs"
					type="button"
					onClick={onDeleteSelected}
					style={{
						marginTop: 'auto',
						padding: '8px 12px',
						background: CascaisPalette.RedMist,
						border: '1px solid #F87171',
						borderRadius: 6,
						color: CascaisPalette.RedDeep,
						fontSize: 11,
						fontWeight: 600,
						cursor: 'pointer',
					}}
				>
					🗑 Delete {isBoundary ? 'Boundary' : isNode ? 'Node' : 'Edge'}
				</button>
			)}
            {footer}
		</aside>
	);
};

/**
 * The deep-link panel speaks the flag (Koyo C2, 2026-10-06), not a status colour: an awakened duality is
 * Verde, as on the node's left half, and stepping through is Vermelho, because the button is the door.
 */
function dualityStatusStyle(active: boolean): React.CSSProperties {
	return active
		? { background: HeraldicWash.verde(DualityWashStrength.verde), color: CascaisPalette.BandeiraVerde }
		: { background: withAlpha(CascaisPalette.GraphiteMuted, 0.12), color: CascaisPalette.GraphiteMuted };
}

const portalActionStyle: React.CSSProperties = {
	background: CascaisPalette.BandeiraVermelho,
	color: CascaisPalette.ChalkWhite,
	border: `1px solid ${CascaisPalette.BandeiraVermelho}`,
};

/**
 * The stereotype list as one comma-separated text: the stereotype words first, then the node's
 * pictograms by file name (`Lead, Customer, Artist.svg`). Chips, the glyph picker and typing all
 * edit the same list, so the field always shows what is selected.
 */
function stereotypeListText(stereotype: string | readonly string[] | undefined, glyph: string | undefined): string {
	const words = Array.isArray(stereotype)
		? stereotype.map((s) => String(s).trim()).filter(Boolean).join(', ')
		: String(stereotype ?? '').trim();
	const glyphs = splitStereotypeGlyphRefs(glyph).map((ref) => resolveStereotypeGlyph(ref)?.file ?? ref);
	return [words, ...glyphs].filter(Boolean).join(', ');
}

/**
 * A typed item names a pictogram when it ends in `.svg` or is a glyph's id (`Computer`). A built-in
 * stereotype word stays a stereotype even when a glyph shares it (`Artist` means Headliner).
 */
function glyphOfItem(item: string): string | undefined {
	const entry = resolveStereotypeGlyph(item);
	if (/\.svg$/i.test(item)) return entry?.file ?? item;
	// An Object Shape is a stereotype word on an Object only, so it is asked for on that kind too:
	// `Certificate` means the Shape, not the legacy pictogram that shares its name.
	if (resolveStereotype(item) !== undefined || resolveStereotype(item, 'obj') !== undefined || !entry) return undefined;
	return item.replace(/\s+/g, '').toLowerCase() === entry.id.toLowerCase() ? entry.file : undefined;
}

/** Split typed text back into the stereotype words and the pictogram list. */
function parseStereotypeList(text: string): { stereotype: string; stereotypeGlyph: string } {
	const words: string[] = [];
	const glyphs: string[] = [];
	for (const raw of text.split(',')) {
		const item = raw.trim();
		if (!item) continue;
		const glyph = glyphOfItem(item);
		if (glyph === undefined) words.push(item);
		else if (!glyphs.includes(glyph)) glyphs.push(glyph);
	}
	return { stereotype: words.join(', '), stereotypeGlyph: glyphs.join(', ') };
}

/** The stereotype text field. While it has focus it shows what is typed; otherwise the stored list. */
const StereotypeListInput: React.FC<{
	stereotype: string | readonly string[] | undefined;
	glyph: string | undefined;
	onChange: (updates: { stereotype: string; stereotypeGlyph: string }) => void;
}> = ({ stereotype, glyph, onChange }) => {
	const [draft, setDraft] = useState<string | null>(null);
	const stored = stereotypeListText(stereotype, glyph);
	return (
		<input className="input input-sm w-full"
			type="text"
			aria-label="Stereotypes"
			value={draft ?? stored}
			onFocus={() => setDraft(stored)}
			onBlur={() => setDraft(null)}
			onChange={(e) => {
				setDraft(e.target.value);
				onChange(parseStereotypeList(e.target.value));
			}}
			style={inputStyle}
			placeholder="e.g. Lead, Customer, Stage, Computer.svg"
		/>
	);
};

/**
 * CR053 §2.2 — visual picker for stereotype pictograms. A badge shows the active glyphs; it opens an
 * inline flyout with category tabs, a search field (English, German, aliases) and the glyph grid.
 * With `multiple` (nodes) each tile toggles its glyph and the flyout stays open; otherwise (edges) a
 * tile replaces the glyph and closes it. Unknown references stay visible verbatim so they can be
 * cleared, never silently lost.
 */
const StereotypeGlyphPicker: React.FC<{
	glyph: string | undefined;
	multiple?: boolean;
	/** The new comma-separated glyph list; `''` clears it. */
	onChange: (glyph: string) => void;
}> = ({ glyph, multiple = false, onChange }) => {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [category, setCategory] = useState<StereotypeGlyphCategory | 'all'>('all');
	const refs = splitStereotypeGlyphRefs(glyph);
	const active = resolveStereotypeGlyphs(glyph);
	const unknown = refs.filter((ref) => resolveStereotypeGlyph(ref) === undefined);
	const summary = [...active.map((entry) => entry.label), ...unknown.map((ref) => `Unknown: ${ref}`)].join(', ');
	const results = open ? searchStereotypeGlyphs(query, category) : [];
	const tabs: { id: StereotypeGlyphCategory | 'all'; label: string }[] = [{ id: 'all', label: 'All' }, ...STEREOTYPE_GLYPH_CATEGORIES];
	const pick = (entry: StereotypeGlyphEntry) => {
		if (!multiple) {
			onChange(entry.file);
			setOpen(false);
			return;
		}
		const files = refs.map((ref) => resolveStereotypeGlyph(ref)?.file ?? ref);
		onChange(active.includes(entry)
			? files.filter((file) => resolveStereotypeGlyph(file) !== entry).join(', ')
			: [...files, entry.file].join(', '));
	};

	return (
		<div className="raid-glyph-picker" style={{ marginTop: 6 }}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
				<button className="btn btn-xs"
					type="button"
					aria-label="Choose stereotype glyph"
					aria-expanded={open}
					title={summary ? `Glyph: ${summary}` : multiple ? 'Choose stereotype glyphs' : 'Choose a stereotype glyph'}
					onClick={() => setOpen((o) => !o)}
					style={{ ...buttonChoiceStyle, gap: 6, padding: '2px 8px', background: active.length > 0 ? CascaisPalette.AmberMist : '#FFFFFF', border: active.length > 0 ? `1.5px solid ${CascaisPalette.NetGoldStroke}` : buttonChoiceStyle.border }}
				>
					{active.length > 0
						? active.map((entry) => <img key={entry.file} src={getStereotypeGlyphUrl(entry.file)} alt="" width={20} height={20} style={{ objectFit: 'contain' }} />)
						: <span aria-hidden="true" style={{ fontSize: 14, lineHeight: '20px' }}>＋</span>}
					<span style={{ color: unknown.length > 0 ? CascaisPalette.RedDeep : '#374151' }}>
						{summary || (multiple ? 'Glyphs' : 'Glyph')}
					</span>
				</button>
				{refs.length > 0 && (
					<button className="btn btn-xs"
						type="button"
						aria-label="Clear stereotype glyph"
						title="Reset to the default archetype rendering"
						onClick={() => { onChange(''); setOpen(false); }}
						style={{ ...buttonChoiceStyle, padding: '2px 8px', background: '#FFFFFF', color: '#6B7280' }}
					>
						Clear
					</button>
				)}
			</div>
			{open && (
				<div role="dialog" aria-label="Stereotype glyphs"
					style={{ marginTop: 6, padding: 8, border: '1px solid #E5E5DF', borderRadius: 8, background: '#FFFFFF' }}
				>
					<input className="input input-sm w-full"
						type="search"
						aria-label="Search stereotype glyphs"
						placeholder="Search, e.g. computer, Lehrer, artist"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						style={inputStyle}
						autoFocus
					/>
					<div role="tablist" aria-label="Glyph categories" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '6px 0' }}>
						{tabs.map((tab) => (
							<button className="btn btn-xs"
								key={tab.id}
								type="button"
								role="tab"
								aria-selected={category === tab.id}
								onClick={() => setCategory(tab.id)}
								style={{
									padding: '1px 6px',
									fontSize: 10,
									borderRadius: 4,
									border: category === tab.id ? `1.5px solid ${CascaisPalette.NetGoldStroke}` : '1px solid #D1D5DB',
									background: category === tab.id ? CascaisPalette.AmberMist : '#FFFFFF',
									color: category === tab.id ? '#92400E' : '#374151',
									cursor: 'pointer',
								}}
							>
								{tab.label}
							</button>
						))}
					</div>
					{multiple && (
						<p style={{ fontSize: 10, color: '#6B7280', margin: '0 0 6px' }}>
							Pick several; pick one again to remove it. The first is the main pictogram.
						</p>
					)}
					{results.length === 0 ? (
						<p style={{ fontSize: 11, color: '#6B7280', margin: '8px 0' }}>No glyph matches “{query}”.</p>
					) : (
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
							{results.map((entry) => {
								const selected = active.includes(entry);
								return (
									<button
										key={entry.file}
										type="button"
										aria-label={entry.label}
										aria-pressed={selected}
										title={entry.label}
										onClick={() => pick(entry)}
										style={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											gap: 2,
											padding: 4,
											borderRadius: 6,
											border: selected ? `1.5px solid ${CascaisPalette.NetGoldStroke}` : '1px solid transparent',
											background: selected ? CascaisPalette.AmberMist : 'transparent',
											cursor: 'pointer',
										}}
									>
										<img src={getStereotypeGlyphUrl(entry.file)} alt="" width={32} height={32} loading="lazy" style={{ objectFit: 'contain' }} />
										<span style={{ fontSize: 9, color: '#4B5563', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
											{entry.label}
										</span>
									</button>
								);
							})}
						</div>
					)}
					{multiple && (
						<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
							<button className="btn btn-xs" type="button" onClick={() => setOpen(false)}
								style={{ ...buttonChoiceStyle, padding: '2px 8px', background: '#FFFFFF' }}
							>
								Done
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

const labelStyle: React.CSSProperties = {
	display: 'block',
	fontSize: 11,
	fontWeight: 600,
	color: '#4B5563',
	marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
	width: '100%',
	padding: '6px 8px',
	fontSize: 12,
	fontFamily: 'inherit',
	background: '#FFFFFF',
	border: '1px solid #D1D5DB',
	borderRadius: 6,
	color: '#111827',
	boxSizing: 'border-box',
	outline: 'none',
};

const selectStyle: React.CSSProperties = {
	...inputStyle,
	cursor: 'pointer',
};

const buttonChoiceStyle: React.CSSProperties = {
	padding: '6px 8px',
	fontSize: 11,
	borderRadius: 6,
	border: '1px solid #D1D5DB',
	cursor: 'pointer',
	transition: 'all 0.15s ease',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
};
