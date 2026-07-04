import { getAddress, isAddress } from "viem";
import { AppError } from "../errors/AppError.js";

/**
 * Las direcciones Ethereum son case-insensitive pero se comparan como texto
 * exacto en PostgreSQL; normalizar a checksum EIP-55 en el límite de la API
 * evita que la misma dirección en distinto casing se trate como dos
 * entidades distintas.
 */
export function normalizeAddress(address: string): `0x${string}` {
  if (!isAddress(address)) {
    throw new AppError("UNPROCESSABLE", `Dirección Ethereum inválida: ${address}`);
  }
  return getAddress(address);
}
