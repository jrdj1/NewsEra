import { createPublicClient, http } from "viem";
import { hardhat, sepolia } from "viem/chains";

const network = process.env.NETWORK ?? "local";

const chain = network === "sepolia" ? sepolia : hardhat;
const rpcUrl =
  network === "sepolia" ? process.env.RPC_URL_SEPOLIA : process.env.RPC_URL_LOCAL;

export const publicClient = createPublicClient({
  chain,
  transport: http(rpcUrl),
  // cacheTime: 0 — el indexador depende de que getBlockNumber() devuelva la
  // altura real en cada llamada; el caché por defecto de viem (~4s) podía
  // devolver un valor obsoleto y hacer que processHistoricalEvents escaneara
  // un rango de bloques que ya había quedado corto, perdiendo eventos reales.
  cacheTime: 0,
});
