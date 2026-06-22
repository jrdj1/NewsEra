export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-2 text-4xl font-bold tracking-tight">Sobre NewsEra</h1>
      <p className="mb-12 text-lg text-zinc-500">
        Una infraestructura descentralizada para la información veraz
      </p>

      {/* El problema */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold">El problema</h2>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
          La desinformación no se resuelve mejorando los mecanismos de verificación sobre
          los sistemas actuales. Los medios, las plataformas y los organismos de
          verificación son susceptibles de captura por grupos de poder económico, político
          o institucional. Mientras las reglas del juego las fijen entidades controlables,
          el problema persiste.
        </p>
      </section>

      {/* La solución */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold">La solución</h2>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
          NewsEra traslada las reglas de publicación, verificación y gobernanza desde
          entidades controlables hacia <strong>contratos inteligentes</strong> desplegados
          en una blockchain pública. Ningún actor puede modificarlos unilateralmente.
        </p>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
          El contenido se almacena en IPFS (descentralizado y resistente a la censura) y
          su integridad se garantiza mediante el hash <code className="text-sm bg-zinc-100 dark:bg-zinc-800 px-1 rounded">keccak256</code> registrado
          on-chain. Cualquier persona puede verificar que el artículo que lee es exactamente
          el que se publicó.
        </p>
      </section>

      {/* Cómo funciona */}
      <section className="mb-12">
        <h2 className="mb-6 text-xl font-semibold">Cómo funciona</h2>
        <ol className="space-y-4">
          {[
            {
              n: "1",
              title: "Publicación",
              desc: "Cualquier usuario con cartera conectada puede registrar un artículo. El hash de su contenido queda inscrito de forma permanente en la blockchain.",
            },
            {
              n: "2",
              title: "Validación",
              desc: "Los validadores con reputación suficiente votan TRUE, FALSE o UNVERIFIABLE. Cuando se alcanza el quórum, el contrato determina el consenso por mayoría.",
            },
            {
              n: "3",
              title: "Reputación",
              desc: "Los validadores que aciertan el consenso ganan reputación; los que se equivocan la pierden. Esto incentiva la honestidad y desincentiva los ataques Sybil.",
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
        <h2 className="mb-4 text-xl font-semibold">Contratos inteligentes</h2>
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
