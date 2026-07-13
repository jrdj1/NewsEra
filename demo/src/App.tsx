import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, lightTheme, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { config } from "@/lib/wagmi";
import Layout from "@/components/layout/Layout";
import Intro from "@/pages/Intro";
import Feed from "@/pages/Feed";
import About from "@/pages/About";
import Publish from "@/pages/Publish";
import Article from "@/pages/Article";
import ArticleVotes from "@/pages/ArticleVotes";
import Users from "@/pages/Users";
import UserProfile from "@/pages/UserProfile";
import Profile from "@/pages/Profile";
import Validate from "@/pages/Validate";
import ValidatorWelcome from "@/pages/ValidatorWelcome";
import SurveyProblem from "@/pages/SurveyProblem";
import SurveySolution from "@/pages/SurveySolution";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

// Azul de marca (#2563EB) también en la cartera conectada — RainbowKit no
// lee tokens de Tailwind, así que se repite el valor aquí.
const rainbowKitTheme = {
  lightMode: lightTheme({ accentColor: "#2563EB" }),
  darkMode: darkTheme({ accentColor: "#2563EB" }),
};

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowKitTheme}>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Intro />} />
                <Route path="/noticias" element={<Feed />} />
                <Route path="/about" element={<About />} />
                <Route path="/publish" element={<Publish />} />
                <Route path="/article/:hash" element={<Article />} />
                <Route path="/article/:hash/votes" element={<ArticleVotes />} />
                <Route path="/users" element={<Users />} />
                <Route path="/users/:address" element={<UserProfile />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/validate" element={<Validate />} />
                <Route path="/validate/welcome" element={<ValidatorWelcome />} />
                <Route path="/encuestas/problema" element={<SurveyProblem />} />
                <Route path="/encuestas/producto" element={<SurveySolution />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
