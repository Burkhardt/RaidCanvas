/**
 * @file RaidPalette.tsx
 * @description Collapsible vertical stencil palette for AOAIM canonical archetypes,
 * class/package boundaries, and Rule 2 (No Coining) unbound shadow slots.
 *
 * Honors Alan Kay's Dynabook vision of dynamic, malleable visual objects
 * and Rainer Burkhardt's C++ GrafObj graphical hierarchy contracts.
 */

import React, { useState } from 'react';
import type { AimOntologyKind, RaidNodeData } from './types.js';

export interface RaidPaletteItem {
	id: string;
	name: string;
	kind?: AimOntologyKind;
	isBoundary?: boolean;
	boundaryKind?: 'Class' | 'Package';
	unbound?: boolean;
	badge: string;
	badgeColor: string;
	description: string;
	customData?: Partial<RaidNodeData>;
	iconSvg: React.ReactNode;
}

export const CANONICAL_PALETTE_ITEMS: RaidPaletteItem[] = [
	// 1. Core Ontological Archetypes
	{
		id: 'per',
		name: 'Actor / Person',
		kind: 'per',
		badge: 'ACTOR',
		badgeColor: '#F59E0B',
		description: 'Initiating role or external persona interacting with system',
		iconSvg: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
				<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
				<circle cx="12" cy="7" r="4" />
			</svg>
		),
	},
	{
		id: 'uc',
		name: 'UseCase',
		kind: 'uc',
		badge: 'USECASE',
		badgeColor: '#C59B27',
		description: 'Class-scoped method goal or system capability',
		iconSvg: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C59B27" strokeWidth="2">
				<ellipse cx="12" cy="12" rx="10" ry="6" />
			</svg>
		),
	},
	{
		id: 'act',
		name: 'Activity',
		kind: 'act',
		badge: 'PROCESS',
		badgeColor: '#EF4444',
		description: 'Discrete executable action step in an orchestrated workflow',
		iconSvg: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
				<rect x="3" y="5" width="18" height="14" rx="4" />
			</svg>
		),
	},
	{
		id: 'cls',
		name: 'Class',
		kind: 'cls',
		badge: 'STRUCTURE',
		badgeColor: '#475569',
		description: 'Domain schema with attributes and methods compartments',
		iconSvg: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.8">
				<rect x="3" y="3" width="18" height="18" rx="2" />
				<line x1="3" y1="9" x2="21" y2="9" />
				<line x1="3" y1="15" x2="21" y2="15" />
			</svg>
		),
	},
	{
		id: 'obj',
		name: 'Object',
		kind: 'obj',
		badge: 'INSTANCE',
		badgeColor: '#10B981',
		description: 'Runtime instantiated entity card with underlined title',
		iconSvg: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
				<rect x="3" y="4" width="18" height="16" rx="2" strokeDasharray="3 2" />
				<line x1="7" y1="10" x2="17" y2="10" />
			</svg>
		),
	},
	{
		id: 'plc',
		name: 'Place / Venue',
		kind: 'plc',
		badge: 'WHERE',
		badgeColor: '#1E293B',
		description: 'Spatial venue or architectural stage anchoring the activity',
		iconSvg: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
				<path d="M 12 18 C 8 13.8 5 10.6 5 7.5 A 7 7 0 1 1 19 7.5 C 19 10.6 16 13.8 12 18 Z" />
				<circle cx="12" cy="7.5" r="2.5" />
			</svg>
		),
	},
	{
		id: 'rol',
		name: 'Role',
		kind: 'rol',
		badge: 'KL-ONE',
		badgeColor: '#8B5CF6',
		description: 'Hollow circle: a typed role defined by its owner',
		iconSvg: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
				<circle cx="12" cy="12" r="7" />
			</svg>
		),
	},
	{
		id: 'rf',
		name: 'RoleFiller',
		kind: 'rf',
		badge: 'BINDING',
		badgeColor: '#2563EB',
		description: 'Filled circle: an object’s binding of a role to a filler',
		iconSvg: (
			<svg width="20" height="20" viewBox="0 0 24 24">
				<circle cx="12" cy="12" r="7" fill="#2563EB" />
			</svg>
		),
	},

	// 2. Boundaries
	{
		id: 'boundary-class',
		name: 'Class Boundary',
		isBoundary: true,
		boundaryKind: 'Class',
		badge: 'CLASS BOX',
		badgeColor: '#C59B27',
		description: 'Outer resizable boundary enclosure with inset badge for UseCases',
		iconSvg: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C59B27" strokeWidth="1.5">
				<rect x="2" y="2" width="20" height="20" rx="3" strokeDasharray="3 2" />
				<rect x="4" y="4" width="8" height="4" fill="#C59B2720" stroke="#C59B27" strokeWidth="0.8" rx="1" />
			</svg>
		),
	},
	{
		id: 'boundary-package',
		name: 'Package Folder',
		isBoundary: true,
		boundaryKind: 'Package',
		badge: 'PACKAGE',
		badgeColor: '#1E293B',
		description: 'Canonical UML hanging folder notation with protruding top-left tab',
		iconSvg: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="1.5">
				<path d="M 2 7 L 10 7 L 12 9 L 22 9 L 22 21 L 2 21 Z" />
				<path d="M 2 9 L 22 9" />
			</svg>
		),
	},

	// 3. Rule 2: No Coining (Unbound Shadow Slots)
	{
		id: 'unbound-per',
		name: '[Person]',
		kind: 'per',
		unbound: true,
		badge: 'UNBOUND',
		badgeColor: '#6B7280',
		description: 'Rule 2: Unbound Person role slot awaiting runtime assignment',
		iconSvg: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeDasharray="3 2">
				<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
				<circle cx="12" cy="7" r="4" />
			</svg>
		),
	},
	{
		id: 'unbound-obj',
		name: '[Object]',
		kind: 'obj',
		unbound: true,
		badge: 'UNBOUND',
		badgeColor: '#6B7280',
		description: 'Rule 2: Unbound Object slot awaiting runtime assignment',
		iconSvg: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeDasharray="3 2">
				<rect x="3" y="4" width="18" height="16" rx="2" />
			</svg>
		),
	},
	{
		id: 'unbound-plc',
		name: '[Place]',
		kind: 'plc',
		unbound: true,
		badge: 'UNBOUND',
		badgeColor: '#6B7280',
		description: 'Rule 2: Unbound Place/Venue slot awaiting assignment',
		iconSvg: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeDasharray="3 2">
				<path d="M 12 18 C 8 13.8 5 10.6 5 7.5 A 7 7 0 1 1 19 7.5 C 19 10.6 16 13.8 12 18 Z" />
				<circle cx="12" cy="7.5" r="2.5" />
			</svg>
		),
	},
];

