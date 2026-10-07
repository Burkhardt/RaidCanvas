/**
 * The Cascais theme: every heraldic colour the canvas paints, defined once.
 *
 * Shapes, the headless SVG export, the Inspector and the Palette reference these names; none of them
 * spells a gold, green or red hex value of its own. The CSS mirror is `styles/aoaim-theme.css` (`--aim-*`).
 *
 * Two greens and two reds, on purpose (CR055):
 * - `BandeiraVerde` / `BandeiraVermelho` are the flag bicolour of the Duality of the Object. Verde is the
 *   hoist (left, the Persona), Vermelho the fly (right, the Portal), joined by the Net Gold seam. They match
 *   the Glass chrome (`--heraldic-green`, `--castle-red` in aia-workbench).
 * - `HeraldicGreen` is Verde under the name the workbench uses for it (Koyo C3, 2026-10-06).
 * - `TelemetryGreen` / `CascaisRed` are status and accent colours (satisfied, true/false pills, approvals,
 *   Activity frame). They are never laid out as a left/right pair.
 *
 * One gold family (CR055, Koyo D6): `NetGold` is the heraldic metallic gold shared with the Glass chrome
 * (`--net-gold`), used for fills. At 1.9:1 on Calçada it cannot carry a line, so seams, outlines, glyph
 * strokes and boundaries use the denser `NetGoldStroke` from the same ochre family (3.06:1 on Calçada, the
 * WCAG 1.4.11 minimum for non-text contrast).
 */
export const CascaisPalette = {
  /** Fills: crowns, accents, badges, handles. Same hex as the chrome's `--net-gold`. */
  NetGold: '#D4AF37',
  /** Lines on light grounds: the duality seam, outlines, initiating-actor glyphs, Class/package boundaries. */
  NetGoldStroke: '#AB8722',
  /** Text on gold tints. */
  AmberDeep: '#B45309',
  /** Selected / unbound tint. */
  AmberMist: '#FEF3C7',
  /** Status only: satisfied conditions, approvals, telemetry and connection indicators. Never the flag. */
  TelemetryGreen: '#10B981',
  EmeraldDeep: '#047857',
  EmeraldInk: '#065F46',
  EmeraldShadow: '#064E3B',
  EmeraldLine: '#A7F3D0',
  EmeraldPale: '#D1FAE5',
  EmeraldMist: '#ECFDF5',
  EmeraldWhisper: '#F0FDF4',
  CascaisRed: '#EF4444',
  RedDeep: '#B91C1C',
  RedMist: '#FEE2E2',
  /** CR055: Verde Esperança, the hoist (left) of the duality bicolour. */
  BandeiraVerde: '#1E5631',
  /** Heraldic Green is Verde, the same colour the workbench calls `--heraldic-green` (Koyo, C3). */
  HeraldicGreen: '#1E5631',
  /** CR055: Vermelho Coragem, the fly (right) of the duality bicolour. */
  BandeiraVermelho: '#D22B2B',
  WarmGraphite: '#1F2937',
  GraphiteMuted: '#4B5563',
  SilverLine: '#E5E7EB',
  SilverLineDark: '#D1D5DB',
  ChalkWhite: '#FFFFFF',
  CanvasCream: '#F8FAFC',
  AccentBlue: '#3B82F6',
  TextPrimary: '#111827',
  TextSecondary: '#4B5563',
} as const;

/**
 * The Generic Role's ring (RAI, 2026-10-06): grey and dashed, because its Who / What / Where category
 * is not chosen yet. The dash is shorter than an unfilled role's `5,4`, and the ring stays fully opaque,
 * so "no category yet" does not read as "nobody has filled this".
 */
export const GenericRoleLine = {
  stroke: CascaisPalette.GraphiteMuted,
  strokeWidth: 2.2,
  dash: '3,3',
} as const;

/** `#RRGGBB` → `rgba(r, g, b, alpha)`, for translucent washes of a palette colour. */
export function withAlpha(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1, 7), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

/**
 * Wash strengths of the awakened duality (Koyo, 2026-10-06, replacing the per-material table of D8).
 *
 * The two halves are deliberately unequal. Verde is a dark green: thinned to 10 % on white it is a cool
 * grey (`#E9EEEA`), while Vermelho at 10 % is still pink. So the hoist is washed stronger than the fly,
 * and the flag reads green and red instead of grey and pink.
 */
export const DualityWashStrength = {
  /** The Persona (hoist, left half), on every material. */
  verde: 0.20,
  /** The Portal door (fly, right half) at rest, on every material. */
  vermelho: 0.12,
  /** The door while the right half is hovered. */
  hover: 0.18,
  /** The `›` chevron at rest; it reaches full Vermelho on hover. */
  chevron: 0.70,
} as const;

/** CR055: translucent washes of the duality bicolour — Verde on the Persona, Vermelho on the Portal. */
export const HeraldicWash = {
  verde: (alpha: number): string => withAlpha(CascaisPalette.BandeiraVerde, alpha),
  vermelho: (alpha: number): string => withAlpha(CascaisPalette.BandeiraVermelho, alpha),
} as const;
