#!/usr/bin/env node
/**
 * @file build-stereotype-glyphs.mjs
 * @description CR053 — normalises the OTW stereotype pictogram library into the bundled glyph set.
 *
 * The sources are Inkscape conversions of the original OTW `.EMF` clip-art: millimetre page sizes,
 * no viewBox, sodipodi/inkscape chrome and full-precision coordinates (8.8 MB for 112 files). This
 * script turns each one into a crisp, viewBox-scaled, metadata-free SVG and regenerates the typed
 * catalog the canvas and the Inspector picker read.
 *
 * Authoring-time only: the outputs (`assets/stereotypes/*.svg`, `src/StereotypeGlyphCatalog.ts`)
 * are committed, so consumers never need the source folders.
 *
 * Usage:
 *   node scripts/build-stereotype-glyphs.mjs [--staged <dir>] [--otw <dir>]
 *
 * Defaults resolve the staged AIA copy (`../AIA/StereotypeImage`) and the OTW programme folder.
 */
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { existsSync, mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { optimize } from 'svgo';

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, '..');
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? path.resolve(args[i + 1]) : fallback;
};

const STAGED = arg('--staged', path.resolve(pkgRoot, '../../../AIA/StereotypeImage'));
const OTW = arg('--otw', '/Users/RSB/Projects/OTW/Programm/StereotypBild');
const OUT_DIR = path.join(pkgRoot, 'assets', 'stereotypes');
const CATALOG_TS = path.join(pkgRoot, 'src', 'StereotypeGlyphCatalog.ts');

/**
 * The curated catalog. `id` is the stable glyph identity (and output file name); it keeps the
 * staged file name so references already written by Adele / RAI (`Artist.svg`, `Computer.svg`)
 * stay valid. `src` is `staged:<file>` or `otw:<file>`. `aliases` resolve legacy names
 * (spaces, German originals, byte-identical duplicates) to the same glyph.
 */
