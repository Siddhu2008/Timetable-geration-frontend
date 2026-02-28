import { createContext, useContext, useMemo, useState } from "react";

const UiContext = createContext(null);

export function UiProvider({ children }) {
  const [busy, setBusy] = useState(false);
  const [busyText, setBusyText] = useState("Working...");
  const [toasts, setToasts] = useState([]);

  const showLoader = (text = "Working...") => {
    setBusyText(text);
    setBusy(true);
  };

  const hideLoader = () => setBusy(false);

  const toast = (message, type = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  };

  const value = useMemo(
    () => ({ busy, busyText, toasts, toast, showLoader, hideLoader }),
    [busy, busyText, toasts]
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  return useContext(UiContext);
}
