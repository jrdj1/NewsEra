export function ChoiceQuestion({
  id,
  text,
  options,
  value,
  onChange,
}: {
  id: string;
  text: string;
  options: string[];
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium">{text}</legend>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <label
            key={opt}
            className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
              value === opt
                ? "border-brand bg-brand/10 font-medium text-brand"
                : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <input
              type="radio"
              name={id}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="h-4 w-4 accent-brand"
            />
            {opt}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