const CATALOG = [
  // ── Roles & Agents ────────────────────────────────────────────────────────────────────────
  { id: 'Actor', src: 'otw:actor.svg', label: 'Actor', category: 'roles', keywords: ['uml', 'actor', 'stick'] },
  { id: 'Accountant', src: 'staged:Accountant.svg', label: 'Accountant', category: 'roles', keywords: ['Buchhalter', 'finance', 'bookkeeper'] },
  { id: 'Arbeiter', src: 'staged:Arbeiter.svg', label: 'Laborer', category: 'roles', keywords: ['Arbeiter', 'worker', 'labor'] },
  { id: 'Arbeiter2', src: 'staged:Arbeiter2.svg', label: 'Laborer 2', category: 'roles', keywords: ['Arbeiter', 'worker', 'labor'] },
  { id: 'Arbeiter3', src: 'staged:Arbeiter3.svg', label: 'Laborer 3', category: 'roles', keywords: ['Arbeiter', 'worker', 'labor'] },
  { id: 'Arbeitsgruppe', src: 'staged:Arbeitsgruppe.svg', label: 'Work Group', category: 'roles', keywords: ['Arbeitsgruppe', 'team', 'workgroup'] },
  { id: 'Artist', src: 'staged:Artist.svg', label: 'Artist', category: 'roles', keywords: ['Künstler', 'painter', 'creative', 'headliner'], aliases: ['Painter', 'Kuenstler', 'Künstler'] },
  { id: 'Asker', src: 'staged:Asker.svg', label: 'Asker', category: 'roles', keywords: ['Frager', 'question', 'inquirer'] },
  { id: 'BusinessMan', src: 'staged:BusinessMan.svg', label: 'Business Man', category: 'roles', keywords: ['Geschäftsmann', 'executive', 'manager'] },
  { id: 'BusinessPartner', src: 'staged:BusinessPartner.svg', label: 'Business Partner', category: 'roles', keywords: ['Geschäftspartner', 'partner', 'deal', 'handshake'] },
  { id: 'CaseWorker', src: 'otw:case worker.svg', label: 'Case Worker', category: 'roles', keywords: ['Sachbearbeiter', 'clerk', 'business worker'], aliases: ['case worker'] },
  { id: 'Dandy', src: 'staged:Dandy.svg', label: 'Dandy', category: 'roles', keywords: ['gentleman', 'style'] },
  { id: 'DeskWorker', src: 'staged:DeskWorker.svg', label: 'Desk Worker', category: 'roles', keywords: ['Schreibtischarbeiter', 'clerk', 'office'] },
  { id: 'Dozent', src: 'staged:Dozent.svg', label: 'Teacher', category: 'roles', keywords: ['Dozent', 'lecturer', 'teacher', 'trainer'], aliases: ['Teacher', 'Lecturer'] },
  { id: 'dynamic', src: 'staged:dynamic.svg', label: 'Young & Dynamic', category: 'roles', keywords: ['jung und dynamisch', 'energetic', 'youth'] },
  { id: 'elegant', src: 'staged:elegant.svg', label: 'Elegant', category: 'roles', keywords: ['elegant', 'lady', 'style'] },
  { id: 'Family', src: 'staged:Family.svg', label: 'Family', category: 'roles', keywords: ['Familie', 'household'] },
  { id: 'FireFighter', src: 'staged:FireFighter.svg', label: 'Fire Fighter', category: 'roles', keywords: ['Löscher', 'firefighter', 'incident', 'emergency', 'on-call'] },
  { id: 'Frau', src: 'staged:Frau.svg', label: 'Woman', category: 'roles', keywords: ['Frau', 'woman', 'female'], aliases: ['Woman'] },
  { id: 'Freak', src: 'staged:Freak.svg', label: 'Freak', category: 'roles', keywords: ['geek', 'nerd', 'enthusiast'] },
  { id: 'Group', src: 'staged:Group.svg', label: 'Group', category: 'roles', keywords: ['Gruppe', 'crowd', 'audience'], aliases: ['Gruppe'] },
  { id: 'InternalWorker', src: 'otw:internal worker.svg', label: 'Internal Worker', category: 'roles', keywords: ['internal', 'employee', 'business worker'], aliases: ['internal worker'] },
  { id: 'Kassierer', src: 'staged:Kassierer.svg', label: 'Cashier', category: 'roles', keywords: ['Kassierer', 'cashier', 'teller'], aliases: ['Cashier'] },
  { id: 'Leonardo', src: 'staged:Leonardo.svg', label: 'Leonardo', category: 'roles', keywords: ['vitruvian', 'human', 'genius'] },
  { id: 'Mailman', src: 'staged:Mailman.svg', label: 'Mailman', category: 'roles', keywords: ['Postbote', 'postman', 'courier'] },
  { id: 'Mann', src: 'staged:Mann.svg', label: 'Man', category: 'roles', keywords: ['Mann', 'man', 'male'], aliases: ['Man'] },
    { id: 'OfficeWorker', src: 'staged:OfficeWorker.svg', label: 'Office Worker', category: 'roles', keywords: ['Bildschirmarbeitsplatz', 'screen', 'operator'] },
  { id: 'Paar', src: 'staged:Paar.svg', label: 'Couple', category: 'roles', keywords: ['Paar', 'couple', 'pair'], aliases: ['Couple'] },
  { id: 'Pantomime', src: 'staged:Pantomime.svg', label: 'Mime', category: 'roles', keywords: ['Pantomime', 'mime', 'performer'] },
  { id: 'Phonecall', src: 'staged:Phonecall.svg', label: 'On the Phone', category: 'roles', keywords: ['Telefonieren', 'call', 'support', 'hotline'] },
  { id: 'Policeman', src: 'staged:Policeman.svg', label: 'Policeman', category: 'roles', keywords: ['Polizist', 'police', 'guard', 'security'] },
  { id: 'StickFigure', src: 'staged:StickFigure.svg', label: 'Stick Figure', category: 'roles', keywords: ['Männchen', 'person', 'figure'] },
  { id: 'Thinker', src: 'staged:Thinker.svg', label: 'Thinker', category: 'roles', keywords: ['Denker', 'analyst', 'architect'] },
  { id: 'Visionary', src: 'staged:Visionary.svg', label: 'Visionary', category: 'roles', keywords: ['Visionär', 'founder', 'strategist'] },
  { id: 'Worker', src: 'otw:worker.svg', label: 'Worker', category: 'roles', keywords: ['business worker', 'employee'] },

  // ── Systems & Infrastructure ──────────────────────────────────────────────────────────────
  { id: 'Computer', src: 'staged:Computer.svg', label: 'Computer', category: 'systems', keywords: ['server', 'pc', 'application server', 'host'] },
  { id: 'Computer2', src: 'staged:Computer2.svg', label: 'Computer 2', category: 'systems', keywords: ['server', 'pc', 'workstation'] },
  { id: 'MultimediaPC', src: 'staged:MultimediaPC.svg', label: 'Multimedia PC', category: 'systems', keywords: ['Multimedia PC', 'media', 'workstation'] },
  { id: 'Compute', src: 'staged:Compute.svg', label: 'Calculator', category: 'systems', keywords: ['Tischrechner', 'compute', 'calculator', 'engine'] },
  { id: 'FlipPhone', src: 'staged:FlipPhone.svg', label: 'Mobile Phone', category: 'systems', keywords: ['Handy', 'cellphone', 'mobile', 'sms'] },
  { id: 'OldPhone', src: 'staged:OldPhone.svg', label: 'Telephone', category: 'systems', keywords: ['Telefonhörer', 'phone', 'landline'] },
  { id: 'Fax', src: 'staged:Fax.svg', label: 'Fax', category: 'systems', keywords: ['fax', 'telefax'] },
  { id: 'Switch', src: 'staged:Switch.svg', label: 'Switch', category: 'systems', keywords: ['Schalter', 'on off', 'toggle', 'feature flag'] },
  { id: 'FilingCabinet', src: 'staged:FilingCabinet.svg', label: 'Filing Cabinet', category: 'systems', keywords: ['Aktenschrank', 'archive', 'storage', 'database'] },
  { id: 'Truck', src: 'staged:Truck.svg', label: 'Truck', category: 'systems', keywords: ['Laster', 'lorry', 'logistics', 'transport'], aliases: ['Laster'] },
  { id: 'SemiL', src: 'staged:SemiL.svg', label: 'Semi Truck (left)', category: 'systems', keywords: ['Laster l', 'semi', 'logistics'] },
  { id: 'SemiR', src: 'staged:SemiR.svg', label: 'Semi Truck (right)', category: 'systems', keywords: ['Laster r', 'semi', 'logistics'] },
  { id: 'ZementTruckL', src: 'staged:ZementTruckL.svg', label: 'Cement Truck (left)', category: 'systems', keywords: ['Bau Fz l', 'construction vehicle', 'mixer'] },
  { id: 'ZementTruckR', src: 'staged:ZementTruckR.svg', label: 'Cement Truck (right)', category: 'systems', keywords: ['Bau Fz r', 'construction vehicle', 'mixer'] },
  { id: 'mobil', src: 'staged:mobil.svg', label: 'Mobility', category: 'systems', keywords: ['mobil', 'car', 'travel', 'on the go'] },
  { id: 'Car', src: 'staged:Car.svg', label: 'Car', category: 'systems', keywords: ['Auto', 'vehicle'] },
  { id: 'CarLeft', src: 'staged:CarLeft.svg', label: 'Car (left)', category: 'systems', keywords: ['Auto l', 'vehicle'] },
  { id: 'CarRight', src: 'staged:CarRight.svg', label: 'Car (right)', category: 'systems', keywords: ['Auto r', 'vehicle'] },
  { id: 'Haus', src: 'staged:Haus.svg', label: 'House', category: 'systems', keywords: ['Haus', 'home', 'building', 'site'], aliases: ['House'] },

  // ── Robustness & Flow (BCE) ───────────────────────────────────────────────────────────────
  { id: 'Boundary', src: 'otw:boundary.svg', label: 'Boundary', category: 'robustness', keywords: ['bce', 'interface', 'ui', 'robustness'] },
  { id: 'Control', src: 'otw:control.svg', label: 'Control', category: 'robustness', keywords: ['bce', 'controller', 'logic', 'robustness'] },
  { id: 'Entity', src: 'otw:entity.svg', label: 'Entity', category: 'robustness', keywords: ['bce', 'data', 'domain', 'robustness'] },
  { id: 'Lieferung', src: 'staged:Lieferung.svg', label: 'Delivery', category: 'robustness', keywords: ['Lieferung', 'delivery', 'shipment', 'flow'], aliases: ['Delivery'] },
  { id: 'Himmelsrichtung', src: 'staged:Himmelsrichtung.svg', label: 'Direction', category: 'robustness', keywords: ['Himmelsrichtung', 'compass', 'direction', 'routing'] },

  // ── Artifacts & Documents ─────────────────────────────────────────────────────────────────
  { id: 'Book', src: 'staged:Book.svg', label: 'Book', category: 'artifacts', keywords: ['Buch', 'manual', 'knowledge'] },
  { id: 'CD', src: 'staged:CD.svg', label: 'CD', category: 'artifacts', keywords: ['disc', 'media', 'release'] },
  { id: 'Certificate', src: 'staged:Certificate.svg', label: 'Certificate', category: 'artifacts', keywords: ['Urkunde', 'contract', 'diploma'] },
  { id: 'Folder', src: 'staged:Folder.svg', label: 'Hanging Folder', category: 'artifacts', keywords: ['Hängeregister', 'file', 'dossier'] },
  { id: 'Kartei', src: 'staged:Kartei.svg', label: 'Card Index', category: 'artifacts', keywords: ['Kartei', 'index', 'register', 'records'] },
  { id: 'Notes', src: 'staged:Notes.svg', label: 'Notepad', category: 'artifacts', keywords: ['Notizblock', 'notes', 'minutes'] },
  { id: 'Notiz', src: 'staged:Notiz.svg', label: 'Note', category: 'artifacts', keywords: ['Notiz', 'memo', 'sticky'] },
  { id: 'Newspaper', src: 'staged:Newspaper.svg', label: 'Newspaper', category: 'artifacts', keywords: ['Zeitung', 'press', 'news'] },
  { id: 'Graduate', src: 'staged:Graduate.svg', label: 'Mortarboard', category: 'artifacts', keywords: ['Doktorhut', 'graduate', 'academic', 'degree'] },
  { id: 'Glasses', src: 'staged:Glasses.svg', label: 'Glasses', category: 'artifacts', keywords: ['Brille', 'review', 'read'] },
  { id: 'InkPen', src: 'staged:InkPen.svg', label: 'Fountain Pen', category: 'artifacts', keywords: ['Füller', 'sign', 'signature'] },
  { id: 'Brush', src: 'staged:Brush.svg', label: 'Brush', category: 'artifacts', keywords: ['Pinsel', 'paint', 'design'] },
  { id: 'Messer', src: 'staged:Messer.svg', label: 'Knife', category: 'artifacts', keywords: ['Messer', 'knife', 'cut'], aliases: ['Knife'] },
  { id: 'Geld', src: 'staged:Geld.svg', label: 'Money', category: 'artifacts', keywords: ['Geld', 'money', 'payment', 'cash'], aliases: ['Money'] },
  { id: 'Mug1', src: 'staged:Mug1.svg', label: 'Mug', category: 'artifacts', keywords: ['Tasse', 'coffee', 'break'] },
  { id: 'Mug2', src: 'staged:Mug2.svg', label: 'Mug 2', category: 'artifacts', keywords: ['Tasse', 'coffee', 'tea'] },
  { id: 'ShoppingCart', src: 'staged:ShoppingCart.svg', label: 'Shopping Cart', category: 'artifacts', keywords: ['Einkauf', 'purchase', 'order', 'commerce'] },
  { id: 'Konstruktion', src: 'staged:Konstruktion.svg', label: 'Construction Drawing', category: 'artifacts', keywords: ['Konstruktion', 'blueprint', 'design', 'engineering'] },

  // ── Metaphors & States ────────────────────────────────────────────────────────────────────
  { id: 'Anchor', src: 'staged:Anchor.svg', label: 'Anchor', category: 'metaphors', keywords: ['Anker', 'stable', 'foundation'] },
  { id: 'ATOM', src: 'staged:ATOM.svg', label: 'Atom', category: 'metaphors', keywords: ['ATOM2', 'science', 'core', 'atomic'] },
  { id: 'Alarm', src: 'staged:Alarm.svg', label: 'Alarm', category: 'metaphors', keywords: ['alarm', 'alert', 'siren'] },
  { id: 'AlarmClock', src: 'staged:AlarmClock.svg', label: 'Alarm Clock', category: 'metaphors', keywords: ['Wecker', 'deadline', 'reminder', 'timer'] },
  { id: 'Blitz', src: 'staged:Blitz.svg', label: 'Lightning', category: 'metaphors', keywords: ['Blitz', 'event', 'trigger', 'flash'] },
  { id: 'Break', src: 'staged:Break.svg', label: 'Break', category: 'metaphors', keywords: ['Pause', 'pause', 'rest', 'interrupt'] },
  { id: 'Bridge', src: 'staged:Bridge.svg', label: 'Bridge', category: 'metaphors', keywords: ['Brücke', 'adapter', 'integration'] },
  { id: 'Construction', src: 'staged:Construction.svg', label: 'Under Construction', category: 'metaphors', keywords: ['Baustelle', 'wip', 'in progress'] },
  { id: 'EmpireState', src: 'staged:EmpireState.svg', label: 'Empire State', category: 'metaphors', keywords: ['EMPIRE', 'enterprise', 'headquarters', 'tower'] },
  { id: 'Eye', src: 'staged:Eye.svg', label: 'Eye', category: 'metaphors', keywords: ['Auge', 'observer', 'watch', 'monitor'] },
  { id: 'FingerPrint', src: 'staged:FingerPrint.svg', label: 'Fingerprint', category: 'metaphors', keywords: ['Fingerabdruck', 'identity', 'auth', 'biometric'] },
  { id: 'Gegenwind', src: 'staged:Gegenwind.svg', label: 'Headwind', category: 'metaphors', keywords: ['Gegenwind', 'resistance', 'risk'] },
  { id: 'Gipfel', src: 'staged:Gipfel.svg', label: 'Peak', category: 'metaphors', keywords: ['Gipfel', 'summit', 'goal', 'milestone'], aliases: ['Peak', 'Summit'] },
  { id: 'Hammer', src: 'staged:Hammer.svg', label: 'Hammer', category: 'metaphors', keywords: ['build', 'tool', 'decide'] },
  { id: 'Schraubendreher', src: 'staged:Schraubendreher.svg', label: 'Screwdriver', category: 'metaphors', keywords: ['Schraubendreher', 'tool', 'fix', 'maintenance'], aliases: ['Screwdriver'] },
  { id: 'Wrench', src: 'staged:Wrench.svg', label: 'Wrench', category: 'metaphors', keywords: ['Schraubenschlüssel', 'tool', 'configure', 'maintenance'] },
  { id: 'Key', src: 'staged:Key.svg', label: 'Key', category: 'metaphors', keywords: ['Schlüssel', 'access', 'secret', 'credential'] },
  { id: 'Hurdle', src: 'staged:Hurdle.svg', label: 'Hurdle', category: 'metaphors', keywords: ['Hürde', 'obstacle', 'blocker'] },
  { id: 'Hurdlebw', src: 'staged:Hurdlebw.svg', label: 'Hurdle (b/w)', category: 'metaphors', keywords: ['Hürde sw', 'obstacle', 'blocker'] },
  { id: 'LadyJustice', src: 'staged:LadyJustice.svg', label: 'Lady Justice', category: 'metaphors', keywords: ['Justitia', 'law', 'compliance', 'legal'] },
  { id: 'weigh', src: 'staged:weigh.svg', label: 'Weigh', category: 'metaphors', keywords: ['abwägen', 'decision', 'balance', 'trade-off'] },
  { id: 'pick', src: 'staged:pick.svg', label: 'Pick', category: 'metaphors', keywords: ['aussuchen', 'choose', 'select'] },
  { id: 'LightBulb', src: 'staged:LightBulb.svg', label: 'Light Bulb', category: 'metaphors', keywords: ['Glühbirne', 'idea', 'insight'] },
  { id: 'Parachute', src: 'staged:Parachute.svg', label: 'Parachute', category: 'metaphors', keywords: ['Fallschirm', 'fallback', 'safety net', 'recovery'] },
  { id: 'Passport', src: 'staged:Passport.svg', label: 'Passport', category: 'metaphors', keywords: ['Paß', 'identity', 'credential', 'travel'] },
  { id: 'Umbrella', src: 'staged:Umbrella.svg', label: 'Umbrella', category: 'metaphors', keywords: ['Regenschirm', 'protection', 'insurance', 'cover'] },
  { id: 'NoEntry', src: 'staged:NoEntry.svg', label: 'No Entry', category: 'metaphors', keywords: ['Durchfahrt verboten', 'forbidden', 'denied', 'blocked'] },
  { id: 'ok', src: 'staged:ok.svg', label: 'Check', category: 'metaphors', keywords: ['Haken', 'ok', 'approved', 'valid'], aliases: ['Haken', 'Check'] },
  { id: 'geschafft', src: 'staged:geschafft.svg', label: 'Done', category: 'metaphors', keywords: ['geschafft', 'done', 'complete', 'success'], aliases: ['Done'] },
  { id: 'geschafft2', src: 'staged:geschafft 2.svg', label: 'Done 2', category: 'metaphors', keywords: ['geschafft', 'done', 'complete', 'celebrate'], aliases: ['geschafft 2'] },
  { id: 'StopWatch', src: 'staged:StopWatch.svg', label: 'Stopwatch', category: 'metaphors', keywords: ['Stoppuhr', 'timing', 'sla', 'duration'] },
  { id: 'SandCastle', src: 'staged:SandCastle.svg', label: 'Sand Castle', category: 'metaphors', keywords: ['Sandburg', 'fragile', 'prototype'] },
  { id: 'Snowman', src: 'staged:Snowman.svg', label: 'Snowman', category: 'metaphors', keywords: ['Schneemann', 'frozen', 'winter', 'seasonal'] },
  { id: 'Sun', src: 'staged:Sun.svg', label: 'Sun', category: 'metaphors', keywords: ['Sonne', 'bright', 'healthy', 'up'] },
  { id: 'Sun2', src: 'staged:Sun2.svg', label: 'Sun 2', category: 'metaphors', keywords: ['Sonne', 'bright', 'summer'] },
  { id: 'Tree', src: 'staged:Tree.svg', label: 'Tree', category: 'metaphors', keywords: ['Baum', 'hierarchy', 'growth'] },
  { id: 'KahlerBaum', src: 'staged:Kahler Baum.svg', label: 'Bare Tree', category: 'metaphors', keywords: ['Kahler Baum', 'dormant', 'winter'], aliases: ['Kahler Baum', 'BareTree'] },
  { id: 'Leaf', src: 'staged:Leaf.svg', label: 'Leaf', category: 'metaphors', keywords: ['Blatt', 'leaf', 'node'] },
  { id: 'Laub', src: 'staged:Laub.svg', label: 'Foliage', category: 'metaphors', keywords: ['Laub', 'leaves', 'autumn'] },
  { id: 'Herbstblatt', src: 'staged:Herbstblatt.svg', label: 'Autumn Leaf', category: 'metaphors', keywords: ['Herbstblatt', 'autumn', 'decline', 'deprecated'] },
];

