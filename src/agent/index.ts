/**
 * OpenEvent Guide - Browser Agent (HTTP version)
 * No WebSocket. Just exposes executeCommand globally.
 * The widget calls it directly after getting commands from the server.
 */

import { initOverlay, destroyOverlay } from "./overlay.js";
import { executeCommand } from "./executor.js";

function init(): void {
  initOverlay();

  // Expose executeCommand globally so the widget can call it
  (window as unknown as Record<string, unknown>).__oeGuide = {
    executeCommand,
    destroy: destroyOverlay,
  };

  console.log("[oe-guide] Agent ready");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
