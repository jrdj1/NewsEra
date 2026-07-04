import { createPublicClient, http } from "viem";
import { hardhat, sepolia } from "viem/chains";

const network = process.env.NETWORK ?? "local";

const chain = network === "sepolia" ? sepolia : hardhat;
const rpcUrl =
  network === "sepolia" ? process.env.RPC_URL_SEPOLIA : process.env.RPC_URL_LOCAL;

export const publicClient = createPublicClient({
  chain,
  transport: http(rpcUrl),
});
