import { useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  Dialog,
  DialogContent,
  Snackbar,
  IconButton,
  Paper,
  Alert,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Link as RouterLink, useLocation } from "wouter";
import { nanoid } from "nanoid";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import FormatBoldRoundedIcon from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRoundedIcon from "@mui/icons-material/FormatItalicRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import LooksOneRoundedIcon from "@mui/icons-material/LooksOneRounded";
import LooksTwoRoundedIcon from "@mui/icons-material/LooksTwoRounded";
import Looks3RoundedIcon from "@mui/icons-material/Looks3Rounded";
import BackspaceRoundedIcon from "@mui/icons-material/BackspaceRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import api from "../api";
import {
  DndContext,
  PointerSensor,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Deal = {
  id: string;
  name: string;
  value: string;
  owner: string;
  link?: string;
  comments?: string;
  descriptionHtml?: string;
  responsibleIds?: string[];
  workerIds?: string[];
  categoryId?: string;
  categoryIds?: string[];
};

type Column = {
  id: string;
  title: string;
  deals: Deal[];
  description?: string;
};

type Category = {
  id: string;
  name: string;
  color: string;
};

type PipelineUser = {
  id: number;
  name: string | null;
  email: string;
};

type Contact = {
  id: string;
  name: string;
  emails: string[];
};

type PersonOption = {
  id: string;
  name: string;
  email?: string;
  type: "user" | "contact";
};

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

const defaultCategories: Category[] = [
  { id: "cat-moradia", name: "Bug", color: DEFAULT_COLORS[0] },
  { id: "cat-alimentacao", name: "Feature", color: DEFAULT_COLORS[1] },
  { id: "cat-transporte", name: "Melhoria", color: DEFAULT_COLORS[2] },
  { id: "cat-saude", name: "Suporte", color: DEFAULT_COLORS[3] },
  { id: "cat-lazer", name: "Pesquisa", color: DEFAULT_COLORS[4] },
  { id: "cat-educacao", name: "Onboarding", color: DEFAULT_COLORS[5] },
  { id: "cat-assinaturas", name: "Design", color: DEFAULT_COLORS[6] },
  { id: "cat-impostos", name: "QA", color: DEFAULT_COLORS[7] },
  { id: "cat-investimentos", name: "DevOps", color: DEFAULT_COLORS[8] },
  { id: "cat-viagem", name: "Cliente", color: DEFAULT_COLORS[9] },
  { id: "cat-compras", name: "Interno", color: DEFAULT_COLORS[10] },
  { id: "cat-outros", name: "Backlog", color: DEFAULT_COLORS[11] },
];

const LEGACY_PIPELINE_NAMES = new Set([
  "Moradia",
  "Alimentacao",
  "Transporte",
  "Saude",
  "Lazer",
  "Educacao",
  "Assinaturas",
  "Impostos",
  "Investimentos",
  "Viagem",
  "Compras",
  "Outros",
]);

const NEW_PIPELINE_NAMES = new Set([
  "Bug",
  "Feature",
  "Melhoria",
  "Suporte",
  "Pesquisa",
  "Onboarding",
  "Design",
  "QA",
  "DevOps",
  "Cliente",
  "Interno",
  "Backlog",
]);

const isLegacyPipelineCategories = (cats: Category[]) => {
  const hasLegacy = cats.some((cat) => LEGACY_PIPELINE_NAMES.has(cat.name));
  const hasNew = cats.some((cat) => NEW_PIPELINE_NAMES.has(cat.name));
  return hasLegacy && !hasNew;
};

const defaultColumns: Column[] = [
  {
    id: "pendente",
    title: "Pendente",
    deals: [
      {
        id: "orbit",
        name: "Orbit Media",
        value: "R$ 18k",
        owner: "Ana C.",
        categoryId: defaultCategories[0]?.id,
        categoryIds: [defaultCategories[0]?.id || ""],
        link: "https://orbitmedia.example.com",
        comments: "Prioridade alta para onboarding.",
        descriptionHtml: "<p>Alinhamento inicial e checklist de kickoff.</p>",
      },
      {
        id: "silo",
        name: "Silo Retail",
        value: "R$ 22k",
        owner: "Lucas M.",
        categoryId: defaultCategories[0]?.id,
        categoryIds: [defaultCategories[0]?.id || ""],
        link: "https://siloretail.example.com",
        comments: "Aguardando envio de documentos.",
        descriptionHtml: "<p>Revisar proposta e confirmar escopo.</p>",
      },
      {
        id: "pulse",
        name: "Pulse Energy",
        value: "R$ 14k",
        owner: "Marina R.",
        categoryId: defaultCategories[0]?.id,
        categoryIds: [defaultCategories[0]?.id || ""],
        link: "https://pulseenergy.example.com",
        comments: "Contato reativado.",
        descriptionHtml: "<p>Agendar reuniao de descoberta.</p>",
      },
    ],
  },
  {
    id: "execucao",
    title: "Em execucao",
    deals: [
      {
        id: "argo",
        name: "Argo Health",
        value: "R$ 92k",
        owner: "Lucas M.",
        categoryId: defaultCategories[1]?.id,
        categoryIds: [defaultCategories[1]?.id || ""],
        link: "https://argohealth.example.com",
        comments: "Sprints semanais aprovados.",
        descriptionHtml: "<p>Implementacao em andamento com time tecnico.</p>",
      },
      {
        id: "nova",
        name: "Nova Terra",
        value: "R$ 36k",
        owner: "Sofia L.",
        categoryId: defaultCategories[1]?.id,
        categoryIds: [defaultCategories[1]?.id || ""],
        link: "https://novaterra.example.com",
        comments: "Revisao de integracoes.",
        descriptionHtml: "<p>Validar integracao com CRM.</p>",
      },
      {
        id: "delta",
        name: "Delta Group",
        value: "R$ 58k",
        owner: "Pedro G.",
        categoryId: defaultCategories[1]?.id,
        categoryIds: [defaultCategories[1]?.id || ""],
        link: "https://deltagroup.example.com",
        comments: "Equipe alocada.",
        descriptionHtml: "<p>Checklist de entregas intermediarias.</p>",
      },
    ],
  },
  {
    id: "teste",
    title: "Em teste",
    deals: [
      {
        id: "prisma",
        name: "Prisma Bank",
        value: "R$ 68k",
        owner: "Rafael P.",
        categoryId: defaultCategories[2]?.id,
        categoryIds: [defaultCategories[2]?.id || ""],
        link: "https://prismabank.example.com",
        comments: "QA final em andamento.",
        descriptionHtml: "<p>Executar testes de regressao.</p>",
      },
      {
        id: "bluebay",
        name: "Bluebay",
        value: "R$ 41k",
        owner: "Joana S.",
        categoryId: defaultCategories[2]?.id,
        categoryIds: [defaultCategories[2]?.id || ""],
        link: "https://bluebay.example.com",
        comments: "Aguardando feedback do cliente.",
        descriptionHtml: "<p>Validar performance e corrigir ajustes.</p>",
      },
      {
        id: "atlas",
        name: "Atlas Labs",
        value: "R$ 27k",
        owner: "Diego M.",
        categoryId: defaultCategories[2]?.id,
        categoryIds: [defaultCategories[2]?.id || ""],
        link: "https://atlaslabs.example.com",
        comments: "Homologacao marcada.",
        descriptionHtml: "<p>Checklist final de aprovacao.</p>",
      },
    ],
  },
  {
    id: "finalizado",
    title: "Finalizado",
    deals: [
      {
        id: "caravel",
        name: "Studio Caravel",
        value: "R$ 48k",
        owner: "Ana C.",
        categoryId: defaultCategories[3]?.id,
        categoryIds: [defaultCategories[3]?.id || ""],
        link: "https://caravelstudio.example.com",
        comments: "Entrega concluida com sucesso.",
        descriptionHtml: "<p>Encerramento e documentacao final.</p>",
      },
      {
        id: "gema",
        name: "Gema Labs",
        value: "R$ 31k",
        owner: "Diego M.",
        categoryId: defaultCategories[3]?.id,
        categoryIds: [defaultCategories[3]?.id || ""],
        link: "https://gemalabs.example.com",
        comments: "Feedback positivo.",
        descriptionHtml: "<p>Preparar case de sucesso.</p>",
      },
      {
        id: "aurora",
        name: "Aurora Tech",
        value: "R$ 74k",
        owner: "Sofia L.",
        categoryId: defaultCategories[3]?.id,
        categoryIds: [defaultCategories[3]?.id || ""],
        link: "https://auroratech.example.com",
        comments: "Contrato renovado.",
        descriptionHtml: "<p>Planejar expandir escopo em Q4.</p>",
      },
    ],
  },
  {
    id: "arquivado",
    title: "Arquivado",
    deals: [
      {
        id: "nord",
        name: "Nord Logistics",
        value: "R$ 19k",
        owner: "Bruno A.",
        categoryId: defaultCategories[4]?.id,
        categoryIds: [defaultCategories[4]?.id || ""],
        link: "https://nordlogistics.example.com",
        comments: "Projeto encerrado.",
        descriptionHtml: "<p>Sem continuidade no momento.</p>",
      },
      {
        id: "helios",
        name: "Helios Foods",
        value: "R$ 26k",
        owner: "Carla F.",
        categoryId: defaultCategories[4]?.id,
        categoryIds: [defaultCategories[4]?.id || ""],
        link: "https://heliosfoods.example.com",
        comments: "Sem budget aprovado.",
        descriptionHtml: "<p>Revisitar no proximo semestre.</p>",
      },
      {
        id: "vento",
        name: "Vento Digital",
        value: "R$ 12k",
        owner: "Igor T.",
        categoryId: defaultCategories[4]?.id,
        categoryIds: [defaultCategories[4]?.id || ""],
        link: "https://ventodigital.example.com",
        comments: "Encerrado por ajuste de prioridade.",
        descriptionHtml: "<p>Manter no radar para retorno.</p>",
      },
    ],
  },
];

const columnDragId = (id: string) => `column:${id}`;
const cardDragId = (id: string) => `card:${id}`;
const isColumnId = (id: string) => id.startsWith("column:");
const isCardId = (id: string) => id.startsWith("card:");
const stripPrefix = (id: string) => id.split(":")[1] || id;

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

const normalizePersonIds = (ids?: Array<number | string>) => {
  if (!ids) {
    return [];
  }
  return ids.map((id) => {
    if (typeof id === "number") {
      return `user:${id}`;
    }
    if (id.startsWith("user:") || id.startsWith("contact:")) {
      return id;
    }
    return `user:${id}`;
  });
};

const normalizeColumns = (incoming: Column[]) =>
  incoming.map((column) => ({
    ...column,
    deals: column.deals.map((deal) => ({
      ...deal,
      responsibleIds: normalizePersonIds(deal.responsibleIds as Array<number | string>),
      workerIds: normalizePersonIds(deal.workerIds as Array<number | string>),
    })),
  }));

export default function Pipeline() {
  const [, setLocation] = useLocation();
  const [columns, setColumns] = useState<Column[]>(() => defaultColumns);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [viewingDeal, setViewingDeal] = useState<Deal | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [lastRemoved, setLastRemoved] = useState<{
    deal: Deal;
    columnId: string;
    index: number;
  } | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editResponsibleIds, setEditResponsibleIds] = useState<string[]>([]);
  const [editWorkerIds, setEditWorkerIds] = useState<string[]>([]);
  const [editOwnerFallback, setEditOwnerFallback] = useState("");
  const [editCategoryIds, setEditCategoryIds] = useState<string[]>([]);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [editColumnTitle, setEditColumnTitle] = useState("");
  const [editColumnDescription, setEditColumnDescription] = useState("");
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [users, setUsers] = useState<PipelineUser[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [taskFieldSettingsOpen, setTaskFieldSettingsOpen] = useState(false);
  const [taskFieldSettings, setTaskFieldSettings] = useState({
    value: false,
    link: false,
  });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(DEFAULT_COLORS[0]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryColor, setEditingCategoryColor] = useState(DEFAULT_COLORS[0]);
  const [taskQuery, setTaskQuery] = useState("");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [columnManagerOpen, setColumnManagerOpen] = useState(false);
  const [newDealId, setNewDealId] = useState<string | null>(null);
  const [removeDealOpen, setRemoveDealOpen] = useState(false);
  const [permissions, setPermissions] = useState(() => ({
    pipeline_view: true,
    pipeline_edit_tasks: true,
    pipeline_edit_columns: true,
    finance_view: true,
    finance_edit: true,
  }));
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const isLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);
  const openedFromLinkRef = useRef(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }));

  useEffect(() => {
    const loadPipeline = async () => {
      try {
        const response = await api.get("/api/pipeline/board");
        const pipeline = response?.data?.pipeline;
        if (Array.isArray(pipeline)) {
          if (pipeline.length) {
            setColumns(normalizeColumns(pipeline));
          }
        } else if (pipeline?.columns) {
          const incomingCategories = Array.isArray(pipeline.categories)
            ? pipeline.categories
            : defaultCategories;
          const nextCategories = isLegacyPipelineCategories(incomingCategories)
            ? defaultCategories
            : incomingCategories;
          if (nextCategories.length) {
            setCategories(nextCategories);
          }
          if (nextCategories !== incomingCategories) {
            await api.put("/api/pipeline/board", {
              data: { columns: pipeline.columns, categories: nextCategories },
            });
          }
          setColumns(normalizeColumns(pipeline.columns));
        } else {
          await api.put("/api/pipeline/board", {
            data: { columns: defaultColumns, categories: defaultCategories },
          });
        }
      } catch {
        // Keep defaults if the request fails.
      } finally {
        isLoadedRef.current = true;
      }
    };
    void loadPipeline();
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await api.get("/api/access/users");
        const nextUsers = response?.data?.users;
        if (Array.isArray(nextUsers)) {
          setUsers(nextUsers);
        }
      } catch {
        // Keep empty if the request fails.
      }
    };
    void loadUsers();
  }, []);

  useEffect(() => {
    const loadContacts = () => {
      const stored = window.localStorage.getItem("contacts_v1");
      if (!stored) {
        setContacts([]);
        return;
      }
      try {
        const parsed = JSON.parse(stored) as Contact[];
        if (Array.isArray(parsed)) {
          setContacts(parsed);
        }
      } catch {
        window.localStorage.removeItem("contacts_v1");
        setContacts([]);
      }
    };
    loadContacts();
    const handleContactsChange = () => loadContacts();
    window.addEventListener("contacts-change", handleContactsChange);
    return () => {
      window.removeEventListener("contacts-change", handleContactsChange);
    };
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem("sc_task_fields");
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { value?: boolean; link?: boolean };
      setTaskFieldSettings({
        value: Boolean(parsed.value),
        link: Boolean(parsed.link),
      });
    } catch {
      window.localStorage.removeItem("sc_task_fields");
    }
  }, []);

  useEffect(() => {
    const syncPermissions = () => {
      try {
        setPermissions(getStoredPermissions());
      } catch {
        setPermissions({
          pipeline_view: true,
          pipeline_edit_tasks: true,
          pipeline_edit_columns: true,
          finance_view: true,
          finance_edit: true,
        });
      }
    };
    syncPermissions();
    window.addEventListener("roles-change", syncPermissions);
    window.addEventListener("auth-change", syncPermissions);
    return () => {
      window.removeEventListener("roles-change", syncPermissions);
      window.removeEventListener("auth-change", syncPermissions);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem("sc_task_fields", JSON.stringify(taskFieldSettings));
    window.dispatchEvent(new Event("task-fields-change"));
  }, [taskFieldSettings]);

  useEffect(() => {
    if (!isLoadedRef.current) {
      return;
    }
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      void api.put("/api/pipeline/board", { data: { columns, categories } });
    }, 600);
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [columns, categories]);

  useEffect(() => {
    if (!permissions.pipeline_view) {
      setLocation("/home");
    }
  }, [permissions.pipeline_view, setLocation]);

  const normalizedQuery = taskQuery.trim().toLowerCase();

  const getStoredPermissions = () => {
    const storedUser = window.localStorage.getItem("sc_user");
    const email = storedUser ? (JSON.parse(storedUser) as { email?: string }).email : "";
    const storedRoles = window.localStorage.getItem("sc_user_roles");
    const userRoles = storedRoles ? (JSON.parse(storedRoles) as Record<string, string>) : {};
    const roleName = (email && userRoles[email]) || "Administrador";
    const storedPermissions = window.localStorage.getItem("sc_role_permissions");
    const rolePermissions = storedPermissions
      ? (JSON.parse(storedPermissions) as Record<string, Record<string, boolean>>)
      : {};
    return (
      rolePermissions[roleName] || {
        pipeline_view: true,
        pipeline_edit_tasks: true,
        pipeline_edit_columns: true,
        finance_view: true,
        finance_edit: true,
      }
    );
  };

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  const personOptions = useMemo<PersonOption[]>(() => {
    const userOptions = users.map((user) => ({
      id: `user:${user.id}`,
      name: user.name?.trim() ? user.name : user.email,
      email: user.email,
      type: "user" as const,
    }));
    const contactOptions = contacts.map((contact) => ({
      id: `contact:${contact.id}`,
      name: contact.name || contact.emails?.[0] || "Contato",
      email: contact.emails?.[0],
      type: "contact" as const,
    }));
    return [...userOptions, ...contactOptions];
  }, [users, contacts]);

  const personMap = useMemo(() => {
    const map = new Map<string, PersonOption>();
    personOptions.forEach((person) => map.set(person.id, person));
    return map;
  }, [personOptions]);

  const formatPersonLabel = (person?: PersonOption) => {
    if (!person) {
      return "";
    }
    return person.name || person.email || "";
  };

  const getPersonLabels = (ids?: string[]) =>
    (ids || []).map((id) => formatPersonLabel(personMap.get(id))).filter(Boolean);

  const stripHtml = (value: string) =>
    value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  const findColumnByCard = (cardId: string) =>
    columns.find((column) => column.deals.some((deal) => deal.id === cardId));

  const findDeal = (cardId: string) => {
    for (const column of columns) {
      const deal = column.deals.find((item) => item.id === cardId);
      if (deal) {
        return deal;
      }
    }
    return null;
  };

  const handleCopyLink = async (dealId: string) => {
    const url = `${window.location.origin}/pipeline?task=${encodeURIComponent(dealId)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const fallback = document.createElement("textarea");
      fallback.value = url;
      document.body.appendChild(fallback);
      fallback.select();
      document.execCommand("copy");
      document.body.removeChild(fallback);
    }
  };

  useEffect(() => {
    if (openedFromLinkRef.current) {
      return;
    }
    if (!columns.length) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get("task");
    if (!taskId) {
      openedFromLinkRef.current = true;
      return;
    }
    const deal = findDeal(taskId);
    if (deal) {
      setViewingDeal(deal);
    }
    openedFromLinkRef.current = true;
  }, [columns]);
  const getDealOwnerLabel = (deal: Deal) => {
    const labels = getPersonLabels(deal.responsibleIds);
    if (labels.length) {
      return labels.join(", ");
    }
    return deal.owner;
  };

  const filterDealsByQuery = (column: Column, query: string) => {
    if (!query) {
      return column.deals;
    }
    return column.deals.filter((deal) => {
      const description = stripHtml(deal.descriptionHtml || deal.comments || "");
      const haystack = `${deal.name} ${getDealOwnerLabel(deal)} ${deal.value} ${description}`.toLowerCase();
      return haystack.includes(query);
    });
  };

  const visibleColumns = useMemo(() => {
    if (!normalizedQuery) {
      return columns;
    }
    return columns.filter((column) => filterDealsByQuery(column, normalizedQuery).length > 0);
  }, [columns, normalizedQuery, getDealOwnerLabel, stripHtml]);

  const columnItems = useMemo(
    () => visibleColumns.map((column) => columnDragId(column.id)),
    [visibleColumns]
  );

  const selectPersonsByIds = (ids: string[]) =>
    personOptions.filter((person) => ids.includes(person.id));

  const findColumn = (columnId: string) =>
    columns.find((column) => column.id === columnId) || null;

  const handleEditOpen = (deal: Deal) => {
    setEditingDeal(deal);
    setEditName(deal.name);
    setEditValue(deal.value);
    setEditLink(deal.link || "");
    setEditDescription(deal.descriptionHtml || deal.comments || "");
    setEditResponsibleIds(normalizePersonIds(deal.responsibleIds as Array<number | string>));
    setEditWorkerIds(normalizePersonIds(deal.workerIds as Array<number | string>));
    setEditOwnerFallback(deal.owner);
    setEditCategoryIds(deal.categoryIds || (deal.categoryId ? [deal.categoryId] : []));
    setEditingCategoryId(null);
    setNewDealId(null);
  };

  const handleEditClose = () => {
    if (editingDeal && newDealId && editingDeal.id === newDealId) {
      const trimmedName = editName.trim();
      const trimmedValue = editValue.trim();
      const trimmedLink = editLink.trim();
      const trimmedDescription = stripHtml(editDescription).trim();
      const isEmpty =
        (!trimmedName || trimmedName === "Nova tarefa") &&
        (!trimmedValue || trimmedValue === "R$ 0") &&
        !trimmedLink &&
        !trimmedDescription &&
        editResponsibleIds.length === 0 &&
        editWorkerIds.length === 0 &&
        editCategoryIds.length === 0;
      if (isEmpty) {
        setColumns((prev) =>
          prev.map((column) => ({
            ...column,
            deals: column.deals.filter((deal) => deal.id !== newDealId),
          }))
        );
      }
    }
    setEditingDeal(null);
    setNewDealId(null);
  };

  const handleViewOpen = (deal: Deal) => {
    setViewingDeal(deal);
  };

  const handleViewClose = () => {
    setViewingDeal(null);
    setRemoveDealOpen(false);
  };

  const handleEditSave = () => {
    if (!editingDeal) {
      return;
    }
    const ownerLabels = getPersonLabels(editResponsibleIds);
    const ownerLabel = ownerLabels.length ? ownerLabels.join(", ") : editOwnerFallback;
    setColumns((prev) =>
      prev.map((column) => ({
        ...column,
        deals: column.deals.map((deal) =>
          deal.id === editingDeal.id
            ? {
                ...deal,
                name: editName.trim() || deal.name,
                value: taskFieldSettings.value ? editValue.trim() || deal.value : deal.value,
                owner: ownerLabel.trim() || deal.owner,
                link: taskFieldSettings.link ? editLink.trim() : deal.link,
                comments: stripHtml(editDescription),
                descriptionHtml: editDescription,
                responsibleIds: editResponsibleIds,
                workerIds: editWorkerIds,
                categoryId: editCategoryIds[0] || "",
                categoryIds: editCategoryIds,
              }
            : deal
        ),
      }))
    );
    setEditingDeal(null);
    setNewDealId(null);
  };

  const handleDealRemove = () => {
    if (!editingDeal) {
      return;
    }
    const removal = columns.reduce<{
      deal: Deal;
      columnId: string;
      index: number;
    } | null>((found, column) => {
      if (found) {
        return found;
      }
      const index = column.deals.findIndex((deal) => deal.id === editingDeal.id);
      if (index === -1) {
        return null;
      }
      return { deal: column.deals[index], columnId: column.id, index };
    }, null);
    if (removal) {
      setLastRemoved(removal);
      setSnackbarOpen(true);
    }
    setColumns((prev) =>
      prev.map((column) => ({
        ...column,
        deals: column.deals.filter((deal) => deal.id !== editingDeal.id),
      }))
    );
    setEditingDeal(null);
  };

  const handleUndoRemove = () => {
    if (!lastRemoved) {
      return;
    }
    setColumns((prev) =>
      prev.map((column) => {
        if (column.id !== lastRemoved.columnId) {
          return column;
        }
        const nextDeals = [...column.deals];
        const insertIndex = Math.min(lastRemoved.index, nextDeals.length);
        nextDeals.splice(insertIndex, 0, lastRemoved.deal);
        return { ...column, deals: nextDeals };
      })
    );
    setSnackbarOpen(false);
    setLastRemoved(null);
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) {
      return;
    }
    const id = `cat-${Date.now()}`;
    setCategories((prev) => [...prev, { id, name, color: newCategoryColor }]);
    setNewCategoryName("");
  };

  const handleRemoveCategory = (id: string) => {
    let nextCategories = categories.filter((cat) => cat.id !== id);
    if (nextCategories.length === 0) {
      nextCategories = [
        { id: `cat-${Date.now()}`, name: "Sem categoria", color: DEFAULT_COLORS[0] },
      ];
    }
    const fallback = nextCategories[0]?.id || "";
    setCategories(nextCategories);
    setEditCategoryId((prev) => (prev === id ? fallback : prev));
    setColumns((prev) =>
      prev.map((column) => ({
        ...column,
        deals: column.deals.map((deal) =>
          deal.categoryId === id ? { ...deal, categoryId: fallback } : deal
        ),
      }))
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
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === editingCategoryId ? { ...cat, name, color: editingCategoryColor } : cat
      )
    );
    setEditingCategoryId(null);
  };

  const handleColumnEditOpen = (column: Column) => {
    setEditingColumn(column);
    setEditColumnTitle(column.title);
    setEditColumnDescription(column.description || "");
  };

  const handleColumnEditClose = () => {
    setEditingColumn(null);
  };

  const handleColumnEditSave = () => {
    if (!editingColumn) {
      return;
    }
    const nextTitle = editColumnTitle.trim() || editingColumn.title;
    const nextDescription = editColumnDescription.trim();
    setColumns((prev) =>
      prev.map((column) =>
        column.id === editingColumn.id
          ? { ...column, title: nextTitle, description: nextDescription }
          : column
      )
    );
    setEditingColumn(null);
  };

  const handleColumnRemove = () => {
    if (!editingColumn) {
      return;
    }
    setColumns((prev) => prev.filter((column) => column.id !== editingColumn.id));
    setEditingColumn(null);
  };

  const handleColumnReorder = (event: { active: { id: string }; over?: { id: string } }) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId || activeId === overId) {
      return;
    }
    setColumns((prev) => {
      const oldIndex = prev.findIndex((column) => column.id === activeId);
      const newIndex = prev.findIndex((column) => column.id === overId);
      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleDragStart = (event: { active: { id: string } }) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragOver = (event: { active: { id: string }; over?: { id: string } }) => {
    const activeId = String(event.active.id);
    let overId = event.over ? String(event.over.id) : null;
    if (!overId || activeId === overId) {
      return;
    }

    if (isColumnId(activeId)) {
      if (isCardId(overId)) {
        const overCardId = stripPrefix(overId);
        const targetColumn = findColumnByCard(overCardId);
        if (targetColumn) {
          overId = columnDragId(targetColumn.id);
        }
      }
      if (!overId || !isColumnId(overId) || activeId === overId) {
        return;
      }
      const activeIndex = columns.findIndex(
        (column) => column.id === stripPrefix(activeId)
      );
      const overIndex = columns.findIndex(
        (column) => column.id === stripPrefix(overId)
      );
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        setColumns((prev) => arrayMove(prev, activeIndex, overIndex));
      }
      return;
    }

    if (isCardId(activeId)) {
      const activeCardId = stripPrefix(activeId);
      const sourceColumn = findColumnByCard(activeCardId);
      if (!sourceColumn) {
        return;
      }

      let destinationColumn: Column | undefined;
      let destinationIndex = 0;

      if (isCardId(overId)) {
        const overCardId = stripPrefix(overId);
        destinationColumn = findColumnByCard(overCardId);
        if (!destinationColumn) {
          return;
        }
        destinationIndex = destinationColumn.deals.findIndex(
          (deal) => deal.id === overCardId
        );
      } else if (isColumnId(overId)) {
        destinationColumn = columns.find(
          (column) => column.id === stripPrefix(overId)
        );
        destinationIndex = destinationColumn ? destinationColumn.deals.length : 0;
      } else {
        return;
      }

      if (!destinationColumn) {
        return;
      }

      if (sourceColumn.id === destinationColumn.id) {
        const oldIndex = sourceColumn.deals.findIndex(
          (deal) => deal.id === activeCardId
        );
        if (oldIndex === -1 || oldIndex === destinationIndex) {
          return;
        }
        setColumns((prev) =>
          prev.map((column) =>
            column.id === sourceColumn.id
              ? { ...column, deals: arrayMove(column.deals, oldIndex, destinationIndex) }
              : column
          )
        );
        return;
      }

      const movingDeal = sourceColumn.deals.find((deal) => deal.id === activeCardId);
      if (!movingDeal) {
        return;
      }

      setColumns((prev) =>
        prev.map((column) => {
          if (column.id === sourceColumn.id) {
            return {
              ...column,
              deals: column.deals.filter((deal) => deal.id !== activeCardId),
            };
          }
          if (column.id === destinationColumn?.id) {
            const nextDeals = [...column.deals];
            nextDeals.splice(destinationIndex, 0, movingDeal);
            return { ...column, deals: nextDeals };
          }
          return column;
        })
      );
    }
  };

  const handleDragEnd = (event: { active: { id: string }; over?: { id: string } }) => {
    setActiveDragId(null);
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId || activeId === overId) {
      return;
    }

    if (isColumnId(activeId)) {
      return;
    }

    if (isCardId(activeId)) {
      const activeCardId = stripPrefix(activeId);
      const sourceColumn = findColumnByCard(activeCardId);
      if (!sourceColumn) {
        return;
      }

      let destinationColumn: Column | undefined;
      let destinationIndex = 0;

      if (isCardId(overId)) {
        const overCardId = stripPrefix(overId);
        destinationColumn = findColumnByCard(overCardId);
        if (!destinationColumn) {
          return;
        }
        destinationIndex = destinationColumn.deals.findIndex(
          (deal) => deal.id === overCardId
        );
      } else if (isColumnId(overId)) {
        destinationColumn = columns.find(
          (column) => column.id === stripPrefix(overId)
        );
        destinationIndex = destinationColumn ? destinationColumn.deals.length : 0;
      } else {
        return;
      }

      if (!destinationColumn) {
        return;
      }

      if (sourceColumn.id === destinationColumn.id) {
        const oldIndex = sourceColumn.deals.findIndex(
          (deal) => deal.id === activeCardId
        );
        if (oldIndex === -1 || oldIndex === destinationIndex) {
          return;
        }
        setColumns((prev) =>
          prev.map((column) =>
            column.id === sourceColumn.id
              ? { ...column, deals: arrayMove(column.deals, oldIndex, destinationIndex) }
              : column
          )
        );
        return;
      }

      const movingDeal = sourceColumn.deals.find((deal) => deal.id === activeCardId);
      if (!movingDeal) {
        return;
      }

      setColumns((prev) =>
        prev.map((column) => {
          if (column.id === sourceColumn.id) {
            return {
              ...column,
              deals: column.deals.filter((deal) => deal.id !== activeCardId),
            };
          }
          if (column.id === destinationColumn?.id) {
            const nextDeals = [...column.deals];
            nextDeals.splice(destinationIndex, 0, movingDeal);
            return { ...column, deals: nextDeals };
          }
          return column;
        })
      );
    }
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
  };

  const handleAddColumn = () => {
    const nextId = nanoid(6);
    const index = columns.length + 1;
    setColumns((prev) => [
      ...prev,
      {
        id: `stage-${nextId}`,
        title: `Etapa ${index}`,
        deals: [],
      },
    ]);
  };

  const handleAddDeal = (columnId: string) => {
    const nextId = nanoid(6);
    const newDeal: Deal = {
      id: `deal-${nextId}`,
      name: "Nova tarefa",
      value: "R$ 0",
      owner: "Responsavel",
      responsibleIds: [],
      workerIds: [],
      descriptionHtml: "",
      categoryIds: [],
      categoryId: "",
    };
    setColumns((prev) =>
      prev.map((column) =>
        column.id === columnId
          ? {
              ...column,
              deals: [...column.deals, newDeal],
            }
          : column
      )
    );
    setNewDealId(newDeal.id);
    handleEditOpen(newDeal);
  };

  const handleScrollPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container || event.button !== 0) {
      return;
    }
    if (
      (event.target as HTMLElement | null)?.closest(
        "button,a,input,textarea,select,label,[data-draggable]"
      )
    ) {
      return;
    }
    isDraggingRef.current = true;
    dragStartXRef.current = event.clientX;
    scrollLeftRef.current = container.scrollLeft;
    container.setPointerCapture(event.pointerId);
  };

  const handleScrollPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container || !isDraggingRef.current) {
      return;
    }
    const delta = event.clientX - dragStartXRef.current;
    container.scrollLeft = scrollLeftRef.current - delta;
  };

  const handleScrollPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    isDraggingRef.current = false;
    container.releasePointerCapture(event.pointerId);
  };

  const scrollColumnsBy = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    const amount = Math.max(320, Math.round(container.clientWidth * 0.7));
    container.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <Box sx={{ maxWidth: 1200 }}>
      <Stack spacing={3}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Pipeline
            </Typography>
          </Box>
          <Button
            component={RouterLink}
            href="/pipeline/dados"
            variant="outlined"
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Ver dados
          </Button>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TextField
            label="Buscar tasks"
            value={taskQuery}
            onChange={(event) => setTaskQuery(event.target.value)}
            sx={{ minWidth: { xs: "100%", sm: 280 } }}
          />
          <Stack direction="row" spacing={2} sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Button
              variant="outlined"
              onClick={() => {
                setEditingCategoryId(null);
                setCategoryDialogOpen(true);
              }}
              sx={{ textTransform: "none", fontWeight: 600 }}
              disabled={!permissions.pipeline_edit_tasks}
            >
              Categorias
            </Button>
            <Button
              variant="outlined"
              onClick={() => setTaskFieldSettingsOpen(true)}
              sx={{ textTransform: "none", fontWeight: 600 }}
              disabled={!permissions.pipeline_edit_tasks}
            >
              Personalizar tarefas
            </Button>
            <Button
              variant="outlined"
              onClick={() => setColumnManagerOpen(true)}
              sx={{ textTransform: "none", fontWeight: 600 }}
              disabled={!permissions.pipeline_edit_columns}
            >
              Gerir colunas
            </Button>
          </Stack>
        </Box>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
        onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          autoScroll
        >
          <SortableContext items={columnItems} strategy={horizontalListSortingStrategy}>
            <Box sx={{ position: "relative" }}>
              <IconButton
                onClick={() => scrollColumnsBy("left")}
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  transform: "translate(-35%, -50%)",
                  zIndex: 2,
                  width: 48,
                  height: 48,
                  borderRadius: 0,
                  backgroundColor: "transparent",
                  border: "none",
                  color: "text.primary",
                  "&:hover": { backgroundColor: "transparent", color: "primary.main" },
                  "&:active": { backgroundColor: "transparent" },
                }}
                aria-label="Voltar colunas"
              >
                <ChevronLeftRoundedIcon fontSize="large" />
              </IconButton>
              <IconButton
                onClick={() => scrollColumnsBy("right")}
                sx={{
                  position: "absolute",
                  top: "50%",
                  right: 0,
                  transform: "translate(35%, -50%)",
                  zIndex: 2,
                  width: 48,
                  height: 48,
                  borderRadius: 0,
                  backgroundColor: "transparent",
                  border: "none",
                  color: "text.primary",
                  "&:hover": { backgroundColor: "transparent", color: "primary.main" },
                  "&:active": { backgroundColor: "transparent" },
                }}
                aria-label="Avancar colunas"
              >
                <ChevronRightRoundedIcon fontSize="large" />
              </IconButton>
              <Box
                ref={scrollRef}
                onPointerDown={handleScrollPointerDown}
                onPointerMove={handleScrollPointerMove}
                onPointerUp={handleScrollPointerUp}
                onPointerLeave={handleScrollPointerUp}
                sx={{
                  overflowX: "auto",
                  pb: 4,
                  cursor: "grab",
                  "&:active": { cursor: "grabbing" },
                }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ width: "max-content", minWidth: "100%" }}
                >
                {visibleColumns.map((column) => (
                  <SortableColumn
                    key={column.id}
                    column={column}
                    onEdit={handleViewOpen}
                    onEditColumn={handleColumnEditOpen}
                    onAddDeal={handleAddDeal}
                    filteredDeals={filterDealsByQuery(column, normalizedQuery)}
                    categoryMap={categoryMap}
                    getDealOwnerLabel={getDealOwnerLabel}
                    showValue={taskFieldSettings.value}
                    canEditTasks={permissions.pipeline_edit_tasks}
                    canEditColumns={permissions.pipeline_edit_columns}
                  />
                ))}
                {permissions.pipeline_edit_columns ? (
                  <Paper
                    elevation={0}
                    onClick={handleAddColumn}
                    data-draggable
                    sx={{
                      p: 2.5,
                      minWidth: 280,
                      border: "1px dashed rgba(255,255,255,0.2)",
                      backgroundColor: "rgba(15, 23, 32, 0.6)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Stack spacing={1} alignItems="center">
                      <AddRoundedIcon />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Adicionar coluna
                      </Typography>
                    </Stack>
                  </Paper>
                ) : null}
              </Stack>
            </Box>
            </Box>
          </SortableContext>
          <DragOverlay>
            {activeDragId ? (
              isColumnId(activeDragId) ? (
                (() => {
                  const column = findColumn(stripPrefix(activeDragId));
                  if (!column) {
                    return null;
                  }
                  return (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        minWidth: 280,
                        borderRadius: "var(--radius-card)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        backgroundColor: "rgba(15, 23, 32, 0.95)",
                        boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
                      }}
                    >
                      <Stack spacing={2}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {column.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                            {column.deals.length}
                          </Typography>
                        </Box>
                        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
                        <Stack spacing={1.5}>
                          {column.deals.slice(0, 3).map((deal) => (
                            <Box
                              key={deal.id}
                              sx={{
                                p: 2,
                                borderRadius: "var(--radius-card)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                backgroundColor: "rgba(10, 16, 23, 0.85)",
                              }}
                            >
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {deal.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                {getDealOwnerLabel(deal)}
                              </Typography>
                            </Box>
                          ))}
                          {column.deals.length > 3 ? (
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              +{column.deals.length - 3} tasks
                            </Typography>
                          ) : null}
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })()
              ) : isCardId(activeDragId) ? (
                (() => {
                  const deal = findDeal(stripPrefix(activeDragId));
                  if (!deal) {
                    return null;
                  }
                  return (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: "var(--radius-card)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        backgroundColor: "rgba(10, 16, 23, 0.95)",
                        boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {deal.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {getDealOwnerLabel(deal)}
                      </Typography>
                      {taskFieldSettings.value ? (
                        <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                          {deal.value}
                        </Typography>
                      ) : null}
                    </Box>
                  );
                })()
              ) : null
            ) : null}
          </DragOverlay>
        </DndContext>
      </Stack>

      <Dialog open={Boolean(viewingDeal)} onClose={handleViewClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Stack spacing={2.5}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="h6">{viewingDeal?.name || "-"}</Typography>
                {viewingDeal ? (
                  <Tooltip title="Copiar link" placement="top">
                    <IconButton
                      size="small"
                      onClick={() => handleCopyLink(viewingDeal.id)}
                      sx={{
                        color: "text.secondary",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      <LinkRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Box>
              <IconButton onClick={handleViewClose} sx={{ color: "text.secondary" }}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            {taskFieldSettings.value ? (
              <Stack spacing={0.5}>
                <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                  Valor
                </Typography>
                <Typography variant="body1">{viewingDeal?.value || "-"}</Typography>
              </Stack>
            ) : null}
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                Responsaveis
              </Typography>
              <Typography variant="body1">
                {viewingDeal
                  ? getPersonLabels(viewingDeal.responsibleIds).join(", ") || viewingDeal.owner
                  : "-"}
              </Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                Pessoas na tarefa
              </Typography>
              <Typography variant="body1">
                {viewingDeal ? getPersonLabels(viewingDeal.workerIds).join(", ") || "-" : "-"}
              </Typography>
            </Stack>
            {taskFieldSettings.link ? (
              <Stack spacing={0.5}>
                <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                  Link
                </Typography>
                <Typography variant="body1">{viewingDeal?.link || "-"}</Typography>
              </Stack>
            ) : null}
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                Categorias
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {viewingDeal?.categoryIds?.length
                  ? viewingDeal.categoryIds.map((id) => {
                      const cat = categoryMap.get(id);
                      if (!cat) {
                        return null;
                      }
                      return (
                        <Chip
                          key={id}
                          label={cat.name}
                          sx={{
                            color: "#e6edf3",
                            backgroundColor: darkenColor(cat.color, 0.5),
                          }}
                        />
                      );
                    })
                  : (
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Sem categoria
                    </Typography>
                  )}
              </Stack>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                Descricao
              </Typography>
              <Box
                sx={{
                  borderRadius: "var(--radius-card)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backgroundColor: "rgba(10, 16, 23, 0.75)",
                  p: 2,
                  minHeight: 120,
                }}
                dangerouslySetInnerHTML={{
                  __html: viewingDeal?.descriptionHtml || viewingDeal?.comments || "",
                }}
              />
            </Stack>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                color="error"
                variant="outlined"
                onClick={() => setRemoveDealOpen(true)}
              >
                Remover
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  if (!viewingDeal) {
                    return;
                  }
                  handleEditOpen(viewingDeal);
                  setViewingDeal(null);
                }}
              >
                Editar
              </Button>
              <Button variant="contained" onClick={handleViewClose}>
                Fechar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={removeDealOpen} onClose={() => setRemoveDealOpen(false)} maxWidth="xs" fullWidth>
        <DialogContent>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6">Remover tarefa</Typography>
              <IconButton onClick={() => setRemoveDealOpen(false)} sx={{ color: "text.secondary" }}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Voce confirma a exclusao desta tarefa? Essa acao nao pode ser desfeita.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => setRemoveDealOpen(false)}>
                Cancelar
              </Button>
              <Button
                color="error"
                variant="contained"
                onClick={() => {
                  if (!viewingDeal) {
                    return;
                  }
                  setColumns((prev) =>
                    prev.map((column) => ({
                      ...column,
                      deals: column.deals.filter((deal) => deal.id !== viewingDeal.id),
                    }))
                  );
                  setViewingDeal(null);
                  setRemoveDealOpen(false);
                }}
              >
                Remover
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingDeal)} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h6">Editar tarefa</Typography>
            </Box>
            <TextField
              label="Titulo"
              fullWidth
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
            />
            {taskFieldSettings.value ? (
              <TextField
                label="Valor"
                fullWidth
                value={editValue}
                onChange={(event) => setEditValue(event.target.value)}
              />
            ) : null}
            <Autocomplete
              multiple
              options={personOptions}
              value={selectPersonsByIds(editResponsibleIds)}
              onChange={(_, value) => setEditResponsibleIds(value.map((person) => person.id))}
              getOptionLabel={(option) => formatPersonLabel(option)}
              noOptionsText="Nenhum usuario"
              renderInput={(params) => (
                <TextField {...params} label="Responsaveis" fullWidth />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={formatPersonLabel(option)}
                    size="small"
                  />
                ))
              }
            />
            <Autocomplete
              multiple
              options={personOptions}
              value={selectPersonsByIds(editWorkerIds)}
              onChange={(_, value) => setEditWorkerIds(value.map((person) => person.id))}
              getOptionLabel={(option) => formatPersonLabel(option)}
              noOptionsText="Nenhum usuario"
              renderInput={(params) => (
                <TextField {...params} label="Pessoas na tarefa" fullWidth />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={formatPersonLabel(option)}
                    size="small"
                  />
                ))
              }
            />
            {taskFieldSettings.link ? (
              <TextField
                label="Link"
                fullWidth
                value={editLink}
                onChange={(event) => setEditLink(event.target.value)}
              />
            ) : null}
            <Autocomplete
              multiple
              options={categories}
              value={categories.filter((cat) => editCategoryIds.includes(cat.id))}
              onChange={(_, value) => setEditCategoryIds(value.map((cat) => cat.id))}
              getOptionLabel={(option) => option.name}
              disableCloseOnSelect
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <Checkbox
                    checked={selected}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {option.name}
                </li>
              )}
              renderInput={(params) => (
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
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                Descricao
              </Typography>
              <RichTextEditor
                value={editDescription}
                onChange={setEditDescription}
              />
            </Stack>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button color="error" variant="outlined" onClick={handleDealRemove}>
                Remover
              </Button>
              <Button variant="outlined" onClick={handleEditClose}>
                Cancelar
              </Button>
              <Button variant="contained" onClick={handleEditSave}>
                Salvar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={categoryDialogOpen}
        onClose={() => {
          setCategoryDialogOpen(false);
          cancelEditCategory();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Stack spacing={2.5}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6">Categorias</Typography>
              <IconButton
                onClick={() => {
                  setCategoryDialogOpen(false);
                  cancelEditCategory();
                }}
                sx={{ color: "text.secondary" }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>

            {editingCategoryId ? (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(10, 16, 23, 0.7)",
                }}
              >
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Editar categoria
                  </Typography>
                  <TextField
                    label="Nome"
                    fullWidth
                    value={editingCategoryName}
                    onChange={(event) => setEditingCategoryName(event.target.value)}
                  />
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {DEFAULT_COLORS.map((color) => (
                      <Box
                        key={color}
                        onClick={() => setEditingCategoryColor(color)}
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: 1,
                          backgroundColor: color,
                          border:
                            editingCategoryColor === color
                              ? "2px solid rgba(255,255,255,0.8)"
                              : "1px solid rgba(255,255,255,0.2)",
                          cursor: "pointer",
                        }}
                      />
                    ))}
                  </Stack>
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button variant="outlined" onClick={cancelEditCategory}>
                      Cancelar
                    </Button>
                    <Button variant="contained" onClick={saveCategory}>
                      Salvar
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ) : null}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {categories.map((cat) => (
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
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                  Nova categoria
                </Typography>
                <Stack spacing={1.5}>
                  <TextField
                    label="Nome"
                    fullWidth
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                  />
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {DEFAULT_COLORS.map((color) => (
                      <Box
                        key={color}
                        onClick={() => setNewCategoryColor(color)}
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: 1,
                          backgroundColor: color,
                          border:
                            newCategoryColor === color
                              ? "2px solid rgba(255,255,255,0.8)"
                              : "1px solid rgba(255,255,255,0.2)",
                          cursor: "pointer",
                        }}
                      />
                    ))}
                  </Stack>
                  <Button
                    variant="outlined"
                    onClick={handleAddCategory}
                    startIcon={<AddRoundedIcon />}
                    sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 600 }}
                  >
                    Criar categoria
                  </Button>
                </Stack>
              </Box>
            )}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => {
                  setCategoryDialogOpen(false);
                  cancelEditCategory();
                }}
              >
                Fechar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={taskFieldSettingsOpen}
        onClose={() => setTaskFieldSettingsOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent>
          <Stack spacing={2.5}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6">Personalizar tarefas</Typography>
              <IconButton onClick={() => setTaskFieldSettingsOpen(false)} sx={{ color: "text.secondary" }}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            <Stack spacing={1}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(15, 23, 32, 0.9)",
                  cursor: "pointer",
                }}
                onClick={() =>
                  setTaskFieldSettings((prev) => ({ ...prev, value: !prev.value }))
                }
              >
                <Typography variant="subtitle2">Mostrar valor</Typography>
                <Switch
                  checked={taskFieldSettings.value}
                  onChange={(event) =>
                    setTaskFieldSettings((prev) => ({ ...prev, value: event.target.checked }))
                  }
                  onClick={(event) => event.stopPropagation()}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(15, 23, 32, 0.9)",
                  cursor: "pointer",
                }}
                onClick={() =>
                  setTaskFieldSettings((prev) => ({ ...prev, link: !prev.link }))
                }
              >
                <Typography variant="subtitle2">Mostrar link</Typography>
                <Switch
                  checked={taskFieldSettings.link}
                  onChange={(event) =>
                    setTaskFieldSettings((prev) => ({ ...prev, link: event.target.checked }))
                  }
                  onClick={(event) => event.stopPropagation()}
                />
              </Box>
            </Stack>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => setTaskFieldSettingsOpen(false)}>
                Fechar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={columnManagerOpen}
        onClose={() => setColumnManagerOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Stack spacing={2.5}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6">Gerir colunas</Typography>
              <IconButton onClick={() => setColumnManagerOpen(false)} sx={{ color: "text.secondary" }}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Renomeie e reorganize as colunas rapidamente.
            </Typography>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragEnd={handleColumnReorder}
            >
              <SortableContext items={columns.map((column) => column.id)} strategy={verticalListSortingStrategy}>
                <Stack spacing={1.5}>
                  {columns.map((column) => (
                    <SortableColumnRow
                      key={column.id}
                      column={column}
                      onRename={(nextTitle) => {
                        setColumns((prev) =>
                          prev.map((item) =>
                            item.id === column.id ? { ...item, title: nextTitle } : item
                          )
                        );
                      }}
                    />
                  ))}
                </Stack>
              </SortableContext>
            </DndContext>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => setColumnManagerOpen(false)}>
                Fechar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={(_, reason) => {
          if (reason === "clickaway") {
            return;
          }
          setSnackbarOpen(false);
          setLastRemoved(null);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="info"
          onClose={() => {
            setSnackbarOpen(false);
            setLastRemoved(null);
          }}
          action={
            <Button color="inherit" size="small" onClick={handleUndoRemove}>
              Desfazer
            </Button>
          }
          sx={{ width: "100%" }}
        >
          Task removida.
        </Alert>
      </Snackbar>

      <Dialog
        open={Boolean(editingColumn)}
        onClose={handleColumnEditClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h6">Editar etapa</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Atualize o titulo e a descricao da etapa.
              </Typography>
            </Box>
            <TextField
              label="Titulo"
              fullWidth
              value={editColumnTitle}
              onChange={(event) => setEditColumnTitle(event.target.value)}
            />
            <TextField
              label="Descricao"
              fullWidth
              multiline
              minRows={3}
              value={editColumnDescription}
              onChange={(event) => setEditColumnDescription(event.target.value)}
            />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button color="error" variant="outlined" onClick={handleColumnRemove}>
                Remover
              </Button>
              <Button variant="outlined" onClick={handleColumnEditClose}>
                Cancelar
              </Button>
              <Button variant="contained" onClick={handleColumnEditSave}>
                Salvar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

function SortableColumn({
  column,
  onEdit,
  onEditColumn,
  onAddDeal,
  filteredDeals,
  categoryMap,
  getDealOwnerLabel,
  showValue,
  canEditTasks,
  canEditColumns,
}: {
  column: Column;
  onEdit: (deal: Deal) => void;
  onEditColumn: (column: Column) => void;
  onAddDeal: (columnId: string) => void;
  filteredDeals: Deal[];
  categoryMap: Map<string, Category>;
  getDealOwnerLabel: (deal: Deal) => string;
  showValue: boolean;
  canEditTasks: boolean;
  canEditColumns: boolean;
}) {
  const displayCount = filteredDeals.length;
  const dragId = columnDragId(column.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: dragId,
      data: { type: "column" },
      disabled: !canEditColumns,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition || "transform 200ms ease",
    opacity: isDragging ? 0.6 : 1,
    willChange: "transform",
  };

  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      sx={{
        p: 2.5,
        flex: 1,
        minWidth: 280,
        border: "1px solid rgba(255,255,255,0.08)",
        backgroundColor: "rgba(15, 23, 32, 0.9)",
      }}
      style={style}
    >
      <Stack spacing={2}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "space-between",
            cursor: canEditColumns ? "grab" : "default",
            touchAction: canEditColumns ? "none" : "auto",
          }}
          {...(canEditColumns ? { ...attributes, ...listeners, "data-draggable": true } : {})}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}
            onClick={() => {
              if (canEditColumns) {
                onEditColumn(column);
              }
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {column.title}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
              {displayCount}
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                if (canEditTasks) {
                  onAddDeal(column.id);
                }
              }}
              disabled={!canEditTasks}
              sx={{
                color: "text.secondary",
                border: "none",
              }}
            >
              <AddRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
        <SortableContext
          items={filteredDeals.map((deal) => cardDragId(deal.id))}
          strategy={verticalListSortingStrategy}
        >
          <Stack spacing={1.5}>
            {filteredDeals.map((deal) => (
              <SortableDeal
                key={deal.id}
                deal={deal}
                onEdit={onEdit}
                ownerLabel={getDealOwnerLabel(deal)}
                category={categoryMap.get(deal.categoryId || "")}
                showValue={showValue}
                canEditTasks={canEditTasks}
              />
            ))}
          </Stack>
        </SortableContext>
      </Stack>
    </Paper>
  );
}

function SortableDeal({
  deal,
  onEdit,
  ownerLabel,
  showValue,
  category,
  canEditTasks,
}: {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  ownerLabel: string;
  showValue: boolean;
  category?: Category;
  canEditTasks: boolean;
}) {
  const dragId = cardDragId(deal.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: dragId,
      data: { type: "card" },
      disabled: !canEditTasks,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition || "transform 180ms ease",
    opacity: isDragging ? 0.6 : 1,
    willChange: "transform",
  };

  return (
    <Box
      ref={setNodeRef}
      sx={{
        p: 2,
        borderRadius: "var(--radius-card)",
        border: "1px solid rgba(255,255,255,0.08)",
        backgroundColor: "rgba(10, 16, 23, 0.85)",
        cursor: canEditTasks ? "grab" : "pointer",
        touchAction: canEditTasks ? "none" : "auto",
      }}
      style={style}
      {...(canEditTasks ? { ...attributes, ...listeners } : {})}
      onClick={() => onEdit(deal)}
      data-draggable
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {deal.name}
        </Typography>
        
      </Box>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {ownerLabel}
      </Typography>
      {showValue ? (
        <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
          {deal.value}
        </Typography>
      ) : null}
    </Box>
  );
}

function SortableColumnRow({
  column,
  onRename,
}: {
  column: Column;
  onRename: (nextTitle: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: column.id,
      data: { type: "column-row" },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition || "transform 180ms ease",
    opacity: isDragging ? 0.7 : 1,
    willChange: "transform",
  };

  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      sx={{
        p: 2,
        border: "1px solid rgba(255,255,255,0.08)",
        backgroundColor: "rgba(15, 23, 32, 0.9)",
      }}
      style={style}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
        <TextField
          label="Nome da coluna"
          fullWidth
          value={column.title}
          onChange={(event) => onRename(event.target.value)}
        />
        <IconButton
          {...attributes}
          {...listeners}
          sx={{
            border: "1px solid rgba(255,255,255,0.12)",
            cursor: "grab",
          }}
          aria-label={`Arrastar ${column.title}`}
        >
          <DragIndicatorRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Paper>
  );
}

function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (nextValue: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image,
      Placeholder.configure({
        placeholder: "Escreva a descricao da tarefa...",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find((item) => item.type.startsWith("image/"));
        if (!imageItem) {
          return false;
        }
        const file = imageItem.getAsFile();
        if (!file) {
          return false;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const src = String(reader.result || "");
          editor?.chain().focus().setImage({ src }).run();
        };
        reader.readAsDataURL(file);
        return true;
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || "", false);
    }
  }, [editor, value]);

  const iconButtonProps = {
    size: "small" as const,
    sx: {
      border: "1px solid rgba(255,255,255,0.12)",
      backgroundColor: "rgba(7, 9, 13, 0.6)",
      "&:hover": { backgroundColor: "rgba(7, 9, 13, 0.8)" },
    },
  };

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Tooltip title="Negrito" placement="top">
          <IconButton
            {...iconButtonProps}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            color={editor?.isActive("bold") ? "primary" : "default"}
            aria-label="Negrito"
          >
            <FormatBoldRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Italico" placement="top">
          <IconButton
            {...iconButtonProps}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            color={editor?.isActive("italic") ? "primary" : "default"}
            aria-label="Italico"
          >
            <FormatItalicRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Titulo 1" placement="top">
          <IconButton
            {...iconButtonProps}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            color={editor?.isActive("heading", { level: 1 }) ? "primary" : "default"}
            aria-label="Titulo 1"
          >
            <LooksOneRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Titulo 2" placement="top">
          <IconButton
            {...iconButtonProps}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            color={editor?.isActive("heading", { level: 2 }) ? "primary" : "default"}
            aria-label="Titulo 2"
          >
            <LooksTwoRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Titulo 3" placement="top">
          <IconButton
            {...iconButtonProps}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            color={editor?.isActive("heading", { level: 3 }) ? "primary" : "default"}
            aria-label="Titulo 3"
          >
            <Looks3RoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Lista" placement="top">
          <IconButton
            {...iconButtonProps}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            color={editor?.isActive("bulletList") ? "primary" : "default"}
            aria-label="Lista"
          >
            <FormatListBulletedRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Lista numerada" placement="top">
          <IconButton
            {...iconButtonProps}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            color={editor?.isActive("orderedList") ? "primary" : "default"}
            aria-label="Lista numerada"
          >
            <FormatListNumberedRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Citação" placement="top">
          <IconButton
            {...iconButtonProps}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            color={editor?.isActive("blockquote") ? "primary" : "default"}
            aria-label="Citação"
          >
            <FormatQuoteRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Limpar formatacao" placement="top">
          <IconButton
            {...iconButtonProps}
            onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
            aria-label="Limpar formatacao"
          >
            <BackspaceRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Box
        sx={{
          borderRadius: "var(--radius-card)",
          border: "1px solid rgba(255,255,255,0.12)",
          backgroundColor: "rgba(10, 16, 23, 0.75)",
          "& .tiptap": {
            minHeight: 180,
            outline: "none",
            padding: "16px",
          },
          "& .tiptap h1": { fontSize: "1.25rem", fontWeight: 700 },
          "& .tiptap h2": { fontSize: "1.1rem", fontWeight: 700 },
          "& .tiptap h3": { fontSize: "1rem", fontWeight: 700 },
          "& .tiptap img": { maxWidth: "100%", borderRadius: "12px" },
          "& .tiptap p.is-editor-empty:first-of-type::before": {
            content: "attr(data-placeholder)",
            color: "rgba(230, 237, 243, 0.5)",
            float: "left",
            height: 0,
            pointerEvents: "none",
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Stack>
  );
}
