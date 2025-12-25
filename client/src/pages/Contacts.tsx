import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  MenuItem,
  Popover,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { APP_RADIUS_PX } from "../designTokens";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SettingsIconButton from "../components/SettingsIconButton";
import ToggleCheckbox from "../components/ToggleCheckbox";
import { interactiveCardSx } from "../styles/interactiveCard";
import { PageContainer } from "../ui/PageContainer/PageContainer";
import { TextField as TextFieldVE } from "../ui/TextField";
import { SearchField } from "../ui/SearchField";
import CardSection from "../components/layout/CardSection";
import CategoryFilter from "../components/CategoryFilter";
import SettingsDialog from "../components/SettingsDialog";
import { loadUserStorage, saveUserStorage } from "../userStorage";
import * as contactStyles from "./contacts.css";

type Contact = {
  id: string;
  name: string;
  birthday: string;
  phones: string[];
  emails: string[];
  addresses: string[];
  comments: string[];
  categoryIds: string[];
  role?: string;
};

type Category = {
  id: string;
  name: string;
  color: string;
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map(item => (typeof item === "string" ? item : String(item ?? "")))
    .filter(Boolean);
};

const normalizeContact = (value: unknown): Contact => {
  const raw = (value ?? {}) as Partial<Contact> & Record<string, unknown>;
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : `contact-${Date.now()}`,
    name: typeof raw.name === "string" ? raw.name : "",
    birthday: typeof raw.birthday === "string" ? raw.birthday : "",
    phones: toStringArray(raw.phones),
    emails: toStringArray(raw.emails),
    addresses: toStringArray(raw.addresses),
    comments: toStringArray(raw.comments),
    categoryIds: toStringArray(raw.categoryIds),
    role: typeof raw.role === "string" ? raw.role : "",
  };
};

const STORAGE_KEY = "contacts_v1";
const CATEGORY_STORAGE_KEY = "contact_categories_v1";
const USER_ROLE_STORAGE_KEY = "sc_user_roles";
const CARD_FIELDS_KEY = "contact_card_fields_v1";
const DETAIL_FIELDS_KEY = "contact_detail_fields_v1";

const DEFAULT_COLORS = [
  "#0f766e",
  "#1d4ed8",
  "#6d28d9",
  "#7c2d12",
  "#7c4a03",
  "#0f172a",
  "#334155",
  "#166534",
  "#9d174d",
  "#312e81",
  "#1f2937",
  "#0f3d3e",
];

const roleOptions = ["Administrador", "Gestor", "Analista", "Leitor"];

const defaultCategories: Category[] = [
  { id: "cat-familia", name: "Familia", color: DEFAULT_COLORS[0] },
  { id: "cat-amigos", name: "Amigos", color: DEFAULT_COLORS[1] },
  { id: "cat-trabalho", name: "Trabalho", color: DEFAULT_COLORS[2] },
  { id: "cat-cliente", name: "Cliente", color: DEFAULT_COLORS[3] },
  { id: "cat-parceiro", name: "Parceiro", color: DEFAULT_COLORS[4] },
  { id: "cat-fornecedor", name: "Fornecedor", color: DEFAULT_COLORS[5] },
  { id: "cat-prospect", name: "Prospect", color: DEFAULT_COLORS[6] },
  { id: "cat-vip", name: "VIP", color: DEFAULT_COLORS[7] },
  { id: "cat-suporte", name: "Suporte", color: DEFAULT_COLORS[8] },
  { id: "cat-financeiro", name: "Financeiro", color: DEFAULT_COLORS[9] },
  { id: "cat-equipe", name: "Equipe", color: DEFAULT_COLORS[10] },
  { id: "cat-outros", name: "Outros", color: DEFAULT_COLORS[11] },
];

