/**
 * Visual overlay system for the browser agent.
 * Renders highlights, subtitles, and step indicators on top of the app.
 */

const OVERLAY_ID = "oe-guide-overlay";
const SUBTITLE_ID = "oe-guide-subtitle";
const HIGHLIGHT_ID = "oe-guide-highlight";
const SPOTLIGHT_ID = "oe-guide-spotlight";

let overlayRoot: HTMLDivElement | null = null;
let subtitleEl: HTMLDivElement | null = null;
let highlightEl: HTMLDivElement | null = null;
let spotlightEl: HTMLDivElement | null = null;
let subtitleTimeout: ReturnType<typeof setTimeout> | null = null;

function injectStyles(): void {
  if (document.getElementById("oe-guide-overlay-styles")) return;

  const style = document.createElement("style");
  style.id = "oe-guide-overlay-styles";
  style.textContent = `
    #${OVERLAY_ID} {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    #${SUBTITLE_ID} {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      max-width: 600px;
      padding: 12px 24px;
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      font-size: 16px;
      line-height: 1.5;
      border-radius: 12px;
      text-align: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 100001;
      pointer-events: none;
      backdrop-filter: blur(8px);
    }

    #${SUBTITLE_ID}.visible {
      opacity: 1;
    }

    #${SPOTLIGHT_ID} {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 99998;
      pointer-events: none;
    }

    #${SPOTLIGHT_ID}.visible {
      opacity: 1;
    }

    #${HIGHLIGHT_ID} {
      position: fixed;
      border: 3px solid #6366f1;
      border-radius: 8px;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.25), 0 0 20px rgba(99, 102, 241, 0.3);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0;
      z-index: 100000;
      pointer-events: none;
    }

    #${HIGHLIGHT_ID}.visible {
      opacity: 1;
    }

    #${HIGHLIGHT_ID}::after {
      content: '';
      position: absolute;
      inset: -3px;
      border: 3px solid #6366f1;
      border-radius: 8px;
      animation: oe-guide-pulse 2s ease-in-out infinite;
    }

    @keyframes oe-guide-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.05); }
    }

    .oe-guide-click-ripple {
      position: fixed;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.4);
      transform: translate(-50%, -50%) scale(0);
      animation: oe-guide-ripple 0.6s ease-out forwards;
      z-index: 100002;
      pointer-events: none;
    }

    @keyframes oe-guide-ripple {
      0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
    }

    .oe-guide-step-badge {
      position: fixed;
      top: 16px;
      right: 16px;
      padding: 8px 16px;
      background: #6366f1;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      border-radius: 20px;
      z-index: 100001;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
  `;
  document.head.appendChild(style);
}

export function initOverlay(): void {
  if (overlayRoot) return;
  injectStyles();

  overlayRoot = document.createElement("div");
  overlayRoot.id = OVERLAY_ID;
  document.body.appendChild(overlayRoot);

  spotlightEl = document.createElement("div");
  spotlightEl.id = SPOTLIGHT_ID;
  document.body.appendChild(spotlightEl);

  subtitleEl = document.createElement("div");
  subtitleEl.id = SUBTITLE_ID;
  document.body.appendChild(subtitleEl);

  highlightEl = document.createElement("div");
  highlightEl.id = HIGHLIGHT_ID;
  document.body.appendChild(highlightEl);
}

export function showSubtitle(text: string, duration = 5000): void {
  if (!subtitleEl) return;
  if (subtitleTimeout) clearTimeout(subtitleTimeout);

  subtitleEl.textContent = text;
  subtitleEl.classList.add("visible");

  if (duration > 0) {
    subtitleTimeout = setTimeout(() => {
      subtitleEl?.classList.remove("visible");
    }, duration);
  }
}

export function hideSubtitle(): void {
  if (subtitleTimeout) clearTimeout(subtitleTimeout);
  subtitleEl?.classList.remove("visible");
}

export function highlightElement(selector: string, duration = 0): () => void {
  const el = document.querySelector(selector);
  if (!el || !highlightEl) {
    console.warn(`[oe-guide] Element not found: ${selector}`);
    return () => {};
  }

  const rect = el.getBoundingClientRect();
  const pad = 6;

  highlightEl.style.top = `${rect.top - pad}px`;
  highlightEl.style.left = `${rect.left - pad}px`;
  highlightEl.style.width = `${rect.width + pad * 2}px`;
  highlightEl.style.height = `${rect.height + pad * 2}px`;
  highlightEl.classList.add("visible");

  // Spotlight: cut out the highlighted area
  if (spotlightEl) {
    spotlightEl.style.clipPath = `polygon(
      0% 0%, 0% 100%, ${rect.left - pad}px 100%,
      ${rect.left - pad}px ${rect.top - pad}px,
      ${rect.right + pad}px ${rect.top - pad}px,
      ${rect.right + pad}px ${rect.bottom + pad}px,
      ${rect.left - pad}px ${rect.bottom + pad}px,
      ${rect.left - pad}px 100%, 100% 100%, 100% 0%
    )`;
    spotlightEl.classList.add("visible");
  }

  // Scroll into view if needed
  el.scrollIntoView({ behavior: "smooth", block: "center" });

  const clear = () => {
    highlightEl?.classList.remove("visible");
    spotlightEl?.classList.remove("visible");
  };

  if (duration > 0) {
    setTimeout(clear, duration);
  }

  return clear;
}

export function clearHighlight(): void {
  highlightEl?.classList.remove("visible");
  spotlightEl?.classList.remove("visible");
}

export function showClickRipple(x: number, y: number): void {
  const ripple = document.createElement("div");
  ripple.className = "oe-guide-click-ripple";
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  document.body.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

export function showStepBadge(current: number, total: number): void {
  let badge = document.querySelector(".oe-guide-step-badge") as HTMLDivElement;
  if (!badge) {
    badge = document.createElement("div");
    badge.className = "oe-guide-step-badge";
    document.body.appendChild(badge);
  }
  badge.textContent = `Step ${current} of ${total}`;
  badge.style.opacity = "1";
}

export function hideStepBadge(): void {
  const badge = document.querySelector(".oe-guide-step-badge");
  if (badge) badge.remove();
}

export function destroyOverlay(): void {
  overlayRoot?.remove();
  subtitleEl?.remove();
  highlightEl?.remove();
  spotlightEl?.remove();
  document.querySelector(".oe-guide-step-badge")?.remove();
  document.getElementById("oe-guide-overlay-styles")?.remove();
  overlayRoot = null;
  subtitleEl = null;
  highlightEl = null;
  spotlightEl = null;
  if (subtitleTimeout) clearTimeout(subtitleTimeout);
}
