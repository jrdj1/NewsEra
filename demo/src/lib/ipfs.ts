/**
 * Sube el cuerpo del artículo a IPFS vía la API de Pinata. Si no hay JWT
 * configurado (prototipo sin cuenta de Pinata), se omite la subida y el
 * artículo queda sin ipfsCid — el contentHash on-chain sigue garantizando
 * la integridad del contenido igualmente.
 */
export async function uploadToIpfs(body: string, filename: string): Promise<string | undefined> {
  const jwt = import.meta.env.VITE_PINATA_JWT;
  if (!jwt) return undefined;

  const form = new FormData();
  form.append("file", new Blob([body], { type: "text/plain" }), filename);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });

  if (!res.ok) {
    console.error("Fallo al subir a IPFS:", await res.text());
    return undefined;
  }

  const data = await res.json();
  return data.IpfsHash as string;
}