const darkenColor = (value: string, factor: number) => {
  const trimmed = value.trim();
  let r = 0;
  let g = 0;
  let b = 0;

  if (/^#([0-9a-fA-F]{3})$/.test(trimmed)) {
    const hex = trimmed.slice(1);
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (/^#([0-9a-fA-F]{6})$/.test(trimmed)) {
    const hex = trimmed.slice(1);
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    const match = trimmed.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
    if (match) {
      r = Math.min(255, Number(match[1]));
      g = Math.min(255, Number(match[2]));
      b = Math.min(255, Number(match[3]));
    }
  }

  const next = (channel: number) => Math.max(0, Math.round(channel * factor));
  return `rgb(${next(r)}, ${next(g)}, ${next(b)})`;
};

const emptyContact = (): Contact => ({
  id: `contact-${Date.now()}`,
  name: "",
  birthday: "",
  phones: [""],
  emails: [""],
  addresses: [""],
  comments: [""],
  categoryIds: [],
  role: "",
});

const defaultContactCardFields = {
  phones: true,
  emails: true,
  addresses: true,
  categories: true,
};

const defaultContactDetailFields = {
  birthday: true,
  categories: true,
  phones: true,
  emails: true,
  addresses: true,
  comments: true,
};

const sampleContacts: Contact[] = [
  {
    id: "contact-ana-mendes",
    name: "Ana Mendes",
    birthday: "1992-04-18",
    phones: ["11988887777", "1133445566"],
    emails: ["ana.mendes@exemplo.com", "ana@agenciaflux.com"],
    addresses: [
      "Rua Augusta, 1200, Sao Paulo, SP",
      "Av. Paulista, 1578, Sao Paulo, SP",
    ],
    comments: [
      "Preferencia por contato via WhatsApp.",
      "Cliente ativa desde 2021.",
    ],
    categoryIds: ["cat-cliente", "cat-vip"],
  },
  {
    id: "contact-bruno-silva",
    name: "Bruno Silva",
    birthday: "1988-11-02",
    phones: ["21999998888"],
    emails: ["bruno.silva@techpark.io"],
    addresses: ["Rua Visconde de Piraja, 330, Rio de Janeiro, RJ"],
    comments: ["Responsavel por compras internas."],
    categoryIds: ["cat-trabalho", "cat-equipe"],
  },
  {
    id: "contact-carla-souza",
    name: "Carla Souza",
    birthday: "1995-07-09",
    phones: ["31977776666"],
    emails: ["carla.souza@exemplo.com", "carla@parceirosul.com"],
    addresses: ["Av. Afonso Pena, 900, Belo Horizonte, MG"],
    comments: ["Parceira de eventos regionais."],
    categoryIds: ["cat-parceiro"],
  },
  {
    id: "contact-diego-almeida",
    name: "Diego Almeida",
    birthday: "1985-01-27",
    phones: ["61966665555", "6133221100"],
    emails: ["diego.almeida@fornecedoresbr.com"],
    addresses: ["SCS Quadra 08, Brasilia, DF"],
    comments: ["Fornecedor de impressos e brindes."],
    categoryIds: ["cat-fornecedor"],
  },
  {
    id: "contact-elis-regis",
    name: "Elis Regis",
    birthday: "1990-09-14",
    phones: ["71955554444"],
    emails: ["elis.regis@exemplo.com"],
    addresses: ["Av. Oceania, 210, Salvador, BA"],
    comments: ["Amiga da equipe de marketing."],
    categoryIds: ["cat-amigos"],
  },
  {
    id: "contact-felipe-rocha",
    name: "Felipe Rocha",
    birthday: "1997-03-30",
    phones: ["51944443333"],
    emails: ["felipe@startupazul.com"],
    addresses: ["Rua Padre Chagas, 75, Porto Alegre, RS"],
    comments: ["Prospect em negociação para Q3."],
    categoryIds: ["cat-prospect"],
  },
  {
    id: "contact-gabriela-lopes",
    name: "Gabriela Lopes",
    birthday: "1993-12-05",
    phones: ["47933332222"],
    emails: ["gabriela@clientesul.com"],
    addresses: ["Rua XV de Novembro, 410, Blumenau, SC"],
    comments: ["Cliente com foco em expansao."],
    categoryIds: ["cat-cliente"],
  },
  {
    id: "contact-henrique-santos",
    name: "Henrique Santos",
    birthday: "1989-06-21",
    phones: ["11922221111"],
    emails: ["henrique.santos@suporteprime.com"],
    addresses: ["Rua Funchal, 411, Sao Paulo, SP"],
    comments: ["Contato de suporte nivel 2."],
    categoryIds: ["cat-suporte"],
  },
  {
    id: "contact-iris-moura",
    name: "Iris Moura",
    birthday: "1998-10-10",
    phones: ["61911112222"],
    emails: ["iris.moura@exemplo.com"],
    addresses: ["CLN 210, Brasilia, DF"],
    comments: ["Familia - contato de emergencia."],
    categoryIds: ["cat-familia"],
  },
  {
    id: "contact-joao-pereira",
    name: "Joao Pereira",
    birthday: "1983-02-12",
    phones: ["21900001111"],
    emails: ["joao.pereira@financeirot.com"],
    addresses: ["Rua do Ouvidor, 50, Rio de Janeiro, RJ"],
    comments: ["Financeiro externo."],
    categoryIds: ["cat-financeiro"],
  },
];

export default function Contacts() {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactForm, setContactForm] = useState<Contact | null>(null);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsAccordion, setSettingsAccordion] = useState<
    "categories" | "cards" | "details" | false
  >(false);
  const [cardFields, setCardFields] = useState({
    ...defaultContactCardFields,
  });
  const [detailFields, setDetailFields] = useState({
    ...defaultContactDetailFields,
  });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(DEFAULT_COLORS[0]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryColor, setEditingCategoryColor] = useState(
    DEFAULT_COLORS[0]
  );
  const [copyMessage, setCopyMessage] = useState("");
  const [copySnackbarOpen, setCopySnackbarOpen] = useState(false);
  const [contactQuery, setContactQuery] = useState("");
  const [birthdayInput, setBirthdayInput] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [removeContactOpen, setRemoveContactOpen] = useState(false);
  const birthdayFieldRef = useRef<HTMLInputElement | null>(null);
  const calendarAnchorRef = useRef<HTMLButtonElement | null>(null);
  const isLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);
  const restoreDefaultsSnapshotRef = useRef<{
    categories: Category[];
    cardFields: typeof cardFields;
    detailFields: typeof detailFields;
    settingsAccordion: typeof settingsAccordion;
    newCategoryName: string;
    newCategoryColor: string;
    editingCategoryId: string | null;
    editingCategoryName: string;
    editingCategoryColor: string;
  } | null>(null);
  const [restoreDefaultsSnackbarOpen, setRestoreDefaultsSnackbarOpen] =
    useState(false);

  useEffect(() => {
    const load = async () => {
      const [dbContacts, dbCategories] = await Promise.all([
        loadUserStorage<Contact[]>(STORAGE_KEY),
        loadUserStorage<Category[]>(CATEGORY_STORAGE_KEY),
      ]);

      if (Array.isArray(dbContacts) && dbContacts.length) {
        const normalized = dbContacts.map(normalizeContact);
        setContacts(normalized);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        isLoadedRef.current = true;
      } else {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (!stored) {
          setContacts(sampleContacts.map(normalizeContact));
          isLoadedRef.current = true;
        } else {
          try {
            const parsed = JSON.parse(stored) as Contact[];
            if (Array.isArray(parsed)) {
              const normalizedParsed = parsed.map(normalizeContact);
              const existingIds = new Set(
                normalizedParsed.map(contact => contact.id)
              );
              const merged = [...normalizedParsed];
              sampleContacts.forEach(contact => {
                const normalizedSample = normalizeContact(contact);
                if (!existingIds.has(normalizedSample.id)) {
                  merged.push(normalizedSample);
                }
              });
              setContacts(merged);
            }
          } catch {
            window.localStorage.removeItem(STORAGE_KEY);
          } finally {
            isLoadedRef.current = true;
          }
        }
      }

      if (Array.isArray(dbCategories) && dbCategories.length) {
        setCategories(dbCategories);
        window.localStorage.setItem(
          CATEGORY_STORAGE_KEY,
          JSON.stringify(dbCategories)
        );
      } else {
        const storedCategories =
          window.localStorage.getItem(CATEGORY_STORAGE_KEY);
        if (!storedCategories) {
          return;
        }
        try {
          const parsed = JSON.parse(storedCategories) as Category[];
          if (Array.isArray(parsed) && parsed.length) {
            const hasContactDefaults = parsed.some(cat =>
              [
                "Familia",
                "Amigos",
                "Cliente",
                "Fornecedor",
                "Prospect",
                "Equipe",
              ].includes(cat.name)
            );
            setCategories(hasContactDefaults ? parsed : defaultCategories);
            if (!hasContactDefaults) {
              window.localStorage.setItem(
                CATEGORY_STORAGE_KEY,
                JSON.stringify(defaultCategories)
              );
            }
          }
        } catch {
          window.localStorage.removeItem(CATEGORY_STORAGE_KEY);
        }
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!isLoadedRef.current) {
      return;
    }
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
      window.localStorage.setItem(
        CATEGORY_STORAGE_KEY,
        JSON.stringify(categories)
      );
      void saveUserStorage(STORAGE_KEY, contacts);
      void saveUserStorage(CATEGORY_STORAGE_KEY, categories);
      window.dispatchEvent(new Event("contacts-change"));
    }, 300);
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [contacts, categories]);

  useEffect(() => {
    const load = async () => {
      const dbValue =
        await loadUserStorage<Partial<typeof cardFields>>(CARD_FIELDS_KEY);
      if (dbValue && typeof dbValue === "object") {
        setCardFields(prev => ({ ...prev, ...dbValue }));
        window.localStorage.setItem(CARD_FIELDS_KEY, JSON.stringify(dbValue));
        return;
      }
      const stored = window.localStorage.getItem(CARD_FIELDS_KEY);
      if (!stored) {
        return;
      }
      try {
        const parsed = JSON.parse(stored) as Partial<typeof cardFields>;
        setCardFields(prev => ({ ...prev, ...parsed }));
      } catch {
        window.localStorage.removeItem(CARD_FIELDS_KEY);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CARD_FIELDS_KEY, JSON.stringify(cardFields));
    const timeoutId = setTimeout(() => {
      void saveUserStorage(CARD_FIELDS_KEY, cardFields);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [cardFields]);

  useEffect(() => {
    const load = async () => {
      const dbValue =
        await loadUserStorage<Partial<typeof detailFields>>(DETAIL_FIELDS_KEY);
      if (dbValue && typeof dbValue === "object") {
        setDetailFields(prev => ({ ...prev, ...dbValue }));
        window.localStorage.setItem(DETAIL_FIELDS_KEY, JSON.stringify(dbValue));
        return;
      }
      const stored = window.localStorage.getItem(DETAIL_FIELDS_KEY);
      if (!stored) {
        return;
      }
      try {
        const parsed = JSON.parse(stored) as Partial<typeof detailFields>;
        setDetailFields(prev => ({ ...prev, ...parsed }));
      } catch {
        window.localStorage.removeItem(DETAIL_FIELDS_KEY);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      DETAIL_FIELDS_KEY,
      JSON.stringify(detailFields)
    );
    const timeoutId = setTimeout(() => {
      void saveUserStorage(DETAIL_FIELDS_KEY, detailFields);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [detailFields]);

  const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

  const handleRestoreContactsDefaults = () => {
    restoreDefaultsSnapshotRef.current = {
      categories,
      cardFields,
      detailFields,
      settingsAccordion,
      newCategoryName,
      newCategoryColor,
      editingCategoryId,
      editingCategoryName,
      editingCategoryColor,
    };
    cancelEditCategory();
    setNewCategoryName("");
    setNewCategoryColor(DEFAULT_COLORS[0]);
    setSettingsAccordion(false);
    setCategories(defaultCategories);
    setCardFields({ ...defaultContactCardFields });
    setDetailFields({ ...defaultContactDetailFields });
    setRestoreDefaultsSnackbarOpen(true);
  };

  const handleUndoRestoreContactsDefaults = () => {
    const snapshot = restoreDefaultsSnapshotRef.current;
    if (!snapshot) {
      setRestoreDefaultsSnackbarOpen(false);
      return;
    }
    setCategories(snapshot.categories);
    setCardFields(snapshot.cardFields);
    setDetailFields(snapshot.detailFields);
    setSettingsAccordion(snapshot.settingsAccordion);
    setNewCategoryName(snapshot.newCategoryName);
    setNewCategoryColor(snapshot.newCategoryColor);
    setEditingCategoryId(snapshot.editingCategoryId);
    setEditingCategoryName(snapshot.editingCategoryName);
    setEditingCategoryColor(snapshot.editingCategoryColor);
    restoreDefaultsSnapshotRef.current = null;
    setRestoreDefaultsSnackbarOpen(false);
  };

  const openNewContact = useCallback(() => {
    const next = emptyContact();
    setSelectedContact(null);
    setEditingContact(next);
    setContactForm(next);
  }, []);

  const openContact = (contact: Contact) => {
    setSelectedContact(contact);
    setEditingContact(null);
    setContactForm(null);
  };

  const updateListField = (
    key: "phones" | "emails" | "addresses" | "comments",
    index: number,
    value: string
  ) => {
    setContactForm(prev => {
      if (!prev) {
        return prev;
      }
      const next = { ...prev };
      const list = [...next[key]];
      list[index] = value;
      next[key] = list;
      return next;
    });
  };

  const sanitizePhone = (value: string) => value.replace(/\D/g, "");
  const formatWhatsAppLink = (value: string) => {
    const digits = sanitizePhone(value);
    if (!digits) {
      return "";
    }
    const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
    return `https://wa.me/${withCountry}`;
  };

  const copyText = async (value: string) => {
    const text = value.trim();
    if (!text) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("Copiado.");
      setCopySnackbarOpen(true);
    } catch {
      const fallback = document.createElement("textarea");
      fallback.value = text;
      document.body.appendChild(fallback);
      fallback.select();
      document.execCommand("copy");
      document.body.removeChild(fallback);
      setCopyMessage("Copiado.");
      setCopySnackbarOpen(true);
    }
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) {
      return;
    }
    const id = `cat-${Date.now()}`;
    setCategories(prev => [...prev, { id, name, color: newCategoryColor }]);
    setNewCategoryName("");
  };

  const handleRemoveCategory = (id: string) => {
    let nextCategories = categories.filter(cat => cat.id !== id);
    if (nextCategories.length === 0) {
      nextCategories = [
        {
          id: `cat-${Date.now()}`,
          name: "Sem categoria",
          color: DEFAULT_COLORS[0],
        },
      ];
    }
    setCategories(nextCategories);
    setEditingCategoryId(prev => (prev === id ? null : prev));
    setContacts(prev =>
      prev.map(contact => ({
        ...contact,
        categoryIds: (contact.categoryIds || []).filter(catId => catId !== id),
      }))
    );
    setContactForm(prev =>
      prev
        ? {
            ...prev,
            categoryIds: (prev.categoryIds || []).filter(catId => catId !== id),
          }
        : prev
    );
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setEditingCategoryName(cat.name);
    setEditingCategoryColor(cat.color);
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
  };

  const saveCategory = () => {
    if (!editingCategoryId) {
      return;
    }
    const name = editingCategoryName.trim();
    if (!name) {
      return;
    }
    setCategories(prev =>
      prev.map(cat =>
        cat.id === editingCategoryId
          ? { ...cat, name, color: editingCategoryColor }
          : cat
      )
    );
    setEditingCategoryId(null);
  };

  const addListField = (
    key: "phones" | "emails" | "addresses" | "comments"
  ) => {
    setContactForm(prev => {
      if (!prev) {
        return prev;
      }
      return { ...prev, [key]: [...prev[key], ""] };
    });
  };

  const removeListField = (
    key: "phones" | "emails" | "addresses" | "comments",
    index: number
  ) => {
    setContactForm(prev => {
      if (!prev) {
        return prev;
      }
      const list = prev[key].filter((_, idx) => idx !== index);
      return { ...prev, [key]: list.length ? list : [""] };
    });
  };

  const hasContactContent = (contact: Contact) => {
    if (contact.name.trim() || contact.birthday) {
      return true;
    }
    if (contact.phones.some(phone => phone.trim())) {
      return true;
    }
    if (contact.emails.some(email => email.trim())) {
      return true;
    }
    if (contact.addresses.some(address => address.trim())) {
      return true;
    }
    if (contact.comments.some(comment => comment.trim())) {
      return true;
    }
    if (contact.categoryIds && contact.categoryIds.length) {
      return true;
    }
    return false;
  };

  const updateUserRole = (contact: Contact) => {
    const email = (contact.emails || []).find(value => value.trim())?.trim();
    if (!email) {
      return;
    }
    const stored = window.localStorage.getItem(USER_ROLE_STORAGE_KEY);
    let roles: Record<string, string> = {};
    if (stored) {
      try {
        roles = JSON.parse(stored) as Record<string, string>;
      } catch {
        window.localStorage.removeItem(USER_ROLE_STORAGE_KEY);
      }
    }
    if (contact.role) {
      roles[email] = contact.role;
    } else if (roles[email]) {
      delete roles[email];
    }
    window.localStorage.setItem(USER_ROLE_STORAGE_KEY, JSON.stringify(roles));
    window.dispatchEvent(new Event("roles-change"));
  };

  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);

  const filteredContacts = contacts.filter(contact => {
    const term = contactQuery.trim().toLowerCase();
    if (categoryFilters.length > 0) {
      const ids = contact.categoryIds || [];
      if (!categoryFilters.some(filterId => ids.includes(filterId))) {
        return false;
      }
    }
    if (!term) {
      return true;
    }
    const haystack = [
      contact.name,
      ...contact.phones,
      ...contact.emails,
      ...contact.addresses,
      ...contact.comments,
      ...((contact.categoryIds || [])
        .map(id => categoryMap.get(id)?.name)
        .filter(Boolean) as string[]),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });

  const removeContact = () => {
    if (!editingContact) {
      return;
    }
    setContacts(prev => prev.filter(item => item.id !== editingContact.id));
    setEditingContact(null);
    setContactForm(null);
  };

  const saveContact = () => {
    if (!contactForm) {
      return;
    }
    const nextContact = {
      ...contactForm,
      categoryIds: contactForm.categoryIds || [],
    };
    setContacts(prev => {
      const existingIndex = prev.findIndex(item => item.id === nextContact.id);
      if (existingIndex === -1) {
        return [nextContact, ...prev];
      }
      const next = [...prev];
      next[existingIndex] = nextContact;
      return next;
    });
    setEditingContact(null);
    setContactForm(null);
    updateUserRole(nextContact);
  };

  useEffect(() => {
    if (!contactForm) {
      return;
    }
    if (!hasContactContent(contactForm)) {
      return;
    }
    setContacts(prev => {
      const existingIndex = prev.findIndex(item => item.id === contactForm.id);
      if (existingIndex === -1) {
        return [contactForm, ...prev];
      }
      const next = [...prev];
      next[existingIndex] = contactForm;
      return next;
    });
    updateUserRole(contactForm);
  }, [contactForm]);

  useEffect(() => {
    if (!contactForm) {
      setBirthdayInput("");
      return;
    }
    if (!contactForm.birthday) {
      setBirthdayInput("");
      return;
    }
    const [year, month, day] = contactForm.birthday.split("-");
    if (year && month && day) {
      setBirthdayInput(`${day}/${month}/${year}`);
    }
  }, [contactForm]);

  const normalizeBirthdayInput = (value: string) =>
    value.replace(/[^\d/]/g, "").slice(0, 10);

  const parseIsoDate = (value: string) => {
    if (!value) {
      return null;
    }
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date;
  };

  const parseBirthdayToIso = (value: string) => {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      return "";
    }
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return "";
    }
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return "";
    }
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${year}-${pad(month)}-${pad(day)}`;
  };

  const monthLabels = [
    "Janeiro",
    "Fevereiro",
    "Marco",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const weekLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

  const getCalendarDays = (base: Date) => {
    const year = base.getFullYear();
    const month = base.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - startOffset);
    const days = Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        date,
        inMonth: date.getMonth() === month,
      };
    });
    return days;
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const openCalendar = () => {
    const baseDate = parseIsoDate(contactForm?.birthday || "");
    const today = new Date();
    const target = baseDate || today;
    setCalendarMonth(new Date(target.getFullYear(), target.getMonth(), 1));
    setCalendarOpen(true);
  };

  const closeSelectedContact = () => {
    setSelectedContact(null);
    setRemoveContactOpen(false);
  };

  const pageActions = useMemo(
    () => (
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          variant="outlined"
          onClick={openNewContact}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          Adicionar contato
        </Button>
        <SettingsIconButton onClick={() => setSettingsOpen(true)} />
      </Stack>
    ),
    [openNewContact]
  );

  return (
    <PageContainer actionsSlot={pageActions}>
      <Stack spacing={3}>
        {contacts.length === 0 ? (
          <CardSection>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Nenhum contato cadastrado ainda.
            </Typography>
          </CardSection>
        ) : (
          <Stack spacing={2}>
            <div className={contactStyles.filtersRow}>
              <div className={contactStyles.searchWrap}>
                <SearchField
                  placeholder="Buscar contatos"
                  value={contactQuery}
                  onChange={event => setContactQuery(event.target.value)}
                  onClear={() => setContactQuery("")}
                  fullWidth
                />
              </div>
              <div className={contactStyles.categoryWrap}>
                <CategoryFilter
                  categories={categories}
                  selectedIds={categoryFilters}
                  onChange={setCategoryFilters}
                  width="100%"
                />
              </div>
            </div>
            {filteredContacts.length === 0 ? (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Nenhum contato encontrado.
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 2,
                }}
              >
                {filteredContacts.map(contact =>
                  (() => {
                    const visibleDetailCount = [
                      cardFields.phones,
                      cardFields.emails,
                      cardFields.addresses,
                      cardFields.categories,
                    ].filter(Boolean).length;
                    const minHeight =
                      visibleDetailCount === 0
                        ? 96
                        : visibleDetailCount === 1
                          ? 120
                          : visibleDetailCount === 2
                            ? 136
                            : 160;
                    return (
                      <CardSection
                        key={contact.id}
                        onClick={() => openContact(contact)}
                        size="sm"
                        sx={theme => ({
                          minHeight,
                          cursor: "pointer",
                          ...interactiveCardSx(theme),
                        })}
                      >
                        <Stack spacing={1}>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 700 }}
                          >
                            {contact.name || "Sem nome"}
                          </Typography>
                          {cardFields.phones ? (
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary" }}
                            >
                              {contact.phones.filter(Boolean).length} telefones
                            </Typography>
                          ) : null}
                          {cardFields.emails ? (
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary" }}
                            >
                              {contact.emails.filter(Boolean).length} emails
                            </Typography>
                          ) : null}
                          {cardFields.addresses ? (
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary" }}
                            >
                              {contact.addresses.filter(Boolean).length}{" "}
                              enderecos
                            </Typography>
                          ) : null}
                          {cardFields.categories ? (
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary" }}
                            >
                              {contact.categoryIds?.length
                                ? `${contact.categoryIds.length} categorias`
                                : "Sem categoria"}
                            </Typography>
                          ) : null}
                        </Stack>
                      </CardSection>
                    );
                  })()
                )}
              </Box>
            )}
          </Stack>
        )}
      </Stack>

      <Dialog
        open={Boolean(selectedContact)}
        onClose={() => setSelectedContact(null)}
        maxWidth="sm"
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
              <Typography variant="h6">
                {selectedContact?.name || "Contato"}
              </Typography>
              <IconButton
                onClick={closeSelectedContact}
                sx={{ color: "text.secondary" }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            {detailFields.birthday ? (
              <Stack spacing={0.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Aniversário
                </Typography>
                {selectedContact?.birthday ? (
                  <Typography variant="body2">
                    {new Date(selectedContact.birthday).toLocaleDateString(
                      "pt-BR"
                    )}
                  </Typography>
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Nao informado.
                  </Typography>
                )}
              </Stack>
            ) : null}
            {detailFields.categories ? (
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Categorias
                </Typography>
                {selectedContact?.categoryIds?.length ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {selectedContact.categoryIds
                      .map(catId => categoryMap.get(catId))
                      .filter(Boolean)
                      .map(cat => (
                        <Chip
                          key={cat?.id}
                          label={cat?.name}
                          size="small"
                          sx={{
                            color: "#e6edf3",
                            backgroundColor: darkenColor(
                              cat?.color || "#0f172a",
                              0.5
                            ),
                          }}
                        />
                      ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Sem categoria.
                  </Typography>
                )}
              </Stack>
            ) : null}
            {detailFields.phones ? (
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Telefones
                </Typography>
                {selectedContact?.phones.filter(Boolean).length ? (
                  selectedContact?.phones
                    .filter(Boolean)
                    .map((phone, index) => (
                      <Stack
                        key={`view-phone-${index}`}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <Typography variant="body2">{phone}</Typography>
                        <Tooltip title="Copiar telefone" placement="top">
                          <IconButton
                            size="small"
                            onClick={() => copyText(phone)}
                            aria-label="Copiar telefone"
                          >
                            <ContentCopyRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Abrir no WhatsApp" placement="top">
                          <IconButton
                            component="a"
                            href={formatWhatsAppLink(phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            aria-label="Abrir WhatsApp"
                            disabled={!formatWhatsAppLink(phone)}
                          >
                            <WhatsAppIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ))
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Nenhum telefone informado.
                  </Typography>
                )}
              </Stack>
            ) : null}
            {detailFields.emails ? (
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Emails
                </Typography>
                {selectedContact?.emails.filter(Boolean).length ? (
                  selectedContact?.emails
                    .filter(Boolean)
                    .map((email, index) => (
                      <Stack
                        key={`view-email-${index}`}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <Typography variant="body2">{email}</Typography>
                        <Tooltip title="Copiar email" placement="top">
                          <IconButton
                            size="small"
                            onClick={() => copyText(email)}
                            aria-label="Copiar email"
                          >
                            <ContentCopyRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ))
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Nenhum email informado.
                  </Typography>
                )}
              </Stack>
            ) : null}
            {detailFields.addresses ? (
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Endereços
                </Typography>
                {selectedContact?.addresses.filter(Boolean).length ? (
                  selectedContact?.addresses
                    .filter(Boolean)
                    .map((address, index) => (
                      <Stack
                        key={`view-address-${index}`}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <Typography variant="body2">{address}</Typography>
                        <Tooltip title="Copiar endereco" placement="top">
                          <IconButton
                            size="small"
                            onClick={() => copyText(address)}
                            aria-label="Copiar endereco"
                          >
                            <ContentCopyRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Abrir no Maps" placement="top">
                          <IconButton
                            component="a"
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              address
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            aria-label="Abrir no Maps"
                          >
                            <LinkRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ))
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Nenhum endereco informado.
                  </Typography>
                )}
              </Stack>
            ) : null}
            {detailFields.comments ? (
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Comentarios
                </Typography>
                {selectedContact?.comments.filter(Boolean).length ? (
                  selectedContact?.comments
                    .filter(Boolean)
                    .map((comment, index) => (
                      <Typography key={`view-comment-${index}`} variant="body2">
                        {comment}
                      </Typography>
                    ))
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Nenhum comentario informado.
                  </Typography>
                )}
              </Stack>
            ) : null}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="flex-end"
            >
              <Button
                color="error"
                variant="outlined"
                onClick={() => setRemoveContactOpen(true)}
              >
                Remover
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  if (!selectedContact) {
                    return;
                  }
                  setEditingContact(selectedContact);
                  setContactForm({
                    ...selectedContact,
                    categoryIds: selectedContact.categoryIds || [],
                  });
                  closeSelectedContact();
                }}
              >
                Editar
              </Button>
              <Button variant="contained" onClick={closeSelectedContact}>
                Fechar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingContact)}
        onClose={() => setEditingContact(null)}
        maxWidth="sm"
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
              <Typography variant="h6">
                {editingContact?.name
                  ? `Editar ${editingContact.name}`
                  : "Novo contato"}
              </Typography>
              <IconButton
                onClick={() => setEditingContact(null)}
                sx={{ color: "text.secondary" }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            <TextField
              label="Nome"
              fullWidth
              value={contactForm?.name || ""}
              onChange={event =>
                setContactForm(prev =>
                  prev ? { ...prev, name: event.target.value } : prev
                )
              }
            />
            <TextField
              select
              label="Papel (Gestão)"
              fullWidth
              value={contactForm?.role || ""}
              onChange={event =>
                setContactForm(prev =>
                  prev ? { ...prev, role: event.target.value } : prev
                )
              }
            >
              <MenuItem value="">Sem papel</MenuItem>
              {roleOptions.map(role => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Data de aniversario"
              fullWidth
              placeholder="DD/MM/AAAA"
              value={birthdayInput}
              onChange={event => {
                const nextValue = normalizeBirthdayInput(event.target.value);
                setBirthdayInput(nextValue);
                const iso = parseBirthdayToIso(nextValue);
                setContactForm(prev =>
                  prev ? { ...prev, birthday: iso } : prev
                );
              }}
              onBlur={() => {
                if (!birthdayInput.trim()) {
                  setContactForm(prev =>
                    prev ? { ...prev, birthday: "" } : prev
                  );
                  return;
                }
                const iso = parseBirthdayToIso(birthdayInput);
                setContactForm(prev =>
                  prev ? { ...prev, birthday: iso } : prev
                );
                if (!iso) {
                  return;
                }
                const [year, month, day] = iso.split("-");
                setBirthdayInput(`${day}/${month}/${year}`);
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      onClick={openCalendar}
                      aria-label="Abrir calendario"
                      ref={calendarAnchorRef}
                    >
                      <CalendarTodayRoundedIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              inputProps={{ inputMode: "numeric" }}
              inputRef={birthdayFieldRef}
            />
            <Popover
              open={calendarOpen}
              anchorEl={calendarAnchorRef.current}
              onClose={() => setCalendarOpen(false)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              PaperProps={{
                sx: theme => ({
                  mt: 1,
                  p: 2,
                  borderRadius: APP_RADIUS_PX,
                  border: 1,
                  borderColor: "divider",
                  backgroundColor: "background.paper",
                  minWidth: 280,
                }),
              }}
            >
              <Stack spacing={1.5}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth() - 1,
                          1
                        )
                      )
                    }
                  >
                    <ChevronLeftRoundedIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {monthLabels[calendarMonth.getMonth()]}{" "}
                    {calendarMonth.getFullYear()}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth() + 1,
                          1
                        )
                      )
                    }
                  >
                    <ChevronRightRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 0.5,
                    textAlign: "center",
                  }}
                >
                  {weekLabels.map(label => (
                    <Typography
                      key={label}
                      variant="caption"
                      sx={{ color: "text.secondary", fontWeight: 600 }}
                    >
                      {label}
                    </Typography>
                  ))}
                  {getCalendarDays(calendarMonth).map(day => {
                    const selectedDate = parseIsoDate(
                      contactForm?.birthday || ""
                    );
                    const isSelected = selectedDate
                      ? isSameDay(day.date, selectedDate)
                      : false;
                    const isToday = isSameDay(day.date, new Date());
                    return (
                      <Box
                        key={day.date.toISOString()}
                        component="button"
                        type="button"
                        onClick={() => {
                          const iso = `${day.date.getFullYear()}-${String(
                            day.date.getMonth() + 1
                          ).padStart(
                            2,
                            "0"
                          )}-${String(day.date.getDate()).padStart(2, "0")}`;
                          setContactForm(prev =>
                            prev ? { ...prev, birthday: iso } : prev
                          );
                          setBirthdayInput(
                            `${String(day.date.getDate()).padStart(2, "0")}/${String(
                              day.date.getMonth() + 1
                            ).padStart(2, "0")}/${day.date.getFullYear()}`
                          );
                          setCalendarOpen(false);
                        }}
                        sx={{
                          appearance: "none",
                          borderRadius: 1.5,
                          p: 0.75,
                          cursor: "pointer",
                          backgroundColor: isSelected
                            ? "rgba(34, 201, 166, 0.25)"
                            : "transparent",
                          color: day.inMonth
                            ? "text.primary"
                            : "text.secondary",
                          border: isToday
                            ? "1px solid rgba(34, 201, 166, 0.5)"
                            : "1px solid transparent",
                        }}
                      >
                        <Typography variant="caption">
                          {day.date.getDate()}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Stack>
            </Popover>
            <Autocomplete
              multiple
              options={categories}
              value={categories.filter(cat =>
                (contactForm?.categoryIds || []).includes(cat.id)
              )}
              onChange={(_, value) =>
                setContactForm(prev =>
                  prev
                    ? { ...prev, categoryIds: value.map(cat => cat.id) }
                    : prev
                )
              }
              getOptionLabel={option => option.name}
              disableCloseOnSelect
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <Checkbox checked={selected} size="small" sx={{ mr: 1 }} />
                  {option.name}
                </li>
              )}
              renderInput={params => (
                <TextField {...params} label="Categorias" fullWidth />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.name}
                    size="small"
                    sx={{
                      color: "#e6edf3",
                      backgroundColor: darkenColor(option.color, 0.5),
                    }}
                  />
                ))
              }
            />

            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Telefones
              </Typography>
              {contactForm?.phones.map((phone, index) => (
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
                      updateListField(
                        "phones",
                        index,
                        sanitizePhone(event.target.value)
                      )
                    }
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                  />
                  <IconButton onClick={() => removeListField("phones", index)}>
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddRoundedIcon />}
                onClick={() => addListField("phones")}
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
              {contactForm?.emails.map((email, index) => (
                <Stack
                  key={`email-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <TextField
                    label={`Email ${index + 1}`}
                    fullWidth
                    value={email}
                    onChange={event =>
                      updateListField("emails", index, event.target.value)
                    }
                  />
                  <IconButton onClick={() => removeListField("emails", index)}>
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddRoundedIcon />}
                onClick={() => addListField("emails")}
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
              {contactForm?.addresses.map((address, index) => (
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
                      updateListField("addresses", index, event.target.value)
                    }
                  />
                  <IconButton
                    component="a"
                    href={
                      address
                        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
                        : undefined
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    disabled={!address}
                  >
                    <LinkRoundedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() => removeListField("addresses", index)}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddRoundedIcon />}
                onClick={() => addListField("addresses")}
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
              {contactForm?.comments.map((comment, index) => (
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
                      updateListField("comments", index, event.target.value)
                    }
                  />
                  <IconButton
                    onClick={() => removeListField("comments", index)}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddRoundedIcon />}
                onClick={() => addListField("comments")}
                sx={{
                  alignSelf: "flex-start",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Adicionar comentario
              </Button>
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="flex-end"
            >
              <Button color="error" variant="outlined" onClick={removeContact}>
                Remover
              </Button>
              <Button
                variant="outlined"
                onClick={() => setEditingContact(null)}
              >
                Cancelar
              </Button>
              <Button variant="contained" onClick={saveContact}>
                Salvar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={removeContactOpen}
        onClose={() => setRemoveContactOpen(false)}
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
              <Typography variant="h6">Remover contato</Typography>
              <IconButton
                onClick={() => setRemoveContactOpen(false)}
                sx={{ color: "text.secondary" }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Você confirma a exclusão deste contato? Essa ação não pode ser
              desfeita.
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="flex-end"
            >
              <Button
                variant="outlined"
                onClick={() => setRemoveContactOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                color="error"
                variant="contained"
                onClick={() => {
                  if (!selectedContact) {
                    return;
                  }
                  setContacts(prev =>
                    prev.filter(item => item.id !== selectedContact.id)
                  );
                  closeSelectedContact();
                }}
              >
                Remover
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          cancelEditCategory();
          setSettingsAccordion(false);
        }}
        title="Configurações"
        maxWidth="sm"
        onRestoreDefaults={handleRestoreContactsDefaults}
        sections={[
          {
            key: "categories",
            title: "Categorias",
            content: (
              <Stack spacing={1.5}>
                {editingCategoryId ? (
                  <CardSection size="xs">
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Editar categoria
                      </Typography>
                      <TextField
                        label="Nome"
                        fullWidth
                        value={editingCategoryName}
                        onChange={event =>
                          setEditingCategoryName(event.target.value)
                        }
                      />
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        {DEFAULT_COLORS.map(color => (
                          <Box
                            key={color}
                            onClick={() => setEditingCategoryColor(color)}
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: 1,
                              backgroundColor: color,
                              borderStyle: "solid",
                              borderWidth:
                                editingCategoryColor === color ? 2 : 1,
                              borderColor: "divider",
                              cursor: "pointer",
                            }}
                          />
                        ))}
                      </Stack>
                      <Stack
                        direction="row"
                        spacing={2}
                        justifyContent="flex-end"
                      >
                        <Button variant="outlined" onClick={cancelEditCategory}>
                          Cancelar
                        </Button>
                        <Button variant="contained" onClick={saveCategory}>
                          Salvar
                        </Button>
                      </Stack>
                    </Stack>
                  </CardSection>
                ) : null}
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {categories.map(cat => (
                    <Chip
                      key={cat.id}
                      label={cat.name}
                      onClick={() => startEditCategory(cat)}
                      onDelete={() => handleRemoveCategory(cat.id)}
                      sx={{
                        color: "#e6edf3",
                        backgroundColor: darkenColor(cat.color, 0.5),
                      }}
                    />
                  ))}
                </Stack>
                {editingCategoryId ? null : (
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", mb: 1 }}
                    >
                      Nova categoria
                    </Typography>
                    <Stack spacing={1.5}>
                      <TextField
                        label="Nome"
                        fullWidth
                        value={newCategoryName}
                        onChange={event =>
                          setNewCategoryName(event.target.value)
                        }
                      />
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        {DEFAULT_COLORS.map(color => (
                          <Box
                            key={color}
                            onClick={() => setNewCategoryColor(color)}
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: 1,
                              backgroundColor: color,
                              borderStyle: "solid",
                              borderWidth: newCategoryColor === color ? 2 : 1,
                              borderColor: "divider",
                              cursor: "pointer",
                            }}
                          />
                        ))}
                      </Stack>
                      <Button
                        variant="outlined"
                        onClick={handleAddCategory}
                        startIcon={<AddRoundedIcon />}
                        sx={{
                          alignSelf: "flex-start",
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        Criar categoria
                      </Button>
                    </Stack>
                  </Box>
                )}
              </Stack>
            ),
          },
          {
            key: "cards",
            title: "Detalhes do card",
            content: (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.5,
                }}
              >
                {[
                  { key: "phones", label: "Telefones" },
                  { key: "emails", label: "Emails" },
                  { key: "addresses", label: "Endereços" },
                  { key: "categories", label: "Categorias" },
                ].map(item => (
                  <Box
                    key={item.key}
                    sx={theme => ({
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      cursor: "pointer",
                      ...interactiveCardSx(theme),
                    })}
                    onClick={() =>
                      setCardFields(prev => ({
                        ...prev,
                        [item.key]: !prev[item.key as keyof typeof cardFields],
                      }))
                    }
                  >
                    <Typography variant="subtitle2">{item.label}</Typography>
                    <ToggleCheckbox
                      checked={Boolean(
                        cardFields[item.key as keyof typeof cardFields]
                      )}
                      onChange={event =>
                        setCardFields(prev => ({
                          ...prev,
                          [item.key]: event.target.checked,
                        }))
                      }
                      onClick={event => event.stopPropagation()}
                    />
                  </Box>
                ))}
              </Box>
            ),
          },
          {
            key: "details",
            title: "Detalhes do contato",
            content: (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.5,
                }}
              >
                {[
                  { key: "birthday", label: "Aniversário" },
                  { key: "categories", label: "Categorias" },
                  { key: "phones", label: "Telefones" },
                  { key: "emails", label: "Emails" },
                  { key: "addresses", label: "Endereços" },
                  { key: "comments", label: "Comentarios" },
                ].map(item => (
                  <Box
                    key={item.key}
                    sx={theme => ({
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      cursor: "pointer",
                      ...interactiveCardSx(theme),
                    })}
                    onClick={() =>
                      setDetailFields(prev => ({
                        ...prev,
                        [item.key]:
                          !prev[item.key as keyof typeof detailFields],
                      }))
                    }
                  >
                    <Typography variant="subtitle2">{item.label}</Typography>
                    <ToggleCheckbox
                      checked={Boolean(
                        detailFields[item.key as keyof typeof detailFields]
                      )}
                      onChange={event =>
                        setDetailFields(prev => ({
                          ...prev,
                          [item.key]: event.target.checked,
                        }))
                      }
                      onClick={event => event.stopPropagation()}
                    />
                  </Box>
                ))}
              </Box>
            ),
          },
        ]}
      />

      <Snackbar
        open={copySnackbarOpen}
        autoHideDuration={2000}
        onClose={() => setCopySnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          onClose={() => setCopySnackbarOpen(false)}
          sx={{ width: "100%" }}
        >
          {copyMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={restoreDefaultsSnackbarOpen}
        autoHideDuration={6000}
        onClose={(_, reason) => {
          if (reason === "clickaway") {
            return;
          }
          setRestoreDefaultsSnackbarOpen(false);
          restoreDefaultsSnapshotRef.current = null;
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="info"
          onClose={() => {
            setRestoreDefaultsSnackbarOpen(false);
            restoreDefaultsSnapshotRef.current = null;
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleUndoRestoreContactsDefaults}
            >
              Reverter
            </Button>
          }
          sx={{ width: "100%" }}
        >
          Configurações restauradas.
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}
