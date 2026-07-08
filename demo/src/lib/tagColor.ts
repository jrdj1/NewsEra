// Paleta de colores para etiquetas — deliberadamente distinta del azul de
// marca y de los colores de estado de consenso (verde/rojo/ámbar), que están
// reservados para navegación/acción y veredicto respectivamente.
const TAG_PALETTE = [
  "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
  "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400",
  "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-400",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400",
  "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
  "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
  "bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-400",
  "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
];

/** Color determinista por etiqueta: la misma etiqueta siempre sale con el mismo color. */
export function tagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }
  return TAG_PALETTE[hash % TAG_PALETTE.length];
}
