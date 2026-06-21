import { useParams } from "react-router-dom";

export default function ValidatorProfile() {
  const { address } = useParams<{ address: string }>();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold">Perfil del validador</h1>
      <p className="font-mono text-sm text-zinc-400 break-all">{address}</p>
      <p className="text-zinc-500">Reputación + historial — Sprint 7</p>
    </main>
  );
}
