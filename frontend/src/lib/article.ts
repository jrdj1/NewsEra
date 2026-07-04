export interface ArticleFields {
  body: string;
  links: string[];
  references: string;
}

/**
 * Serialización canónica del cuerpo del artículo: el resultado de esta
 * función es exactamente lo que se hashea con keccak256 y lo que se
 * almacena en el backend — deben coincidir siempre (RD 6).
 */
export function composeArticleBody({ body, links, references }: ArticleFields): string {
  let full = body.trim();

  if (links.length > 0) {
    full += `\n\n## Enlaces relacionados\n${links.map((l) => `- ${l}`).join("\n")}`;
  }

  if (references.trim()) {
    full += `\n\n## Referencias\n${references.trim()}`;
  }

  return full;
}
