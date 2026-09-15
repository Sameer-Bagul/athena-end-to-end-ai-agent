import { useState, useEffect, useRef } from 'react';
import { AthenaEngine, EngineStatus, ExpressionPreset } from '@athena-ai/core';

export function useAthenaAgent(engine: AthenaEngine | null) {
  const [status, setStatus] = useState<EngineStatus>('idle');
  const [expression, setExpression] = useState<ExpressionPreset>('neutral');
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!engine) return;

    const handleStatus = (s: EngineStatus) => setStatus(s);
    const handleExpression = (e: ExpressionPreset) => setExpression(e);
    const handleTranscript = (t: string) => setLastTranscript(t);
    const handleWarning = (w: string) => setWarningMessage(w);

    engine.on('status-change', handleStatus);
    engine.on('expression-change', handleExpression);
    engine.on('transcript', handleTranscript);
    engine.on('warning', handleWarning);

    return () => {
      engine.off('status-change', handleStatus);
      engine.off('expression-change', handleExpression);
      engine.off('transcript', handleTranscript);
      engine.off('warning', handleWarning);
    };
  }, [engine]);

  return {
    status,
    expression,
    lastTranscript,
    warningMessage,
    say: (text: string) => engine?.say(text),
    ask: (prompt: string) => engine?.ask(prompt),
    listen: () => engine?.listen(),
    setEmotion: (exp: ExpressionPreset) => engine?.setEmotion(exp),
  };
}
