import { createContext, useContext, useState } from "react";

const DebateContext = createContext(null);

export function DebateProvider({ children }) {
  const [topic, setTopic] = useState("");
  const [messages, setMessages] = useState([]);
  const [isDebating, setIsDebating] = useState(false);

  function addMessage(message) {
    setMessages((previous) => [...previous, message]);
  }

  function resetDebate() {
    setTopic("");
    setMessages([]);
    setIsDebating(false);
  }

  return (
    <DebateContext.Provider
      value={{
        topic,
        setTopic,
        messages,
        addMessage,
        isDebating,
        setIsDebating,
        resetDebate
      }}
    >
      {children}
    </DebateContext.Provider>
  );
}

export function useDebate() {
  const context = useContext(DebateContext);

  if (!context) {
    throw new Error("useDebate must be used inside DebateProvider");
  }

  return context;
}