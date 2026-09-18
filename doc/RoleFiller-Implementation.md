# Role and RoleFiller diagrams

Implemented for RAI in RaidCanvas by Alan (UI Engineer), September 2026.
Ontology ownership remains with Vasco.

The default playground at `http://localhost:5173` shows System, Person, AIA,
AfricaStage and RAI, one Role definition and two RoleFiller bindings.

## Notation and editing

- `rol` / `aim-rol`: selectable hollow circle. An undirected segment connects
  its owning Class; a solid arrow points to the permitted filler Class.
- `rf` / `aim-rf`: selectable filled circle. An undirected segment connects
  its owning Object; a solid arrow points to the filler Object; a dashed arrow
  points to the Role definition. The green and blue circles are distinct
  bindings even though RAI fills both.
- Object-to-Class instantiation arrows point toward the Class.
- Objects and RoleFiller labels are always underlined. Other shapes use the
  explicit `instance` flag. A binding label can be empty.
- The inspector derives the owner, type, role and filler references from the
  connections. Edges, rather than duplicated ID fields, carry those references.
- A role projects into its owner's attribute compartment as `+ Admin: Person`
  or `- Admin: Person`. Change the Role name/visibility or type Class to update
  that projection. Additional free-form attributes remain independently editable.
- These are diagram kinds, not additions to the six persistence `Kind` tokens.

The UseCase profile filters the palette and validates new connections: only
UseCases and non-instance participant roles (Actor, Role, external Class
symbols) are admitted; connections require a UseCase at one or both ends.
The mixed ClassObject profile permits structural roles, bindings, inheritance,
and instance-to-type connections. Existing mixed demonstration diagrams remain
available as explicitly mixed views.

## Description layout

Object cards accept `description` and `descriptionWidth` (32–50 characters;
default 40). Paragraph breaks are preserved; long unbroken tokens are split.
Card width and height follow the wrapped text. The same layout is used by the
interactive canvas and standalone SVG export. Use the Description wrapping
preset to edit and inspect this behavior.

This adds the facility to RaidCanvas; AfricaStage's separate diagram renderer
has not been changed or deployed by this work.

## SVG contract

`aim-directed="false"` suppresses the arrow on owner segments. `aim-kind="rf"`
round-trips filled circles. Node Description, width, visibility, attributes,
methods and extension properties are preserved as JSON values in their
corresponding `aim-*` attributes. `aim-namespace` retains its plain-string
contract. Derived role attribute rows are rebuilt from the connections.

The playground stacks the inspector below the canvas in narrow Dynabook panels.

Validation covers circle dimensions and colors, underlining, directed and
undirected connections, SVG import/export, role attribute projection,
Description sizing and wrapping, and diagram-specific connection rules.