/** Byte-identical duplicates in the staged folder, resolved as aliases instead of shipped twice. */
const DUPLICATE_SOURCES = new Set(['staged:Painter.svg', 'staged:Laster.svg']);

const PX_PER_UNIT = { mm: 96 / 25.4, cm: 96 / 2.54, in: 96, pt: 96 / 72, pc: 16, px: 1, '': 1 };
function toPx(value) {
  const m = /^\s*([0-9.]+)\s*([a-z]*)\s*$/i.exec(value ?? '');
  if (!m) return undefined;
  return parseFloat(m[1]) * (PX_PER_UNIT[m[2].toLowerCase()] ?? 1);
}

/** Give the root a viewBox from its physical page size so it scales instead of clipping. */
function ensureViewBox(svg) {
  const rootMatch = /<svg\b[^>]*>/i.exec(svg);
  if (!rootMatch) throw new Error('No <svg> root');
  const root = rootMatch[0];
  if (/\bviewBox\s*=/.test(root)) return svg;
  const w = toPx(/\bwidth\s*=\s*"([^"]+)"/.exec(root)?.[1]);
  const h = toPx(/\bheight\s*=\s*"([^"]+)"/.exec(root)?.[1]);
  if (!w || !h) throw new Error('Root has neither viewBox nor width/height');
  const patched = root.replace(/<svg\b/i, `<svg viewBox="0 0 ${w.toFixed(2)} ${h.toFixed(2)}"`);
  return svg.replace(root, patched);
}

