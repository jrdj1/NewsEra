import { useMemo, useRef, useState } from "react";
import { usePublicationTags } from "@/hooks/usePublications";
import { tagColor } from "@/lib/tagColor";

/**
 * Selector de etiquetas: combina las ya usadas en la plataforma (autocompletado
 * en vivo mientras se escribe, vía GET /api/v1/publications/tags) con la
 * opción de crear una nueva — no hay catálogo cerrado de etiquetas (son
 * libres, ver CLAUDE.md), así que "crear" es simplemente añadir cualquier
 * texto que no coincida exactamente con una ya existente.
 */
export function TagPicker({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const { data: existingTags = [] } = usePublicationTags();
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout>>();

  const normalized = inputValue.trim().toLowerCase();
  const suggestions = useMemo(
    () =>
      existingTags
        .filter((t) => !value.includes(t))
        .filter((t) => (normalized ? t.toLowerCase().includes(normalized) : true))
        .slice(0, 8),
    [existingTags, value, normalized],
  );
  const exactMatch = existingTags.some((t) => t.toLowerCase() === normalized) || value.some((t) => t.toLowerCase() === normalized);

  function addTag(tag: string) {
    const clean = tag.trim();
    if (!clean || value.includes(clean)) return;
    onChange([...value, clean]);
    setInputValue("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 focus-within:ring-2 focus-within:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-within:ring-white">
        {value.map((tag) => (
          <span
            key={tag}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tagColor(tag)}`}
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Quitar etiqueta ${tag}`}
              className="opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            clearTimeout(blurTimeout.current);
            setOpen(true);
          }}
          onBlur={() => {
            blurTimeout.current = setTimeout(() => setOpen(false), 150);
          }}
          placeholder={value.length === 0 ? "Elige o escribe una etiqueta..." : ""}
          className="min-w-[8rem] flex-1 bg-transparent py-0.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-white"
        />
      </div>

      {open && (suggestions.length > 0 || (inputValue.trim() && !exactMatch)) && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {suggestions.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(tag)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tagColor(tag)}`}>#{tag}</span>
              </button>
            </li>
          ))}
          {inputValue.trim() && !exactMatch && (
            <li>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(inputValue)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Crear etiqueta <span className="font-medium text-zinc-900 dark:text-white">"{inputValue.trim()}"</span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
