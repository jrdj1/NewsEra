import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "NewsEra",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "",
  chains: [sepolia],
});
