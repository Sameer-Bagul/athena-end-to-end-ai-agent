import React, { useEffect, useRef } from 'react';
import { AthenaEngine, EngineConfig } from '@athena-ai/core';

export interface AthenaCanvasProps extends Omit<EngineConfig, 'canvas'> {
  className?: string;
  style?: React.CSSProperties;
  onEngineReady?: (engine: AthenaEngine) => void;
}

export const AthenaCanvas: React.FC<AthenaCanvasProps> = ({
  avatarUrl,
  aiProvider,
  ttsProvider,
  sttProvider,
  className = '',
  style = {},
  onEngineReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<AthenaEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new AthenaEngine({
      canvas: canvasRef.current,
      avatarUrl,
      aiProvider,
      ttsProvider,
      sttProvider,
    });

    engineRef.current = engine;
    engine.init(avatarUrl).then(() => {
      if (onEngineReady) onEngineReady(engine);
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [avatarUrl]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full min-h-[300px] ${className}`}
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
};
