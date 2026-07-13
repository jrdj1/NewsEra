import { describe, expect, it } from "vitest";
import { composeArticleBody } from "./article";

describe("composeArticleBody", () => {
  it("devuelve solo el cuerpo recortado si no hay enlaces ni referencias", () => {
    const result = composeArticleBody({ body: "  Cuerpo del artículo  ", links: [], references: "" });
    expect(result).toBe("Cuerpo del artículo");
  });

  it("añade la sección de enlaces relacionados cuando hay enlaces", () => {
    const result = composeArticleBody({
      body: "Cuerpo",
      links: ["0xhash1", "0xhash2"],
      references: "",
    });

    expect(result).toBe("Cuerpo\n\n## Enlaces relacionados\n- 0xhash1\n- 0xhash2");
  });

  it("añade la sección de referencias cuando se indican", () => {
    const result = composeArticleBody({
      body: "Cuerpo",
      links: [],
      references: "  Vosoughi et al., Science 2018  ",
    });

    expect(result).toBe("Cuerpo\n\n## Referencias\nVosoughi et al., Science 2018");
  });

  it("compone enlaces y referencias juntos en el orden correcto", () => {
    const result = composeArticleBody({
      body: "Cuerpo",
      links: ["0xhash1"],
      references: "Referencia A",
    });

    expect(result).toBe(
      "Cuerpo\n\n## Enlaces relacionados\n- 0xhash1\n\n## Referencias\nReferencia A",
    );
  });

  it("una referencia solo con espacios en blanco no añade la sección", () => {
    const result = composeArticleBody({ body: "Cuerpo", links: [], references: "   " });
    expect(result).toBe("Cuerpo");
  });

  it("es determinista: la misma entrada produce siempre el mismo resultado (invariante keccak256==contentHash)", () => {
    const input = { body: "Cuerpo estable", links: ["0xa", "0xb"], references: "Ref" };
    expect(composeArticleBody(input)).toBe(composeArticleBody({ ...input }));
  });
});
