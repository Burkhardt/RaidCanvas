/**
 * @file StereotypeGlyphs.ts
 * @description CR053 — the OTW stereotype pictogram library as a runtime registry.
 *
 * A node names its pictogram with `stereotypeGlyph` (SVG contract: `aim-stereotype-glyph`), e.g.
 * `"Computer.svg"`. This module answers three questions about that name:
 *
 * 1. **Which glyph is it?** {@link resolveStereotypeGlyph} is deliberately tolerant — case, spaces,
 *    a missing `.svg`, a path prefix, the German original or a known alias all resolve to the same
 *    entry, so files written by hand or by older agents hydrate without manual re-selection.
 *    An unknown name resolves to `undefined`, and every renderer then falls back to the plain
 *    archetype (CR053 §2.3 "Graceful Fallback").
 * 2. **Where is the artwork?** {@link getStereotypeGlyphUrl}. The SVGs ship in the package under
 *    `assets/stereotypes/` and are *referenced*, never inlined into the JS bundle (1.9 MB for the
 *    full set; a diagram only fetches the few it uses). Hosts serve that folder and point the
 *    canvas at it once with {@link setStereotypeGlyphBaseUrl} (default `/stereotypes/`), or take
 *    full control with {@link setStereotypeGlyphResolver}.
 * 3. **What can be picked?** {@link searchStereotypeGlyphs} backs the Inspector picker.
 */
import { STEREOTYPE_GLYPH_CATALOG } from './StereotypeGlyphCatalog.js';

/** Picker categories (CR053 §2.2), in display order. */
export type StereotypeGlyphCategory = 'roles' | 'systems' | 'robustness' | 'artifacts' | 'metaphors';

export const STEREOTYPE_GLYPH_CATEGORIES: readonly { readonly id: StereotypeGlyphCategory; readonly label: string }[] = [
	{ id: 'roles', label: 'Roles & Agents' },
	{ id: 'systems', label: 'Systems & Infrastructure' },
	{ id: 'robustness', label: 'Robustness & Flow' },
	{ id: 'artifacts', label: 'Artifacts & Documents' },
	{ id: 'metaphors', label: 'Metaphors & States' },
];

/** One pictogram of the library. */
export interface StereotypeGlyphEntry {
	/** Stable identity, also the default stereotype name it suggests (e.g. `Computer`). */
	readonly id: string;
	/** Canonical file name — the value written to `aim-stereotype-glyph` (e.g. `Computer.svg`). */
	readonly file: string;
	/** English display label (e.g. `Teacher` for `Dozent`). */
	readonly label: string;
	readonly category: StereotypeGlyphCategory;
	/** Search terms, including the German OTW original. */
	readonly keywords: readonly string[];
	/** Other names that resolve to this glyph (legacy file names, duplicates). */
	readonly aliases: readonly string[];
	/** Width / height of the artwork's viewBox, for proportional placement. */
	readonly aspect: number;
	/** Size of the optimized SVG in bytes. */
	readonly bytes: number;
}

export { STEREOTYPE_GLYPH_CATALOG };

/** Lowercase alphanumerics only, without a trailing `.svg` or any directory prefix. */
function normalizeGlyphKey(ref: string): string {
	const base = ref.trim().split(/[\\/]/).pop() ?? '';
	return base
		.replace(/\.svg$/i, '')
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/ß/g, 'ss')
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '');
}

let glyphIndex: Map<string, StereotypeGlyphEntry> | null = null;
function index(): Map<string, StereotypeGlyphEntry> {
	if (glyphIndex) return glyphIndex;
	const map = new Map<string, StereotypeGlyphEntry>();
	// Ids and file names first, so an alias can never shadow a real glyph.
	for (const entry of STEREOTYPE_GLYPH_CATALOG) map.set(normalizeGlyphKey(entry.id), entry);
	for (const entry of STEREOTYPE_GLYPH_CATALOG) {
		for (const alias of entry.aliases) {
			const key = normalizeGlyphKey(alias);
			if (!map.has(key)) map.set(key, entry);
		}
	}
	glyphIndex = map;
	return map;
}

/**
 * Resolve a glyph reference (`"Computer.svg"`, `"computer"`, `"geschafft 2.svg"`,
 * `"/stereotypes/Artist.svg"`, `"Painter"`) to its catalog entry, or `undefined` if unknown.
 */
export function resolveStereotypeGlyph(ref: string | null | undefined): StereotypeGlyphEntry | undefined {
	if (typeof ref !== 'string' || ref.trim().length === 0) return undefined;
	return index().get(normalizeGlyphKey(ref));
}

/** True when the node data names a glyph the library knows. */
export function hasStereotypeGlyph(data: { readonly stereotypeGlyph?: string | undefined } | null | undefined): boolean {
	return resolveStereotypeGlyph(data?.stereotypeGlyph) !== undefined;
}

