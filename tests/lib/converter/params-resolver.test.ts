import { describe, it, expect } from "vitest";
import { resolveParams } from "#/lib/converter/params-resolver";

describe("resolveParams", () => {
  it("resolves a simple @@#params.X string", () => {
    const json = { opacity: "@@#params.opacity" };
    const params = { opacity: 0.8 };
    expect(resolveParams(json, params)).toEqual({ opacity: 0.8 });
  });

  it("does not mutate the original object", () => {
    const json = { opacity: "@@#params.opacity" };
    const params = { opacity: 0.5 };
    const result = resolveParams(json, params);
    expect(result).not.toBe(json);
    expect(json.opacity).toBe("@@#params.opacity");
  });

  it("resolves nested objects recursively", () => {
    const json = {
      paint: {
        "fill-color": "@@#params.fill_color",
        "fill-opacity": "@@#params.opacity",
      },
    };
    const params = { fill_color: "#3b82f6", opacity: 0.7 };
    expect(resolveParams(json, params)).toEqual({
      paint: { "fill-color": "#3b82f6", "fill-opacity": 0.7 },
    });
  });

  it("resolves values inside arrays", () => {
    const json = {
      colors: ["@@#params.color1", "@@#params.color2"],
    };
    const params = { color1: "#ff0000", color2: "#00ff00" };
    expect(resolveParams(json, params)).toEqual({
      colors: ["#ff0000", "#00ff00"],
    });
  });

  it("resolves inside MapLibre expression arrays", () => {
    const json = {
      "fill-color": [
        "match",
        ["get", "category"],
        "forest", "@@#params.forest_color",
        "water", "@@#params.water_color",
        "@@#params.default_color",
      ],
    };
    const params = {
      forest_color: "#228B22",
      water_color: "#1E90FF",
      default_color: "#808080",
    };
    expect(resolveParams(json, params)).toEqual({
      "fill-color": [
        "match",
        ["get", "category"],
        "forest", "#228B22",
        "water", "#1E90FF",
        "#808080",
      ],
    });
  });

  it("passes through non-@@#params values unchanged", () => {
    const json = {
      type: "fill",
      opacity: 0.5,
      visible: true,
      data: null,
      color: "@@#params.color",
    };
    const params = { color: "#fff" };
    const result = resolveParams(json, params);
    expect(result.type).toBe("fill");
    expect(result.opacity).toBe(0.5);
    expect(result.visible).toBe(true);
    expect(result.data).toBeNull();
    expect(result.color).toBe("#fff");
  });

  it("resolves dot-notation for nested param access", () => {
    const json = { color: "@@#params.style.primary" };
    const params = { style: { primary: "#ff0" } };
    expect(resolveParams(json, params)).toEqual({ color: "#ff0" });
  });

  it("returns undefined for missing params (does not throw)", () => {
    const json = { color: "@@#params.missing" };
    const params = {};
    expect(resolveParams(json, params)).toEqual({ color: undefined });
  });

  it("does not resolve @@function, @@type, @@=, or @@# (non-params)", () => {
    const json = {
      "@@function": "setQueryParams",
      "@@type": "ScatterplotLayer",
      accessor: "@@=[lng, lat]",
      constant: "@@#GL.ONE",
    };
    const params = {};
    const result = resolveParams(json, params);
    expect(result["@@function"]).toBe("setQueryParams");
    expect(result["@@type"]).toBe("ScatterplotLayer");
    expect(result.accessor).toBe("@@=[lng, lat]");
    expect(result.constant).toBe("@@#GL.ONE");
  });
});
