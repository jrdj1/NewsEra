import { describe, expect, it } from "vitest";
import { tagColor } from "./tagColor";

describe("tagColor", () => {
  it("es determinista: la misma etiqueta siempre produce el mismo color", () => {
    expect(tagColor("política")).toBe(tagColor("política"));
    expect(tagColor("economía")).toBe(tagColor("economía"));
  });

  it("etiquetas distintas pueden (no necesariamente deben) producir colores distintos, pero el formato es siempre una clase Tailwind válida", () => {
    const result = tagColor("ciencia");
    expect(result).toMatch(/^bg-\S+ text-\S+ dark:bg-\S+ dark:text-\S+$/);
  });

  it("nunca lanza con una etiqueta vacía", () => {
    expect(() => tagColor("")).not.toThrow();
  });

  it("es estable frente a etiquetas largas o con caracteres especiales", () => {
    const tag = "política-económica_2026 #tag";
    expect(tagColor(tag)).toBe(tagColor(tag));
  });
});
