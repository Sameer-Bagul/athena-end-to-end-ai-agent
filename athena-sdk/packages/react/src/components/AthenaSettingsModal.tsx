import React, { useState, useRef } from 'react';
import { Settings, User, UploadCloud, Brain, Volume2, Mic, Eye, X } from 'lucide-react';

export interface AthenaSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: {
    aiProvider: string;
    aiKey: string;
    voiceProvider: string;
    voiceKey: string;
    sttProvider?: string;
    sttKey?: string;
    customAvatarFile?: File | null;
    enableFaceTracking?: boolean;
  }) => void;
}

export const AthenaSettingsModal: React.FC<AthenaSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [aiProvider, setAiProvider] = useState('gemini');
  const [aiKey, setAiKey] = useState('');
  const [voiceProvider, setVoiceProvider] = useState('browser');
  const [voiceKey, setVoiceKey] = useState('');
  const [sttProvider, setSttProvider] = useState('browser');
  const [sttKey, setSttKey] = useState('');
  const [enableFaceTracking, setEnableFaceTracking] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.vrm')) {
        setSelectedFile(file);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      aiProvider,
      aiKey,
      voiceProvider,
      voiceKey,
      sttProvider,
      sttKey,
      customAvatarFile: selectedFile,
      enableFaceTracking,
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
        border: '1px solid #334155',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings style={{ width: '20px', height: '20px', color: '#38BDF8' }} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#38BDF8' }}>
              Athena Agent Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          {/* Custom VRM 3D Avatar Drag & Drop */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <User style={{ width: '14px', height: '14px', color: '#94A3B8' }} />
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8' }}>
                CUSTOM 3D AVATAR (.vrm model)
              </label>
            </div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #334155',
                borderRadius: '10px',
                padding: '16px',
                textAlign: 'center',
                backgroundColor: '#1E293B',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".vrm"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <UploadCloud style={{ width: '32px', height: '32px', color: '#38BDF8', margin: '0 auto' }} />
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#CBD5E1' }}>
                {selectedFile ? `Selected: ${selectedFile.name}` : 'Click or Drag & Drop a .vrm avatar file here'}
              </p>
            </div>
          </div>

          {/* AI Provider Section */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Brain style={{ width: '14px', height: '14px', color: '#38BDF8' }} />
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8' }}>
                AI LLM CONNECTOR
              </label>
            </div>
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#1E293B',
                color: '#F8FAFC',
                border: '1px solid #334155',
                marginBottom: '8px',
                fontWeight: 500,
              }}
            >
              <option value="gemini">Google Gemini 1.5 / 2.0 (Cloud)</option>
              <option value="openai">OpenAI GPT-4o / GPT-4o-mini</option>
              <option value="anthropic">Anthropic Claude 3.5 Sonnet</option>
              <option value="groq">Groq Ultra-Fast (Llama 3.3 70B)</option>
              <option value="deepseek">DeepSeek AI (V3 / R1)</option>
              <option value="ollama">Ollama (Local http://localhost:11434)</option>
              <option value="custom">Custom Agent Gateway (REST / WebSocket)</option>
            </select>

            {aiProvider !== 'ollama' && (
              <input
                type="password"
                placeholder={aiProvider === 'custom' ? 'Endpoint URL or Token' : `${aiProvider.toUpperCase()} API Key`}
                value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#1E293B',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>

          {/* Voice Provider Section */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Volume2 style={{ width: '14px', height: '14px', color: '#38BDF8' }} />
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8' }}>
                SPEECH SYNTHESIS (TTS) CONNECTOR
              </label>
            </div>
            <select
              value={voiceProvider}
              onChange={(e) => setVoiceProvider(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#1E293B',
                color: '#F8FAFC',
                border: '1px solid #334155',
                marginBottom: '8px',
                fontWeight: 500,
              }}
            >
              <option value="browser">Browser Web Speech API (Free Fallback)</option>
              <option value="elevenlabs">ElevenLabs TTS (High Fidelity)</option>
              <option value="cartesia">Cartesia Sonic TTS (Real-time sub-100ms)</option>
              <option value="openai">OpenAI Audio API (tts-1)</option>
              <option value="azure">Azure Cognitive Speech Services</option>
            </select>

            {voiceProvider !== 'browser' && (
              <input
                type="password"
                placeholder={`${voiceProvider.toUpperCase()} API Key`}
                value={voiceKey}
                onChange={(e) => setVoiceKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#1E293B',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>

          {/* Speech-to-Text Section */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Mic style={{ width: '14px', height: '14px', color: '#38BDF8' }} />
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8' }}>
                SPEECH RECOGNITION (STT) CONNECTOR
              </label>
            </div>
            <select
              value={sttProvider}
              onChange={(e) => setSttProvider(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#1E293B',
                color: '#F8FAFC',
                border: '1px solid #334155',
                marginBottom: '8px',
                fontWeight: 500,
              }}
            >
              <option value="browser">Browser WebSpeech STT (Free)</option>
              <option value="deepgram">Deepgram Nova-2 (Real-Time WebSocket)</option>
              <option value="groq-whisper">Groq Whisper API</option>
            </select>

            {sttProvider !== 'browser' && (
              <input
                type="password"
                placeholder={`${sttProvider.toUpperCase()} API Key`}
                value={sttKey}
                onChange={(e) => setSttKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#1E293B',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>

          {/* Face Tracking Toggle */}
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye style={{ width: '16px', height: '16px', color: '#38BDF8' }} />
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Webcam Face Tracking</span>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94A3B8' }}>
                  Rotate Athena's neck & gaze to follow your face via MediaPipe
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={enableFaceTracking}
              onChange={(e) => setEnableFaceTracking(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid #475569',
                backgroundColor: 'transparent',
                color: '#94A3B8',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#0EA5E9',
                color: '#FFFFFF',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
