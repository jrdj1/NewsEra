import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { config } from "@/lib/wagmi";
import Layout from "@/components/layout/Layout";
import Feed from "@/pages/Feed";
import About from "@/pages/About";
import Publish from "@/pages/Publish";
import Article from "@/pages/Article";
import Validators from "@/pages/Validators";
import ValidatorProfile from "@/pages/ValidatorProfile";
import Profile from "@/pages/Profile";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Feed />} />
                <Route path="/about" element={<About />} />
                <Route path="/publish" element={<Publish />} />
                <Route path="/article/:hash" element={<Article />} />
                <Route path="/validators" element={<Validators />} />
                <Route path="/validators/:address" element={<ValidatorProfile />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
