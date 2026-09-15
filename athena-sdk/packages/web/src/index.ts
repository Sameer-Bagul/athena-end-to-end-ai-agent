import { AthenaEngine, GeminiAdapter, ElevenLabsTTSAdapter } from '@athena-ai/core';

export class AthenaAgentElement extends HTMLElement {
  private engine: AthenaEngine | null = null;
  private shadow: ShadowRoot;
  private canvas: HTMLCanvasElement | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const avatarUrl = this.getAttribute('avatar-url') || '/models/athena.vrm';
    const apiKey = this.getAttribute('api-key') || '';
    const voiceKey = this.getAttribute('voice-key') || '';

    // Create Shadow DOM UI layout with SVG icons
    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .container {
          width: 360px;
          height: 520px;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(16px);
          border-radius: 16px;
          border: 1px solid rgba(56, 189, 248, 0.2);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(14, 165, 233, 0.25);
        }
        .header {
          padding: 12px 16px;
          background: rgba(30, 41, 59, 0.8);
          color: #f8fafc;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid rgba(51, 65, 85, 0.6);
        }
        .header svg {
          width: 20px;
          height: 20px;
          color: #38bdf8;
        }
        .warning-banner {
          background: rgba(254, 243, 199, 0.9);
          color: #92400e;
          font-size: 11px;
          padding: 8px 12px;
          border-bottom: 1px solid #f59e0b;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .warning-banner svg {
          width: 14px;
          height: 14px;
          color: #d97706;
          flex-shrink: 0;
        }
        .viewport {
          flex: 1;
          position: relative;
          background: #020617;
        }
        canvas {
          width: 100%;
          height: 100%;
        }
        .controls {
          padding: 12px;
          background: rgba(30, 41, 59, 0.8);
          display: flex;
          gap: 8px;
        }
        input {
          flex: 1;
          background: #0f172a;
          border: 1px solid #334155;
          color: #fff;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
        }
        button {
          background: #0ea5e9;
          color: #fff;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
        }
      </style>

      <div class="container">
        <div class="header">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="12" x="3" y="6" rx="2"/><path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M12 2v4"/><path d="M12 18v4"/></svg>
          <span>Athena 3D Agent</span>
        </div>

        ${
          !voiceKey
            ? `<div class="warning-banner">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                Browser speech fallback active. Provide voice-key for realistic ElevenLabs TTS.
               </div>`
            : ''
        }

        <div class="viewport">
          <canvas id="athena-canvas"></canvas>
        </div>

        <form class="controls" id="prompt-form">
          <input type="text" id="prompt-input" placeholder="Ask Athena..." />
          <button type="submit">Send</button>
        </form>
      </div>
    `;

    this.canvas = this.shadow.querySelector('#athena-canvas') as HTMLCanvasElement;
    if (this.canvas) {
      const aiProvider = new GeminiAdapter({ apiKey });
      const ttsProvider = voiceKey ? new ElevenLabsTTSAdapter({ apiKey: voiceKey }) : undefined;

      this.engine = new AthenaEngine({
        canvas: this.canvas,
        avatarUrl,
        aiProvider,
        ttsProvider,
      });

      this.engine.init(avatarUrl);
    }

    const form = this.shadow.querySelector('#prompt-form');
    const input = this.shadow.querySelector('#prompt-input') as HTMLInputElement;

    if (form && input) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = input.value.trim();
        if (val && this.engine) {
          input.value = '';
          this.engine.ask(val);
        }
      });
    }
  }

  disconnectedCallback() {
    if (this.engine) {
      this.engine.destroy();
      this.engine = null;
    }
  }
}

// Auto-register custom element if window is present
if (typeof window !== 'undefined' && !customElements.get('athena-agent')) {
  customElements.define('athena-agent', AthenaAgentElement);
}
