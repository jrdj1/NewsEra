const DRAFT_KEY = "newsera:publish-draft";

export interface PublicationDraft {
  title: string;
  body: string;
  tags: string[];
}

export function loadDraft(): PublicationDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as PublicationDraft) : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: PublicationDraft): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}
