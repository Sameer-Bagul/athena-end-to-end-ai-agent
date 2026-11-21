import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";

export function isTauriEnvironment(): boolean {
  return typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
}

export function initTauriBridge() {
  if (typeof window === "undefined") return;

  // If already running under Electron contextBridge, do not overwrite
  if (window.athena && !isTauriEnvironment()) {
    console.log("[IPC Bridge] Running under Electron environment");
    return;
  }

  console.log("[IPC Bridge] Initializing Tauri 2.0 Native IPC Bridge");

  window.athena = {
    chat: async (messages: any[]) => {
      const lastMsg = messages[messages.length - 1]?.content || "";
      const res: any = await invoke("agent_query", { query: lastMsg });
      return res.response || "";
    },

    tts: async (text: string, voiceStyle = "M1") => {
      try {
        return await invoke<string>("tts_generate", { text, voiceStyle });
      } catch (err: any) {
        console.warn("[Tauri IPC] TTS error:", err);
        return "";
      }
    },

    transcribe: async (buffer: ArrayBuffer) => {
      try {
        const audioBytes = Array.from(new Uint8Array(buffer));
        return await invoke<string>("stt_transcribe", { audioBytes });
      } catch (err: any) {
        console.warn("[Tauri IPC] STT error:", err);
        return "";
      }
    },

    getNews: async (url: string) => {
      return await invoke("tool_news", { url });
    },

    saveChatHistory: async (history: any[]) => {
      return await invoke<boolean>("chat_save_history", { history });
    },

    loadChatHistory: async () => {
      const res: any = await invoke("chat_load_history");
      return Array.isArray(res) ? res : [];
    },

    openWidget: async () => {
      await invoke("widget_open");
    },

    closeWidget: async () => {
      await invoke("widget_close");
    },

    resizeWidget: async (width: number, height: number) => {
      await invoke("widget_resize", { width, height });
    },

    broadcastState: (data: any) => {
      invoke("sync_broadcast", { data }).catch(console.error);
    },

    onSyncReceive: (callback: (data: any) => void) => {
      let unlistenFn: (() => void) | null = null;
      listen("sync:receive", (event: any) => {
        if (Array.isArray(event.payload)) {
          event.payload.forEach(callback);
        } else {
          callback(event.payload);
        }
      }).then((unlisten) => {
        unlistenFn = unlisten;
      });

      return () => {
        if (unlistenFn) unlistenFn();
      };
    },

    sendWidgetInput: (text: string) => {
      invoke("widget_input", { text }).catch(console.error);
    },

    onWidgetInput: (callback: (text: string) => void) => {
      let unlistenFn: (() => void) | null = null;
      listen("widget:receive-input", (event: any) => {
        callback(event.payload);
      }).then((unlisten) => {
        unlistenFn = unlisten;
      });

      return () => {
        if (unlistenFn) unlistenFn();
      };
    },

    minimizeWindow: async () => {
      await invoke("window_minimize");
    },

    maximizeWindow: async () => {
      await invoke("window_maximize");
    },

    closeWindow: async () => {
      await invoke("window_close");
    },

    onShortcutEvent: (callback: (type: "pressed" | "released") => void) => {
      let unlistenFn: (() => void) | null = null;
      listen("shortcut:pressed", () => {
        callback("pressed");
      }).then((unlisten) => {
        unlistenFn = unlisten;
      });

      return () => {
        if (unlistenFn) unlistenFn();
      };
    },

    rag: {
      uploadDocument: async () => {
        try {
          const selected = await openFileDialog({
            multiple: false,
            filters: [{ name: "Documents", extensions: ["pdf", "txt", "md"] }],
          });

          if (!selected) return { canceled: true };
          const filePath = typeof selected === "string" ? selected : (selected as any).path;
          return await invoke("rag_upload_document", { filePath });
        } catch (error: any) {
          console.error("[Tauri RAG] Upload error:", error);
          return { error: error.message };
        }
      },

      getStatus: async () => {
        return await invoke("rag_status");
      },

      clear: async () => {
        await invoke("rag_clear");
        return { success: true };
      },

      getContext: async (input: string) => {
        return await invoke<string>("rag_get_context", { input });
      },
    },

    agent: {
      query: async (query: string, systemPrompt: string, modelName?: string) => {
        return await invoke("agent_query", { query, systemPrompt, modelName });
      },

      queryStream: (
        queryId: string,
        query: string,
        systemPrompt: string,
        modelName?: string,
        apiKey?: string,
        onToken?: (token: string) => void,
        onProgress?: (msg: string) => void
      ) => {
        return new Promise(async (resolve) => {
          const unlistenToken = onToken
            ? await listen<string>(`agent:token-${queryId}`, (e) => onToken(e.payload))
            : null;

          const unlistenProgress = onProgress
            ? await listen<string>(`agent:progress-${queryId}`, (e) => onProgress(e.payload))
            : null;

          const unlistenComplete = await listen<any>(`agent:complete-${queryId}`, (e) => {
            if (unlistenToken) unlistenToken();
            if (unlistenProgress) unlistenProgress();
            unlistenComplete();
            resolve(e.payload);
          });

          invoke("agent_query_stream", {
            queryId,
            query,
            systemPrompt,
            modelName,
            apiKey,
          }).catch((err) => {
            if (unlistenToken) unlistenToken();
            if (unlistenProgress) unlistenProgress();
            unlistenComplete();
            resolve({ success: false, error: err });
          });
        });
      },

      onAddTimer: (callback: (data: any) => void) => {
        let unlistenFn: (() => void) | null = null;
        listen("athena:add-timer-ipc", (e: any) => callback(e.payload)).then((unlisten) => {
          unlistenFn = unlisten;
        });
        return () => {
          if (unlistenFn) unlistenFn();
        };
      },

      onRemoveTimer: (callback: (data: any) => void) => {
        let unlistenFn: (() => void) | null = null;
        listen("athena:remove-timer-ipc", (e: any) => callback(e.payload)).then((unlisten) => {
          unlistenFn = unlisten;
        });
        return () => {
          if (unlistenFn) unlistenFn();
        };
      },

      onMcpStatus: (callback: (data: any) => void) => {
        let unlistenFn: (() => void) | null = null;
        listen("agent:mcp-status", (e: any) => callback(e.payload)).then((unlisten) => {
          unlistenFn = unlisten;
        });
        return () => {
          if (unlistenFn) unlistenFn();
        };
      },
    },

    ollama: {
      checkStatus: async () => invoke("ollama_check_status"),
      listModels: async () => invoke("ollama_list_models"),
      pullModel: (name: string) => {
        invoke("ollama_pull_model", { name }).catch(console.error);
      },
      onPullProgress: (callback: (data: any) => void) => {
        let unlistenFn: (() => void) | null = null;
        listen("ollama:pull-progress", (e: any) => callback(e.payload)).then((unlisten) => {
          unlistenFn = unlisten;
        });
        return () => {
          if (unlistenFn) unlistenFn();
        };
      },
      deleteModel: async (name: string) => invoke("ollama_delete_model", { name }),
    },

    models: {
      checkStatus: async (modelId: string) => invoke("model_check_status", { modelId }),
      pull: (modelId: string) => {
        invoke("model_pull", { modelId }).catch(console.error);
      },
      delete: async (modelId: string) => invoke("model_delete", { modelId }),
      onProgress: (callback: (data: any) => void) => {
        let unlistenFn: (() => void) | null = null;
        listen("model:pull-progress", (e: any) => callback(e.payload)).then((unlisten) => {
          unlistenFn = unlisten;
        });
        return () => {
          if (unlistenFn) unlistenFn();
        };
      },
    },

    system: {
      getVolume: async () => invoke("system_get_volume"),
      setVolume: async (percent: number) => invoke("system_set_volume", { percent }),
      setBrightness: async (percent: number) => invoke("system_set_brightness", { percent }),
      getBattery: async () => invoke("system_get_battery"),
      listFiles: async (targetPath: string) => invoke("system_list_files", { targetPath }),
      readFile: async (targetPath: string) => invoke("system_read_file", { targetPath }),
      fileStats: async (targetPath: string) => invoke("system_file_stats", { targetPath }),
    },

    log: (...args: any[]) => {
      console.log("\x1b[36m[Athena]\x1b[0m", ...args);
    },
  };
}