function svgoConfig(id) {
  return {
    multipass: true,
    floatPrecision: 1,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            // (svgo 4 keeps the viewBox by default — it is the whole point of the normalisation.)
            // EMF exports carry ids on every path; nothing references them.
            cleanupIds: { minify: true, remove: true },
          },
        },
      },
      'removeDimensions',
      'convertStyleToAttrs',
      { name: 'prefixIds', params: { prefix: `aimg-${id}` } },
      { name: 'removeAttrs', params: { attrs: ['sodipodi:*', 'inkscape:*', 'version'] } },
    ],
  };
}

function resolveSource(src) {
  const [scheme, file] = src.split(/:(.+)/);
  const dir = scheme === 'otw' ? OTW : STAGED;
  return path.join(dir, file);
}

/** Pure line drawings whose only strokes are EMF hairlines (`0.001px` = "one device pixel"). */
function isHairlineArt(svg) {
  return /stroke-width:0\.001px/.test(svg) && !/fill:#(?!000000)[0-9a-f]{6}/i.test(svg);
}

/**
 * The OTW UML glyphs (Actor, Boundary/Control/Entity, workers) are hairline drawings that also sit
 * partly outside their EMF page. Give them a stroke proportional to their size (so every line-art
 * glyph reads with the same weight once scaled into a node) in Warm Graphite, then let Inkscape
 * re-bound the page to the drawing.
 */
