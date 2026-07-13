const REVERT_MESSAGES: Record<string, string> = {
  InsufficientReputation: "No tienes reputación suficiente para realizar esta acción.",
  AlreadyValidated: "Ya has votado o predicho este artículo — no puedes hacerlo de nuevo.",
  VotingNotOpen: "La votación de este artículo ya no está abierta en esta ronda.",
  ReopenNotAvailable: "Este artículo no admite una solicitud de reapertura en su estado actual.",
  AlreadyRequestedReopen: "Ya has solicitado la reapertura de este artículo.",
  NothingToClaim: "No tienes ningún ajuste de reputación retroactiva pendiente de reclamar.",
  PublicationAlreadyExists: "Ya existe una publicación registrada con este contenido exacto.",
  PublicationNotFound: "No se encontró ninguna publicación con ese hash.",
  NotEligibleForPrediction: "Ya tienes reputación suficiente para votar — usa el voto real en vez de predecir.",
  PredictionTargetNotDefinitive: "Todavía no puedes predecir sobre este artículo: su resultado no está fijado.",
  AlreadyPredicted: "Ya has predicho sobre este artículo — no puedes hacerlo de nuevo.",
};

/** Traduce errores de revert de Solidity (y de la API) a lenguaje natural. */
export function translateError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  for (const [name, message] of Object.entries(REVERT_MESSAGES)) {
    if (raw.includes(name)) return message;
  }

  if (raw.includes("User rejected") || raw.includes("User denied")) {
    return "Has cancelado la firma desde la cartera.";
  }

  return "Ha ocurrido un error inesperado. Inténtalo de nuevo.";
}
