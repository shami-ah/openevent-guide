// @vitest-environment node
import { describe, expect, it } from "vitest";
import { resolveLlmConfig } from "./brain.js";

describe("resolveLlmConfig", () => {
  it("defaults to OpenAI when its key is set", () => {
    const c = resolveLlmConfig({ OPENAI_API_KEY: "x", NVIDIA_API_KEY: "y" });
    expect(c.provider).toBe("openai");
    expect(c.model).toBe("gpt-4o");
    expect(c.baseURL).toBeUndefined();
  });

  it("falls back to NVIDIA when only its key is set", () => {
    const c = resolveLlmConfig({ NVIDIA_API_KEY: "y" });
    expect(c.provider).toBe("nvidia");
    expect(c.apiKey).toBe("y");
    expect(c.baseURL).toBe("https://integrate.api.nvidia.com/v1");
  });

  it("honours an explicit provider even when both keys are set", () => {
    expect(resolveLlmConfig({ GUIDE_LLM_PROVIDER: "nvidia", OPENAI_API_KEY: "x", NVIDIA_API_KEY: "y" }).provider).toBe("nvidia");
  });

  it("uses the provider default when GUIDE_MODEL is empty, and GUIDE_MODEL when set", () => {
    expect(resolveLlmConfig({ GUIDE_LLM_PROVIDER: "nvidia", GUIDE_MODEL: "" }).model).toBe("nvidia/nemotron-3-super-120b-a12b");
    expect(resolveLlmConfig({ GUIDE_LLM_PROVIDER: "nvidia", GUIDE_MODEL: "openai/gpt-oss-20b" }).model).toBe("openai/gpt-oss-20b");
  });

  it("rejects an unknown provider", () => {
    expect(() => resolveLlmConfig({ GUIDE_LLM_PROVIDER: "gemini" })).toThrow(/GUIDE_LLM_PROVIDER/);
  });
});