function reboundLineArt(svg, id) {
  const root = /<svg\b[^>]*>/i.exec(svg)?.[0] ?? '';
  const w = toPx(/\bwidth\s*=\s*"([^"]+)"/.exec(root)?.[1]) ?? 100;
  const h = toPx(/\bheight\s*=\s*"([^"]+)"/.exec(root)?.[1]) ?? 100;
  const stroke = Math.max(2.5, Math.max(w, h) * 0.03).toFixed(2);
  const thick = svg
    .replace(/stroke-width:0\.001px/g, `stroke-width:${stroke}px`)
    .replace(/stroke:#000000/gi, 'stroke:#1F2937');
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'aimglyph-'));
  const input = path.join(tmp, `${id}.in.svg`);
  const output = path.join(tmp, `${id}.svg`);
  writeFileSync(input, thick);
  execFileSync('inkscape', [input, '--export-area-drawing', '--export-plain-svg', '--export-type=svg', `--export-filename=${output}`], { stdio: 'ignore' });
  const result = readFileSync(output, 'utf8');
  rmSync(tmp, { recursive: true, force: true });
  // The EMF conversion lost the y-axis inversion: Actor's head lands at the bottom and Entity's
  // underline on top. Mirror the drawing back inside its (now tight) page.
  const outRoot = /<svg\b[^>]*>/i.exec(result)?.[0] ?? '';
  const pageH = toPx(/\bheight\s*=\s*"([^"]+)"/.exec(outRoot)?.[1]) ?? h;
  return result
    .replace(outRoot, `${outRoot}<g transform="matrix(1 0 0 -1 0 ${pageH.toFixed(3)})">`)
    .replace(/<\/svg>\s*$/i, '</g></svg>');
}

