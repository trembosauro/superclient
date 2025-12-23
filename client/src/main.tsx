import React from "react";
import ReactDOM from "react-dom/client";
import { Router } from "wouter";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import App from "./App.tsx";
import "./index.css";

// Inicializar i18n antes de qualquer componente
import "./i18n";

import { applyDesignTokensToCssVars } from "./designTokens";

const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

applyDesignTokensToCssVars();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router base={base === "" ? "/" : base}>
      <App />
    </Router>
  </React.StrictMode>,
)
