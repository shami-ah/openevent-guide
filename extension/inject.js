/**
 * OpenEvent Guide - Chrome Extension Content Script
 * Automatically injects the guide agent + chat widget on OpenEvent pages.
 */

(function () {
  const SERVER = "http://localhost:3847";

  // Don't inject twice
  if (document.getElementById("oe-guide-agent-script")) return;

  // Inject browser agent
  const agent = document.createElement("script");
  agent.id = "oe-guide-agent-script";
  agent.src = SERVER + "/agent.js";
  agent.dataset.guideServer = SERVER.replace("http", "ws");
  document.body.appendChild(agent);

  // Inject chat widget
  const widget = document.createElement("script");
  widget.id = "oe-guide-widget-script";
  widget.src = SERVER + "/widget.js";
  widget.dataset.guideServer = SERVER;
  document.body.appendChild(widget);

  console.log("[OpenEvent Guide] Injected on", window.location.hostname);
})();
