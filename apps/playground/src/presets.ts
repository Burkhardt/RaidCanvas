import { ROLE_PRESETS } from './rolePresets';
export interface DiagramPreset {
  id: string;
  name: string;
  archetype: string;
  description: string;
  svg: string;
}

export const PRESETS: DiagramPreset[] = [
  {
    id: 'canvas-ergonomics', name: 'Living Stage · Routing & Expressions (0.8.1)', archetype: 'ActivityDiagram',
    description: 'Select an edge, then tap a bend point to delete it in the Inspector. Switch routing in one tap. The formula glyph hides conditions in this diagram only; exported SVG retains the conditions and visibility preference.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 460" id="Ergonomics_081" aim-archetype="ActivityDiagram" aim-routing="normal" aim-show-expressions="true">
      <g aim-node="true" aim-id="Prepare" aim-kind="act" transform="translate(40,200)"><rect width="140" height="70"/><text>Prepare</text></g>
      <g aim-node="true" aim-id="Perform" aim-kind="act" transform="translate(340,200)"><rect width="140" height="70"/><text>Perform</text></g>
      <g aim-node="true" aim-id="Conclude" aim-kind="act" transform="translate(620,200)"><rect width="140" height="70"/><text>Conclude</text></g>
      <g aim-edge="true" aim-id="Pre" aim-source="Prepare" aim-target="Perform" aim-edge-kind="dependency" aim-expression="Ready == true" aim-expression-color="green" aim-bends="240,235; 240,130; 410,130" aim-routing="normal"><path d="M180 235 L240 235 L240 130 L410 130 L410 200"/><text>Pre</text></g>
      <g aim-edge="true" aim-id="Exec" aim-source="Perform" aim-target="Conclude" aim-edge-kind="dependency" aim-expression="Progress &gt; 0" aim-expression-color="blue" aim-routing="normal"><path d="M480 235 L620 235"/><text>Exec</text></g>
      <g aim-edge="true" aim-id="Post" aim-source="Prepare" aim-target="Conclude" aim-edge-kind="dependency" aim-expression="Result != null" aim-expression-color="green" aim-bends="110,365; 690,365" aim-routing="normal"><path d="M110 270 L110 365 L690 365 L690 270"/><text>Post</text></g>
    </svg>`,
  },
  {
    id: 'living-stage-inspector', name: 'Living Stage · Reusable Inspector (0.8.0)', archetype: 'OneUseCaseDiagram',
    description: 'Published DaisyUI inspector, projected attribute tree, Pin, header actions and right-click portal. Duplicate is a local Studio canvas demonstration; application persistence belongs to the consumer.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 400" id="LivingStage_UCC" aim-archetype="OneUseCaseDiagram">
      <g aim-boundary="Class" aim-id="MeetingClass" aim-name="Meeting" aim-elements="ScheduleMeeting" transform="translate(350,80)"><rect width="300" height="220"/></g>
      <g aim-node="true" aim-id="ScheduleMeeting" aim-kind="uc" aim-href="/usecases?select=ScheduleMeeting" aim-properties='{&quot;Meeting&quot;:{&quot;Attributes&quot;:{&quot;Host&quot;:&quot;Person&quot;,&quot;Owner&quot;:&quot;Person&quot;,&quot;Auditor&quot;:&quot;Person&quot;},&quot;Methods&quot;:{&quot;Schedule&quot;:&quot;UseCase&quot;}},&quot;Who&quot;:{&quot;Host&quot;:{&quot;ValueRestriction&quot;:&quot;Person&quot;},&quot;Owner&quot;:{&quot;ValueRestriction&quot;:&quot;Person&quot;}},&quot;Description&quot;:&quot;A reusable inspector presents rich nested properties without stretching the canvas. Descriptions wrap at a readable width and projected roles appear in Cascais Gold.&quot;}' transform="translate(400,160)"><ellipse cx="90" cy="45" rx="90" ry="45"/><text>Schedule Meeting</text></g>
      <g aim-node="true" aim-id="Host" aim-kind="per" transform="translate(100,140)"><rect width="100" height="90"/><text>Host</text></g>
      <g aim-edge="true" aim-id="initiates" aim-source="Host" aim-target="ScheduleMeeting" aim-edge-kind="association" aim-directed="true"><path d="M200 185 L400 205"/><text>initiates</text></g>
    </svg>`,
  },
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
    description: 'Increment 2: Resizable Class boundary enclosure (Class: Contract) containing method UseCases (Close Contract, Sign Contract) inside, with cross-boundary initiating edge from Customer.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 540" id="Contract_UCD" aim-archetype="OneUseCaseDiagram" aim-routing="manhattan">
  <defs>
    <marker id="arrow-classic" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#1F2937" />
    </marker>
    <style>
      .aim-edge { fill: none; stroke: #1F2937; stroke-width: 1.5; }
      text { font-family: Inter, system-ui, sans-serif; }
    </style>
  </defs>

  <!-- Boundaries Layer (zIndex: 0) -->
  <g class="aim-boundaries-layer">
    <!-- Resizable Class Scope Box: Class: Contract -->
    <g aim-boundary="Class" id="boundary_contract" aim-name="Contract" aim-package="Commercial" aim-href="/classes?select=Contract" aim-elements="CloseContract_UC,SignContract_UC" transform="translate(240, 50)">
      <rect width="440" height="360" rx="8" ry="8" fill="rgba(248, 250, 252, 0.65)" stroke="#C59B27" stroke-width="1.5" stroke-dasharray="6,4" />
      <text class="aim-boundary-header-text" x="14" y="22" fill="#1F2937" font-size="12" font-weight="bold" font-family="Inter, system-ui, sans-serif">Class: Contract</text>
    </g>
  </g>

  <!-- Edges -->
  <g class="aim-edges-layer">
    <!-- Cross-boundary initiating edge with AST expression capsule pill -->
    <g aim-edge="true" aim-id="edge-initiate" aim-edge-kind="association" aim-source="Customer_Actor" aim-target="CloseContract_UC" aim-expression="Customer != null" aim-expression-color="green" aim-satisfied="true" aim-bends="140,150; 320,150">
      <path d="M 140 150 L 320 150" class="aim-edge" stroke="#F59E0B" stroke-width="2" marker-end="url(#arrow-classic)" />
      <text x="210" y="140" font-size="11" fill="#4B5563" text-anchor="middle">«initiates»</text>
    </g>
    <!-- Internal UseCase dependency -->
    <g aim-edge="true" aim-id="edge-include" aim-edge-kind="dependency" aim-source="CloseContract_UC" aim-target="SignContract_UC" aim-bends="400,195; 400,270">
      <path d="M 400 195 L 400 270" class="aim-edge" stroke-dasharray="5,5" marker-end="url(#arrow-classic)" />
      <text x="420" y="235" font-size="11" fill="#4B5563" text-anchor="start">«includes»</text>
    </g>
  </g>

  <!-- Nodes -->
  <g class="aim-nodes-layer">
    <!-- External Actor: Customer -->
    <g aim-node="true" aim-id="Customer_Actor" aim-kind="per" aim-display-name="Customer" aim-href="/actors?select=7010" aim-stereotype="Customer, initiates" transform="translate(50, 95)">
      <rect width="90" height="90" fill="none" stroke="none" />
      <path d="M 61 50 v -4 a 8 8 0 0 0 -8 -8 H 37 a 8 8 0 0 0 -8 8 v 4" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="45" cy="22" r="8" fill="#FFFFFF" stroke="#F59E0B" stroke-width="2" />
      <text x="45" y="68" font-size="12" font-weight="600" fill="#111827" text-anchor="middle">Customer</text>
    </g>

    <!-- Method UseCase 1: Close Contract (INSIDE Class: Contract) -->
    <g aim-node="true" aim-id="CloseContract_UC" aim-kind="uc" aim-display-name="Close Contract" aim-boundary-id="boundary_contract" aim-href="/usecases?select=uc-close-contract" transform="translate(320, 115)">
      <ellipse cx="80" cy="40" rx="80" ry="40" fill="#FFFFFF" stroke="#C59B27" stroke-width="2" />
      <text x="80" y="44" font-size="13" font-weight="bold" fill="#111827" text-anchor="middle">Close Contract</text>
    </g>

    <!-- Method UseCase 2: Sign Contract (INSIDE Class: Contract) -->
    <g aim-node="true" aim-id="SignContract_UC" aim-kind="uc" aim-display-name="Sign Contract" aim-boundary-id="boundary_contract" aim-href="/usecases?select=uc-sign-contract" transform="translate(320, 270)">
      <ellipse cx="80" cy="40" rx="80" ry="40" fill="#FFFFFF" stroke="#C59B27" stroke-width="2" />
      <text x="80" y="44" font-size="13" font-weight="bold" fill="#111827" text-anchor="middle">Sign Contract</text>
    </g>
  </g>
</svg>`,
  },
  {
    id: 'one-activity',
    name: 'OneActivity Diagram',
    archetype: 'OneActivityDiagram',
    description: 'Increment 2: OneActivity Diagram featuring Actor instance (Signer: Customer), Cascais red Activity (MyContract.CloseContract with underlined name and quiet UseCase name CloseContract on top), Object RoleFiller (Host), Precondition boolean expression edge, and Postcondition set expression edge.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 540" id="Contract_OAD" aim-archetype="OneActivityDiagram" aim-routing="manhattan">
  <defs>
    <marker id="arrow-classic" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#1F2937" />
    </marker>
    <style>
      .aim-edge { fill: none; stroke: #1F2937; stroke-width: 1.5; }
      text { font-family: Inter, system-ui, sans-serif; }
    </style>
  </defs>

  <!-- Edges -->
  <g class="aim-edges-layer">
    <!-- Actor executes Activity -->
    <g aim-edge="true" aim-id="edge-executes" aim-edge-kind="association" aim-source="Signer_Actor" aim-target="CloseContract_Act" aim-bends="180,155; 320,155">
      <path d="M 180 155 L 320 155" class="aim-edge" stroke="#1F2937" stroke-width="1.5" marker-end="url(#arrow-classic)" />
      <text x="250" y="145" font-size="11" fill="#4B5563" text-anchor="middle">«executes»</text>
    </g>

    <!-- Precondition boolean expression edge from Host Object to Activity -->
    <g aim-edge="true" aim-id="edge-precondition" aim-edge-kind="association" aim-source="Host_Obj" aim-target="CloseContract_Act" aim-expression="Customer != null" aim-expression-color="green" aim-satisfied="true" aim-bends="250,330; 400,200">
      <path d="M 250 330 L 400 200" class="aim-edge" stroke="#10B981" stroke-width="1.5" marker-end="url(#arrow-classic)" />
      <text x="325" y="275" font-size="11" fill="#10B981" text-anchor="middle">«precondition»</text>
    </g>

    <!-- Postcondition condition/set expression edge from Activity to Host Object -->
    <g aim-edge="true" aim-id="edge-postcondition" aim-edge-kind="association" aim-source="CloseContract_Act" aim-target="Host_Obj" aim-expression='Contract.State := "Closed"' aim-expression-color="red" aim-satisfied="false" aim-bends="450,200; 340,330">
      <path d="M 450 200 L 340 330" class="aim-edge" stroke="#EF4444" stroke-width="1.5" marker-end="url(#arrow-classic)" />
      <text x="410" y="275" font-size="11" fill="#EF4444" text-anchor="middle">«postcondition»</text>
    </g>
  </g>

  <!-- Nodes -->
  <g class="aim-nodes-layer">
    <!-- Actor/Person Instance: Rolefiller name (Signer) underlined, Person name (Customer) quiet on top -->
    <g aim-node="true" aim-id="Signer_Actor" aim-kind="per" aim-instance="true" aim-display-name="Signer" aim-qualifier="Customer" aim-href="/actors?select=Customer" transform="translate(60, 100)">
      <rect width="120" height="110" fill="none" stroke="none" />
      <path d="M 81 54 v -6 a 10 10 0 0 0 -10 -10 H 49 a 10 10 0 0 0 -10 10 v 6" fill="none" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="60" cy="20" r="12" fill="#FFFFFF" stroke="#F59E0B" stroke-width="2.2" />
      <text x="60" y="66" font-size="11" font-style="italic" fill="#4B5563" text-anchor="middle">Customer</text>
      <text x="60" y="84" font-size="12" font-weight="600" fill="#111827" text-anchor="middle" text-decoration="underline">Signer</text>
    </g>

    <!-- Activity: Cascais red rounded rectangle, Activity name (MyContract.CloseContract) underlined, UseCase name (CloseContract) quiet on top -->
    <g aim-node="true" aim-id="CloseContract_Act" aim-kind="act" aim-instance="true" aim-display-name="MyContract.CloseContract" aim-qualifier="CloseContract" aim-href="/activities?activity=act-close-contract" transform="translate(320, 125)">
      <rect width="210" height="65" rx="12" ry="12" fill="#FFFFFF" stroke="#EF4444" stroke-width="2" />
      <text x="105" y="26" font-size="11" font-style="italic" fill="#4B5563" text-anchor="middle">CloseContract</text>
      <text x="105" y="46" font-size="13" font-weight="600" fill="#111827" text-anchor="middle" text-decoration="underline">MyContract.CloseContract</text>
    </g>

    <!-- Object: RoleFiller (Host) -->
    <g aim-node="true" aim-id="Host_Obj" aim-kind="obj" aim-instance="true" aim-display-name="Host" aim-qualifier="RoleFiller" aim-href="/objects?select=Host" transform="translate(240, 330)">
      <rect width="140" height="60" rx="4" ry="4" fill="#FFFFFF" stroke="#10B981" stroke-width="1.8" stroke-dasharray="3 2" />
      <text x="70" y="24" font-size="11" font-style="italic" fill="#4B5563" text-anchor="middle">RoleFiller</text>
      <text x="70" y="42" font-size="13" font-weight="600" fill="#111827" text-anchor="middle" text-decoration="underline">Host</text>
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
