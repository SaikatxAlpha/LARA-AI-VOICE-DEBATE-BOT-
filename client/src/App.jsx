import { useState } from "react";
import { DebateProvider } from "./context/DebateContext";
import Navbar from "./components/Navbar";
import Debate from "./pages/Debate";
import History from "./pages/History";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import "./styles/index.css";

const VIEWS = {
  debate: Debate,
  history: History,
  leaderboard: Leaderboard,
  profile: Profile
};

function App() {
  const [view, setView] = useState("debate");
  const View = VIEWS[view];

  return (
    <DebateProvider>
      <div className="app">
        <Navbar view={view} onNavigate={setView} />
        <View onNavigate={setView} />
      </div>
    </DebateProvider>
  );
}

export default App;
