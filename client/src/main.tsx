import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "leaflet/dist/leaflet.css";
import { ParcelStoreProvider } from "./contexts/ParcelStoreContext";
import { AuthProvider } from "./contexts/AuthContext";
import { registerSW } from "virtual:pwa-register";

// Register Service Worker for PWA auto-updates
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ParcelStoreProvider>
      <App />
    </ParcelStoreProvider>
  </AuthProvider>
);
