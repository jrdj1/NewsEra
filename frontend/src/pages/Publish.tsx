import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { keccak256, toBytes } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { TagPicker } from "@/components/TagPicker";
import { ArticleLinkPicker, type LinkedArticle } from "@/components/ArticleLinkPicker";
import { useTransactionState } from "@/hooks/useTransactionState";
import { publicationRegistry, PUBLISH_REPUTATION_REWARD, PUBLISH_REPUTATION_PENALTY_UNVERIFIABLE, PUBLISH_REPUTATION_PENALTY_FALSE } from "@/lib/contracts";
import { composeArticleBody } from "@/lib/article";
import { loadDraft, saveDraft, clearDraft, type PublicationDraft } from "@/lib/draft";
import { uploadToIpfs } from "@/lib/ipfs";
import { api } from "@/lib/api";
import { translateError } from "@/lib/errors";

type Step = "editing" | "preview";

export default function Publish() {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const tx = useTransactionState();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [linkedArticles, setLinkedArticles] = useState<LinkedArticle[]>([]);
  const [references, setReferences] = useState("");
  const [step, setStep] = useState<Step>("editing");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const pendingIpfsCid = useRef<string | undefined>(undefined);

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setTitle(draft.title);
      setBody(draft.body);
      setTags(draft.tags);
    }
  }, []);

  const links = linkedArticles.map((l) => `/article/${l.contentHash}`);

  const fullBody = composeArticleBody({ body, links, references });
  const contentHash = fullBody ? keccak256(toBytes(fullBody)) : undefined;

  function handleSaveDraft() {
    const draft: PublicationDraft = { title, body, tags };
    saveDraft(draft);
  }

  async function handleConfirm() {
    if (!contentHash) return;
    setPostError(null);

    const ipfsCid = await uploadToIpfs(fullBody, `${contentHash}.txt`).catch(() => undefined);
    pendingIpfsCid.current = ipfsCid;

    tx.write({
      address: publicationRegistry.address,
      abi: publicationRegistry.abi,
      functionName: "registerPublication",
      args: [contentHash],
    });
    // El POST al backend se completa cuando la transacción confirme (ver efecto abajo).
  }

  useEffect(() => {
    if (!tx.isConfirmed || !contentHash || posting) return;

    setPosting(true);

    api
      .post("/api/v1/publications", {
        contentHash,
        ipfsCid: pendingIpfsCid.current,
        title,
        body: fullBody,
        tags,
      })
      .then(() => {
        clearDraft();
        navigate(`/article/${contentHash}`);
      })
      .catch((err) => {
        setPostError(translateError(err));
        setPosting(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx.isConfirmed]);

  if (!isConnected) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Publicar artículo</h1>
        <p className="text-sm text-zinc-500">Conecta tu cartera para publicar contenido en NewsEra.</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Publicar artículo</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Autor y fecha se asignan automáticamente al confirmar la transacción — no son campos del formulario.
      </p>

      {step === "editing" && (
        <div className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium">Título</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del artículo" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Cuerpo</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              placeholder="Redacta el artículo..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Etiquetas</label>
            <TagPicker value={tags} onChange={setTags} />
            <p className="mt-1 text-xs text-zinc-400">
              Elige entre las que ya usa la comunidad o escribe una nueva y pulsa Intro.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Enlaces internos a otros artículos</label>
            <ArticleLinkPicker value={linkedArticles} onChange={setLinkedArticles} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Referencias bibliográficas</label>
            <Textarea value={references} onChange={(e) => setReferences(e.target.value)} rows={3} />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSaveDraft}>
              Guardar borrador
            </Button>
            <Button onClick={() => setStep("preview")} disabled={!title || !body}>
              Vista previa
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-6">
          <article className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <h2 className="mb-4 text-2xl font-bold">{title}</h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {fullBody}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                  #{t}
                </span>
              ))}
            </div>
          </article>

          <div className="rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
            <p className="mb-1 font-medium">Hash del contenido (keccak256)</p>
            <p className="break-all font-mono text-xs text-zinc-500">{contentHash}</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            Esta publicación puede ganar o perder reputación según el consenso final: <strong>+{PUBLISH_REPUTATION_REWARD}</strong> si
            se confirma verdadero, <strong>−{PUBLISH_REPUTATION_PENALTY_UNVERIFIABLE}</strong> si resulta no verificable, y{" "}
            <strong>−{PUBLISH_REPUTATION_PENALTY_FALSE}</strong> si se confirma falso.
          </div>

          {tx.status !== "idle" && (
            <div className="rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
              {tx.status === "pending" && "Confirma la transacción en tu cartera..."}
              {tx.status === "confirming" && "Esperando confirmación en la blockchain..."}
              {tx.status === "confirmed" && !posting && "Transacción confirmada. Guardando en el servidor..."}
              {tx.status === "failed" && (
                <span className="text-red-600 dark:text-red-400">{tx.errorMessage}</span>
              )}
            </div>
          )}

          {postError && <p className="text-sm text-red-600 dark:text-red-400">{postError}</p>}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("editing")} disabled={tx.status !== "idle" && tx.status !== "failed"}>
              Volver a editar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!address || (tx.status !== "idle" && tx.status !== "failed")}
            >
              {tx.status === "idle" || tx.status === "failed" ? "Confirmar y publicar" : "Publicando..."}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
