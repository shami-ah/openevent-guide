/**
 * Visual overlay: highlights, subtitles and the step counter.
 *
 * Two things this file has to get right:
 *
 * 1. The highlight must follow its element. The box is position:fixed, so a
 *    rect measured before scrollIntoView() is stale the moment the page moves.
 *    It now tracks with requestAnimationFrame while visible, which also covers
 *    resize, sidebar collapse and layout shifts from lazy content.
 *
 * 2. The overlay must not sit on the app's own controls. OpenEvent puts a FAB
 *    bottom-right on many pages and its entire mobile navigation bottom-centre,
 *    which is exactly where subtitles and the guide bubble used to land.
 */

const OVERLAY_ID = "oe-guide-overlay";
const SUBTITLE_ID = "oe-guide-subtitle";
const HIGHLIGHT_ID = "oe-guide-highlight";
const SPOTLIGHT_ID = "oe-guide-spotlight";
const BADGE_CLASS = "oe-guide-step-badge";

let overlayRoot: HTMLDivElement | null = null;
let subtitleEl: HTMLDivElement | null = null;
let highlightEl: HTMLDivElement | null = null;
let spotlightEl: HTMLDivElement | null = null;
let subtitleTimeout: ReturnType<typeof setTimeout> | null = null;

/** State for the tracking loop. */
let trackedEl: Element | null = null;
let trackFrame: number | null = null;
let highlightTimeout: ReturnType<typeof setTimeout> | null = null;

const PAD = 6;

