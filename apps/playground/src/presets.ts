export interface DiagramPreset {
  id: string;
  name: string;
  archetype: string;
  description: string;
  svg: string;
}

export const PRESETS: DiagramPreset[] = [
  {
    id: 'one-use-case',
    name: 'OneUseCase Diagram',
    archetype: 'OneUseCaseDiagram',
    description: 'Initiating role, core UseCase ellipse, and downflow activity verification.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 500" id="SignContract_UCD" aim-archetype="OneUseCaseDiagram" aim-routing="manhattan">
  <defs>
    <marker id="arrow-classic" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#1F2937" />
    </marker>
    <marker id="arrow-hollow" viewBox="0 0 12 12" refX="12" refY="6" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
      <polygon points="0 0, 12 6, 0 12" fill="#FFFFFF" stroke="#1F2937" stroke-width="1.5" />
    </marker>
    <style>
      .aim-edge { fill: none; stroke: #1F2937; stroke-width: 1.5; }
      text { font-family: Inter, system-ui, sans-serif; }
      .aim-act text, .aim-obj text { text-decoration: underline; }
    </style>
  </defs>

  <!-- Edges -->
  <g class="aim-edges-layer">
    <g aim-edge="true" aim-id="edge-initiate" aim-edge-kind="association" aim-source="Customer_Actor" aim-target="SignContract_UC" aim-bends="140,130; 250,130">
      <path d="M 140 130 L 250 130" class="aim-edge" marker-end="url(#arrow-classic)" />
      <text x="195" y="122" font-size="11" fill="#4B5563" text-anchor="middle">«initiates»</text>
    </g>
    <g aim-edge="true" aim-id="edge-include" aim-edge-kind="dependency" aim-source="SignContract_UC" aim-target="VerifyIdentity_Act" aim-bends="390,130; 500,130">
      <path d="M 390 130 L 500 130" class="aim-edge" stroke-dasharray="5,5" marker-end="url(#arrow-classic)" />
      <text x="445" y="122" font-size="11" fill="#4B5563" text-anchor="middle">«includes»</text>
    </g>
  </g>

  <!-- Nodes -->
  <g class="aim-nodes-layer">
    <g aim-node="true" aim-id="Customer_Actor" aim-kind="per" aim-display-name="Customer" aim-stereotype="«initiates»" transform="translate(50, 85)">
      <rect width="90" height="90" fill="none" stroke="none" />
      <path d="M 61 50 v -4 a 8 8 0 0 0 -8 -8 H 37 a 8 8 0 0 0 -8 8 v 4" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="45" cy="22" r="8" fill="#FFFFFF" stroke="#F59E0B" stroke-width="2" />
      <text x="45" y="68" font-size="12" font-weight="600" fill="#111827" text-anchor="middle">Customer</text>
    </g>

    <g aim-node="true" aim-id="SignContract_UC" aim-kind="uc" aim-display-name="Sign Contract" transform="translate(250, 95)">
      <ellipse cx="70" cy="35" rx="70" ry="35" fill="#FFFFFF" stroke="#F59E0B" stroke-width="2" />
      <text x="70" y="35" font-size="13" font-weight="bold" fill="#111827" text-anchor="middle" dominant-baseline="central">Sign Contract</text>
    </g>

    <g aim-node="true" aim-id="VerifyIdentity_Act" aim-kind="act" aim-display-name="Verify Identity" transform="translate(500, 100)">
      <rect width="150" height="60" rx="12" ry="12" fill="#F8FAFC" stroke="#10B981" stroke-width="2" />
      <text x="75" y="30" font-size="13" font-weight="600" fill="#111827" text-anchor="middle" dominant-baseline="central" text-decoration="underline">Verify Identity</text>
    </g>
  </g>
</svg>`,
  },
  {
    id: 'class-diagram',
    name: 'Class Diagram',
    archetype: 'ClassDiagram',
    description: 'Ontological class cards with attributes and methods compartments.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 500" id="ContractModel_CD" aim-archetype="ClassDiagram">
  <!-- Edges -->
  <g class="aim-edges-layer">
    <g aim-edge="true" aim-id="edge-has" aim-edge-kind="composition" aim-source="Contract_Cls" aim-target="Signer_Cls" aim-bends="240,140; 420,140">
      <path d="M 240 140 L 420 140" class="aim-edge" stroke="#1F2937" stroke-width="1.5" />
      <text x="330" y="132" font-size="11" fill="#4B5563" text-anchor="middle">1..* signers</text>
    </g>
  </g>

  <!-- Nodes -->
  <g class="aim-nodes-layer">
    <g aim-node="true" aim-id="Contract_Cls" aim-kind="cls" aim-display-name="Contract" transform="translate(60, 70)">
      <rect width="180" height="140" fill="#FFFFFF" stroke="#1F2937" stroke-width="1.5" />
      <text x="90" y="24" font-size="13" font-weight="bold" fill="#111827" text-anchor="middle">Contract</text>
    </g>

    <g aim-node="true" aim-id="Signer_Cls" aim-kind="cls" aim-display-name="Signer" transform="translate(420, 70)">
      <rect width="160" height="120" fill="#FFFFFF" stroke="#1F2937" stroke-width="1.5" />
      <text x="80" y="24" font-size="13" font-weight="bold" fill="#111827" text-anchor="middle">Signer</text>
    </g>
  </g>
</svg>`,
  },
  {
    id: 'activity-diagram',
    name: 'Activity Process',
    archetype: 'ActivityDiagram',
    description: 'Rounded rectangular process step workflow with Heraldic Green tokens.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 500" id="ApprovalFlow_AD" aim-archetype="ActivityDiagram">
  <!-- Edges -->
  <g class="aim-edges-layer">
    <g aim-edge="true" aim-id="flow-1" aim-edge-kind="association" aim-source="Step1_Review" aim-target="Step2_Approve" aim-bends="210,130; 320,130">
      <path d="M 210 130 L 320 130" class="aim-edge" stroke="#1F2937" stroke-width="1.5" />
    </g>
    <g aim-edge="true" aim-id="flow-2" aim-edge-kind="association" aim-source="Step2_Approve" aim-target="Step3_Archive" aim-bends="470,130; 580,130">
      <path d="M 470 130 L 580 130" class="aim-edge" stroke="#1F2937" stroke-width="1.5" />
    </g>
  </g>

  <!-- Nodes -->
  <g class="aim-nodes-layer">
    <g aim-node="true" aim-id="Step1_Review" aim-kind="act" aim-display-name="Review Draft" transform="translate(60, 100)">
      <rect width="150" height="60" rx="12" ry="12" fill="#F8FAFC" stroke="#10B981" stroke-width="2" />
      <text x="75" y="30" font-size="13" font-weight="600" fill="#111827" text-anchor="middle" dominant-baseline="central">Review Draft</text>
    </g>

    <g aim-node="true" aim-id="Step2_Approve" aim-kind="act" aim-display-name="Approve Terms" transform="translate(320, 100)">
      <rect width="150" height="60" rx="12" ry="12" fill="#F8FAFC" stroke="#10B981" stroke-width="2" />
      <text x="75" y="30" font-size="13" font-weight="600" fill="#111827" text-anchor="middle" dominant-baseline="central">Approve Terms</text>
    </g>

    <g aim-node="true" aim-id="Step3_Archive" aim-kind="act" aim-display-name="Archive Vault" transform="translate(580, 100)">
      <rect width="150" height="60" rx="12" ry="12" fill="#F8FAFC" stroke="#10B981" stroke-width="2" />
      <text x="75" y="30" font-size="13" font-weight="600" fill="#111827" text-anchor="middle" dominant-baseline="central">Archive Vault</text>
    </g>
  </g>
</svg>`,
  },
];
