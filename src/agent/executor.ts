/**
 * Command executor - performs browser actions (navigate, click, fill, etc.)
 * This runs inside the user's browser and manipulates the real DOM.
 */

import type { AgentCommand } from "../shared/types.js";
import {
  showSubtitle,
  hideSubtitle,
  highlightElement,
  clearHighlight,
  showClickRipple,
} from "./overlay.js";

/** Wait for an element to appear in the DOM */
function waitForElement(
  selector: string,
  timeout = 10000
): Promise<Element | null> {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/** Wait for navigation/page transition to settle */
function waitForNavigation(timeout = 5000): Promise<void> {
  return new Promise((resolve) => {
    let resolved = false;

    const done = () => {
      if (resolved) return;
      resolved = true;
      // Give React a moment to render after navigation
      setTimeout(resolve, 500);
    };

    // Listen for popstate (SPA navigation)
    const handler = () => done();
    window.addEventListener("popstate", handler, { once: true });

    // Also watch for DOM changes that indicate page content loaded
    const observer = new MutationObserver(() => {
      observer.disconnect();
      done();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      window.removeEventListener("popstate", handler);
      observer.disconnect();
      done();
    }, timeout);
  });
}

/** Simulate a realistic click with visual feedback */
async function simulateClick(el: Element): Promise<void> {
  const rect = el.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  showClickRipple(x, y);

  // Dispatch mouse events in order
  for (const eventType of ["mousedown", "mouseup", "click"] as const) {
    el.dispatchEvent(
      new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        view: window,
      })
    );
  }
}

/** Simulate typing into an input with realistic delays */
async function simulateTyping(
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string
): Promise<void> {
  el.focus();

  // Clear existing value
  el.value = "";
  el.dispatchEvent(new Event("input", { bubbles: true }));

  // Type character by character
  for (const char of value) {
    el.value += char;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key: char, bubbles: true })
    );
    el.dispatchEvent(new KeyboardEvent("keyup", { key: char, bubbles: true }));
    await new Promise((r) => setTimeout(r, 30 + Math.random() * 50));
  }

  el.dispatchEvent(new Event("change", { bubbles: true }));
}

/** Execute a single agent command */
export async function executeCommand(command: AgentCommand): Promise<void> {
  // Show subtitle if the command has one
  if ("subtitle" in command && command.subtitle) {
    showSubtitle(command.subtitle, 0); // 0 = stay until next subtitle
  }

  switch (command.type) {
    case "navigate": {
      const currentPath = window.location.pathname;
      if (currentPath !== command.path) {
        // Try clicking the sidebar link first (works with React Router)
        const link = document.querySelector(
          `a[href="${command.path}"], a[href*="${command.path}"]`
        ) as HTMLAnchorElement | null;
        if (link) {
          link.click();
        } else {
          // Fallback: direct navigation
          window.location.href = command.path;
        }
        await waitForNavigation();
      }
      break;
    }

    case "highlight": {
      const el = await waitForElement(command.selector);
      if (el) {
        highlightElement(command.selector, command.duration);
      } else {
        console.warn(`[oe-guide] Could not find element: ${command.selector}`);
      }
      break;
    }

    case "click": {
      clearHighlight();
      const el = await waitForElement(command.selector);
      if (el) {
        highlightElement(command.selector);
        await new Promise((r) => setTimeout(r, 800)); // Let user see the highlight
        await simulateClick(el);
        clearHighlight();
        await new Promise((r) => setTimeout(r, 300)); // Let the click effect settle
      } else {
        console.warn(`[oe-guide] Could not find element to click: ${command.selector}`);
      }
      break;
    }

    case "fill": {
      const el = await waitForElement(command.selector);
      if (
        el &&
        (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
      ) {
        highlightElement(command.selector);
        await new Promise((r) => setTimeout(r, 500));
        await simulateTyping(el, command.value);
        clearHighlight();
      } else {
        console.warn(`[oe-guide] Could not find input: ${command.selector}`);
      }
      break;
    }

    case "scroll": {
      const el = await waitForElement(command.selector);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        await new Promise((r) => setTimeout(r, 500));
      }
      break;
    }

    case "subtitle": {
      showSubtitle(command.text, command.duration ?? 5000);
      break;
    }

    case "wait": {
      await new Promise((r) => setTimeout(r, command.ms));
      break;
    }

    case "sequence": {
      for (const cmd of command.commands) {
        await executeCommand(cmd);
        // Small pause between sequence steps
        await new Promise((r) => setTimeout(r, 300));
      }
      break;
    }

    case "clear": {
      clearHighlight();
      hideSubtitle();
      break;
    }
  }
}