/**
 * Returns the contextual palette stencils for a specific diagram archetype.
 * Guarantees that folded and unfolded palettes offer the identical set of elements:
 * - OneUseCaseDiagram: Actor/Person, UseCase, ClassBoundary, Package
 * - OneActivityDiagram: Actor/Person (instance with Rolefiller name underlined & Person name quiet),
 *   Activity (Cascais red, Activity name underlined, UseCase qualifier quiet on top),
 *   Object (RoleFiller instance)
 * - General/Other: Complete canonical palette set.
 */
export function getPaletteItemsForArchetype(archetype: string = ''): RaidPaletteItem[] {
	const norm = archetype.toLowerCase();

	if (norm.includes('usecase')) {
		return [
			{
				id: 'per',
				name: 'Actor / Person',
				kind: 'per',
				badge: 'ACTOR',
				badgeColor: '#F59E0B',
				description: 'Initiating role or external persona interacting with system',
				iconSvg: (
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
						<circle cx="12" cy="7" r="4" />
					</svg>
				),
			},
			{
				id: 'uc',
				name: 'UseCase',
				kind: 'uc',
				badge: 'USECASE',
				badgeColor: '#C59B27',
				description: 'Class-scoped method goal or system capability',
				iconSvg: (
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C59B27" strokeWidth="2">
						<ellipse cx="12" cy="12" rx="10" ry="6" />
					</svg>
				),
			},
			{
				id: 'boundary-class',
				name: 'Class Boundary',
				isBoundary: true,
				boundaryKind: 'Class',
				badge: 'CLASS BOX',
				badgeColor: '#C59B27',
				description: 'Outer resizable boundary enclosure with inset label for UseCases',
				iconSvg: (
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C59B27" strokeWidth="1.5">
						<rect x="2" y="2" width="20" height="20" rx="3" strokeDasharray="3 2" />
						<rect x="4" y="4" width="8" height="4" fill="#C59B2720" stroke="#C59B27" strokeWidth="0.8" rx="1" />
					</svg>
				),
			},
			{
				id: 'boundary-package',
				name: 'Package Folder',
				isBoundary: true,
				boundaryKind: 'Package',
				badge: 'PACKAGE',
				badgeColor: '#1E293B',
				description: 'Canonical UML hanging folder notation with top tab',
				iconSvg: (
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="1.5">
						<path d="M 2 7 L 10 7 L 12 9 L 22 9 L 22 21 L 2 21 Z" />
						<path d="M 2 9 L 22 9" />
					</svg>
				),
			},
		];
	}

	if (norm.includes('activity')) {
		return [
			{
				id: 'per-instance',
				name: 'Actor / Person',
				kind: 'per',
				badge: 'ROLEFILLER',
				badgeColor: '#F59E0B',
				description: 'Instance with underlined Rolefiller & quiet Actor name',
				customData: {
					instance: true,
					qualifier: 'Customer',
					displayName: 'Signer',
				},
				iconSvg: (
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
						<circle cx="12" cy="7" r="4" />
						<line x1="6" y1="23" x2="18" y2="23" stroke="#F59E0B" strokeWidth="1.5" />
					</svg>
				),
			},
			{
				id: 'act',
				name: 'Activity',
				kind: 'act',
				badge: 'PROCESS',
				badgeColor: '#EF4444',
				description: 'Cascais red: Activity name underlined, UseCase quiet on top',
				customData: {
					instance: true,
					qualifier: 'CloseContract',
					displayName: 'MyContract.CloseContract',
					properties: {
						preconditions: ['Customer != null'],
						postconditions: ['Contract.State == Closed'],
					},
				},
				iconSvg: (
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
						<rect x="3" y="5" width="18" height="14" rx="4" />
						<line x1="7" y1="15" x2="17" y2="15" stroke="#EF4444" strokeWidth="1.2" />
					</svg>
				),
			},
			{
				id: 'obj',
				name: 'Object (RoleFiller)',
				kind: 'obj',
				badge: 'ROLEFILLER',
				badgeColor: '#10B981',
				description: 'RoleFiller object instance (e.g. Host, Age, Contract)',
				customData: {
					instance: true,
					qualifier: 'RoleFiller',
					displayName: 'Host',
				},
				iconSvg: (
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
						<rect x="3" y="4" width="18" height="16" rx="2" strokeDasharray="3 2" />
						<line x1="7" y1="12" x2="17" y2="12" />
					</svg>
				),
			},
		];
	}

	return CANONICAL_PALETTE_ITEMS;
}

