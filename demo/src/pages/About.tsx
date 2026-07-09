import { resetDemoState } from "@/demo/store";

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-2 text-4xl font-bold tracking-tight">Sobre NewsEra</h1>
      <p className="mb-6 text-lg text-zinc-500">
        Una infraestructura descentralizada para la información veraz
      </p>

      <div className="mb-12 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
        <p className="mb-3">
          🧪 <strong>Estás en el modo demo.</strong> No hay backend ni blockchain reales detrás:
          todos los datos son estáticos y las acciones (votar, publicar, predecir...) se simulan
          localmente en tu navegador para que puedas explorar el diseño y el flujo de la
          plataforma. La versión completa funciona sobre contratos inteligentes reales — ver el
          repositorio y la memoria del TFG más abajo.
        </p>
        <p className="mb-3 text-xs">
          Tus acciones (artículos publicados, votos...) se guardan en este navegador y
          sobreviven a una recarga de página, pero no se comparten con otras personas ni
          dispositivos.
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm("¿Reiniciar la demo a su estado original? Se perderá lo que hayas hecho en esta sesión.")) {
              resetDemoState();
            }
          }}
          className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900"
        >
          Reiniciar demo
        </button>
      </div>

      {/* La idea, en cristiano */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold">💡 La idea, en cristiano</h2>

        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
          Imagina que en vez de confiar en que <em>"esto es verdad porque lo dice tal medio"</em>,
          la verdad la decide un jurado popular gigante — miles de personas normales, no una
          sola empresa ni un solo gobierno — y que <strong>nadie puede sobornar al jurado
          entero</strong>. Eso, resumido a lo bruto, es NewsEra.
        </p>

        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
          Cualquiera puede publicar una noticia. La comunidad vota si es verdadera, falsa o
          si todavía no hay pruebas suficientes para saberlo. Y aquí está la magia: esas
          reglas de votación no las controla nadie de forma unilateral, porque están escritas
          en la <strong>blockchain</strong> — piénsala como un cuaderno gigante, compartido
          por miles de ordenadores repartidos por el mundo, donde cualquiera puede escribir
          una página nueva, pero <strong>nadie puede arrancar una página ya escrita ni
          cambiar las reglas a mitad de partido</strong>. Ni siquiera quien construyó NewsEra.
        </p>

        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
          🕵️ <strong>¿Y cómo evitamos que la gente vote a lo loco o en bloque?</strong> Con
          reputación, como en un barrio de toda la vida: si sueles acertar cuando algo es
          verdad o mentira, te ganas la confianza del vecindario y tu voto empieza a pesar
          más. Si te equivocas — o intentas hacer trampas — la pierdes. Y como esa confianza
          no se compra ni se fabrica de la nada, es muy difícil colarse creando cien cuentas
          falsas para votar mil veces: todas empiezan desde cero, sin ningún peso.
        </p>

        <div className="rounded-xl bg-zinc-50 p-5 dark:bg-zinc-900">
          <p className="mb-2 font-medium">En resumen, con NewsEra:</p>
          <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            <li>📌 Nadie puede borrar lo que ya se publicó.</li>
            <li>👥 Nadie decide en solitario qué es verdad — lo decide la comunidad.</li>
            <li>🔍 Cualquiera puede comprobar con sus propios ojos cómo se llegó a esa conclusión.</li>
          </ul>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="mb-12">
        <h2 className="mb-6 text-xl font-semibold">🧭 Cómo funciona, paso a paso</h2>
        <ol className="space-y-4">
          {[
            {
              n: "1",
              title: "Alguien publica",
              desc: "Cualquier persona puede escribir y publicar un artículo. Queda registrado de forma permanente — nadie puede editarlo a escondidas ni hacerlo desaparecer después.",
            },
            {
              n: "2",
              title: "El barrio vota",
              desc: "Quienes tienen reputación suficiente votan si el artículo es verdadero, falso o si aún no se puede saber. Cuando vota suficiente gente, se calcula el resultado por mayoría.",
            },
            {
              n: "3",
              title: "La reputación se mueve",
              desc: "Acertar con la mayoría te suma reputación (y más peso en futuras votaciones); quedarte en minoría te la resta. Así el sistema premia acertar de verdad, no votar por votar.",
            },
          ].map(({ n, title, desc }) => (
            <li key={n} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white dark:bg-white dark:text-zinc-900">
                {n}
              </span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-zinc-500 mt-1">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Contratos */}
      <section className="mb-12 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="mb-1 text-xl font-semibold">🔧 Para quien quiera meterse en el motor</h2>
        <p className="mb-4 text-xs text-zinc-500">
          Opcional — el "cuaderno compartido" del que hablábamos arriba en realidad son estos
          tres contratos inteligentes:
        </p>
        <div className="space-y-3 text-sm">
          {[
            {
              name: "PublicationRegistry",
              desc: "Registro inmutable de hashes de publicaciones. Abierto a cualquier dirección.",
            },
            {
              name: "ValidationRegistry",
              desc: "Gestiona votos y determina el consenso por quórum.",
            },
            {
              name: "ReputationSystem",
              desc: "Sistema de reputación con control de roles. Resistencia Sybil incorporada.",
            },
          ].map(({ name, desc }) => (
            <div key={name} className="flex flex-col gap-0.5">
              <span className="font-mono font-medium">{name}</span>
              <span className="text-zinc-500">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Whitepaper / TFG */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold">Whitepaper / Memoria TFG</h2>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
          El diseño completo de la arquitectura, las decisiones técnicas y la evaluación
          del sistema están documentados en la memoria del Trabajo de Fin de Grado.
        </p>
        <a
          href="https://github.com/jrdj1/TFG-NewsEra-memoria"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Leer la memoria (GitHub)
        </a>
      </section>

      {/* Autor */}
      <section className="border-t border-zinc-100 dark:border-zinc-900 pt-8 text-sm text-zinc-500">
        <p>
          Desarrollado por <strong className="text-zinc-900 dark:text-white">Jorge Rafael de Julián Vicedo</strong>
        </p>
        <p>
          Grado en Ingeniería Informática &mdash; EPS, Universidad de Alicante
        </p>
        <p>
          Tutor: <strong className="text-zinc-900 dark:text-white">Dr. Higinio Mora Mora</strong> &mdash; Dpto. Tecnología Informática y Computación &mdash; 2026
        </p>
      </section>
    </div>
  );
}
