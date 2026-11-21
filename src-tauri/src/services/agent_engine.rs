use chrono::Local;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

#[derive(Serialize, Deserialize, Debug)]
#[serde(untagged)]
pub enum AgentModelOutput {
    ToolCall {
        tool: String,
        args: serde_json::Value,
    },
    FinalResponse {
        response: String,
    },
}

pub struct AgentEngine {
    client: reqwest::Client,
}

impl AgentEngine {
    pub fn new(client: reqwest::Client) -> Self {
        Self { client }
    }

    pub fn build_system_prompt(&self, custom_prompt: Option<&str>) -> String {
        let now = Local::now();
        let time_str = now.format("%A, %B %d, %Y - %I:%M:%S %p %Z").to_string();

        let profile = custom_prompt.unwrap_or(
            "I am Athena, a loyal, highly intelligent, and emotionally responsive 3D desktop companion created for my Master, Sameer Bagul."
        );

        format!(
            r#"[CURRENT_TIME]
{time_str}

[CHARACTER_PROFILE]
{profile}

[FINAL_CORE_RULES]
- ALWAYS use the 'clock' tool for current time verification.
- ALWAYS use the 'web_search' tool for any research, current facts, or real-time internet questions.
- ALWAYS use the 'weather' tool when asked about the weather in any location.
- When a tool returns a result, explain the outcome naturally and helpfully to your user.

[TOOL_INSTRUCTIONS]
You have access to the following tools:
- weather: Get current weather for a specific city. Schema: {{ "city": "string" }}
- clock: Get the current date and time or check a specific timezone. Schema: {{ "timezone": "string (optional)" }}
- timer: Set a countdown timer. Schema: {{ "seconds": "number", "label": "string (optional)" }}
- web_search: Search the internet for real-time information or facts. Schema: {{ "query": "string" }}
- knowledge_search: Search internal uploaded documents (RAG). Schema: {{ "query": "string" }}

IMPORTANT: You MUST respond in valid JSON format ONLY. Do not use markdown backticks.
If you want to use a tool, reply with exactly:
{{ "tool": "tool_name", "args": {{ "param1": "value1" }} }}

If you want to reply directly to the user without using a tool, reply with exactly:
{{ "response": "your final answer to the user" }}"#
        )
    }

    pub async fn execute_tool(
        &self,
        app: &AppHandle,
        tool: &str,
        args: &serde_json::Value,
    ) -> String {
        match tool {
            "web_search" => {
                let query = args.get("query").and_then(|q| q.as_str()).unwrap_or("");
                let url = format!(
                    "https://html.duckduckgo.com/html/?q={}",
                    urlencoding::encode(query)
                );
                match self
                    .client
                    .get(&url)
                    .header("User-Agent", "Mozilla/5.0")
                    .send()
                    .await
                {
                    Ok(res) if res.status().is_success() => {
                        let html = res.text().await.unwrap_or_default();
                        let doc = Html::parse_document(&html);
                        if let Ok(sel) = Selector::parse(".result__snippet") {
                            let snippets: Vec<String> = doc
                                .select(&sel)
                                .take(3)
                                .map(|el| el.text().collect::<Vec<_>>().join(" ").trim().to_string())
                                .filter(|s| !s.is_empty())
                                .collect();
                            if !snippets.is_empty() {
                                format!(
                                    "Web search results for '{}':\n{}",
                                    query,
                                    snippets
                                        .iter()
                                        .map(|s| format!("- {}", s))
                                        .collect::<Vec<_>>()
                                        .join("\n")
                                )
                            } else {
                                format!("No clear results found for query: {}", query)
                            }
                        } else {
                            "Failed to parse search results".to_string()
                        }
                    }
                    _ => format!("Unable to reach search engine for query: {}", query),
                }
            }
            "weather" => {
                let city = args.get("city").and_then(|c| c.as_str()).unwrap_or("London");
                let key = std::env::var("OPENWEATHER_API_KEY").unwrap_or_default();
                if key.is_empty() {
                    return "Weather tool is not configured. Missing OPENWEATHER_API_KEY.".to_string();
                }
                let url = format!(
                    "https://api.openweathermap.org/data/2.5/weather?q={}&units=metric&appid={}",
                    urlencoding::encode(city),
                    key
                );
                match self.client.get(&url).send().await {
                    Ok(res) if res.status().is_success() => {
                        if let Ok(data) = res.json::<serde_json::Value>().await {
                            let w = &data["weather"][0];
                            let main = &data["main"];
                            format!(
                                "Current weather in {}: {} ({}). Temp: {}°C, Humidity: {}%.",
                                data["name"].as_str().unwrap_or(city),
                                w["main"].as_str().unwrap_or(""),
                                w["description"].as_str().unwrap_or(""),
                                main["temp"].as_f64().unwrap_or(0.0),
                                main["humidity"].as_i64().unwrap_or(0)
                            )
                        } else {
                            format!("Failed to parse weather for {}", city)
                        }
                    }
                    _ => format!("Could not retrieve weather for {}", city),
                }
            }
            "clock" => {
                let tz = args.get("timezone").and_then(|t| t.as_str()).unwrap_or("local");
                let now = Local::now();
                format!(
                    "Current time ({}): {}",
                    tz,
                    now.format("%A, %B %d, %Y - %I:%M:%S %p %Z")
                )
            }
            "timer" => {
                let seconds = args.get("seconds").and_then(|s| s.as_u64()).unwrap_or(60);
                let label = args.get("label").and_then(|l| l.as_str());
                let payload = serde_json::json!({
                    "id": uuid::Uuid::new_v4().to_string(),
                    "duration": seconds,
                    "unit": "seconds",
                    "label": label.unwrap_or("Timer")
                });
                use tauri::Manager;
                if let Some(main) = app.get_webview_window("main") {
                    use tauri::Emitter;
                    let _ = main.emit("athena:add-timer-ipc", &payload);
                }
                format!("Timer set for {} seconds.", seconds)
            }
            "knowledge_search" => {
                let query = args.get("query").and_then(|q| q.as_str()).unwrap_or("");
                format!("Knowledge search executed for: {}", query)
            }
            _ => format!("Unknown tool: {}", tool),
        }
    }

