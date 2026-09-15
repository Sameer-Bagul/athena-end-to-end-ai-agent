import React from 'react';
import { AlertTriangle } from 'lucide-react';

export interface VoiceFallbackBannerProps {
  message?: string;
  onOpenSettings?: () => void;
}

export const VoiceFallbackBanner: React.FC<VoiceFallbackBannerProps> = ({
  message = 'Using basic browser speech synthesis fallback. Connect an ElevenLabs, Cartesia, or OpenAI API key for realistic natural voice.',
  onOpenSettings,
}) => {
  return (
    <div style={{
      backgroundColor: 'rgba(254, 243, 199, 0.9)',
      color: '#92400E',
      border: '1px solid #F59E0B',
      borderRadius: '10px',
      padding: '10px 14px',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      margin: '8px 0',
      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0, color: '#D97706' }} />
        <span>{message}</span>
      </div>
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          style={{
            backgroundColor: '#D97706',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            marginLeft: '12px',
            whiteSpace: 'nowrap',
          }}
        >
          Connect Provider
        </button>
      )}
    </div>
  );
};