function injectStyles(): void {
  if (document.getElementById("oe-guide-overlay-styles")) return;

  const style = document.createElement("style");
  style.id = "oe-guide-overlay-styles";
  style.textContent = `
    #${OVERLAY_ID} {
      position: fixed; inset: 0; pointer-events: none; z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* Raised to 96px so it clears the guide bubble and the call pill. */
    #${SUBTITLE_ID} {
      position: fixed; bottom: 96px; left: 50%; transform: translateX(-50%);
      max-width: min(600px, calc(100vw - 32px));
      padding: 12px 24px;
      background: rgba(0, 0, 0, 0.85); color: #fff;
      font-size: 16px; line-height: 1.5; border-radius: 12px; text-align: center;
      opacity: 0; transition: opacity 0.3s ease;
      z-index: 100001; pointer-events: none; backdrop-filter: blur(8px);
    }
    #${SUBTITLE_ID}.visible { opacity: 1; }

    #${SPOTLIGHT_ID} {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5);
      opacity: 0; transition: opacity 0.3s ease;
      z-index: 99998; pointer-events: none;
    }
    #${SPOTLIGHT_ID}.visible { opacity: 1; }

    #${HIGHLIGHT_ID} {
      position: fixed;
      border: 3px solid #6366f1; border-radius: 8px;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.25), 0 0 20px rgba(99, 102, 241, 0.3);
      opacity: 0; z-index: 100000; pointer-events: none;
    }
    /* Only fade in. Animating position fights the tracking loop. */
    #${HIGHLIGHT_ID}.visible { opacity: 1; transition: opacity 0.25s ease; }

    #${HIGHLIGHT_ID}::after {
      content: ''; position: absolute; inset: -3px;
      border: 3px solid #6366f1; border-radius: 8px;
      animation: oe-guide-pulse 2s ease-in-out infinite;
    }
    @keyframes oe-guide-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.05); }
    }

    .oe-guide-click-ripple {
      position: fixed; width: 40px; height: 40px; border-radius: 50%;
      background: rgba(99, 102, 241, 0.4);
      transform: translate(-50%, -50%) scale(0);
      animation: oe-guide-ripple 0.6s ease-out forwards;
      z-index: 100002; pointer-events: none;
    }
    @keyframes oe-guide-ripple {
      0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
    }

    .${BADGE_CLASS} {
      position: fixed; top: 16px; right: 16px;
      padding: 8px 16px; background: #6366f1; color: #fff;
      font-size: 13px; font-weight: 600; border-radius: 999px;
      z-index: 100002; pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 4px 12px rgba(99, 102, 241, .35);
    }

    /*
     * Mobile: OpenEvent's primary navigation is a bottom-centre floating
     * button and most pages add a bottom-right FAB. Move the subtitle to the
     * top and drop the step badge so the guide never covers either.
     */
    @media (max-width: 768px) {
      #${SUBTITLE_ID} {
        bottom: auto;
        top: calc(env(safe-area-inset-top, 0px) + 12px);
        font-size: 15px; padding: 10px 16px;
        max-width: calc(100vw - 24px);
      }
      .${BADGE_CLASS} { display: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      #${HIGHLIGHT_ID}::after { animation: none; }
      .oe-guide-click-ripple { animation-duration: 0.01s; }
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
    subtitleTimeout = setTimeout(() => subtitleEl?.classList.remove("visible"), duration);
  }
}

export function hideSubtitle(): void {
  if (subtitleTimeout) clearTimeout(subtitleTimeout);
  subtitleEl?.classList.remove("visible");
}

/** Position the box and the spotlight cut-out over the element's current rect. */
function paint(el: Element): void {
  if (!highlightEl) return;
  const r = el.getBoundingClientRect();

  highlightEl.style.top = `${r.top - PAD}px`;
  highlightEl.style.left = `${r.left - PAD}px`;
  highlightEl.style.width = `${r.width + PAD * 2}px`;
  highlightEl.style.height = `${r.height + PAD * 2}px`;

  if (spotlightEl) {
    const l = r.left - PAD;
    const t = r.top - PAD;
    const rt = r.right + PAD;
    const b = r.bottom + PAD;
    spotlightEl.style.clipPath =
      `polygon(0% 0%, 0% 100%, ${l}px 100%, ${l}px ${t}px, ${rt}px ${t}px, ` +
      `${rt}px ${b}px, ${l}px ${b}px, ${l}px 100%, 100% 100%, 100% 0%)`;
  }
}

function stopTracking(): void {
  if (trackFrame !== null) cancelAnimationFrame(trackFrame);
  trackFrame = null;
  trackedEl = null;
}

function track(): void {
  if (!trackedEl) return;
  // The element can disappear under us: a route change, a closing dialog.
  if (!trackedEl.isConnected) {
    clearHighlight();
    return;
  }
  paint(trackedEl);
  trackFrame = requestAnimationFrame(track);
}

/**
 * Highlight an element and keep the box on it.
 *
 * Scrolls into view first, then tracks every frame, so the box stays put
 * through smooth scrolling, resizes and layout shifts rather than being
 * painted once at a position the element is about to leave.
 */
export function highlightElement(selector: string, duration = 0): () => void {
  let el: Element | null = null;
  try {
    el = document.querySelector(selector);
  } catch {
    console.warn(`[oe-guide] Invalid selector: ${selector}`);
  }
  if (!el || !highlightEl) return () => {};

  if (highlightTimeout) clearTimeout(highlightTimeout);
  stopTracking();

  el.scrollIntoView({ behavior: "smooth", block: "center" });

  trackedEl = el;
  paint(el);
  highlightEl.classList.add("visible");
  spotlightEl?.classList.add("visible");
  trackFrame = requestAnimationFrame(track);

  if (duration > 0) {
    highlightTimeout = setTimeout(clearHighlight, duration);
  }

  return clearHighlight;
}

export function clearHighlight(): void {
  if (highlightTimeout) clearTimeout(highlightTimeout);
  highlightTimeout = null;
  stopTracking();
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
  let badge = document.querySelector(`.${BADGE_CLASS}`) as HTMLDivElement | null;
  if (!badge) {
    badge = document.createElement("div");
    badge.className = BADGE_CLASS;
    document.body.appendChild(badge);
  }
  badge.textContent = `Step ${current} of ${total}`;
}

export function hideStepBadge(): void {
  document.querySelector(`.${BADGE_CLASS}`)?.remove();
}

export function destroyOverlay(): void {
  clearHighlight();
  if (subtitleTimeout) clearTimeout(subtitleTimeout);
  overlayRoot?.remove();
  subtitleEl?.remove();
  highlightEl?.remove();
  spotlightEl?.remove();
  hideStepBadge();
  document.getElementById("oe-guide-overlay-styles")?.remove();
  overlayRoot = null;
  subtitleEl = null;
  highlightEl = null;
  spotlightEl = null;
}
