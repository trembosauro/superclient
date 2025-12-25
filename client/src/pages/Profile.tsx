import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  Box,
  Button,
  Divider,
  Dialog,
  DialogContent,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
  Avatar,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import PageContainer from "../components/layout/PageContainer";
import AppAccordion from "../components/layout/AppAccordion";
import CardSection from "../components/layout/CardSection";
import AppCard from "../components/layout/AppCard";
import api from "../api";
import ToggleCheckbox from "../components/ToggleCheckbox";
import { interactiveCardSx } from "../styles/interactiveCard";
import { changeLanguage } from "../i18n";
import { usePageActions } from "../hooks/usePageActions";

type StoredAccount = {
  name: string;
  email: string;
  lastUsed: number;
  token?: string;
};

type AccessModule = {
  id: number;
  name: string;
  description: string;
  enabled: boolean;
};

type ModuleDialog =
  | {
      kind: "core";
      key:
        | "modulePipeline"
        | "moduleFinance"
        | "moduleContacts"
        | "moduleCalendar"
        | "moduleNotes";
      nextValue: boolean;
    }
  | {
      kind: "access";
      id: number;
      name: string;
      nextValue: boolean;
    };

const ACCOUNT_STORAGE_KEY = "sc_accounts";

const CORE_MODULE_PRICE_BRL = 10;
const CORE_MODULE_BUNDLE_TOTAL_BRL = 25;

const coreModuleLabels = {
  modulePipeline: {
    title: "Pipeline",
    price: "R$ 10/mês",
    description: "Gestão de oportunidades e tasks.",
    features: [
      "Quadro kanban com etapas personalizadas",
      "Sprints, backlog e historico",
      "Checklist, prioridades e responsaveis",
      "Campos customizados por tarefa",
    ],
  },
  moduleFinance: {
    title: "Finanças",
    price: "R$ 10/mês",
    description: "Controle de gastos e categorias.",
    features: [
      "Lancamentos e categorias personalizadas",
      "Graficos por categoria e periodo",
      "Filtros avancados e busca rapida",
      "Associação de contatos aos gastos",
    ],
  },
  moduleContacts: {
    title: "Contatos",
    price: "R$ 10/mês",
    description: "Gestão de contatos e categorias.",
    features: [
      "Campos e categorias personalizadas",
      "Filtros por tags e pesquisa rapida",
      "Copiar dados e abrir enderecos",
      "Historico com notas e observacoes",
    ],
  },
  moduleCalendar: {
    title: "Calendário",
    price: "R$ 10/mês",
    description: "Agenda visual e lembretes de tarefas.",
    features: [
      "Lista diaria de tarefas e lembretes",
      "Categorias compartilhadas com pipeline",
      "Criação rápida de tarefas",
      "Configuração de campos da tarefa",
    ],
  },
  moduleNotes: {
    title: "Notas",
    price: "R$ 10/mês",
    description: "Notas com editor rico e categorias.",
    features: [
      "Editor com rich text",
      "Categorias e subcategorias",
      "Links organizados por nota",
      "Busca rápida por título",
    ],
  },
};

const accessModuleFeatures: Record<string, string[]> = {
  "Dashboard executivo": [
    "KPIs em tempo real",
    "Indicadores de performance",
    "Visão consolidada por área",
  ],
  "Gestão de usuários": [
    "Controle de papéis e permissões",
    "Distribuição por time",
    "Permissões por módulo",
  ],
  "Convites e onboarding": [
    "Convites com papéis pré-definidos",
    "Fluxos de entrada por time",
    "Acompanhamento de status",
  ],
  Relatórios: [
    "Exportação de dados",
    "Auditoria de alterações",
    "Relatórios por período",
  ],
};

const fallbackAccessModules: AccessModule[] = [
  {
    id: -1,
    name: "Dashboard executivo",
    description: "KPIs e indicadores de acesso.",
    enabled: true,
  },
  {
    id: -2,
    name: "Gestão de usuários",
    description: "Perfis, roles e permissão.",
    enabled: true,
  },
  {
    id: -3,
    name: "Convites e onboarding",
    description: "Fluxos de entrada.",
    enabled: true,
  },
  {
    id: -4,
    name: "Relatórios",
    description: "Exportação e auditoria.",
    enabled: true,
  },
];

const languageOptions = [
  { value: "pt-BR", label: "Português do Brasil" },
  { value: "pt-PT", label: "Português de Portugal" },
  { value: "pt-AO", label: "Português de Angola" },
  { value: "es-419", label: "Espanhol latino-americano" },
  { value: "es-ES", label: "Espanhol europeu" },
  { value: "en-US", label: "Inglês americano" },
  { value: "en-CA", label: "Inglês canadense" },
  { value: "en-GB", label: "Inglês britânico" },
  { value: "en-AU", label: "Inglês australiano" },
  { value: "de-DE", label: "Alemão" },
  { value: "fr-FR", label: "Francês" },
];

