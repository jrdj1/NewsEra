const LIKERT_VALUES = [1, 2, 3, 4, 5] as const;

export function LikertQuestion({
  id,
  text,
  lowLabel,
  highLabel,
  value,
  onChange,
}: {
  id: string;
  text: string;
  lowLabel: string;
  highLabel: string;
  value: number | undefined;
  onChange: (value: number) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium">{text}</legend>
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {LIKERT_VALUES.map((n) => (
          <label
            key={n}
            className={`flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
              value === n
                ? "border-brand bg-brand/10 text-brand"
                : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:text-white"
            }`}
          >
            <input
              type="radio"
              name={id}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
            />
            {n}
          </label>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-zinc-400">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </fieldset>
  );
}
