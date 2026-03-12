import { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (groqKey: string, tripoKey: string) => Promise<void>;
}

export default function SettingsModal({ isOpen, onClose, onSave }: SettingsModalProps) {
  const [groqApiKey, setGroqApiKey] = useState(() => {
    return localStorage.getItem('groq_api_key') || '';
  });

  const [tripoApiKey, setTripoApiKey] = useState(() => {
    return localStorage.getItem('tripo_api_key') || '';
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async () => {
    if (!groqApiKey.trim() || !tripoApiKey.trim()) {
      setErrorMessage('Both API keys are required');
      setSaveStatus('error');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      await onSave(groqApiKey, tripoApiKey);

      // Store in localStorage for reference
      localStorage.setItem('groq_api_key', groqApiKey);
      localStorage.setItem('tripo_api_key', tripoApiKey);

      setSaveStatus('success');
      setErrorMessage('');

      // Auto close after 2 seconds
      setTimeout(() => {
        onClose();
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      setSaveStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to save API keys'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            flexShrink: 0,
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
            API Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', flex: 1 }}>
          {/* Info Message */}
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#1e40af',
            }}
          >
            <p style={{ margin: '0 0 4px 0', fontWeight: '600' }}>API Key Configuration</p>
            <p style={{ margin: 0 }}>
              Update your API keys to ensure seamless 3D model generation. Keys are securely stored on the backend.
            </p>
          </div>

          {/* Groq API Key */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
              }}
            >
              Groq API Key
              <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
            </label>
            <input
              type="password"
              value={groqApiKey}
              onChange={(e) => setGroqApiKey(e.target.value)}
              placeholder="Enter your Groq API key..."
              disabled={isSaving}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s',
                backgroundColor: isSaving ? '#f3f4f6' : '#ffffff',
                opacity: isSaving ? 0.6 : 1,
                cursor: isSaving ? 'not-allowed' : 'text',
              }}
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', margin: '6px 0 0 0' }}>
              Get your key from <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>console.groq.com</a>
            </p>
          </div>

          {/* Tripo AI API Key */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
              }}
            >
              Tripo AI API Key
              <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
            </label>
            <input
              type="password"
              value={tripoApiKey}
              onChange={(e) => setTripoApiKey(e.target.value)}
              placeholder="Enter your Tripo AI API key..."
              disabled={isSaving}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s',
                backgroundColor: isSaving ? '#f3f4f6' : '#ffffff',
                opacity: isSaving ? 0.6 : 1,
                cursor: isSaving ? 'not-allowed' : 'text',
              }}
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', margin: '6px 0 0 0' }}>
              Get your key from <a href="https://www.tripo3d.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>tripo3d.ai</a>
            </p>
          </div>

          {/* Status Messages */}
          {saveStatus === 'success' && (
            <div
              style={{
                background: '#dcfce7',
                border: '1px solid #86efac',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#166534',
                fontSize: '14px',
              }}
            >
              <Check size={18} />
              <span>API keys saved successfully!</span>
            </div>
          )}

          {saveStatus === 'error' && errorMessage && (
            <div
              style={{
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                color: '#991b1b',
                fontSize: '14px',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            flexShrink: 0,
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: '10px 16px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s',
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !groqApiKey.trim() || !tripoApiKey.trim()}
            style={{
              padding: '10px 16px',
              background: '#2563eb',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              cursor: isSaving || !groqApiKey.trim() || !tripoApiKey.trim() ? 'not-allowed' : 'pointer',
              opacity: isSaving || !groqApiKey.trim() || !tripoApiKey.trim() ? 0.6 : 1,
              transition: 'background-color 0.3s',
            }}
          >
            {isSaving ? 'Saving...' : 'Save Keys'}
          </button>
        </div>
      </div>
    </div>
  );
}
