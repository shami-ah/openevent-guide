/**
 * These tests exist because of two bugs that shipped and reached users.
 *
 * 1. Seven flows navigated to paths the app renders no sidebar anchor for, so
 *    the executor fell through to a full page reload that tore the guide down
 *    mid-walkthrough.
 * 2. Two flows carried selectors that were not valid CSS
 *    (`span:contains(...)`) or matched the wrong element entirely
 *    (`button:has(svg)` finds the first icon button on the page, which lives
 *    in the sidebar).
 *
 * Neither is caught by a typecheck. Both are caught here.
 */

import { describe, expect, it } from "vitest";
import { getAllFlows, getFlowById, getFlowDefs, getFlowSummaries } from "./registry.js";
import { getTarget, TARGETS, targetIds } from "./targets.js";
import { isKnownRoute, isSafePath } from "../shared/appRoutes.js";
import { LANGS } from "../shared/i18n.js";

const defs = getFlowDefs();

describe("flow definitions", () => {
  it("has flows", () => {
    expect(defs.length).toBeGreaterThan(0);
  });

  it("has unique ids", () => {
    const ids = defs.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every flow at least one step and one keyword", () => {
    for (const flow of defs) {
      expect(flow.steps.length, `${flow.id} has no steps`).toBeGreaterThan(0);
      expect(flow.keywords.length, `${flow.id} has no keywords`).toBeGreaterThan(0);
    }
  });
});

describe("navigation targets a real page", () => {
  it("only navigates to routes that exist in the app", () => {
    for (const flow of defs) {
      for (const step of flow.steps) {
        if (step.command.type !== "navigate") continue;
        expect(
          isKnownRoute(step.command.path),
          `${flow.id} navigates to "${step.command.path}", which is not in APP_ROUTES`,
        ).toBe(true);
      }
    }
  });

  it("only navigates to paths that cannot escape the app origin", () => {
    for (const flow of defs) {
      for (const step of flow.steps) {
        if (step.command.type !== "navigate") continue;
        expect(isSafePath(step.command.path), `${flow.id} has an unsafe path`).toBe(true);
      }
    }
  });
});

describe("element targets", () => {
  it("resolves every target id a flow references", () => {
    for (const flow of defs) {
      for (const step of flow.steps) {
        const cmd = step.command;
        if (cmd.type === "highlight" || cmd.type === "click" || cmd.type === "scroll" || cmd.type === "fill") {
          expect(getTarget(cmd.target), `${flow.id} references unknown target "${cmd.target}"`).toBeDefined();
        }
      }
    }
  });

  it("only contains selectors the browser can actually parse", () => {
    // querySelector throws SyntaxError on jQuery-isms like :contains().
    for (const id of targetIds()) {
      const { selector } = TARGETS[id];
      for (const part of selector.split(",").map((s) => s.trim())) {
        expect(() => document.querySelector(part), `target "${id}" has invalid CSS: ${part}`).not.toThrow();
      }
    }
  });

  it("has no text-matching selectors, which would break in DE and FR", () => {
    for (const id of targetIds()) {
      const { selector } = TARGETS[id];
      expect(selector, `target "${id}" selects on text`).not.toMatch(/:contains\(|:has-text\(/);
    }
  });

  it("gives every target a label, so a miss can be explained to the user", () => {
    for (const id of targetIds()) {
      expect(TARGETS[id].label.length, `target "${id}" has no label`).toBeGreaterThan(0);
    }
  });
});

describe("resolution", () => {
  it("resolves every flow in every supported language", () => {
    for (const lang of LANGS) {
      const flows = getAllFlows(lang);
      expect(flows.length).toBe(defs.length);
      for (const flow of flows) {
        expect(flow.name.length, `${flow.id} has no name in ${lang}`).toBeGreaterThan(0);
        for (const step of flow.steps) {
          expect(step.description.length, `${flow.id} step has no description in ${lang}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("produces stable, unique step ids", () => {
    for (const flow of getAllFlows()) {
      const ids = flow.steps.map((s) => s.id);
      expect(new Set(ids).size, `${flow.id} has duplicate step ids`).toBe(ids.length);
    }
    // Same input, same ids: the old module-level counter made these drift.
    expect(getFlowById("create-event")?.steps.map((s) => s.id))
      .toEqual(getFlowById("create-event")?.steps.map((s) => s.id));
  });

  it("carries a selector and a label on every element command", () => {
    for (const flow of getAllFlows()) {
      for (const step of flow.steps) {
        const cmd = step.command;
        if (cmd.type === "highlight" || cmd.type === "click" || cmd.type === "scroll" || cmd.type === "fill") {
          expect(cmd.selector.length).toBeGreaterThan(0);
          expect(cmd.label?.length ?? 0).toBeGreaterThan(0);
        }
      }
    }
  });

  it("translates flow copy rather than leaving English everywhere", () => {
    const en = getFlowSummaries("en");
    const de = getFlowSummaries("de");
    const differing = en.filter((f, i) => f.name !== de[i].name);
    expect(differing.length, "no German flow names differ from English").toBeGreaterThan(0);
  });
});
