import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ptBR from "./locales/pt-BR.json";
import enUS from "./locales/en-US.json";
import es419 from "./locales/es-419.json";

// Obter idioma salvo ou usar pt-BR como padrão
const getSavedLanguage = (): string => {
  try {
    const prefs = localStorage.getItem("sc_prefs");
    if (prefs) {
      const parsed = JSON.parse(prefs);
      return parsed.language || "pt-BR";
    }
  } catch {
    // Ignora erro
  }
  return "pt-BR";
};

// Mapear variantes de idioma para o arquivo de tradução correto
const languageMapping: Record<string, string> = {
  "pt-BR": "pt-BR",
  "pt-PT": "pt-BR", // Portugal usa pt-BR por enquanto
  "pt-AO": "pt-BR", // Angola usa pt-BR por enquanto
  "es-419": "es-419",
  "es-ES": "es-419", // Espanha usa es-419 por enquanto
  "en-US": "en-US",
  "en-CA": "en-US", // Canadá usa en-US
  "en-GB": "en-US", // UK usa en-US por enquanto
  "en-AU": "en-US", // Austrália usa en-US
  "de-DE": "en-US", // Alemão usa en-US por enquanto (adicionar tradução depois)
  "fr-FR": "en-US", // Francês usa en-US por enquanto (adicionar tradução depois)
};

export const resolveLanguage = (lang: string): string => {
  return languageMapping[lang] || "pt-BR";
};

const resources = {
  "pt-BR": { translation: ptBR },
  "en-US": { translation: enUS },
  "es-419": { translation: es419 },
};

i18n.use(initReactI18next).init({
  resources,
  lng: resolveLanguage(getSavedLanguage()),
  fallbackLng: "pt-BR",
  interpolation: {
    escapeValue: false, // React já escapa por padrão
  },
  react: {
    useSuspense: false,
  },
});

// Função para trocar idioma
export const changeLanguage = (lang: string) => {
  const resolvedLang = resolveLanguage(lang);
  i18n.changeLanguage(resolvedLang);
  document.documentElement.lang = lang;
};

// Escutar mudanças de preferências
if (typeof window !== "undefined") {
  window.addEventListener("prefs-change", () => {
    const newLang = getSavedLanguage();
    changeLanguage(newLang);
  });
}

export default i18n;