export default function Profile() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [expanded, setExpanded] = useState<
    "main" | "security" | "notifications" | "modules" | "account" | false
  >(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [team, setTeam] = useState("");
  const [role, setRole] = useState("");
  const [timezone, setTimezone] = useState("");
  const [phones, setPhones] = useState<string[]>([""]);
  const [emails, setEmails] = useState<string[]>([""]);
  const [addresses, setAddresses] = useState<string[]>([""]);
  const [comments, setComments] = useState<string[]>([""]);
  const [preferences, setPreferences] = useState({
    notifyEmail: true,
    notifyMentions: true,
    notifyPipelineUpdates: true,
    notifyFinanceAlerts: true,
    notifyWeeklySummary: true,
    notifyProductUpdates: true,
    singleSession: false,
    modulePipeline: true,
    moduleFinance: true,
    moduleContacts: true,
    moduleCalendar: true,
    moduleNotes: true,
    language: "pt-BR",
  });
  const [languageDraft, setLanguageDraft] = useState("pt-BR");
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<string | null>(null);
  const [languageSnackbarOpen, setLanguageSnackbarOpen] = useState(false);
  const lastLanguageRef = useRef<string | null>(null);
  const [accessModules, setAccessModules] = useState<AccessModule[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSnackbar, setPasswordSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const formatBRL = (amount: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(amount);
  const [moduleDialog, setModuleDialog] = useState<ModuleDialog | null>(null);
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [switchAccounts, setSwitchAccounts] = useState<StoredAccount[]>([]);
  const [switchEmail, setSwitchEmail] = useState("");
  const [switchPassword, setSwitchPassword] = useState("");
  const [switchError, setSwitchError] = useState("");
  const [switchLoading, setSwitchLoading] = useState(false);
  const isLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);
  const accessModulesToShow = accessModules.length
    ? accessModules
    : fallbackAccessModules;
  const canToggleAccessModules = accessModules.length > 0;

  const coreModuleKeys = Object.keys(coreModuleLabels) as Array<
    | "modulePipeline"
    | "moduleFinance"
    | "moduleContacts"
    | "moduleCalendar"
    | "moduleNotes"
  >;
  const enabledCoreModulesCount = coreModuleKeys.filter(
    key => preferences[key]
  ).length;
  const allCoreModulesEnabled = enabledCoreModulesCount === coreModuleKeys.length;
  const bundleBaseTotal = coreModuleKeys.length * CORE_MODULE_PRICE_BRL;
  const coreModulesTotal = allCoreModulesEnabled
    ? CORE_MODULE_BUNDLE_TOTAL_BRL
    : enabledCoreModulesCount * CORE_MODULE_PRICE_BRL;

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      return;
    }
    
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setProfilePhoto(dataUrl);
        
        // Update localStorage immediately
        const stored = window.localStorage.getItem("sc_user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as { name?: string; email?: string };
            const updated = { ...parsed, profilePhoto: dataUrl };
            window.localStorage.setItem("sc_user", JSON.stringify(updated));
          } catch {
            // ignore
          }
        }
        
        // Trigger photo change event to update navbar
        window.dispatchEvent(new Event("profile-photo-change"));
      };
      reader.readAsDataURL(file);
    } catch {
      // ignore error
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordSnackbar({
        open: true,
        message: "Preencha os dois campos de senha",
        severity: "error",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordSnackbar({
        open: true,
        message: "A nova senha deve ter pelo menos 6 caracteres",
        severity: "error",
      });
      return;
    }

    try {
      await api.post("/api/auth/change-password", {
        currentPassword,
        newPassword,
      });
      
      setPasswordSnackbar({
        open: true,
        message: "Senha atualizada com sucesso",
        severity: "success",
      });
      
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: any) {
      setPasswordSnackbar({
        open: true,
        message: error?.response?.data?.message || "Erro ao atualizar senha",
        severity: "error",
      });
    }
  };

  const loadAccounts = () => {
    const stored = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    try {
      const parsed = JSON.parse(stored) as StoredAccount[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      window.localStorage.removeItem(ACCOUNT_STORAGE_KEY);
      return [];
    }
  };

  const persistAccount = (
    user?: { name?: string | null; email?: string },
    token?: string
  ) => {
    if (!user?.email) {
      return;
    }
    const existingAccounts = loadAccounts();
    const existing = existingAccounts.find(
      account => account.email === user.email
    );
    const nextAccount = {
      name: user.name || "",
      email: user.email,
      lastUsed: Date.now(),
      token: token || existing?.token,
    };
    const deduped = existingAccounts.filter(
      account => account.email !== user.email
    );
    const nextAccounts = [nextAccount, ...deduped].slice(0, 3);
    window.localStorage.setItem(
      ACCOUNT_STORAGE_KEY,
      JSON.stringify(nextAccounts)
    );
    setSwitchAccounts(nextAccounts);
  };

  const hydrateProfile = (response: {
    data?: {
      user?: { name?: string | null; email?: string | null };
      profile?: {
        phone?: string;
        team?: string;
        role?: string;
        timezone?: string;
        phones?: string[];
        emails?: string[];
        addresses?: string[];
        comments?: string[];
      };
      preferences?: {
        emailNotifications?: boolean;
        notifyMentions?: boolean;
        notifyPipelineUpdates?: boolean;
        notifyFinanceAlerts?: boolean;
        notifyWeeklySummary?: boolean;
        notifyProductUpdates?: boolean;
        singleSession?: boolean;
        modulePipeline?: boolean;
        moduleFinance?: boolean;
        moduleContacts?: boolean;
        moduleCalendar?: boolean;
        moduleNotes?: boolean;
        language?: string;
      };
    };
  }) => {
    const user = response?.data?.user;
    const profile = response?.data?.profile;
    const prefs = response?.data?.preferences;
    setName(user?.name || "");
    setEmail(user?.email || "");
    setTeam(profile?.team || "");
    setRole(profile?.role || "");
    setTimezone(profile?.timezone || "");
    const initialPhones =
      profile?.phones?.length && Array.isArray(profile.phones)
        ? profile.phones
        : profile?.phone
          ? [profile.phone]
          : [];
    setPhones(ensureList(initialPhones));

    const serverEmails = Array.isArray(profile?.emails) ? profile?.emails : [];
    const primary = typeof user?.email === "string" ? user.email : "";
    const mergedEmails = primary
      ? [primary, ...serverEmails.filter(item => item !== primary)]
      : serverEmails;
    setEmails(ensureList(mergedEmails));
    setAddresses(
      ensureList(
        Array.isArray(profile?.addresses) ? profile?.addresses || [] : []
      )
    );
    setComments(
      ensureList(
        Array.isArray(profile?.comments) ? profile?.comments || [] : []
      )
    );
    setPreferences({
      notifyEmail: Boolean(prefs?.emailNotifications ?? true),
      notifyMentions: Boolean(prefs?.notifyMentions ?? true),
      notifyPipelineUpdates: Boolean(prefs?.notifyPipelineUpdates ?? true),
      notifyFinanceAlerts: Boolean(prefs?.notifyFinanceAlerts ?? true),
      notifyWeeklySummary: Boolean(prefs?.notifyWeeklySummary ?? true),
      notifyProductUpdates: Boolean(prefs?.notifyProductUpdates ?? true),
      singleSession: Boolean(prefs?.singleSession),
      modulePipeline: Boolean(prefs?.modulePipeline ?? true),
      moduleFinance: Boolean(prefs?.moduleFinance ?? true),
      moduleContacts: Boolean(prefs?.moduleContacts ?? true),
      moduleCalendar: Boolean(prefs?.moduleCalendar ?? true),
      moduleNotes: Boolean(prefs?.moduleNotes ?? true),
      language: prefs?.language || "pt-BR",
    });
    setLanguageDraft(prefs?.language || "pt-BR");
    window.localStorage.setItem(
      "sc_prefs",
      JSON.stringify({
        modulePipeline: Boolean(prefs?.modulePipeline ?? true),
        moduleFinance: Boolean(prefs?.moduleFinance ?? true),
        moduleContacts: Boolean(prefs?.moduleContacts ?? true),
        moduleCalendar: Boolean(prefs?.moduleCalendar ?? true),
        moduleNotes: Boolean(prefs?.moduleNotes ?? true),
        language: prefs?.language || "pt-BR",
      })
    );
    window.dispatchEvent(new Event("prefs-change"));
    if (typeof user?.email === "string" && user.email) {
      const userData = { 
        name: user.name || "", 
        email: user.email, 
        profilePhoto: (user as { profilePhoto?: string }).profilePhoto || "" 
      };
      window.localStorage.setItem("sc_user", JSON.stringify(userData));
      persistAccount({ name: user.name ?? null, email: user.email });
    }
    const userPhoto = (user as { profilePhoto?: string })?.profilePhoto;
    if (typeof userPhoto === "string") {
      setProfilePhoto(userPhoto);
    }
  };

  useEffect(() => {
    const stored = window.localStorage.getItem("sc_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { name?: string; email?: string; profilePhoto?: string };
        if (parsed?.name) {
          setName(parsed.name);
        }
        if (parsed?.email) {
          setEmail(parsed.email);
        }
        if (parsed?.profilePhoto) {
          setProfilePhoto(parsed.profilePhoto);
        }
      } catch {
        window.localStorage.removeItem("sc_user");
      }
    }
    const syncProfile = async () => {
      try {
        const response = await api.get("/api/profile");
        hydrateProfile(response);
      } catch {
        // Keep local values if the session is unavailable.
      } finally {
        isLoadedRef.current = true;
      }
    };
    const syncModules = async () => {
      try {
        const response = await api.get("/api/access/modules");
        const modules = Array.isArray(response?.data?.modules)
          ? (response.data.modules as AccessModule[])
          : [];
        setAccessModules(modules);
      } catch {
        setAccessModules([]);
      }
    };
    void syncProfile();
    void syncModules();
  }, []);

  useEffect(() => {
    setEmail(emails[0] || "");
  }, [emails]);

  const handleLogout = () => {
    void api.post("/api/auth/logout").finally(() => {
      window.localStorage.removeItem("sc_user");
      window.localStorage.removeItem("sc_active_session");
      window.dispatchEvent(new Event("auth-change"));
      setLocation("/login");
    });
  };

  const handleSwitchAccount = () => {
    setSwitchAccounts(loadAccounts());
    setSwitchEmail("");
    setSwitchPassword("");
    setSwitchError("");
    setSwitchDialogOpen(true);
  };

  const handleSwitchLogin = async (nextEmail?: string) => {
    setSwitchError("");
    const targetEmail = (nextEmail || switchEmail).trim().toLowerCase();
    if (!targetEmail || !switchPassword) {
      setSwitchError("Informe email e senha.");
      return;
    }
    setSwitchLoading(true);
    try {
      const response = await api.post("/api/auth/login", {
        email: targetEmail,
        password: switchPassword,
      });
      const user = response?.data?.user;
      const token = response?.data?.token;
      if (user?.email) {
        window.localStorage.setItem(
          "sc_user",
          JSON.stringify({ name: user.name || "", email: user.email })
        );
      }
      if (token) {
        window.localStorage.setItem("sc_active_session", token);
      }
      persistAccount(user, token);
      window.dispatchEvent(new Event("auth-change"));
      window.localStorage.setItem(
        "sc_switch_notice",
        `Conta alterada: ${user?.email || targetEmail}`
      );
      window.dispatchEvent(new Event("switch-account"));
      setSwitchDialogOpen(false);
      setSwitchPassword("");
      setSwitchEmail("");
      setLocation("/home");
    } catch (error) {
      const response = (
        error as { response?: { status?: number; data?: { error?: string } } }
      )?.response;
      const code = response?.data?.error;
      if (code === "session_conflict") {
        setSwitchError(
          "Sua conta foi usada em outro lugar. Todas as sessoes foram encerradas. Entre novamente."
        );
      } else {
        setSwitchError("Email ou senha invalidos.");
      }
    } finally {
      setSwitchLoading(false);
    }
  };

  const sanitizePhone = (value: string) => value.replace(/\D/g, "");

  const sanitizeList = (items: string[]) =>
    items.map(item => item.trim()).filter(Boolean);

  const ensureList = (items: string[]) => (items.length ? items : [""]);

  const saveProfile = () => {
    const primaryPhone = sanitizeList(phones)[0] || "";
    const primaryEmail = sanitizeList(emails)[0] || email;
    void api
      .put("/api/profile", {
        name,
        email: primaryEmail,
        profilePhoto,
        phone: primaryPhone,
        team,
        role,
        timezone,
        phones: sanitizeList(phones),
        emails: sanitizeList(emails),
        addresses: sanitizeList(addresses),
        comments: sanitizeList(comments),
        preferences: {
          emailNotifications: preferences.notifyEmail,
          singleSession: preferences.singleSession,
          modulePipeline: preferences.modulePipeline,
          moduleFinance: preferences.moduleFinance,
          moduleContacts: preferences.moduleContacts,
          moduleCalendar: preferences.moduleCalendar,
          moduleNotes: preferences.moduleNotes,
          language: preferences.language,
          notifyMentions: preferences.notifyMentions,
          notifyPipelineUpdates: preferences.notifyPipelineUpdates,
          notifyFinanceAlerts: preferences.notifyFinanceAlerts,
          notifyWeeklySummary: preferences.notifyWeeklySummary,
          notifyProductUpdates: preferences.notifyProductUpdates,
        },
      })
      .then(response => {
        const user = response?.data?.user;
        if (user?.email) {
          const userData = {
            name: user.name || "",
            email: user.email,
            profilePhoto: profilePhoto
          };
          window.localStorage.setItem("sc_user", JSON.stringify(userData));
          window.dispatchEvent(new Event("profile-photo-change"));
        }
      })
      .catch(() => {
        // No-op for now.
      });
  };

  useEffect(() => {
    if (!isLoadedRef.current) {
      return;
    }
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      window.localStorage.setItem(
        "sc_prefs",
        JSON.stringify({
          modulePipeline: preferences.modulePipeline,
          moduleFinance: preferences.moduleFinance,
          moduleContacts: preferences.moduleContacts,
          moduleCalendar: preferences.moduleCalendar,
          moduleNotes: preferences.moduleNotes,
          language: preferences.language,
        })
      );
      window.dispatchEvent(new Event("prefs-change"));
      saveProfile();
    }, 600);
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    name,
    email,
    profilePhoto,
    team,
    role,
    timezone,
    phones,
    emails,
    addresses,
    comments,
    preferences,
  ]);

  useEffect(() => {
    setLanguageDraft(preferences.language);
  }, [preferences.language]);

  const requestModuleToggle = (
    key:
      | "modulePipeline"
      | "moduleFinance"
      | "moduleContacts"
      | "moduleCalendar"
      | "moduleNotes",
    nextValue: boolean
  ) => {
    setModuleDialog({ kind: "core", key, nextValue });
  };

  const requestAccessModuleToggle = (
    module: AccessModule,
    nextValue: boolean
  ) => {
    if (!canToggleAccessModules) {
      return;
    }
    setModuleDialog({
      kind: "access",
      id: module.id,
      name: module.name,
      nextValue,
    });
  };

  const confirmModuleToggle = async () => {
    if (!moduleDialog) {
      return;
    }
    if (moduleDialog.kind === "core") {
      setPreferences(prev => ({
        ...prev,
        [moduleDialog.key]: moduleDialog.nextValue,
      }));
      setModuleDialog(null);
      return;
    }
    try {
      const response = await api.patch(
        `/api/access/modules/${moduleDialog.id}`,
        {
          enabled: moduleDialog.nextValue,
        }
      );
      const updated = response?.data?.module as AccessModule | undefined;
      setAccessModules(prev =>
        prev.map(item =>
          item.id === moduleDialog.id
            ? {
                ...item,
                enabled: updated?.enabled ?? moduleDialog.nextValue,
              }
            : item
        )
      );
    } catch {
      // Keep local state if the update fails.
    } finally {
      setModuleDialog(null);
    }
  };

  const updateListItem = (
    setter: Dispatch<SetStateAction<string[]>>,
    index: number,
    value: string,
    transform?: (value: string) => string
  ) => {
    const nextValue = transform ? transform(value) : value;
    setter(prev => prev.map((item, idx) => (idx === index ? nextValue : item)));
  };

  const removeListItem = (
    setter: Dispatch<SetStateAction<string[]>>,
    index: number
  ) => {
    setter(prev => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.length ? next : [""];
    });
  };

  const addListItem = (setter: Dispatch<SetStateAction<string[]>>) => {
    setter(prev => [...prev, ""]);
  };

  const getLanguageLabel = (value: string) =>
    languageOptions.find(option => option.value === value)?.label || value;

  const handleLanguageSelect = useCallback((nextLanguage: string) => {
    setLanguageDraft(nextLanguage);
    if (nextLanguage === preferences.language) {
      setPendingLanguage(null);
      return;
    }
    setPendingLanguage(nextLanguage);
    setLanguageDialogOpen(true);
  }, [preferences.language]);

  const handleGoToAccess = useCallback(() => {
    setLocation("/access");
  }, [setLocation]);

  const handleLanguageConfirm = () => {
    if (!pendingLanguage || pendingLanguage === preferences.language) {
      setLanguageDialogOpen(false);
      setPendingLanguage(null);
      return;
    }
    lastLanguageRef.current = preferences.language;
    const nextLanguage = pendingLanguage;
    
    // Alterar idioma no i18n
    changeLanguage(nextLanguage);
    
    setPreferences(prev => {
      const next = { ...prev, language: nextLanguage };
      window.localStorage.setItem(
        "sc_prefs",
        JSON.stringify({
          modulePipeline: next.modulePipeline,
          moduleFinance: next.moduleFinance,
          moduleContacts: next.moduleContacts,
          moduleCalendar: next.moduleCalendar,
          moduleNotes: next.moduleNotes,
          language: next.language,
        })
      );
      window.dispatchEvent(new Event("prefs-change"));
      return next;
    });
    setLanguageDraft(nextLanguage);
    setLanguageDialogOpen(false);
    setPendingLanguage(null);
    setLanguageSnackbarOpen(true);
  };

  const handleLanguageCancel = () => {
    setLanguageDraft(preferences.language);
    setLanguageDialogOpen(false);
    setPendingLanguage(null);
  };

  const handleLanguageUndo = () => {
    if (!lastLanguageRef.current) {
      setLanguageSnackbarOpen(false);
      return;
    }
    const previous = lastLanguageRef.current;
    setPreferences(prev => {
      const next = { ...prev, language: previous };
      window.localStorage.setItem(
        "sc_prefs",
        JSON.stringify({
          modulePipeline: next.modulePipeline,
          moduleFinance: next.moduleFinance,
          moduleContacts: next.moduleContacts,
          moduleCalendar: next.moduleCalendar,
          moduleNotes: next.moduleNotes,
          language: next.language,
        })
      );
      window.dispatchEvent(new Event("prefs-change"));
      return next;
    });
    setLanguageDraft(previous);
    setLanguageSnackbarOpen(false);
    lastLanguageRef.current = null;
  };

  const moduleFeatures = moduleDialog
    ? moduleDialog.kind === "core"
      ? coreModuleLabels[moduleDialog.key].features
      : accessModuleFeatures[moduleDialog.name] || []
    : [];
  const showModuleFeatures = Boolean(
    moduleDialog?.nextValue && moduleFeatures.length
  );

  const languageSelect = useMemo(
    () => (
      <TextField
        select
        label="Idioma"
        value={languageDraft}
        onChange={event => handleLanguageSelect(event.target.value)}
        size="small"
        sx={{ minWidth: 260 }}
      >
        {languageOptions.map(option => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    ),
    [languageDraft, handleLanguageSelect]
  );

  const profileActions = useMemo(
    () => (
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          type="button"
          variant="outlined"
          size="small"
          onClick={handleGoToAccess}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {t("nav.access")}
        </Button>
        {languageSelect}
      </Stack>
    ),
    [handleGoToAccess, languageSelect, t]
  );

  usePageActions(profileActions);

  return (
    <PageContainer>
      <Stack spacing={3}>
        <Box sx={{ display: { xs: "block", md: "none" } }}>{profileActions}</Box>

        <AppAccordion
          expanded={expanded === "main"}
          onChange={(_, isExpanded) => setExpanded(isExpanded ? "main" : false)}
          title="Dados principais"
        >
          <Stack spacing={2.5}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <Avatar
                src={profilePhoto}
                alt={name || "Perfil"}
                sx={{
                  width: 120,
                  height: 120,
                  fontSize: "3rem",
                  bgcolor: "primary.main",
                }}
              >
                {!profilePhoto && (name?.[0]?.toUpperCase() || "?")}
              </Avatar>
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCameraRoundedIcon />}
                sx={{ textTransform: "none" }}
              >
                Alterar foto
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </Button>
              {profilePhoto && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setProfilePhoto("");
                    
                    // Update localStorage immediately
                    const stored = window.localStorage.getItem("sc_user");
                    if (stored) {
                      try {
                        const parsed = JSON.parse(stored) as { name?: string; email?: string };
                        const updated = { ...parsed, profilePhoto: "" };
                        window.localStorage.setItem("sc_user", JSON.stringify(updated));
                      } catch {
                        // ignore
                      }
                    }
                    
                    window.dispatchEvent(new Event("profile-photo-change"));
                  }}
                  sx={{ textTransform: "none" }}
                >
                  Remover foto
                </Button>
              )}
            </Box>
            <TextField
              label="Nome"
              fullWidth
              value={name}
              onChange={event => setName(event.target.value)}
            />
            <TextField
              label="Time"
              fullWidth
              value={team}
              onChange={event => setTeam(event.target.value)}
            />
            <TextField
              label="Cargo"
              fullWidth
              value={role}
              onChange={event => setRole(event.target.value)}
            />
            <TextField
              label="Fuso horario"
              fullWidth
              value={timezone}
              onChange={event => setTimezone(event.target.value)}
            />

            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Telefones
              </Typography>
              {phones.map((phone, index) => (
                <Stack
                  key={`phone-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <TextField
                    label={`Telefone ${index + 1}`}
                    fullWidth
                    value={phone}
                    onChange={event =>
                      updateListItem(
                        setPhones,
                        index,
                        event.target.value,
                        sanitizePhone
                      )
                    }
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                  />
                  <IconButton onClick={() => removeListItem(setPhones, index)}>
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddRoundedIcon />}
                onClick={() => addListItem(setPhones)}
                sx={{
                  alignSelf: "flex-start",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Adicionar telefone
              </Button>
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Emails
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Pelo menos 1 email e obrigatório.
              </Typography>
              {emails.map((item, index) => (
                <Stack
                  key={`email-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <TextField
                    label={`Email ${index + 1}`}
                    fullWidth
                    value={item}
                    onChange={event =>
                      updateListItem(setEmails, index, event.target.value)
                    }
                  />
                  <IconButton onClick={() => removeListItem(setEmails, index)}>
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddRoundedIcon />}
                onClick={() => addListItem(setEmails)}
                sx={{
                  alignSelf: "flex-start",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Adicionar email
              </Button>
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Endereços
              </Typography>
              {addresses.map((address, index) => (
                <Stack
                  key={`address-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <TextField
                    label={`Endereço ${index + 1}`}
                    fullWidth
                    value={address}
                    onChange={event =>
                      updateListItem(setAddresses, index, event.target.value)
                    }
                  />
                  <IconButton
                    component="a"
                    href={
                      address
                        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            address
                          )}`
                        : undefined
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    disabled={!address}
                  >
                    <LinkRoundedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() => removeListItem(setAddresses, index)}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddRoundedIcon />}
                onClick={() => addListItem(setAddresses)}
                sx={{
                  alignSelf: "flex-start",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Adicionar endereco
              </Button>
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Comentarios
              </Typography>
              {comments.map((comment, index) => (
                <Stack
                  key={`comment-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <TextField
                    label={`Comentario ${index + 1}`}
                    fullWidth
                    multiline
                    minRows={2}
                    value={comment}
                    onChange={event =>
                      updateListItem(setComments, index, event.target.value)
                    }
                  />
                  <IconButton
                    onClick={() => removeListItem(setComments, index)}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddRoundedIcon />}
                onClick={() => addListItem(setComments)}
                sx={{
                  alignSelf: "flex-start",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Adicionar comentario
              </Button>
            </Stack>
          </Stack>
        </AppAccordion>

        <AppAccordion
          expanded={expanded === "notifications"}
          onChange={(_, isExpanded) =>
            setExpanded(isExpanded ? "notifications" : false)
          }
          title="Notificações"
        >
          <Stack spacing={2.5}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              <AppCard
                variant="outlined"
                onClick={() =>
                  setPreferences(prev => ({
                    ...prev,
                    notifyEmail: !prev.notifyEmail,
                  }))
                }
                sx={theme => ({
                  p: 2.5,
                  cursor: "pointer",
                  ...interactiveCardSx(theme),
                })}
              >
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Notificações por email
                    </Typography>
                    <ToggleCheckbox
                      checked={preferences.notifyEmail}
                      onChange={event =>
                        setPreferences(prev => ({
                          ...prev,
                          notifyEmail: event.target.checked,
                        }))
                      }
                      onClick={event => event.stopPropagation()}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Receba alertas relevantes no email.
                  </Typography>
                </Stack>
              </AppCard>
              <AppCard
                variant="outlined"
                onClick={() =>
                  setPreferences(prev => ({
                    ...prev,
                    notifyMentions: !prev.notifyMentions,
                  }))
                }
                sx={theme => ({
                  p: 2.5,
                  cursor: "pointer",
                  ...interactiveCardSx(theme),
                })}
              >
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Mencoes e atribuicoes
                    </Typography>
                    <ToggleCheckbox
                      checked={preferences.notifyMentions}
                      onChange={event =>
                        setPreferences(prev => ({
                          ...prev,
                          notifyMentions: event.target.checked,
                        }))
                      }
                      onClick={event => event.stopPropagation()}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Avise quando voce for mencionado em tarefas.
                  </Typography>
                </Stack>
              </AppCard>
              <AppCard
                variant="outlined"
                onClick={() =>
                  setPreferences(prev => ({
                    ...prev,
                    notifyPipelineUpdates: !prev.notifyPipelineUpdates,
                  }))
                }
                sx={theme => ({
                  p: 2.5,
                  cursor: "pointer",
                  ...interactiveCardSx(theme),
                })}
              >
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Atualizacoes da pipeline
                    </Typography>
                    <ToggleCheckbox
                      checked={preferences.notifyPipelineUpdates}
                      onChange={event =>
                        setPreferences(prev => ({
                          ...prev,
                          notifyPipelineUpdates: event.target.checked,
                        }))
                      }
                      onClick={event => event.stopPropagation()}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Movimentacoes e mudancas de status.
                  </Typography>
                </Stack>
              </AppCard>
              <AppCard
                variant="outlined"
                onClick={() =>
                  setPreferences(prev => ({
                    ...prev,
                    notifyFinanceAlerts: !prev.notifyFinanceAlerts,
                  }))
                }
                sx={theme => ({
                  p: 2.5,
                  cursor: "pointer",
                  ...interactiveCardSx(theme),
                })}
              >
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Alertas financeiros
                    </Typography>
                    <ToggleCheckbox
                      checked={preferences.notifyFinanceAlerts}
                      onChange={event =>
                        setPreferences(prev => ({
                          ...prev,
                          notifyFinanceAlerts: event.target.checked,
                        }))
                      }
                      onClick={event => event.stopPropagation()}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Limites e variacoes relevantes.
                  </Typography>
                </Stack>
              </AppCard>
              <AppCard
                variant="outlined"
                onClick={() =>
                  setPreferences(prev => ({
                    ...prev,
                    notifyWeeklySummary: !prev.notifyWeeklySummary,
                  }))
                }
                sx={theme => ({
                  p: 2.5,
                  cursor: "pointer",
                  ...interactiveCardSx(theme),
                })}
              >
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Resumo semanal
                    </Typography>
                    <ToggleCheckbox
                      checked={preferences.notifyWeeklySummary}
                      onChange={event =>
                        setPreferences(prev => ({
                          ...prev,
                          notifyWeeklySummary: event.target.checked,
                        }))
                      }
                      onClick={event => event.stopPropagation()}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Relatório semanal da conta.
                  </Typography>
                </Stack>
              </AppCard>
              <AppCard
                variant="outlined"
                onClick={() =>
                  setPreferences(prev => ({
                    ...prev,
                    notifyProductUpdates: !prev.notifyProductUpdates,
                  }))
                }
                sx={theme => ({
                  p: 2.5,
                  cursor: "pointer",
                  ...interactiveCardSx(theme),
                })}
              >
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Novidades do produto
                    </Typography>
                    <ToggleCheckbox
                      checked={preferences.notifyProductUpdates}
                      onChange={event =>
                        setPreferences(prev => ({
                          ...prev,
                          notifyProductUpdates: event.target.checked,
                        }))
                      }
                      onClick={event => event.stopPropagation()}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Novos recursos e melhorias.
                  </Typography>
                </Stack>
              </AppCard>
            </Box>
          </Stack>
        </AppAccordion>

        <AppAccordion
          expanded={expanded === "modules"}
          onChange={(_, isExpanded) =>
            setExpanded(isExpanded ? "modules" : false)
          }
          title="Modulos"
        >
          <Stack spacing={2.5}>
            <AppCard variant="outlined" sx={{ p: 2.5 }}>
              <Stack spacing={0.75}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Total dos módulos
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatBRL(coreModulesTotal)}/mês
                </Typography>
                {allCoreModulesEnabled ? (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Todos os módulos pagos: de {formatBRL(bundleBaseTotal)}/mês por {formatBRL(CORE_MODULE_BUNDLE_TOTAL_BRL)}/mês (R$ 5 por módulo).
                  </Typography>
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {formatBRL(CORE_MODULE_PRICE_BRL)}/mês por módulo pago. Módulos administrativos são grátis.
                  </Typography>
                )}
              </Stack>
            </AppCard>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              {(
                Object.keys(coreModuleLabels) as Array<
                  | "modulePipeline"
                  | "moduleFinance"
                  | "moduleContacts"
                  | "moduleCalendar"
                  | "moduleNotes"
                >
              ).map(key => (
                <AppCard
                  key={key}
                  variant="outlined"
                  onClick={() => requestModuleToggle(key, !preferences[key])}
                  sx={theme => ({
                    p: 2.5,
                    cursor: "pointer",
                    ...interactiveCardSx(theme),
                  })}
                >
                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {coreModuleLabels[key].title}
                      </Typography>
                      <ToggleCheckbox
                        checked={preferences[key]}
                        onClick={event => {
                          event.stopPropagation();
                          requestModuleToggle(key, !preferences[key]);
                        }}
                        onChange={() => {}}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {coreModuleLabels[key].description}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {coreModuleLabels[key].price}
                    </Typography>
                  </Stack>
                </AppCard>
              ))}
            </Box>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Modulos administrativos
              </Typography>
              {accessModulesToShow.length ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  {accessModulesToShow.map(module => (
                    <AppCard
                      key={module.id}
                      variant="outlined"
                      onClick={() =>
                        requestAccessModuleToggle(module, !module.enabled)
                      }
                      sx={theme => ({
                        p: 2,
                        cursor: "pointer",
                        ...interactiveCardSx(theme),
                      })}
                    >
                      <Stack spacing={1}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                          >
                            {module.name}
                          </Typography>
                          <ToggleCheckbox
                            checked={module.enabled}
                            disabled={!canToggleAccessModules}
                            onClick={event => {
                              event.stopPropagation();
                              requestAccessModuleToggle(
                                module,
                                !module.enabled
                              );
                            }}
                            onChange={() => {}}
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          {module.description}
                        </Typography>
                      </Stack>
                      </AppCard>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Nenhum módulo adicional encontrado.
                </Typography>
              )}
            </Stack>
          </Stack>
        </AppAccordion>

        <AppAccordion
          expanded={expanded === "security"}
          onChange={(_, isExpanded) =>
            setExpanded(isExpanded ? "security" : false)
          }
          title="Senha"
        >
          <Stack spacing={3}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField 
                label="Senha atual" 
                type="password" 
                fullWidth 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <TextField 
                label="Nova senha" 
                type="password" 
                fullWidth 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Box>
            <Button
              variant="outlined"
              size="large"
              sx={{ alignSelf: "flex-start" }}
              onClick={handlePasswordChange}
            >
              Atualizar senha
            </Button>
          </Stack>
        </AppAccordion>

        <CardSection size="md">
          <Stack spacing={2.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Conta
            </Typography>
            <Divider />
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2.5}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <AppCard
                variant="outlined"
                onClick={() =>
                  setPreferences(prev => ({
                    ...prev,
                    singleSession: !prev.singleSession,
                  }))
                }
                sx={theme => ({
                  p: 2.5,
                  cursor: "pointer",
                  flex: 1,
                  maxWidth: { xs: "100%", md: 420 },
                  ...interactiveCardSx(theme),
                })}
              >
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Sessao unica
                    </Typography>
                    <ToggleCheckbox
                      checked={preferences.singleSession}
                      onChange={event =>
                        setPreferences(prev => ({
                          ...prev,
                          singleSession: event.target.checked,
                        }))
                      }
                      onClick={event => event.stopPropagation()}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Desconecte outras sessoes ao entrar novamente.
                  </Typography>
                </Stack>
              </AppCard>

              <Stack
                direction="column"
                spacing={1.5}
                alignItems="stretch"
                sx={{ display: { xs: "none", md: "flex" } }}
              >
                <Button
                  color="error"
                  variant="contained"
                  size="large"
                  onClick={handleLogout}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    minWidth: 180,
                    height: 48,
                  }}
                >
                  Sair
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleSwitchAccount}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    minWidth: 180,
                    height: 48,
                  }}
                >
                  Trocar de conta
                </Button>
              </Stack>
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ display: { xs: "flex", md: "none" } }}
            >
              <Button
                color="error"
                variant="contained"
                size="large"
                fullWidth
                onClick={handleLogout}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Sair
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={handleSwitchAccount}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Trocar de conta
              </Button>
            </Stack>
          </Stack>
        </CardSection>
      </Stack>

      <Dialog
        open={Boolean(moduleDialog)}
        onClose={() => setModuleDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent>
          <Stack spacing={2}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h6">
                {moduleDialog
                  ? moduleDialog.nextValue
                    ? "Ativar módulo"
                    : "Desativar módulo"
                  : "Modulo"}
              </Typography>
              <IconButton
                onClick={() => setModuleDialog(null)}
                sx={{ color: "text.secondary" }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            {moduleDialog ? (
              <Stack spacing={1.5}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {moduleDialog.kind === "core"
                    ? moduleDialog.nextValue
                      ? `Você confirma a ativação do módulo ${coreModuleLabels[moduleDialog.key].title}?`
                      : `Você confirma a desativação do módulo ${coreModuleLabels[moduleDialog.key].title}?`
                    : moduleDialog.nextValue
                      ? `Você confirma a ativação do módulo ${moduleDialog.name}?`
                      : `Você confirma a desativação do módulo ${moduleDialog.name}?`}
                </Typography>
                {moduleDialog.kind === "core" ? (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {coreModuleLabels[moduleDialog.key].price} por módulo.
                  </Typography>
                ) : null}
                {showModuleFeatures ? (
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      O que voce recebe
                    </Typography>
                    <Stack spacing={0.5}>
                      {moduleFeatures.map(feature => (
                        <Typography
                          key={feature}
                          variant="body2"
                          sx={{ color: "text.secondary" }}
                        >
                          - {feature}
                        </Typography>
                      ))}
                    </Stack>
                  </Stack>
                ) : null}
              </Stack>
            ) : null}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="flex-end"
            >
              <Button variant="outlined" onClick={() => setModuleDialog(null)}>
                Cancelar
              </Button>
              <Button variant="contained" onClick={confirmModuleToggle}>
                Confirmar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={languageDialogOpen}
        onClose={handleLanguageCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent>
          <Stack spacing={2}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h6">Alterar idioma</Typography>
              <IconButton
                onClick={handleLanguageCancel}
                sx={{ color: "text.secondary" }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Deseja alterar o idioma para{" "}
              {getLanguageLabel(pendingLanguage || languageDraft)}?
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="flex-end"
            >
              <Button variant="outlined" onClick={handleLanguageCancel}>
                Cancelar
              </Button>
              <Button variant="contained" onClick={handleLanguageConfirm}>
                Confirmar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={switchDialogOpen}
        onClose={() => setSwitchDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent>
          <Stack spacing={2.5}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h6">Trocar de conta</Typography>
              <IconButton
                onClick={() => setSwitchDialogOpen(false)}
                sx={{ color: "text.secondary" }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            {switchAccounts.length ? (
              <Stack spacing={1}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "text.secondary" }}
                >
                  Contas recentes
                </Typography>
                <Stack spacing={1}>
                  {switchAccounts.map(account => (
                    <AppCard
                      key={account.email}
                      variant="outlined"
                      onClick={() => {
                        if (account.email === email) {
                          setSwitchDialogOpen(false);
                          return;
                        }
                        if (account.token) {
                          window.localStorage.setItem(
                            "sc_active_session",
                            account.token
                          );
                          window.localStorage.setItem(
                            "sc_user",
                            JSON.stringify({
                              name: account.name || "",
                              email: account.email,
                            })
                          );
                          window.dispatchEvent(new Event("auth-change"));
                          window.localStorage.setItem(
                            "sc_switch_notice",
                            `Conta alterada: ${account.email}`
                          );
                          window.dispatchEvent(new Event("switch-account"));
                          setSwitchDialogOpen(false);
                          setLocation("/home");
                          return;
                        }
                        setSwitchEmail(account.email);
                        setSwitchError("");
                      }}
                      sx={theme => ({
                        p: 1.5,
                        cursor: "pointer",
                        ...interactiveCardSx(theme),
                      })}
                    >
                      <Stack spacing={0.5}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          {account.name || "Conta"}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          {account.email}
                        </Typography>
                        {account.email === email ? (
                          <Typography
                            variant="caption"
                            sx={{ color: "primary.main" }}
                          >
                            Conta ativa
                          </Typography>
                        ) : null}
                      </Stack>
                    </AppCard>
                  ))}
                </Stack>
              </Stack>
            ) : null}
            <Stack spacing={2}>
              <Typography variant="subtitle2">Entrar em outra conta</Typography>
              <TextField
                label="Email"
                fullWidth
                value={switchEmail}
                onChange={event => setSwitchEmail(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter") {
                    void handleSwitchLogin();
                  }
                }}
              />
              <TextField
                label="Senha"
                type="password"
                fullWidth
                value={switchPassword}
                onChange={event => setSwitchPassword(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter") {
                    void handleSwitchLogin();
                  }
                }}
              />
              {switchError ? (
                <Typography variant="body2" sx={{ color: "error.main" }}>
                  {switchError}
                </Typography>
              ) : null}
            </Stack>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="flex-end"
            >
              <Button
                variant="outlined"
                onClick={() => setSwitchDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="contained"
                onClick={() => void handleSwitchLogin()}
                disabled={switchLoading}
              >
                Entrar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={languageSnackbarOpen}
        autoHideDuration={6000}
        onClose={() => setLanguageSnackbarOpen(false)}
        message={`Idioma alterado para ${getLanguageLabel(preferences.language)}.`}
        action={
          <Button
            variant="text"
            color="inherit"
            size="small"
            onClick={handleLanguageUndo}
          >
            Reverter
          </Button>
        }
      />

      <Snackbar
        open={passwordSnackbar.open}
        autoHideDuration={6000}
        onClose={() => setPasswordSnackbar({ ...passwordSnackbar, open: false })}
        message={passwordSnackbar.message}
        ContentProps={{
          sx: {
            backgroundColor: passwordSnackbar.severity === "error" ? "error.main" : "success.main",
          },
        }}
      />
    </PageContainer>
  );
}