async function main() {
  for (const dir of [STAGED, OTW]) {
    if (!existsSync(dir)) throw new Error(`Source folder not found: ${dir}`);
  }

  // Every staged SVG must be catalogued (or a declared duplicate) — no silent omissions.
  const staged = (await readdir(STAGED)).filter((f) => f.toLowerCase().endsWith('.svg'));
  const catalogued = new Set(CATALOG.map((e) => e.src));
  const missing = staged.filter((f) => !catalogued.has(`staged:${f}`) && !DUPLICATE_SOURCES.has(`staged:${f}`));
  if (missing.length) throw new Error(`Uncatalogued staged glyphs: ${missing.join(', ')}`);
  const ids = new Set();
  for (const e of CATALOG) {
    if (ids.has(e.id)) throw new Error(`Duplicate glyph id ${e.id}`);
    ids.add(e.id);
  }

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const entries = [];
  let totalIn = 0;
  let totalOut = 0;
  for (const e of CATALOG) {
    const srcPath = resolveSource(e.src);
    const raw = await readFile(srcPath, 'utf8');
    totalIn += Buffer.byteLength(raw);
    const prepared = isHairlineArt(raw) ? reboundLineArt(raw, e.id) : raw;
    const withViewBox = ensureViewBox(prepared);
    const { data } = optimize(withViewBox, { path: srcPath, ...svgoConfig(e.id) });
    const vb = /viewBox="([^"]+)"/.exec(data)?.[1]?.split(/[\s,]+/).map(Number);
    if (!vb || vb.length !== 4) throw new Error(`${e.id}: lost its viewBox`);
    const file = `${e.id}.svg`;
    await writeFile(path.join(OUT_DIR, file), data);
    totalOut += Buffer.byteLength(data);
    entries.push({
      id: e.id,
      file,
      label: e.label,
      category: e.category,
      keywords: e.keywords ?? [],
      aliases: e.aliases ?? [],
      aspect: Number((vb[2] / vb[3]).toFixed(4)),
      bytes: Buffer.byteLength(data),
    });
  }

  const ts = `/**
 * @file StereotypeGlyphCatalog.ts
 * @description GENERATED by scripts/build-stereotype-glyphs.mjs (CR053) — do not edit by hand.
 *
 * The OTW stereotype pictogram library (Dr. Rainer Burkhardt), normalised to viewBox-scaled SVGs
 * shipped in \`assets/stereotypes/\`. ${entries.length} glyphs.
 */
import type { StereotypeGlyphEntry } from './StereotypeGlyphs.js';

export const STEREOTYPE_GLYPH_CATALOG: readonly StereotypeGlyphEntry[] = ${JSON.stringify(entries, null, 2)
    .replace(/"(\w+)":/g, '$1:')
    .replace(/"/g, "'")};
`;
  await writeFile(CATALOG_TS, ts);
  console.log(
    `✔ ${entries.length} stereotype glyphs → ${path.relative(pkgRoot, OUT_DIR)} ` +
      `(${(totalIn / 1048576).toFixed(2)} MB → ${(totalOut / 1048576).toFixed(2)} MB)`,
  );
  const heavy = [...entries].sort((a, b) => b.bytes - a.bytes).slice(0, 5);
  console.log('  heaviest:', heavy.map((h) => `${h.id} ${(h.bytes / 1024).toFixed(0)}KB`).join(', '));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
