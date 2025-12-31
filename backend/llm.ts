import fetch from "node-fetch";

export async function chatWithLLM(messages: any[]) {
  const res = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "dolphin-mistral", messages }),
  });
  const json: any = await res.json();
  return json.message?.content ?? "";
}
