import { DebateProvider } from "./context/DebateContext";
import Debate from "./pages/Debate";
import "./styles/index.css";

function App() {
  return (
    <DebateProvider>
      <Debate />
    </DebateProvider>
  );
}

export default App;