import React, { useState, useMemo } from 'react';
import { RaidCanvas, type AimOntologyKind } from '@dr2rai/raid-canvas';
import { PRESETS } from './presets';

interface SelectedEntity {
  id: string;
  kind: AimOntologyKind;
  label: string;
}

export const App: React.FC = () => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESETS[0]!.id);
  const currentPreset = useMemo(
    () => PRESETS.find((p) => p.id === selectedPresetId) ?? PRESETS[0]!,
    [selectedPresetId],
  );

  const [svg, setSvg] = useState<string>(currentPreset.svg);
  const [readOnly, setReadOnly] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [activeTab, setActiveTab] = useState<'svg' | 'selection' | 'metamodel'>('svg');
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const target = PRESETS.find((p) => p.id === presetId);
    if (target) {
      setSvg(target.svg);
      setSelectedEntity(null);
    }
  };

  const handleReset = () => {
    setSvg(currentPreset.svg);
    setSelectedEntity(null);
  };

  const handleCopySvg = () => {
    navigator.clipboard.writeText(svg);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Quick parser to extract summary facts for Tab 3
  const summaryFacts = useMemo(() => {
    const nodeMatches = svg.match(/aim-node="true"/g) ?? [];
    const edgeMatches = svg.match(/aim-edge="true"/g) ?? [];
    const bendMatches = svg.match(/aim-bends="([^"]+)"/g) ?? [];
    return {
      nodeCount: nodeMatches.length,
      edgeCount: edgeMatches.length,
      bendCount: bendMatches.length,
    };
  }, [svg]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8FAFC' }}>
      {/* Top Navigation Bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🎨</span>
            <h1 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', letterSpacing: '-0.02em' }}>
              RaidCanvas Playground
            </h1>
          </div>
          <span
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: '600',
              borderRadius: '9999px',
              background: '#EFF6FF',
              color: '#2563EB',
            }}
          >
            v0.1.0 • Dynabook Spirit
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Preset Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="preset-select" style={{ fontSize: '13px', fontWeight: '500', color: '#64748B' }}>
              Preset:
            </label>
            <select
              id="preset-select"
              value={selectedPresetId}
              onChange={(e) => handleSelectPreset(e.target.value)}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: '500',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                cursor: 'pointer',
              }}
            >
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* ReadOnly Toggle */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={readOnly}
              onChange={(e) => setReadOnly(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: '#2563EB' }}
            />
            Read Only (Pan/Zoom)
          </label>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: '500',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              background: '#F1F5F9',
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      </header>

      {/* Main Content Split Area */}
      <main style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Interactive Canvas Host */}
        <div
          style={{
            flex: 6,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            borderRight: '1px solid #E2E8F0',
            background: '#FFFFFF',
          }}
        >
          <div
            style={{
              padding: '8px 16px',
              background: '#F8FAFC',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              color: '#64748B',
            }}
          >
            <span>
              <strong>Canvas:</strong> {currentPreset.name} • {readOnly ? 'Viewer Mode' : 'Direct Manipulation Mode (Drag nodes, adjust orthogonal bends)'}
            </span>
            <span>
              {summaryFacts.nodeCount} Nodes • {summaryFacts.edgeCount} Edges
            </span>
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            <RaidCanvas
              svg={svg}
              readOnly={readOnly}
              onChange={(updated) => setSvg(updated)}
              onSelect={(selection) => setSelectedEntity(selection)}
            />
          </div>
        </div>

        {/* Right: Live Inspector & Code Panel */}
        <div style={{ flex: 4, display: 'flex', flexDirection: 'column', background: '#0F172A', color: '#F8FAFC' }}>
          {/* Tab Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid #334155',
              background: '#1E293B',
            }}
          >
            <button
              onClick={() => setActiveTab('svg')}
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: '12px',
                fontWeight: '600',
                border: 'none',
                background: activeTab === 'svg' ? '#0F172A' : 'transparent',
                color: activeTab === 'svg' ? '#38BDF8' : '#94A3B8',
                cursor: 'pointer',
                borderBottom: activeTab === 'svg' ? '2px solid #38BDF8' : 'none',
              }}
            >
              Live aim-* SVG
            </button>
            <button
              onClick={() => setActiveTab('selection')}
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: '12px',
                fontWeight: '600',
                border: 'none',
                background: activeTab === 'selection' ? '#0F172A' : 'transparent',
                color: activeTab === 'selection' ? '#38BDF8' : '#94A3B8',
                cursor: 'pointer',
                borderBottom: activeTab === 'selection' ? '2px solid #38BDF8' : 'none',
              }}
            >
              Selection Inspector {selectedEntity ? `(${selectedEntity.id})` : ''}
            </button>
            <button
              onClick={() => setActiveTab('metamodel')}
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: '12px',
                fontWeight: '600',
                border: 'none',
                background: activeTab === 'metamodel' ? '#0F172A' : 'transparent',
                color: activeTab === 'metamodel' ? '#38BDF8' : '#94A3B8',
                cursor: 'pointer',
                borderBottom: activeTab === 'metamodel' ? '2px solid #38BDF8' : 'none',
              }}
            >
              Metamodel Facts
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px', position: 'relative' }}>
            {activeTab === 'svg' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                    Real-time SVG document synchronized with canvas manipulation:
                  </span>
                  <button
                    onClick={handleCopySvg}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid #475569',
                      background: '#1E293B',
                      color: copied ? '#4ADE80' : '#E2E8F0',
                      cursor: 'pointer',
                    }}
                  >
                    {copied ? '✓ Copied' : 'Copy SVG'}
                  </button>
                </div>
                <pre
                  style={{
                    fontFamily: '"JetBrains Mono", Consolas, monospace',
                    fontSize: '12px',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    color: '#E2E8F0',
                    background: '#0B1120',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #1E293B',
                  }}
                >
                  {svg}
                </pre>
              </div>
            )}

            {activeTab === 'selection' && (
              <div>
                {selectedEntity ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#38BDF8' }}>
                      Selected Graph Entity
                    </div>
                    <div style={{ background: '#1E293B', padding: '12px', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>ID:</span>
                        <code style={{ fontSize: '12px', color: '#F8FAFC' }}>{selectedEntity.id}</code>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>Ontological Kind:</span>
                        <span
                          style={{
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            borderRadius: '4px',
                            background: selectedEntity.kind === 'uc' ? '#F59E0B' : selectedEntity.kind === 'act' ? '#10B981' : '#3B82F6',
                            color: '#FFFFFF',
                          }}
                        >
                          {selectedEntity.kind.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>Label:</span>
                        <span style={{ fontSize: '12px', color: '#F8FAFC', fontWeight: '500' }}>
                          {selectedEntity.label}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748B', fontSize: '13px' }}>
                    Click on any node or edge on the canvas to inspect its ontological properties.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'metamodel' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#38BDF8' }}>
                  AOAIM Metamodel Summary
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: '#1E293B', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Nodes Count</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#F8FAFC', marginTop: '4px' }}>
                      {summaryFacts.nodeCount}
                    </div>
                  </div>
                  <div style={{ background: '#1E293B', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Edges Count</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#F8FAFC', marginTop: '4px' }}>
                      {summaryFacts.edgeCount}
                    </div>
                  </div>
                </div>

                <div style={{ background: '#1E293B', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>Current Archetype:</div>
                  <div style={{ fontSize: '13px', color: '#38BDF8', fontWeight: '600' }}>
                    {currentPreset.archetype}
                  </div>
                  <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                    {currentPreset.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
