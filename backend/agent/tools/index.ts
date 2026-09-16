import { Tool } from "./types.js";
import { weatherTool } from "./weather.js";
import { clockTool, timerTool } from "./clock.js";
import { webSearchTool, knowledgeSearchTool } from "./webSearch.js";
import { browserOpenTool, browserSnapshotTool, browserClickTool, browserFillTool } from "./browser.js";

export * from "./types.js";
export * from "./weather.js";
export * from "./clock.js";
export * from "./webSearch.js";
export * from "./browser.js";

export const tools: Tool[] = [
  weatherTool,
  clockTool,
  knowledgeSearchTool,
  timerTool,
  webSearchTool,
  browserOpenTool,
  browserSnapshotTool,
  browserClickTool,
  browserFillTool,
];
