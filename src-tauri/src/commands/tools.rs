use crate::state::AppState;
use chrono::Local;
use scraper::{Html, Selector};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager, State};

#[tauri::command]
pub async fn tool_web_search(
    state: State<'_, Arc<AppState>>,
    query: String,
) -> Result<String, String> {
    let url = format!(
        "https://html.duckduckgo.com/html/?q={}",
        urlencoding::encode(&query)
    );

    let res = state
        .http_client
        .get(&url)
        .header(
            "User-Agent",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        )
        .send()
        .await
        .map_err(|e| format!("Search request failed: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("Search API returned status {}", res.status()));
    }

    let html_content = res.text().await.map_err(|e| e.to_string())?;
    let document = Html::parse_document(&html_content);
    let selector = Selector::parse(".result__snippet").map_err(|e| format!("{:?}", e))?;

    let snippets: Vec<String> = document
        .select(&selector)
        .take(3)
        .map(|el| el.text().collect::<Vec<_>>().join(" ").trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    if !snippets.is_empty() {
        let results = snippets
            .iter()
            .map(|s| format!("- {}", s))
            .collect::<Vec<_>>()
            .join("\n\n");
        Ok(format!(
            "I found the following web results for \"{}\":\n\n{}\n\n(Source: DuckDuckGo)",
            query, results
        ))
    } else {
        Ok(format!(
            "I searched for \"{}\" but couldn't find a definitive answer. Try rephrasing or being more specific.",
            query
        ))
    }
}

#[tauri::command]
pub async fn tool_weather(
    state: State<'_, Arc<AppState>>,
    city: String,
    api_key: Option<String>,
) -> Result<String, String> {
    let key = api_key
        .or_else(|| std::env::var("OPENWEATHER_API_KEY").ok())
        .filter(|k| !k.is_empty())
        .ok_or_else(|| "Weather tool is not configured. Please add an OpenWeather API Key in Settings.".to_string())?;

    let url = format!(
        "https://api.openweathermap.org/data/2.5/weather?q={}&units=metric&appid={}",
        urlencoding::encode(&city),
        key
    );

    let res = state
        .http_client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to reach OpenWeather API: {}", e))?;

    if res.status() == reqwest::StatusCode::NOT_FOUND {
        return Ok(format!("Could not find weather data for {}.", city));
    }
    if res.status() == reqwest::StatusCode::UNAUTHORIZED {
        return Err("Weather API Error: Invalid API Key.".to_string());
    }

    let data: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    let weather = &data["weather"][0];
    let main = &data["main"];
    let time_str = Local::now().format("%I:%M %p").to_string();

    Ok(format!(
        "Current weather in {}: {} ({}). Temperature: {}°C. Humidity: {}%. [Source: OpenWeatherMap | {}]",
        data["name"].as_str().unwrap_or(&city),
        weather["main"].as_str().unwrap_or(""),
        weather["description"].as_str().unwrap_or(""),
        main["temp"].as_f64().unwrap_or(0.0),
        main["humidity"].as_i64().unwrap_or(0),
        time_str
    ))
}

#[tauri::command]
pub async fn tool_clock(timezone: Option<String>) -> Result<String, String> {
    let now = Local::now();
    let time_str = now.format("%A, %B %d, %Y - %I:%M:%S %p %Z").to_string();
    if let Some(tz) = timezone {
        Ok(format!("Current system time ({}) is: {}", tz, time_str))
    } else {
        Ok(format!("Current local time is: {}", time_str))
    }
}

#[tauri::command]
pub async fn tool_timer(
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
    seconds: u64,
    label: Option<String>,
) -> Result<String, String> {
    let timer_id = uuid::Uuid::new_v4().to_string();
    let payload = serde_json::json!({
        "id": timer_id,
        "duration": seconds,
        "unit": "seconds",
        "label": label.clone().unwrap_or_else(|| "Timer".to_string())
    });

    if let Some(main) = app.get_webview_window("main") {
        let _ = main.emit("athena:add-timer-ipc", &payload);
    }
    if let Some(widget) = app.get_webview_window("widget") {
        let _ = widget.emit("athena:add-timer-ipc", &payload);
    }

    // Spawn async background countdown
    let app_clone = app.clone();
    let timer_id_clone = timer_id.clone();
    let handle = tokio::spawn(async move {
        tokio::time::sleep(std::time::Duration::from_secs(seconds)).await;
        let remove_payload = serde_json::json!({ "id": timer_id_clone });
        if let Some(main) = app_clone.get_webview_window("main") {
            let _ = main.emit("athena:remove-timer-ipc", &remove_payload);
        }
        if let Some(widget) = app_clone.get_webview_window("widget") {
            let _ = widget.emit("athena:remove-timer-ipc", &remove_payload);
        }
    });

    state.active_timers.lock().await.insert(timer_id, handle);

    let minutes = seconds / 60;
    let secs = seconds % 60;
    let display = if minutes > 0 {
        format!("{}m {}s", minutes, secs)
    } else {
        format!("{}s", seconds)
    };

    Ok(format!(
        "I've set a timer for {}. You should see a countdown appearing in your 3D view now!",
        display
    ))
}

#[tauri::command]
pub async fn tool_news(
    state: State<'_, Arc<AppState>>,
    url: String,
) -> Result<serde_json::Value, String> {
    if !url.starts_with("https://newsapi.org/") {
        return Err("Unauthorized URL: Only newsapi.org is permitted".to_string());
    }

    let res = state
        .http_client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("News API request failed: {}", e))?;

    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    Ok(json)
}