export type StereotypeGlyphUrlResolver = (entry: StereotypeGlyphEntry) => string;

const DEFAULT_GLYPH_BASE_URL = '/stereotypes/';
let glyphBaseUrl = DEFAULT_GLYPH_BASE_URL;
let customResolver: StereotypeGlyphUrlResolver | null = null;

/**
 * Point the canvas at the folder serving `assets/stereotypes/` (default `/stereotypes/`).
 * A trailing slash is added when missing. Call once at start-up, before the first render.
 */
export function setStereotypeGlyphBaseUrl(baseUrl: string): void {
	const trimmed = baseUrl.trim();
	glyphBaseUrl = trimmed.length === 0 ? DEFAULT_GLYPH_BASE_URL : trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

export function getStereotypeGlyphBaseUrl(): string {
	return glyphBaseUrl;
}

/**
 * Replace URL construction entirely (e.g. a bundler's asset map, an authenticated image endpoint
 * such as `GET /api/v1/Image/stereotype/{name}.svg`, or data URIs). Pass `null` to restore the
 * base-URL behaviour.
 */
export function setStereotypeGlyphResolver(resolver: StereotypeGlyphUrlResolver | null): void {
	customResolver = resolver;
}

/** URL of the artwork for a glyph reference, or `undefined` when the reference is unknown. */
export function getStereotypeGlyphUrl(ref: string | null | undefined): string | undefined {
	const entry = resolveStereotypeGlyph(ref);
	if (!entry) return undefined;
	if (customResolver) return customResolver(entry);
	return `${glyphBaseUrl}${encodeURIComponent(entry.file)}`;
}

/**
 * Filter the library for the picker: by category (or all), then by a free-text query matched
 * against id, label, keywords and aliases (accent- and case-insensitive; every word must match).
 */
export function searchStereotypeGlyphs(
	query = '',
	category: StereotypeGlyphCategory | 'all' = 'all',
): StereotypeGlyphEntry[] {
	const words = query
		.split(/\s+/)
		.map(normalizeGlyphKey)
		.filter((w) => w.length > 0);
	return STEREOTYPE_GLYPH_CATALOG.filter((entry) => {
		if (category !== 'all' && entry.category !== category) return false;
		if (words.length === 0) return true;
		const haystack = [entry.id, entry.label, ...entry.keywords, ...entry.aliases].map(normalizeGlyphKey).join(' ');
		return words.every((w) => haystack.includes(w));
	});
}

/**
 * Glyph geometry for a node (CR053 §2.1), shared by the live X6 node and the headless SVG export so
 * both draw the pictogram in exactly the same place.
 *
 * - **Silhouette** (`per`, frameless `plc`): the pictogram replaces the stick figure / pin, centred
 *   in the 58 px band above the qualifier and name lines — the band the figure occupied, so labels
 *   do not move and resizing stays stable (CR034 §2.1).
 * - **Badge** (cards — `obj`, framed `plc`, `act`, `uc`, `cls`): a 24 × 24 badge in the header
 *   compartment / leading edge, beside the `«Stereotype»` line, where the built-in stereotype icons
 *   already sit.
 */
export interface StereotypeGlyphPlacement {
	readonly mode: 'silhouette' | 'badge';
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
}

export const GLYPH_SILHOUETTE_BAND = 58;
export const GLYPH_BADGE_SIZE = 24;

export function computeStereotypeGlyphPlacement(
	kind: string,
	width: number,
	height: number,
	options: { readonly frameless?: boolean } = {},
): StereotypeGlyphPlacement {
	if (kind === 'per' || (kind === 'plc' && options.frameless)) {
		const size = GLYPH_SILHOUETTE_BAND - 2;
		return { mode: 'silhouette', x: Math.round(width / 2 - size / 2), y: 1, width: size, height: size };
	}
	if (kind === 'cls') {
		return { mode: 'badge', x: 6, y: 2, width: GLYPH_BADGE_SIZE, height: GLYPH_BADGE_SIZE };
	}
	if (kind === 'plc') {
		// Framed Place: top-centre above the centred qualifier / name, like the built-in place icons.
		return { mode: 'badge', x: Math.round(width / 2 - GLYPH_BADGE_SIZE / 2), y: 8, width: GLYPH_BADGE_SIZE, height: GLYPH_BADGE_SIZE };
	}
	if (kind === 'uc') {
		// Inside the ellipse's leading curve: inset so the badge never crosses the outline.
		const inset = Math.max(12, Math.round(width * 0.09));
		return { mode: 'badge', x: inset, y: Math.round(height / 2 - GLYPH_BADGE_SIZE / 2), width: GLYPH_BADGE_SIZE, height: GLYPH_BADGE_SIZE };
	}
	return { mode: 'badge', x: 10, y: Math.max(6, Math.round(height / 2 - GLYPH_BADGE_SIZE / 2)), width: GLYPH_BADGE_SIZE, height: GLYPH_BADGE_SIZE };
}
