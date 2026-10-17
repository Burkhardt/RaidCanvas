/**
 * How an Activity node shows its lifecycle state (0.13.0).
 *
 * One table, read by the live canvas (`X6Shapes`) and by the exported SVG (`RaiBridge`), so the two
 * can never disagree. The state arrives as `aim-state` in the AOAIM vocabulary (`Created`,
 * `Unblocked`, `Blocked`, `Doing`, `Concluded`, `Done`, `Archived`); `Ready` is accepted as a name
 * for `Unblocked`.
 *
 * **Status colours, not the flag.** A lifecycle state is status, so it uses the Telemetry/Emerald
 * family and Net Gold, never Heraldic Green or Vermelho, which belong to the Persona/Portal duality
 * (CascaisTheme). An Activity with no state, or in `Doing`, keeps the frame it always had.
 *
 * **Not by colour alone.** States that are easy to confuse also differ in line: `Blocked` is dashed,
 * `Archived` dotted, and the finished states (`Concluded`, `Done`) carry a heavier gold border.
 */
import { CascaisPalette } from './CascaisTheme.js';

export interface ActivityLook {
	fill: string;
	stroke: string;
	strokeWidth: number;
	/** SVG `stroke-dasharray`, when the line is not solid. */
	dash?: string;
	/** What a reader is told, for a tooltip or an accessible name. */
	label: string;
}

/** The frame an Activity has always had: in flight, or state unknown. */
export const ACTIVITY_DEFAULT_LOOK: ActivityLook = {
	fill: CascaisPalette.ChalkWhite,
	stroke: CascaisPalette.CascaisRed,
	strokeWidth: 2,
	label: 'Doing',
};

export const ACTIVITY_STATE_LOOKS: Readonly<Record<string, ActivityLook>> = {
	Created: { fill: CascaisPalette.ChalkWhite, stroke: CascaisPalette.GraphiteMuted, strokeWidth: 1.5, label: 'Created' },
	Blocked: { fill: CascaisPalette.ChalkWhite, stroke: CascaisPalette.GraphiteMuted, strokeWidth: 1.5, dash: '6,4', label: 'Blocked' },
	Unblocked: { fill: CascaisPalette.EmeraldWhisper, stroke: CascaisPalette.EmeraldDeep, strokeWidth: 2.5, label: 'Ready' },
	Doing: ACTIVITY_DEFAULT_LOOK,
	Concluded: { fill: CascaisPalette.ChalkWhite, stroke: CascaisPalette.NetGoldStroke, strokeWidth: 3, label: 'Concluded' },
	Done: { fill: CascaisPalette.EmeraldPale, stroke: CascaisPalette.NetGoldStroke, strokeWidth: 3, label: 'Done' },
	Archived: { fill: CascaisPalette.ChalkWhite, stroke: CascaisPalette.SilverLineDark, strokeWidth: 1.5, dash: '2,3', label: 'Archived' },
};

/** The look for an Activity in `state`; the default frame for no state or one this table does not know. */
export function activityLookOf(state: string | undefined | null): ActivityLook {
	if (!state) return ACTIVITY_DEFAULT_LOOK;
	const key = state.trim() === 'Ready' ? 'Unblocked' : state.trim();
	return ACTIVITY_STATE_LOOKS[key] ?? ACTIVITY_DEFAULT_LOOK;
}