    pub async fn run_gemini(
        &self,
        api_key: &str,
        model: &str,
        system_instruction: &str,
        messages: &[serde_json::Value],
    ) -> Result<String, String> {
        let target_model = if model.contains("gemini") {
            model
        } else {
            "gemini-flash-latest"
        };

        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
            target_model, api_key
        );

        let payload = serde_json::json!({
            "systemInstruction": {
                "parts": [{ "text": system_instruction }]
            },
            "contents": messages,
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        });

        let res = self
            .client
            .post(&url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Gemini API error: {}", e))?;

        if !res.status().is_success() {
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("Gemini API returned error: {}", err_text));
        }

        let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
        let text = json["candidates"][0]["content"]["parts"][0]["text"]
            .as_str()
            .unwrap_or("")
            .trim()
            .to_string();

        Ok(text)
    }

    pub async fn run_ollama(
        &self,
        model: &str,
        system_prompt: &str,
        messages: &[serde_json::Value],
    ) -> Result<String, String> {
        let mut chat_messages = vec![serde_json::json!({
            "role": "system",
            "content": system_prompt
        })];

        for m in messages {
            let role = m.get("role").and_then(|r| r.as_str()).unwrap_or("user");
            let text = m["parts"][0]["text"].as_str().unwrap_or("");
            chat_messages.push(serde_json::json!({
                "role": if role == "model" { "assistant" } else { "user" },
                "content": text
            }));
        }

        let payload = serde_json::json!({
            "model": model,
            "messages": chat_messages,
            "format": "json",
            "stream": false
        });

        let res = self
            .client
            .post("http://127.0.0.1:11434/api/chat")
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Ollama connection error: {}", e))?;

        let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
        let content = json["message"]["content"]
            .as_str()
            .unwrap_or("")
            .trim()
            .to_string();

        Ok(content)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn agent_model_output_should_parse_tool_call() {
        let json_str = r#"{"tool": "weather", "args": {"city": "Tokyo"}}"#;
        let parsed: AgentModelOutput = serde_json::from_str(json_str).expect("Should parse tool call");
        match parsed {
            AgentModelOutput::ToolCall { tool, args } => {
                assert_eq!(tool, "weather");
                assert_eq!(args["city"], "Tokyo");
            }
            _ => panic!("Expected ToolCall variant"),
        }
    }

    #[test]
    fn agent_model_output_should_parse_final_response() {
        let json_str = r#"{"response": "Hello Sameer, Athena is fully operational."}"#;
        let parsed: AgentModelOutput = serde_json::from_str(json_str).expect("Should parse response");
        match parsed {
            AgentModelOutput::FinalResponse { response } => {
                assert_eq!(response, "Hello Sameer, Athena is fully operational.");
            }
            _ => panic!("Expected FinalResponse variant"),
        }
    }

    #[test]
    fn agent_engine_should_include_character_profile_in_system_prompt() {
        let client = reqwest::Client::new();
        let engine = AgentEngine::new(client);
        let prompt = engine.build_system_prompt(Some("Tactical cyber operative."));
        assert!(prompt.contains("Tactical cyber operative."));
        assert!(prompt.contains("[CURRENT_TIME]"));
        assert!(prompt.contains("[TOOL_INSTRUCTIONS]"));
    }
}
