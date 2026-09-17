export interface DiagramPreset {
  id: string;
  name: string;
  archetype: string;
  description: string;
  svg: string;
}

export const PRESETS: DiagramPreset[] = [
  {
    id: 'heraldic-duality',
    name: 'The Duality of the Object (Heraldic Mode)',
    archetype: 'DualityOfTheObject',
    description: 'Flagship demonstration of the Portuguese Bicolor Seam & Portal Door across 6 archetypes. Tap 1 awakens duality; Tap 2 on Door navigates; Tap 2 on Anchor inspects.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 460" id="DualityPantheon_UCD" aim-archetype="DualityOfTheObject" aim-routing="manhattan">
  <defs>
    <marker id="arrow-classic" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#1F2937" />
    </marker>
    <style>
      .aim-edge { fill: none; stroke: #1F2937; stroke-width: 1.5; }
      text { font-family: Inter, system-ui, sans-serif; }
      .aim-act text, .aim-obj text { text-decoration: underline; }
    </style>
  </defs>

  <!-- Edges -->
  <g class="aim-edges-layer">
    <g aim-edge="true" aim-id="edge-initiate" aim-edge-kind="association" aim-source="Customer_Actor" aim-target="SignContract_UC" aim-bends="180,135; 270,135">
      <path d="M 180 135 L 270 135" class="aim-edge" marker-end="url(#arrow-classic)" />
      <text x="225" y="125" font-size="11" fill="#4B5563" text-anchor="middle">«initiates»</text>
    </g>
    <g aim-edge="true" aim-id="edge-include" aim-edge-kind="dependency" aim-source="SignContract_UC" aim-target="VerifyIdentity_Act" aim-bends="430,135; 510,135">
      <path d="M 430 135 L 510 135" class="aim-edge" stroke-dasharray="5,5" marker-end="url(#arrow-classic)" />
      <text x="470" y="125" font-size="11" fill="#4B5563" text-anchor="middle">«includes»</text>
    </g>
    <g aim-edge="true" aim-id="edge-location" aim-edge-kind="association" aim-source="VerifyIdentity_Act" aim-target="LisbonStage_Plc" aim-bends="680,135; 750,135">
      <path d="M 680 135 L 750 135" class="aim-edge" marker-end="url(#arrow-classic)" />
      <text x="715" y="125" font-size="11" fill="#4B5563" text-anchor="middle">«locatedIn»</text>
    </g>
    <g aim-edge="true" aim-id="edge-generates" aim-edge-kind="association" aim-source="SignContract_UC" aim-target="ContractDoc_Obj" aim-bends="350,175; 350,270">
      <path d="M 350 175 L 350 270" class="aim-edge" marker-end="url(#arrow-classic)" />
      <text x="365" y="225" font-size="11" fill="#4B5563" text-anchor="start">«generates»</text>
    </g>
    <g aim-edge="true" aim-id="edge-binds" aim-edge-kind="association" aim-source="ContractDoc_Obj" aim-target="SignerRole_Rol" aim-bends="430,305; 510,305">
      <path d="M 430 305 L 510 305" class="aim-edge" marker-end="url(#arrow-classic)" />
      <text x="470" y="295" font-size="11" fill="#4B5563" text-anchor="middle">«binds»</text>
    </g>
  </g>

  <!-- Nodes -->
  <g class="aim-nodes-layer">
    <!-- 1. Person: Dr. Rainer Burkhardt -->
    <g aim-node="true" aim-id="Customer_Actor" aim-kind="per" aim-display-name="Dr. Rainer Burkhardt" aim-qualifier="Project Director" aim-href="/actors?select=7010" aim-stereotype="«initiates»" transform="translate(60, 90)">
      <rect width="120" height="90" fill="none" stroke="none" />
      <path d="M 76 50 v -4 a 8 8 0 0 0 -8 -8 H 52 a 8 8 0 0 0 -8 8 v 4" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="60" cy="22" r="8" fill="#FFFFFF" stroke="#F59E0B" stroke-width="2" />
      <text x="60" y="62" font-size="11" font-style="italic" fill="#4B5563" text-anchor="middle">Project Director</text>
      <text x="60" y="76" font-size="12" font-weight="600" fill="#111827" text-anchor="middle">Dr. Rainer Burkhardt</text>
    </g>

    <!-- 2. UseCase: Sign Contract -->
    <g aim-node="true" aim-id="SignContract_UC" aim-kind="uc" aim-display-name="Sign Contract" aim-qualifier="Commercial Workflow" aim-href="/usecases?select=uc-sign-contract" transform="translate(270, 95)">
      <ellipse cx="80" cy="40" rx="80" ry="40" fill="#FFFFFF" stroke="#F59E0B" stroke-width="2" />
      <text x="80" y="32" font-size="11" font-style="italic" fill="#4B5563" text-anchor="middle">Commercial Workflow</text>
      <text x="80" y="48" font-size="13" font-weight="bold" fill="#111827" text-anchor="middle">Sign Contract</text>
    </g>

    <!-- 3. Activity: Verify Identity -->
    <g aim-node="true" aim-id="VerifyIdentity_Act" aim-kind="act" aim-display-name="Verify Identity" aim-qualifier="Security Verification" aim-href="/activities?activity=act-verify-id" transform="translate(510, 105)">
      <rect width="170" height="60" rx="12" ry="12" fill="#F8FAFC" stroke="#10B981" stroke-width="2" />
      <text x="85" y="24" font-size="11" font-style="italic" fill="#4B5563" text-anchor="middle">Security Verification</text>
      <text x="85" y="40" font-size="13" font-weight="600" fill="#111827" text-anchor="middle" text-decoration="underline">Verify Identity</text>
    </g>

    <!-- 4. Place: Lisbon Stage -->
    <g aim-node="true" aim-id="LisbonStage_Plc" aim-kind="plc" aim-display-name="Lisbon Stage" aim-qualifier="Physical Site" aim-stereotype="Stage" aim-href="/places?select=plc-lisbon" transform="translate(750, 100)">
      <rect width="160" height="70" fill="#FFFFFF" stroke="#F59E0B" stroke-width="1.5" />
      <rect width="160" height="6" fill="#3B82F6" stroke="none" />
      <g class="aim-stereotype-icon aim-icon-stage" transform="translate(12, 23)">
        <path d="M 2 5.5 L 5.5 1.5 H 22.5 L 26 5.5 Z M 2 20.5 H 9 V 23 H 2 Z M 19 20.5 H 26 V 23 H 19 Z M 8.5 13 H 12 V 19.5 H 8.5 Z M 16 13 H 19.5 V 19.5 H 16 Z M 8.5 20.5 H 19.5 V 21.8 H 8.5 Z M 9.5 22.2 H 18.5 V 23.5 H 9.5 Z" fill="#1F2937" />
        <path d="M 7.5 6.5 H 20.5 M 3.5 5.5 V 20.5 M 7.5 5.5 V 20.5 M 3.5 5.5 L 7.5 10.5 M 7.5 5.5 L 3.5 10.5 M 3.5 10.5 L 7.5 15.5 M 7.5 10.5 L 3.5 15.5 M 3.5 15.5 L 7.5 20.5 M 7.5 15.5 L 3.5 20.5 M 20.5 5.5 V 20.5 M 24.5 5.5 V 20.5 M 20.5 5.5 L 24.5 10.5 M 24.5 5.5 L 20.5 10.5 M 20.5 10.5 L 24.5 15.5 M 24.5 10.5 L 20.5 15.5 M 20.5 15.5 L 24.5 20.5 M 24.5 15.5 L 20.5 20.5 M 9.5 6.5 L 8.5 9 M 11.8 6.5 V 9 M 14 6.5 V 9 M 16.2 6.5 V 9 M 18.5 6.5 L 19.5 9 M 7.5 19.5 H 20.5" fill="none" stroke="#1F2937" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M 8 2.2 L 8.4 3.2 L 9.5 3.3 L 8.7 4.1 L 8.9 5.2 L 8 4.6 L 7.1 5.2 L 7.3 4.1 L 6.5 3.3 L 7.6 3.2 Z M 12 2.2 L 12.4 3.2 L 13.5 3.3 L 12.7 4.1 L 12.9 5.2 L 12 4.6 L 11.1 5.2 L 11.3 4.1 L 10.5 3.3 L 11.6 3.2 Z M 16 2.2 L 16.4 3.2 L 17.5 3.3 L 16.7 4.1 L 16.9 5.2 L 16 4.6 L 15.1 5.2 L 15.3 4.1 L 14.5 3.3 L 15.6 3.2 Z M 20 2.2 L 20.4 3.2 L 21.5 3.3 L 20.7 4.1 L 20.9 5.2 L 20 4.6 L 19.1 5.2 L 19.3 4.1 L 18.5 3.3 L 19.6 3.2 Z" fill="#F59E0B" />
      </g>
      <text x="102" y="28" font-size="11" font-style="italic" fill="#4B5563" text-anchor="middle">Physical Site</text>
      <text x="102" y="46" font-size="12" font-weight="600" fill="#111827" text-anchor="middle">Lisbon Stage</text>
    </g>

    <!-- 5. Object: Signed Contract Document -->
    <g aim-node="true" aim-id="ContractDoc_Obj" aim-kind="obj" aim-display-name="Signed Contract" aim-qualifier="Legal Artifact" aim-instance="true" aim-href="/objects?select=obj-contract-doc" transform="translate(270, 270)">
      <rect width="160" height="70" fill="#FFFFFF" stroke="#F59E0B" stroke-width="1.5" />
      <text x="80" y="28" font-size="11" font-style="italic" fill="#4B5563" text-anchor="middle">Legal Artifact</text>
      <text x="80" y="46" font-size="12" font-weight="600" fill="#111827" text-anchor="middle" text-decoration="underline">Signed Contract</text>
    </g>

    <!-- 6. Role: Signer Role -->
    <g aim-node="true" aim-id="SignerRole_Rol" aim-kind="rol" aim-display-name="Signer Role" aim-qualifier="Authorised Agent" aim-href="/roles?select=rol-signer" transform="translate(510, 280)">
      <rect width="170" height="50" fill="#FFFFFF" stroke="#1F2937" stroke-width="1.5" />
      <text x="85" y="22" font-size="11" font-style="italic" fill="#4B5563" text-anchor="middle">Authorised Agent</text>
      <text x="85" y="38" font-size="12" font-weight="600" fill="#111827" text-anchor="middle">Signer Role</text>
    </g>
  </g>
</svg>`,
  },
  {
    id: 'one-use-case',
    name: 'OneUseCase Diagram',
    archetype: 'OneUseCaseDiagram',
    description: 'Initiating role, core UseCase ellipse, and downflow activity verification with ontological deep links.',
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
    <g aim-node="true" aim-id="Customer_Actor" aim-kind="per" aim-display-name="Customer" aim-href="/actors?select=7010" aim-stereotype="«initiates»" transform="translate(50, 85)">
      <rect width="90" height="90" fill="none" stroke="none" />
      <path d="M 61 50 v -4 a 8 8 0 0 0 -8 -8 H 37 a 8 8 0 0 0 -8 8 v 4" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="45" cy="22" r="8" fill="#FFFFFF" stroke="#F59E0B" stroke-width="2" />
      <text x="45" y="68" font-size="12" font-weight="600" fill="#111827" text-anchor="middle">Customer</text>
    </g>

    <g aim-node="true" aim-id="SignContract_UC" aim-kind="uc" aim-display-name="Sign Contract" aim-href="/usecases?select=uc-sign-contract" transform="translate(250, 95)">
      <ellipse cx="70" cy="35" rx="70" ry="35" fill="#FFFFFF" stroke="#F59E0B" stroke-width="2" />
      <text x="70" y="35" font-size="13" font-weight="bold" fill="#111827" text-anchor="middle" dominant-baseline="central">Sign Contract</text>
    </g>

    <g aim-node="true" aim-id="VerifyIdentity_Act" aim-kind="act" aim-display-name="Verify Identity" aim-href="/activities?activity=act-verify-id" transform="translate(500, 100)">
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
    description: 'Ontological class cards with attributes, methods compartments, and entity links.',
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
    <g aim-node="true" aim-id="Contract_Cls" aim-kind="cls" aim-display-name="Contract" aim-href="/classes?select=cls-contract" transform="translate(60, 70)">
      <rect width="180" height="140" fill="#FFFFFF" stroke="#1F2937" stroke-width="1.5" />
      <text x="90" y="24" font-size="13" font-weight="bold" fill="#111827" text-anchor="middle">Contract</text>
    </g>

    <g aim-node="true" aim-id="Signer_Cls" aim-kind="cls" aim-display-name="Signer" aim-href="/classes?select=cls-signer" transform="translate(420, 70)">
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
    description: 'Rounded rectangular process step workflow with Heraldic Green tokens and activity routes.',
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
    <g aim-node="true" aim-id="Step1_Review" aim-kind="act" aim-display-name="Review Draft" aim-href="/activities?activity=act-review" transform="translate(60, 100)">
      <rect width="150" height="60" rx="12" ry="12" fill="#F8FAFC" stroke="#10B981" stroke-width="2" />
      <text x="75" y="30" font-size="13" font-weight="600" fill="#111827" text-anchor="middle" dominant-baseline="central">Review Draft</text>
    </g>

    <g aim-node="true" aim-id="Step2_Approve" aim-kind="act" aim-display-name="Approve Terms" aim-href="/activities?activity=act-approve" transform="translate(320, 100)">
      <rect width="150" height="60" rx="12" ry="12" fill="#F8FAFC" stroke="#10B981" stroke-width="2" />
      <text x="75" y="30" font-size="13" font-weight="600" fill="#111827" text-anchor="middle" dominant-baseline="central">Approve Terms</text>
    </g>

    <g aim-node="true" aim-id="Step3_Archive" aim-kind="act" aim-display-name="Archive Vault" aim-href="/activities?activity=act-archive" transform="translate(580, 100)">
      <rect width="150" height="60" rx="12" ry="12" fill="#F8FAFC" stroke="#10B981" stroke-width="2" />
      <text x="75" y="30" font-size="13" font-weight="600" fill="#111827" text-anchor="middle" dominant-baseline="central">Archive Vault</text>
    </g>
  </g>
</svg>`,
  },
];