export interface RaidPaletteProps {
	/** Diagram archetype classification (e.g. 'OneUseCaseDiagram', 'OneActivityDiagram') */
	archetype?: string;
	/** Callback when a node stencil is selected or clicked */
	onAddNode?: (kind: AimOntologyKind, customData?: Partial<RaidNodeData>) => void;
	/** Callback when a boundary stencil is selected or clicked */
	onAddBoundary?: (kind: 'Class' | 'Package', name: string) => void;
	/** Whether the palette is collapsed */
	collapsed?: boolean;
	/** Toggle collapsed state */
	onToggleCollapse?: () => void;
	/** Optional items list (defaults to getPaletteItemsForArchetype(archetype)) */
	items?: RaidPaletteItem[];
	/** Optional CSS class name */
	className?: string;
	/** Optional inline styles */
	style?: React.CSSProperties;
}

export const RaidPalette: React.FC<RaidPaletteProps> = ({
	archetype = '',
	onAddNode,
	onAddBoundary,
	collapsed: controlledCollapsed,
	onToggleCollapse: controlledToggleCollapse,
	items: providedItems,
	className,
	style,
}) => {
	const [internalCollapsed, setInternalCollapsed] = useState(false);
	const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
	const toggleCollapse = controlledToggleCollapse ?? (() => setInternalCollapsed(!isCollapsed));
	const items = providedItems ?? getPaletteItemsForArchetype(archetype);

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
			onAddNode?.(item.kind, customData as Partial<RaidNodeData>);
		}
	};

	if (isCollapsed) {
		return (
			<aside
				className={`raid-ui bg-base-100 text-base-content ${className ?? ""}`}
				style={{
					width: 44,
					background: '#F9F9F6',
					borderRight: '1px solid #E5E5DF',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: '12px 0',
					gap: 8,
					userSelect: 'none',
					boxSizing: 'border-box',
					...style,
				}}
			>
				<button className="btn btn-xs btn-ghost"
					type="button"
					onClick={toggleCollapse}
					title="Expand Stencil Palette"
					style={{
						background: 'none',
						border: 'none',
						color: '#6B7280',
						cursor: 'pointer',
						padding: '4px',
						borderRadius: 4,
						fontSize: 12,
					}}
				>
					▶
				</button>
				<div style={{ width: 24, height: 1, background: '#E5E5DF', margin: '2px 0' }} />
				{items.map((item) => (
					<div
						key={item.id}
						draggable
						onDragStart={(e) => handleDragStart(e, item)}
						onClick={() => handleClickItem(item)}
						title={`${item.name} (${item.badge})\n${item.description}\nDrag or click to insert`}
						style={{
							cursor: 'grab',
							padding: '6px',
							borderRadius: 6,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							transition: 'background 0.15s ease',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = '#FFFFFF';
							e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = 'transparent';
							e.currentTarget.style.boxShadow = 'none';
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
			className={`raid-ui bg-base-100 text-base-content ${className ?? ""}`}
			style={{
				width: 175,
				background: '#F9F9F6',
				borderRight: '1px solid #E5E5DF',
				display: 'flex',
				flexDirection: 'column',
				padding: '12px 8px',
				gap: 10,
				userSelect: 'none',
				boxSizing: 'border-box',
				overflowY: 'auto',
				fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
				...style,
			}}
		>
			{/* Top Bar with Chevron folding */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 6px', borderBottom: '1px solid #E5E5DF' }}>
				<span style={{ fontSize: 11, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
					Stencils
				</span>
				<button className="btn btn-xs btn-ghost"
					type="button"
					onClick={toggleCollapse}
					title="Fold Stencil Palette"
					style={{
						background: 'none',
						border: 'none',
						color: '#6B7280',
						cursor: 'pointer',
						padding: '2px 4px',
						borderRadius: 4,
						fontSize: 12,
					}}
				>
					◀
				</button>
			</div>

			{/* Stencil Groups */}
			<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
				{items.map((item) => (
					<div
						key={item.id}
						draggable
						onDragStart={(e) => handleDragStart(e, item)}
						onClick={() => handleClickItem(item)}
						title={`${item.name} (${item.badge})\n${item.description}\nDrag or click to insert`}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 8,
							padding: '6px 8px',
							background: '#FFFFFF',
							border: '1px solid #E5E5DF',
							borderRadius: 6,
							cursor: 'grab',
							transition: 'all 0.15s ease',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.borderColor = '#C59B27';
							e.currentTarget.style.background = '#FEFDFB';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.borderColor = '#E5E5DF';
							e.currentTarget.style.background = '#FFFFFF';
						}}
					>
						<div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
							{item.iconSvg}
						</div>
						<div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
							<span style={{ fontSize: 11, fontWeight: 600, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
								{item.name}
							</span>
							<span style={{ fontSize: 8, fontWeight: 700, color: item.badgeColor, textTransform: 'uppercase' }}>
								{item.badge}
							</span>
						</div>
					</div>
				))}
			</div>
		</aside>
	);
};
