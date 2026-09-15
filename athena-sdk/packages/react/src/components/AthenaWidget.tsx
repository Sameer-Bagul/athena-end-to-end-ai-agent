import React, { useState, useRef } from 'react';
import { Bot, Settings, Minimize2, Mic, Send, Sparkles, Brain, Volume2 } from 'lucide-react';
import { AthenaCanvas } from './AthenaCanvas.js';
import { VoiceFallbackBanner } from './VoiceFallbackBanner.js';
import { AthenaSettingsModal } from './AthenaSettingsModal.js';
import {
  AthenaEngine,
  AIProviderAdapter,
  GeminiAdapter,
  OpenAIAdapter,
  AnthropicAdapter,
  GroqAdapter,
  DeepSeekAdapter,
  OllamaAdapter,
  CustomAgentAdapter,
  ElevenLabsTTSAdapter,
  OpenAITTSAdapter,
  CartesiaTTSAdapter,
  AzureTTSAdapter,
} from '@athena-ai/core';

export interface AthenaWidgetProps {
  avatarUrl?: string;
  apiKey?: string;
  defaultAiProvider?: string;
  position?: 'bottom-right' | 'bottom-left' | 'inline';
  theme?: 'dark' | 'light';
}

export const AthenaWidget: React.FC<AthenaWidgetProps> = ({
  avatarUrl = '/models/athena.vrm',
  apiKey = '',
  position = 'bottom-right',
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [showWarning, setShowWarning] = useState(true);
  const [statusText, setStatusText] = useState<'idle' | 'thinking' | 'speaking' | 'listening'>('idle');
  const engineRef = useRef<AthenaEngine | null>(null);

  const [aiAdapter, setAiAdapter] = useState<AIProviderAdapter>(() => new GeminiAdapter({ apiKey }));
  const [ttsAdapter, setTtsAdapter] = useState<any>(null);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || !engineRef.current) return;
    const text = prompt;
    setPrompt('');
    setStatusText('thinking');
    try {
      await engineRef.current.ask(text);
    } finally {
      setStatusText('idle');
    }
  };

  const handleMicClick = () => {
    if (engineRef.current) {
      setStatusText('listening');
      engineRef.current.listen();
    }
  };

  const handleSaveSettings = async (settings: {
    aiProvider: string;
    aiKey: string;
    voiceProvider: string;
    voiceKey: string;
    sttProvider?: string;
    sttKey?: string;
    customAvatarFile?: File | null;
    enableFaceTracking?: boolean;
  }) => {
    // Custom VRM Avatar reload
    if (settings.customAvatarFile && engineRef.current) {
      await engineRef.current.loadCustomAvatarFile(settings.customAvatarFile);
    }

    // Face Tracking
    if (engineRef.current) {
      if (settings.enableFaceTracking) {
        engineRef.current.startFaceTracking();
      } else {
        engineRef.current.stopFaceTracking();
      }
    }

    // Switch AI Provider
    if (settings.aiProvider === 'anthropic' && settings.aiKey) {
      setAiAdapter(new AnthropicAdapter({ apiKey: settings.aiKey }));
    } else if (settings.aiProvider === 'groq' && settings.aiKey) {
      setAiAdapter(new GroqAdapter({ apiKey: settings.aiKey }));
    } else if (settings.aiProvider === 'deepseek' && settings.aiKey) {
      setAiAdapter(new DeepSeekAdapter({ apiKey: settings.aiKey }));
    } else if (settings.aiProvider === 'openai' && settings.aiKey) {
      setAiAdapter(new OpenAIAdapter({ apiKey: settings.aiKey }));
    } else if (settings.aiProvider === 'ollama') {
      setAiAdapter(new OllamaAdapter());
    } else if (settings.aiProvider === 'custom') {
      setAiAdapter(new CustomAgentAdapter({ endpoint: settings.aiKey }));
    } else if (settings.aiKey) {
      setAiAdapter(new GeminiAdapter({ apiKey: settings.aiKey }));
    }

    // Switch Voice Provider
    if (settings.voiceProvider === 'cartesia' && settings.voiceKey) {
      setTtsAdapter(new CartesiaTTSAdapter({ apiKey: settings.voiceKey }));
      setShowWarning(false);
    } else if (settings.voiceProvider === 'azure' && settings.voiceKey) {
      setTtsAdapter(new AzureTTSAdapter({ subscriptionKey: settings.voiceKey, region: 'eastus' }));
      setShowWarning(false);
    } else if (settings.voiceProvider === 'elevenlabs' && settings.voiceKey) {
      setTtsAdapter(new ElevenLabsTTSAdapter({ apiKey: settings.voiceKey }));
      setShowWarning(false);
    } else if (settings.voiceProvider === 'openai' && settings.voiceKey) {
      setTtsAdapter(new OpenAITTSAdapter({ apiKey: settings.voiceKey }));
      setShowWarning(false);
    } else {
      setTtsAdapter(null);
      setShowWarning(true);
    }
  };

  const positionStyles: React.CSSProperties =
    position === 'bottom-right'
      ? { position: 'fixed', bottom: '24px', right: '24px', zIndex: 9000 }
      : position === 'bottom-left'
      ? { position: 'fixed', bottom: '24px', left: '24px', zIndex: 9000 }
      : { position: 'relative', width: '100%', height: '100%' };

  return (
    <div style={positionStyles}>
      {isOpen ? (
        <div style={{
          width: '380px',
          height: '560px',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(14, 165, 233, 0.25), 0 0 0 1px rgba(56, 189, 248, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {/* Top Header Bar */}
          <div style={{
            padding: '14px 18px',
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(51, 65, 85, 0.6)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bot style={{ width: '22px', height: '22px', color: '#38BDF8' }} />
              <div>
                <div style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '14px', letterSpacing: '0.02em' }}>
                  Athena 3D AI
                </div>
                <div style={{ fontSize: '11px', color: '#0EA5E9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {statusText === 'thinking' ? (
                    <><Brain style={{ width: '12px', height: '12px', color: '#38BDF8' }} /> Thinking...</>
                  ) : statusText === 'listening' ? (
                    <><Mic style={{ width: '12px', height: '12px', color: '#EF4444' }} /> Listening...</>
                  ) : statusText === 'speaking' ? (
                    <><Volume2 style={{ width: '12px', height: '12px', color: '#10B981' }} /> Speaking...</>
                  ) : (
                    <><span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} /> Online</>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setIsSettingsOpen(true)}
                title="Configure Connectors"
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
              >
                <Settings style={{ width: '18px', height: '18px' }} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize Widget"
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
              >
                <Minimize2 style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          </div>

          {/* Voice Fallback Warning Badge */}
          {showWarning && (
            <div style={{ padding: '0 12px' }}>
              <VoiceFallbackBanner onOpenSettings={() => setIsSettingsOpen(true)} />
            </div>
          )}

          {/* 3D Canvas Viewport */}
          <div style={{ flex: 1, position: 'relative', backgroundColor: '#020617' }}>
            <AthenaCanvas
              avatarUrl={avatarUrl}
              aiProvider={aiAdapter}
              ttsProvider={ttsAdapter}
              onEngineReady={(engine) => {
                engineRef.current = engine;
              }}
            />
          </div>

          {/* Controls Bar */}
          <form onSubmit={handleSend} style={{ padding: '14px', backgroundColor: 'rgba(30, 41, 59, 0.8)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleMicClick}
              title="Voice Input"
              style={{
                backgroundColor: statusText === 'listening' ? '#EF4444' : '#334155',
                color: '#F8FAFC',
                border: 'none',
                borderRadius: '10px',
                padding: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
              }}
            >
              <Mic style={{ width: '18px', height: '18px' }} />
            </button>
            <input
              type="text"
              placeholder="Ask Athena anything..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: '#0F172A',
                color: '#F8FAFC',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: '#0EA5E9',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
              }}
            >
              <Send style={{ width: '16px', height: '16px' }} />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            backgroundColor: '#0EA5E9',
            color: '#FFFFFF',
            borderRadius: '9999px',
            width: '64px',
            height: '64px',
            border: 'none',
            boxShadow: '0 10px 25px -3px rgba(14, 165, 233, 0.6)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
          }}
        >
          <Bot style={{ width: '32px', height: '32px' }} />
        </button>
      )}

      {/* Settings Modal */}
      <AthenaSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
};
