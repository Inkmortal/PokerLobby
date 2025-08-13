import React, { useState } from 'react';
import { RangeData } from './RangeBuilder';
import { exportToGTOWizard } from './utils/formats/gtoWizard';

interface ImportExportModalProps {
  rangeData: RangeData;
  onImport: (rangeString: string) => void;
  onClose: () => void;
}

const catppuccin = {
  base: '#1e1e2e',
  mantle: '#181825',
  surface0: '#313244',
  surface1: '#45475a',
  surface2: '#585b70',
  overlay1: '#7f849c',
  subtext0: '#a6adc8',
  text: '#cdd6f4',
  green: '#a6e3a1',
  blue: '#89b4fa',
  red: '#f38ba8',
  yellow: '#f9e2af'
};

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  rangeData,
  onImport,
  onClose
}) => {
  const [importText, setImportText] = useState('');
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [copied, setCopied] = useState(false);
  
  const exportText = exportToGTOWizard(rangeData);
  
  const handleImport = () => {
    if (importText.trim()) {
      onImport(importText);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: catppuccin.surface0,
        borderRadius: '16px',
        width: '600px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: `1px solid ${catppuccin.surface1}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: catppuccin.text
          }}>
            Import/Export Range
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: catppuccin.subtext0,
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
        
        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${catppuccin.surface1}`
        }}>
          <button
            onClick={() => setActiveTab('import')}
            style={{
              flex: 1,
              padding: '1rem',
              background: activeTab === 'import' ? catppuccin.surface1 : 'transparent',
              color: activeTab === 'import' ? catppuccin.text : catppuccin.subtext0,
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'import' ? '600' : '400',
              transition: 'all 0.2s'
            }}
          >
            Import
          </button>
          <button
            onClick={() => setActiveTab('export')}
            style={{
              flex: 1,
              padding: '1rem',
              background: activeTab === 'export' ? catppuccin.surface1 : 'transparent',
              color: activeTab === 'export' ? catppuccin.text : catppuccin.subtext0,
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'export' ? '600' : '400',
              transition: 'all 0.2s'
            }}
          >
            Export
          </button>
        </div>
        
        {/* Content */}
        <div style={{
          padding: '1.5rem',
          flex: 1,
          overflow: 'auto'
        }}>
          {activeTab === 'import' ? (
            <>
              <div style={{
                marginBottom: '1rem'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: catppuccin.text,
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  Paste GTO Wizard/PIO Format
                </label>
                <div style={{
                  padding: '0.5rem',
                  background: catppuccin.mantle,
                  borderRadius: '8px',
                  color: catppuccin.subtext0,
                  fontSize: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  Example: Ac2c:1,Ac2d:0.5,Ac2h:0,Ac2s:0.5,...
                </div>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste your range string here..."
                  style={{
                    width: '100%',
                    height: '300px',
                    padding: '1rem',
                    background: catppuccin.mantle,
                    color: catppuccin.text,
                    border: `1px solid ${catppuccin.surface2}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: '0.5rem 1rem',
                    background: catppuccin.surface1,
                    color: catppuccin.text,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  style={{
                    padding: '0.5rem 1rem',
                    background: catppuccin.green,
                    color: catppuccin.base,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Import Range
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{
                marginBottom: '1rem'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: catppuccin.text,
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  GTO Wizard/PIO Format
                </label>
                <div style={{
                  position: 'relative'
                }}>
                  <textarea
                    value={exportText}
                    readOnly
                    style={{
                      width: '100%',
                      height: '300px',
                      padding: '1rem',
                      background: catppuccin.mantle,
                      color: catppuccin.text,
                      border: `1px solid ${catppuccin.surface2}`,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                      resize: 'vertical'
                    }}
                  />
                  {copied && (
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      background: catppuccin.green,
                      color: catppuccin.base,
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      Copied!
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{
                marginBottom: '1rem',
                padding: '1rem',
                background: catppuccin.surface1,
                borderRadius: '8px'
              }}>
                <h4 style={{
                  color: catppuccin.text,
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Range Statistics
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  color: catppuccin.subtext0
                }}>
                  <div>Total Combos: {Object.keys(rangeData).length}</div>
                  <div>Format: GTO Wizard/PIO</div>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: '0.5rem 1rem',
                    background: catppuccin.surface1,
                    color: catppuccin.text,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
                <button
                  onClick={handleCopy}
                  style={{
                    padding: '0.5rem 1rem',
                    background: catppuccin.blue,
                    color: catppuccin.base,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Copy to Clipboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};