import { ROLE_PRESETS } from './rolePresets';
export interface DiagramPreset {
  id: string;
  name: string;
  archetype: string;
  description: string;
  svg: string;
}

export const PRESETS: DiagramPreset[] = [
  ...ROLE_PRESETS,
  {
    id: 'heraldic-duality',
    name: 'The Duality of the Object (Heraldic Mode)',
    archetype: 'DualityOfTheObject',
    description: 'Flagship demonstration of the Portuguese Bicolor Seam & Portal Door across 6 archetypes. Tap 1 awakens duality; Tap 2 on Door navigates; Tap 2 on Anchor inspects.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 560" id="DualityPantheon_UCD" aim-archetype="DualityOfTheObject" aim-routing="manhattan">
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
    <g aim-edge="true" aim-id="edge-initiate" aim-edge-kind="association" aim-source="Customer_Actor" aim-target="SignContract_UC" aim-bends="170,135; 270,135">
      <path d="M 170 135 L 270 135" class="aim-edge" marker-end="url(#arrow-classic)" />
      <text x="220" y="125" font-size="11" fill="#4B5563" text-anchor="middle">«initiates»</text>
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
    <g aim-edge="true" aim-id="edge-perform" aim-edge-kind="association" aim-source="Headliner_Actor" aim-target="SunsetStage_Plc" aim-bends="170,455; 750,455">
      <path d="M 170 455 L 750 455" class="aim-edge" marker-end="url(#arrow-classic)" />
      <text x="450" y="445" font-size="11" fill="#4B5563" text-anchor="middle">«performsAt»</text>
    </g>
  </g>

  <!-- Nodes -->
  <g class="aim-nodes-layer">
    <!-- 1. Person: Dr. Rainer Burkhardt with Customer Crown on Head -->
    <g aim-node="true" aim-id="Customer_Actor" aim-kind="per" aim-display-name="Dr. Rainer Burkhardt" aim-qualifier="Project Director" aim-href="/actors?select=7010" aim-stereotype="Customer, initiates" transform="translate(50, 80)">
      <rect width="120" height="110" fill="none" stroke="none" />
      <path d="M 81 54 v -6 a 10 10 0 0 0 -10 -10 H 49 a 10 10 0 0 0 -10 10 v 6" fill="none" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="60" cy="20" r="12" fill="#FFFFFF" stroke="#F59E0B" stroke-width="2.2" />
      <g class="aim-stereotype-icon aim-icon-customer" transform="translate(48, -7)">
        <path d="M 4 17.5 L 4 9.5 L 8.5 13 L 12 7 L 15.5 13 L 20 9.5 L 20 17.5 Z M 4 17.5 H 20 V 20 H 4 Z" fill="#F59E0B" />
        <path d="M 4 17.5 L 4 9.5 L 8.5 13 L 12 7 L 15.5 13 L 20 9.5 L 20 17.5 Z M 4 17.5 H 20 V 20 H 4 Z" fill="none" stroke="#F59E0B" stroke-width="1.2" />
        <path d="M 4 9.5 A 1 1 0 1 1 3.9 9.5 Z M 12 7 A 1 1 0 1 1 11.9 7 Z M 20 9.5 A 1 1 0 1 1 19.9 9.5 Z" fill="#FFFFFF" />
      </g>
      <text x="60" y="66" font-size="11" font-style="italic" fill="#4B5563" text-anchor="middle">Project Director</text>
      <text x="60" y="84" font-size="12" font-weight="600" fill="#111827" text-anchor="middle">Dr. Rainer Burkhardt</text>
    </g>

    <!-- 2. Person: Amália with Headliner Star on Chest -->
    <g aim-node="true" aim-id="Headliner_Actor" aim-kind="per" aim-display-name="Amália" aim-qualifier="Fado Diva" aim-href="/actors?select=amalia" aim-stereotype="Headliner" transform="translate(50, 400)">
      <rect width="120" height="110" fill="none" stroke="none" />
      <path d="M 81 54 v -6 a 10 10 0 0 0 -10 -10 H 49 a 10 10 0 0 0 -10 10 v 6" fill="none" stroke="#1F2937" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="60" cy="20" r="12" fill="#FFFFFF" stroke="#1F2937" stroke-width="2.2" />
      <g class="aim-stereotype-icon aim-icon-headliner" transform="translate(52, 38.5)">
        <path d="M 8 0.5 L 10.1 5.1 L 15.6 5.5 L 11.4 9.1 L 12.7 14.5 L 8 11.6 L 3.3 14.5 L 4.6 9.1 L 0.4 5.5 L 5.9 5.1 Z" fill="none" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <text x="60" y="66" font-size="11" font-style="italic" fill="#4B5563" text-anchor="middle">Fado Diva</text>
      <text x="60" y="84" font-size="12" font-weight="600" fill="#111827" text-anchor="middle">Amália</text>
    </g>

    <!-- 3. UseCase: Sign Contract -->
    <g aim-node="true" aim-id="SignContract_UC" aim-kind="uc" aim-display-name="Sign Contract" aim-qualifier="Commercial Workflow" aim-href="/usecases?select=uc-sign-contract" transform="translate(270, 95)">
      <ellipse cx="80" cy="40" rx="80" ry="40" fill="#FFFFFF" stroke="#F59E0B" stroke-width="2" />
      <text x="80" y="32" font-size="11" font-style="italic" fill="#4B5563" text-anchor="middle">Commercial Workflow</text>
      <text x="80" y="48" font-size="13" font-weight="bold" fill="#111827" text-anchor="middle">Sign Contract</text>
    </g>

    <!-- 4. Activity: Verify Identity -->
    <g aim-node="true" aim-id="VerifyIdentity_Act" aim-kind="act" aim-display-name="Verify Identity" aim-qualifier="Security Verification" aim-href="/activities?activity=act-verify-id" transform="translate(510, 105)">
      <rect width="170" height="60" rx="12" ry="12" fill="#FFFFFF" stroke="#EF4444" stroke-width="2" />
      <text x="85" y="24" font-size="11" font-style="italic" fill="#4B5563" text-anchor="middle">Security Verification</text>
      <text x="85" y="40" font-size="13" font-weight="600" fill="#111827" text-anchor="middle" text-decoration="underline">Verify Identity</text>
    </g>

    <!-- 5. Place: Lisbon Stage (Venue Stereotype: Frameless Location Pin) -->
    <g aim-node="true" aim-id="LisbonStage_Plc" aim-kind="plc" aim-display-name="Lisbon Arena" aim-qualifier="Physical Site" aim-stereotype="Venue" aim-href="/places?select=plc-lisbon" transform="translate(750, 80)">
      <rect width="120" height="110" fill="none" stroke="none" />
      <g class="aim-stereotype-icon aim-icon-venue" transform="translate(37.5, 6)">
        <path d="M 22.5 43.5 C 15 33.75 9 26.25 9 16.5 A 13.5 13.5 0 1 1 36 16.5 C 36 26.25 30 33.75 22.5 43.5 Z M 22.5 11.25 A 5.25 5.25 0 1 0 22.5 21.75 A 5.25 5.25 0 1 0 22.5 11.25 Z" fill="#FFFFFF" fill-rule="evenodd" />
        <path d="M 22.5 43.5 C 15 33.75 9 26.25 9 16.5 A 13.5 13.5 0 1 1 36 16.5 C 36 26.25 30 33.75 22.5 43.5 Z M 22.5 11.25 A 5.25 5.25 0 1 0 22.5 21.75 A 5.25 5.25 0 1 0 22.5 11.25 Z M 7.5 49.5 C 7.5 47.25 14.25 45.75 22.5 45.75 C 30.75 45.75 37.5 47.25 37.5 49.5 C 37.5 51.75 30.75 53.25 22.5 53.25 C 14.25 53.25 7.5 51.75 7.5 49.5 Z" fill="none" stroke="#1F2937" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <text x="60" y="66" font-size="11" font-style="italic" fill="#4B5563" text-anchor="middle">Physical Site</text>
      <text x="60" y="84" font-size="12" font-weight="600" fill="#111827" text-anchor="middle">Lisbon Arena</text>
    </g>

    <!-- 6. Place: Sunset Stage (Stage Stereotype: Frameless Festival Truss) -->
    <g aim-node="true" aim-id="SunsetStage_Plc" aim-kind="plc" aim-display-name="Sunset Stage" aim-qualifier="Main Concert Rig" aim-stereotype="Stage" aim-href="/places?select=plc-sunset" transform="translate(750, 400)">
      <rect width="120" height="110" fill="none" stroke="none" />
      <text x="60" y="66" font-size="11" font-style="italic" fill="#4B5563" text-anchor="middle">Main Concert Rig</text>
      <text x="60" y="84" font-size="12" font-weight="600" fill="#111827" text-anchor="middle">Sunset Stage</text>
    </g>

    <!-- 7. Object: Signed Contract Document -->
    <g aim-node="true" aim-id="ContractDoc_Obj" aim-kind="obj" aim-display-name="Signed Contract" aim-qualifier="Legal Artifact" aim-instance="true" aim-href="/objects?select=obj-contract-doc" transform="translate(270, 270)">
      <rect width="160" height="70" fill="#FFFFFF" stroke="#F59E0B" stroke-width="1.5" />
      <text x="80" y="28" font-size="11" font-style="italic" fill="#4B5563" text-anchor="middle">Legal Artifact</text>
      <text x="80" y="46" font-size="12" font-weight="600" fill="#111827" text-anchor="middle" text-decoration="underline">Signed Contract</text>
    </g>

    <!-- 8. Role: Signer Role -->
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
    description: 'Initiating role, core UseCase ellipse, and included verification UseCase with ontological deep links.',
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

    <g aim-node="true" aim-id="VerifyIdentity_Act" aim-kind="uc" aim-display-name="Verify Identity" aim-href="/activities?activity=act-verify-id" transform="translate(500, 100)">
      <rect width="150" height="60" rx="12" ry="12" fill="#FFFFFF" stroke="#EF4444" stroke-width="2" />
      <text x="75" y="30" font-size="13" font-weight="600" fill="#111827" text-anchor="middle" dominant-baseline="central" >Verify Identity</text>
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
