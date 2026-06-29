export default function Profile() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold">Mi perfil</h1>
      <p className="text-zinc-500 text-sm">Sprint 7 — pendiente:</p>
      <ul className="text-left text-sm text-zinc-400 list-disc list-inside space-y-1">
        <li>Reputación propia y rango entre validadores</li>
        <li>Historial de validaciones por artículo y ronda</li>
        <li>Botón "Reclamar reputación retroactiva" por artículo con rondas pendientes</li>
      </ul>
    </main>
  );
}
