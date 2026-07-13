import { describe, expect, it } from "vitest";
import { translateError } from "./errors";

describe("translateError", () => {
  it("traduce cada mensaje de revert conocido a lenguaje natural", () => {
    expect(translateError(new Error("execution reverted: InsufficientReputation"))).toBe(
      "No tienes reputación suficiente para realizar esta acción.",
    );
    expect(translateError(new Error("AlreadyValidated"))).toContain("Ya has votado o predicho");
    expect(translateError(new Error("VotingNotOpen"))).toContain("no está abierta");
    expect(translateError(new Error("ReopenNotAvailable"))).toContain("no admite una solicitud de reapertura");
    expect(translateError(new Error("AlreadyRequestedReopen"))).toContain("Ya has solicitado");
    expect(translateError(new Error("NothingToClaim"))).toContain("ningún ajuste");
    expect(translateError(new Error("PublicationAlreadyExists"))).toContain("Ya existe una publicación");
    expect(translateError(new Error("PublicationNotFound"))).toContain("No se encontró");
    expect(translateError(new Error("NotEligibleForPrediction"))).toContain("reputación suficiente para votar");
  });

  it("reconoce el rechazo de firma de la cartera con distintos mensajes de proveedor", () => {
    expect(translateError(new Error("User rejected the request"))).toBe(
      "Has cancelado la firma desde la cartera.",
    );
    expect(translateError(new Error("User denied transaction signature"))).toBe(
      "Has cancelado la firma desde la cartera.",
    );
  });

  it("cae al mensaje genérico ante un error desconocido", () => {
    expect(translateError(new Error("algo totalmente inesperado"))).toBe(
      "Ha ocurrido un error inesperado. Inténtalo de nuevo.",
    );
  });

  it("acepta valores que no son instancias de Error (strings, objetos)", () => {
    expect(translateError("VotingNotOpen")).toContain("no está abierta");
    expect(translateError({ message: "no interesa" })).toBe(
      "Ha ocurrido un error inesperado. Inténtalo de nuevo.",
    );
  });
});
