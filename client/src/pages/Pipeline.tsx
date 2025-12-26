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
  Alert,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { nanoid } from "nanoid";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import FileCopyRoundedIcon from "@mui/icons-material/FileCopyRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import RestoreFromTrashRoundedIcon from "@mui/icons-material/RestoreFromTrashRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import SettingsIconButton from "../components/SettingsIconButton";
import RichTextEditor from "../components/RichTextEditor";
import api from "../api";
import { saveUserStorage } from "../userStorage";
import ToggleCheckbox from "../components/ToggleCheckbox";
import { PageContainer } from "../ui/PageContainer/PageContainer";
import AppAccordion from "../components/layout/AppAccordion";
import CardSection from "../components/layout/CardSection";
import SettingsDialog from "../components/SettingsDialog";
import { interactiveCardSx } from "../styles/interactiveCard";
import { CategoryChip } from "../components/CategoryChip";
import CategoryFilter from "../components/CategoryFilter";
import { SearchField } from "../ui/SearchField/SearchField";
import {
  DndContext,
  PointerSensor,
  DragOverlay,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
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

import AppCard from "../components/layout/AppCard";
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
  watcherIds?: string[];
  categoryId?: string;
  categoryIds?: string[];
  priority?: "Baixa" | "Media" | "Alta" | "Urgente";
  dueDate?: string;
  checklist?: ChecklistItem[];
  labels?: string[];
  estimate?: string;
  timeSpent?: string;
  attachments?: string[];
};

type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

type Column = {
  id: string;
  title: string;
  deals: Deal[];
  description?: string;
  archived?: boolean;
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

type SprintInfo = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

type SprintHistory = SprintInfo & {
  closedAt: string;
  columns: Column[];
};

type SprintState = {
  enabled: boolean;
  duration: "1w" | "2w" | "1m";
  activeSprint: SprintInfo | null;
  backlog: Deal[];
  history: SprintHistory[];
};

type Permissions = {
  pipeline_view: boolean;
  pipeline_edit_tasks: boolean;
  pipeline_edit_columns: boolean;
  finance_view: boolean;
  finance_edit: boolean;
};

const DEFAULT_PERMISSIONS: Permissions = {
  pipeline_view: true,
  pipeline_edit_tasks: true,
  pipeline_edit_columns: true,
  finance_view: true,
  finance_edit: true,
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
  "Alimentação",
  "Transporte",
  "Saude",
  "Lazer",
  "Educação",
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
  const hasLegacy = cats.some(cat => LEGACY_PIPELINE_NAMES.has(cat.name));
  const hasNew = cats.some(cat => NEW_PIPELINE_NAMES.has(cat.name));
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
        descriptionHtml: "<p>Implementação em andamento com time técnico.</p>",
      },
      {
        id: "nova",
        name: "Nova Terra",
        value: "R$ 36k",
        owner: "Sofia L.",
        categoryId: defaultCategories[1]?.id,
        categoryIds: [defaultCategories[1]?.id || ""],
        link: "https://novaterra.example.com",
        comments: "Revisão de integrações.",
        descriptionHtml: "<p>Validar integração com CRM.</p>",
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
        comments: "Homologação marcada.",
        descriptionHtml: "<p>Checklist final de aprovação.</p>",
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
        descriptionHtml: "<p>Encerramento e documentação final.</p>",
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

const normalizePersonIds = (ids?: Array<number | string>) => {
  if (!ids) {
    return [];
  }
  return ids.map(id => {
    if (typeof id === "number") {
      return `user:${id}`;
    }
    if (id.startsWith("user:") || id.startsWith("contact:")) {
      return id;
    }
    return `user:${id}`;
  });
};

const normalizeDeals = (deals: Deal[]) =>
  deals.map(deal => ({
    ...deal,
    responsibleIds: normalizePersonIds(
      deal.responsibleIds as Array<number | string>
    ),
    workerIds: normalizePersonIds(deal.workerIds as Array<number | string>),
    watcherIds: normalizePersonIds(deal.watcherIds as Array<number | string>),
  }));

const normalizeColumns = (incoming: Column[]) =>
  incoming.map(column => ({
    ...column,
    archived: Boolean(column.archived),
    deals: normalizeDeals(column.deals),
  }));

const addSprintDuration = (base: Date, duration: SprintState["duration"]) => {
  const next = new Date(base);
  const days = duration === "1w" ? 7 : duration === "2w" ? 14 : 30;
  next.setDate(next.getDate() + days);
  return next;
};

const defaultTaskFieldSettings = {
  value: false,
  link: false,
  description: true,
  priority: false,
  dueDate: false,
  checklist: false,
  labels: false,
  estimate: false,
  timeSpent: false,
  watchers: false,
  attachments: false,
  sprintInfo: false,
};

export default function Pipeline() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [columns, setColumns] = useState<Column[]>(() => defaultColumns);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [viewingDeal, setViewingDeal] = useState<Deal | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editCameFromView, setEditCameFromView] = useState(false);
  const [editSourceDealId, setEditSourceDealId] = useState<string | null>(null);
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
  const [editWatcherIds, setEditWatcherIds] = useState<string[]>([]);
  const [editOwnerFallback, setEditOwnerFallback] = useState("");
  const [editCategoryIds, setEditCategoryIds] = useState<string[]>([]);
  const [editPriority, setEditPriority] = useState<Deal["priority"]>("Media");
  const [editDueDate, setEditDueDate] = useState("");
  const [editChecklist, setEditChecklist] = useState<ChecklistItem[]>([]);
  const [editLabels, setEditLabels] = useState<string[]>([]);
  const [editEstimate, setEditEstimate] = useState("");
  const [editTimeSpent, setEditTimeSpent] = useState("");
  const [editAttachments, setEditAttachments] = useState<string[]>([]);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [editColumnTitle, setEditColumnTitle] = useState("");
  const [editColumnDescription, setEditColumnDescription] = useState("");
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [users, setUsers] = useState<PipelineUser[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [taskFieldSettingsOpen, setTaskFieldSettingsOpen] = useState(false);
  const [configAccordion, setConfigAccordion] = useState<
    "fields" | "categories" | "columns" | "sprints" | false
  >(false);
  const [taskFieldSettings, setTaskFieldSettings] = useState({
    ...defaultTaskFieldSettings,
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
  const [taskQuery, setTaskQuery] = useState("");
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [viewingChecklistDraftText, setViewingChecklistDraftText] = useState("");
  const viewingChecklistDraftInputRef = useRef<HTMLInputElement | null>(null);
  const [sprintState, setSprintState] = useState<SprintState>({
    enabled: false,
    duration: "2w",
    activeSprint: null,
    backlog: [],
    history: [],
  });
  const [newDealId, setNewDealId] = useState<string | null>(null);
  const [removeDealOpen, setRemoveDealOpen] = useState(false);
  const [duplicateDealOpen, setDuplicateDealOpen] = useState(false);
  const [duplicateDealTarget, setDuplicateDealTarget] = useState<Deal | null>(
    null
  );
  const [removeColumnOpen, setRemoveColumnOpen] = useState(false);
  const [removeColumnTarget, setRemoveColumnTarget] = useState<Column | null>(
    null
  );
  const [permissions, setPermissions] = useState<Permissions>(() => ({
    ...DEFAULT_PERMISSIONS,
  }));
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const isLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);
  const openedFromLinkRef = useRef(false);
  const restoreDefaultsSnapshotRef = useRef<{
    taskFieldSettings: typeof taskFieldSettings;
    configAccordion: typeof configAccordion;
    newCategoryName: string;
    newCategoryColor: string;
    editingCategoryId: string | null;
    editingCategoryName: string;
    editingCategoryColor: string;
  } | null>(null);
  const [restoreDefaultsSnackbarOpen, setRestoreDefaultsSnackbarOpen] =
    useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  );
  const canEditTasksOnBoard =
    permissions.pipeline_edit_tasks &&
    (!sprintState.enabled || !!sprintState.activeSprint);

  const handleRestorePipelineDefaults = () => {
    restoreDefaultsSnapshotRef.current = {
      taskFieldSettings,
      configAccordion,
      newCategoryName,
      newCategoryColor,
      editingCategoryId,
      editingCategoryName,
      editingCategoryColor,
    };
    cancelEditCategory();
    setNewCategoryName("");
    setNewCategoryColor(DEFAULT_COLORS[0]);
    setEditingCategoryName("");
    setEditingCategoryColor(DEFAULT_COLORS[0]);
    setConfigAccordion(false);
    setTaskFieldSettings({ ...defaultTaskFieldSettings });
    setRestoreDefaultsSnackbarOpen(true);
  };

  const handleUndoRestorePipelineDefaults = () => {
    const snapshot = restoreDefaultsSnapshotRef.current;
    if (!snapshot) {
      setRestoreDefaultsSnackbarOpen(false);
      return;
    }
    setTaskFieldSettings(snapshot.taskFieldSettings);
    setConfigAccordion(snapshot.configAccordion);
    setNewCategoryName(snapshot.newCategoryName);
    setNewCategoryColor(snapshot.newCategoryColor);
    setEditingCategoryId(snapshot.editingCategoryId);
    setEditingCategoryName(snapshot.editingCategoryName);
    setEditingCategoryColor(snapshot.editingCategoryColor);
    restoreDefaultsSnapshotRef.current = null;
    setRestoreDefaultsSnackbarOpen(false);
  };

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
          const incomingSprints = pipeline.sprints as SprintState | undefined;
          if (incomingSprints) {
            setSprintState({
              enabled: Boolean(incomingSprints.enabled),
              duration: incomingSprints.duration || "2w",
              activeSprint: incomingSprints.activeSprint || null,
              backlog: normalizeDeals(incomingSprints.backlog || []),
              history: Array.isArray(incomingSprints.history)
                ? incomingSprints.history.map(item => ({
                    ...item,
                    columns: normalizeColumns(item.columns || []),
                  }))
                : [],
            });
          }
          if (nextCategories !== incomingCategories) {
            await api.put("/api/pipeline/board", {
              data: {
                columns: pipeline.columns,
                categories: nextCategories,
                sprints: incomingSprints,
              },
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
      const parsed = JSON.parse(stored) as Partial<typeof taskFieldSettings>;
      setTaskFieldSettings({
        value: Boolean(parsed.value),
        link: Boolean(parsed.link),
        description:
          parsed.description !== undefined ? Boolean(parsed.description) : true,
        priority: Boolean(parsed.priority),
        dueDate: Boolean(parsed.dueDate),
        checklist: Boolean(parsed.checklist),
        labels: Boolean(parsed.labels),
        estimate: Boolean(parsed.estimate),
        timeSpent: Boolean(parsed.timeSpent),
        watchers: Boolean(parsed.watchers),
        attachments: Boolean(parsed.attachments),
        sprintInfo: Boolean(parsed.sprintInfo),
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
        setPermissions({ ...DEFAULT_PERMISSIONS });
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
    window.localStorage.setItem(
      "sc_task_fields",
      JSON.stringify(taskFieldSettings)
    );
    window.dispatchEvent(new Event("task-fields-change"));
    const timeoutId = setTimeout(() => {
      void saveUserStorage("sc_task_fields", taskFieldSettings);
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [taskFieldSettings]);

  useEffect(() => {
    if (!isLoadedRef.current) {
      return;
    }
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      void api.put("/api/pipeline/board", {
        data: { columns, categories, sprints: sprintState },
      });
    }, 600);
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [columns, categories, sprintState]);

  useEffect(() => {
    if (!permissions.pipeline_view) {
      setLocation("/home");
    }
  }, [permissions.pipeline_view, setLocation]);

  const normalizedQuery = taskQuery.trim().toLowerCase();

  const getStoredPermissions = (): Permissions => {
    const storedUser = window.localStorage.getItem("sc_user");
    const email = storedUser
      ? (JSON.parse(storedUser) as { email?: string }).email
      : "";
    const storedRoles = window.localStorage.getItem("sc_user_roles");
    const userRoles = storedRoles
      ? (JSON.parse(storedRoles) as Record<string, string>)
      : {};
    const roleName = (email && userRoles[email]) || "Administrador";
    const storedPermissions = window.localStorage.getItem(
      "sc_role_permissions"
    );
    const rolePermissions = storedPermissions
      ? (JSON.parse(storedPermissions) as Record<
          string,
          Record<string, boolean>
        >)
      : {};

    const raw = rolePermissions[roleName] as
      | Partial<Record<keyof Permissions, boolean>>
      | undefined;

    return {
      pipeline_view: raw?.pipeline_view ?? DEFAULT_PERMISSIONS.pipeline_view,
      pipeline_edit_tasks:
        raw?.pipeline_edit_tasks ?? DEFAULT_PERMISSIONS.pipeline_edit_tasks,
      pipeline_edit_columns:
        raw?.pipeline_edit_columns ?? DEFAULT_PERMISSIONS.pipeline_edit_columns,
      finance_view: raw?.finance_view ?? DEFAULT_PERMISSIONS.finance_view,
      finance_edit: raw?.finance_edit ?? DEFAULT_PERMISSIONS.finance_edit,
    };
  };

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(cat => map.set(cat.id, cat));
    return map;
  }, [categories]);

  const personOptions = useMemo<PersonOption[]>(() => {
    const userOptions = users.map(user => ({
      id: `user:${user.id}`,
      name: user.name?.trim() ? user.name : user.email,
      email: user.email,
      type: "user" as const,
    }));
    const contactOptions = contacts.map(contact => ({
      id: `contact:${contact.id}`,
      name: contact.name || contact.emails?.[0] || "Contato",
      email: contact.emails?.[0],
      type: "contact" as const,
    }));
    return [...userOptions, ...contactOptions];
  }, [users, contacts]);

  const personMap = useMemo(() => {
    const map = new Map<string, PersonOption>();
    personOptions.forEach(person => map.set(person.id, person));
    return map;
  }, [personOptions]);

  const formatPersonLabel = (person?: PersonOption) => {
    if (!person) {
      return "";
    }
    return person.name || person.email || "";
  };

  const getPersonLabels = (ids?: string[]) =>
    (ids || []).map(id => formatPersonLabel(personMap.get(id))).filter(Boolean);

  const stripHtml = (value: string) =>
    value
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const findColumnByCard = (cardId: string) =>
    columns.find(column => column.deals.some(deal => deal.id === cardId));

  const findDeal = (cardId: string) => {
    for (const column of columns) {
      const deal = column.deals.find(item => item.id === cardId);
      if (deal) {
        return deal;
      }
    }
    return null;
  };

  const findDealInColumns = (cardId: string) =>
    columns.some(column => column.deals.some(deal => deal.id === cardId));

  const findDealInBacklog = (cardId: string) =>
    sprintState.backlog.some(deal => deal.id === cardId);

  const findDealAnywhere = (dealId: string) => {
    const inColumns = findDeal(dealId);
    if (inColumns) {
      return inColumns;
    }
    const inBacklog = sprintState.backlog.find(deal => deal.id === dealId) || null;
    return inBacklog;
  };

  const formatDealDateLabel = (deal?: Deal | null) => {
    if (!deal?.dueDate) {
      return "";
    }
    const raw = deal.dueDate;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? new Date(`${raw}T00:00:00`)
      : new Date(raw);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleDateString("pt-BR");
  };

  const getSprintLabel = (deal?: Deal | null) => {
    if (!deal || !sprintState.enabled) {
      return "";
    }
    if (findDealInBacklog(deal.id)) {
      return "Backlog";
    }
    if (sprintState.activeSprint) {
      return sprintState.activeSprint.name;
    }
    return "Sem sprint";
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

  const handleRequestDuplicateDeal = (deal: Deal) => {
    setDuplicateDealTarget(deal);
    setDuplicateDealOpen(true);
  };

  const handleCloseDuplicateDeal = () => {
    setDuplicateDealOpen(false);
    setDuplicateDealTarget(null);
  };

  const handleConfirmDuplicateDeal = () => {
    if (!duplicateDealTarget) {
      return;
    }
    handleDuplicateDeal(duplicateDealTarget);
    handleCloseDuplicateDeal();
  };

  const handleDuplicateDeal = (deal: Deal) => {
    const nextDeal: Deal = {
      ...deal,
      id: `deal-${Date.now()}`,
      name: deal.name ? `${deal.name} (copia)` : "Copia da tarefa",
    };
    if (sprintState.enabled && findDealInBacklog(deal.id)) {
      setSprintState(prev => ({
        ...prev,
        backlog: [nextDeal, ...prev.backlog],
      }));
      setViewingDeal(nextDeal);
      return;
    }
    const column = findColumnByCard(deal.id) || columns[0];
    if (!column) {
      return;
    }
    setColumns(prev =>
      prev.map(item =>
        item.id === column.id
          ? { ...item, deals: [nextDeal, ...item.deals] }
          : item
      )
    );
    setViewingDeal(nextDeal);
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
      return column.deals.filter(deal => {
        if (categoryFilters.length === 0) {
          return true;
        }
        const ids = deal.categoryIds?.length
          ? deal.categoryIds
          : deal.categoryId
            ? [deal.categoryId]
            : [];
        return categoryFilters.some(id => ids.includes(id));
      });
    }
    return column.deals.filter(deal => {
      if (categoryFilters.length > 0) {
        const ids = deal.categoryIds?.length
          ? deal.categoryIds
          : deal.categoryId
            ? [deal.categoryId]
            : [];
        if (!categoryFilters.some(id => ids.includes(id))) {
          return false;
        }
      }
      const description = stripHtml(
        deal.descriptionHtml || deal.comments || ""
      );
      const haystack =
        `${deal.name} ${getDealOwnerLabel(deal)} ${deal.value} ${description}`.toLowerCase();
      return haystack.includes(query);
    });
  };

  const activeColumns = useMemo(
    () => columns.filter(column => !column.archived),
    [columns]
  );

  const archivedColumns = useMemo(
    () => columns.filter(column => column.archived),
    [columns]
  );

  const visibleColumns = useMemo(() => {
    if (!normalizedQuery && categoryFilters.length === 0) {
      return activeColumns;
    }
    return activeColumns.filter(
      column => filterDealsByQuery(column, normalizedQuery).length > 0
    );
  }, [
    activeColumns,
    normalizedQuery,
    categoryFilters,
    getDealOwnerLabel,
    stripHtml,
  ]);

  const filteredBacklog = useMemo(() => {
    if (!sprintState.backlog.length) {
      return [];
    }
    const virtualColumn: Column = {
      id: "backlog",
      title: "Backlog",
      deals: sprintState.backlog,
    };
    return filterDealsByQuery(virtualColumn, normalizedQuery);
  }, [
    sprintState.backlog,
    normalizedQuery,
    categoryFilters,
    getDealOwnerLabel,
    stripHtml,
  ]);

  const columnItems = useMemo(
    () => visibleColumns.map(column => columnDragId(column.id)),
    [visibleColumns]
  );

  const selectPersonsByIds = (ids: string[]) =>
    personOptions.filter(person => ids.includes(person.id));

  const findColumn = (columnId: string) =>
    columns.find(column => column.id === columnId) || null;

  const handleEditOpen = (deal: Deal) => {
    setEditingDeal(deal);
    setEditName(deal.name);
    setEditValue(deal.value);
    setEditLink(deal.link || "");
    setEditDescription(deal.descriptionHtml || deal.comments || "");
    setEditResponsibleIds(
      normalizePersonIds(deal.responsibleIds as Array<number | string>)
    );
    setEditWorkerIds(
      normalizePersonIds(deal.workerIds as Array<number | string>)
    );
    setEditWatcherIds(
      normalizePersonIds(deal.watcherIds as Array<number | string>)
    );
    setEditOwnerFallback(deal.owner);
    setEditCategoryIds(
      deal.categoryIds || (deal.categoryId ? [deal.categoryId] : [])
    );
    setEditPriority(deal.priority || "Media");
    setEditDueDate(deal.dueDate || "");
    setEditChecklist(deal.checklist ? [...deal.checklist] : []);
    setEditLabels(deal.labels ? [...deal.labels] : []);
    setEditEstimate(deal.estimate || "");
    setEditTimeSpent(deal.timeSpent || "");
    setEditAttachments(deal.attachments ? [...deal.attachments] : []);
    setEditingCategoryId(null);
    setNewDealId(null);
  };

  const handleOpenEditFromView = () => {
    if (!viewingDeal) {
      return;
    }
    setEditCameFromView(true);
    setEditSourceDealId(viewingDeal.id);
    handleEditOpen(viewingDeal);
    setViewingDeal(null);
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
        if (sprintState.enabled && !findDealInColumns(newDealId)) {
          setSprintState(prev => ({
            ...prev,
            backlog: prev.backlog.filter(deal => deal.id !== newDealId),
          }));
        } else {
          setColumns(prev =>
            prev.map(column => ({
              ...column,
              deals: column.deals.filter(deal => deal.id !== newDealId),
            }))
          );
        }
      }
    }
    setEditingDeal(null);
    setNewDealId(null);
    setEditCameFromView(false);
    setEditSourceDealId(null);
  };

  const handleBackToViewFromEdit = () => {
    if (!editCameFromView || !editSourceDealId) {
      handleEditClose();
      return;
    }
    const nextDeal = findDealAnywhere(editSourceDealId);
    setEditingDeal(null);
    setNewDealId(null);
    setEditCameFromView(false);
    setEditSourceDealId(null);
    setViewingDeal(nextDeal);
  };

  const handleViewOpen = (deal: Deal) => {
    setViewingDeal(deal);
  };

  const handleViewClose = () => {
    setViewingDeal(null);
    setRemoveDealOpen(false);
    setDuplicateDealOpen(false);
    setDuplicateDealTarget(null);
    setViewingChecklistDraftText("");
  };

  const handleUpdateViewingDealName = (nextName: string) => {
    if (!viewingDeal) {
      return;
    }
    const dealId = viewingDeal.id;

    if (sprintState.enabled && !findDealInColumns(dealId) && findDealInBacklog(dealId)) {
      setSprintState(prev => ({
        ...prev,
        backlog: prev.backlog.map(deal =>
          deal.id === dealId ? { ...deal, name: nextName } : deal
        ),
      }));
      setViewingDeal(prev => (prev ? { ...prev, name: nextName } : prev));
      return;
    }

    setColumns(prev =>
      prev.map(column => ({
        ...column,
        deals: column.deals.map(deal =>
          deal.id === dealId ? { ...deal, name: nextName } : deal
        ),
      }))
    );
    setViewingDeal(prev => (prev ? { ...prev, name: nextName } : prev));
  };

  const handleAddViewingChecklistItem = (text?: string) => {
    if (!viewingDeal) {
      return;
    }
    const dealId = viewingDeal.id;
    const nextText = (text ?? viewingChecklistDraftText).trim();
    if (!nextText) {
      return;
    }
    const nextItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      text: nextText,
      done: false,
    };

    const apply = (deal: Deal) => ({
      ...deal,
      checklist: [...(deal.checklist || []), nextItem],
    });

    if (sprintState.enabled && !findDealInColumns(dealId) && findDealInBacklog(dealId)) {
      setSprintState(prev => ({
        ...prev,
        backlog: prev.backlog.map(deal => (deal.id === dealId ? apply(deal) : deal)),
      }));
      setViewingDeal(prev => (prev ? apply(prev) : prev));
    } else {
      setColumns(prev =>
        prev.map(column => ({
          ...column,
          deals: column.deals.map(deal => (deal.id === dealId ? apply(deal) : deal)),
        }))
      );
      setViewingDeal(prev => (prev ? apply(prev) : prev));
    }

    setViewingChecklistDraftText("");
    queueMicrotask(() => viewingChecklistDraftInputRef.current?.focus());
  };

  const handleToggleViewingChecklistDone = (itemId: string, nextDone: boolean) => {
    if (!viewingDeal) {
      return;
    }
    const dealId = viewingDeal.id;
    const apply = (deal: Deal) => ({
      ...deal,
      checklist: (deal.checklist || []).map(item =>
        item.id === itemId ? { ...item, done: nextDone } : item
      ),
    });

    if (sprintState.enabled && !findDealInColumns(dealId) && findDealInBacklog(dealId)) {
      setSprintState(prev => ({
        ...prev,
        backlog: prev.backlog.map(deal => (deal.id === dealId ? apply(deal) : deal)),
      }));
      setViewingDeal(prev => (prev ? apply(prev) : prev));
      return;
    }

    setColumns(prev =>
      prev.map(column => ({
        ...column,
        deals: column.deals.map(deal => (deal.id === dealId ? apply(deal) : deal)),
      }))
    );
    setViewingDeal(prev => (prev ? apply(prev) : prev));
  };

  const handleUpdateViewingChecklistText = (itemId: string, nextText: string) => {
    if (!viewingDeal) {
      return;
    }
    const dealId = viewingDeal.id;
    const apply = (deal: Deal) => ({
      ...deal,
      checklist: (deal.checklist || []).map(item =>
        item.id === itemId ? { ...item, text: nextText } : item
      ),
    });

    if (sprintState.enabled && !findDealInColumns(dealId) && findDealInBacklog(dealId)) {
      setSprintState(prev => ({
        ...prev,
        backlog: prev.backlog.map(deal => (deal.id === dealId ? apply(deal) : deal)),
      }));
      setViewingDeal(prev => (prev ? apply(prev) : prev));
      return;
    }

    setColumns(prev =>
      prev.map(column => ({
        ...column,
        deals: column.deals.map(deal => (deal.id === dealId ? apply(deal) : deal)),
      }))
    );
    setViewingDeal(prev => (prev ? apply(prev) : prev));
  };

  const handleRemoveViewingChecklistItem = (itemId: string) => {
    if (!viewingDeal) {
      return;
    }
    const dealId = viewingDeal.id;
    const apply = (deal: Deal) => ({
      ...deal,
      checklist: (deal.checklist || []).filter(item => item.id !== itemId),
    });

    if (sprintState.enabled && !findDealInColumns(dealId) && findDealInBacklog(dealId)) {
      setSprintState(prev => ({
        ...prev,
        backlog: prev.backlog.map(deal => (deal.id === dealId ? apply(deal) : deal)),
      }));
      setViewingDeal(prev => (prev ? apply(prev) : prev));
      return;
    }

    setColumns(prev =>
      prev.map(column => ({
        ...column,
        deals: column.deals.map(deal => (deal.id === dealId ? apply(deal) : deal)),
      }))
    );
    setViewingDeal(prev => (prev ? apply(prev) : prev));
  };

  const handleEditSave = () => {
    if (!editingDeal) {
      return;
    }
    const ownerLabels = getPersonLabels(editResponsibleIds);
    const ownerLabel = ownerLabels.length
      ? ownerLabels.join(", ")
      : editOwnerFallback;
    if (sprintState.enabled && !findDealInColumns(editingDeal.id)) {
      setSprintState(prev => ({
        ...prev,
        backlog: prev.backlog.map(deal =>
          deal.id === editingDeal.id
            ? {
                ...deal,
                name: editName.trim() || deal.name,
                value: taskFieldSettings.value
                  ? editValue.trim() || deal.value
                  : deal.value,
                owner: ownerLabel.trim() || deal.owner,
                link: taskFieldSettings.link ? editLink.trim() : deal.link,
                comments: stripHtml(editDescription),
                descriptionHtml: editDescription,
                responsibleIds: editResponsibleIds,
                workerIds: editWorkerIds,
                watcherIds: editWatcherIds,
                categoryId: editCategoryIds[0] || "",
                categoryIds: editCategoryIds,
                priority: editPriority,
                dueDate: editDueDate,
                checklist: taskFieldSettings.checklist
                  ? editChecklist
                  : deal.checklist,
                labels: editLabels,
                estimate: editEstimate,
                timeSpent: editTimeSpent,
                attachments: editAttachments,
              }
            : deal
        ),
      }));
      setEditingDeal(null);
      setNewDealId(null);
      return;
    }
    setColumns(prev =>
      prev.map(column => ({
        ...column,
        deals: column.deals.map(deal =>
          deal.id === editingDeal.id
            ? {
                ...deal,
                name: editName.trim() || deal.name,
                value: taskFieldSettings.value
                  ? editValue.trim() || deal.value
                  : deal.value,
                owner: ownerLabel.trim() || deal.owner,
                link: taskFieldSettings.link ? editLink.trim() : deal.link,
                comments: stripHtml(editDescription),
                descriptionHtml: editDescription,
                responsibleIds: editResponsibleIds,
                workerIds: editWorkerIds,
                watcherIds: editWatcherIds,
                categoryId: editCategoryIds[0] || "",
                categoryIds: editCategoryIds,
                priority: editPriority,
                dueDate: editDueDate,
                checklist: taskFieldSettings.checklist
                  ? editChecklist
                  : deal.checklist,
                labels: editLabels,
                estimate: editEstimate,
                timeSpent: editTimeSpent,
                attachments: editAttachments,
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
    if (sprintState.enabled && !findDealInColumns(editingDeal.id)) {
      setSprintState(prev => ({
        ...prev,
        backlog: prev.backlog.filter(deal => deal.id !== editingDeal.id),
      }));
      setEditingDeal(null);
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
      const index = column.deals.findIndex(deal => deal.id === editingDeal.id);
      if (index === -1) {
        return null;
      }
      return { deal: column.deals[index], columnId: column.id, index };
    }, null);
    if (removal) {
      setLastRemoved(removal);
      setSnackbarOpen(true);
    }
    setColumns(prev =>
      prev.map(column => ({
        ...column,
        deals: column.deals.filter(deal => deal.id !== editingDeal.id),
      }))
    );
    setEditingDeal(null);
  };

  const handleUndoRemove = () => {
    if (!lastRemoved) {
      return;
    }
    setColumns(prev =>
      prev.map(column => {
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
    const fallback = nextCategories[0]?.id || "";
    setCategories(nextCategories);
    setEditCategoryIds((prev: string[]) =>
      prev
        .map(categoryId => (categoryId === id ? fallback : categoryId))
        .filter(Boolean)
    );
    setColumns(prev =>
      prev.map(column => ({
        ...column,
        deals: column.deals.map(deal =>
          deal.categoryId === id ? { ...deal, categoryId: fallback } : deal
        ),
      }))
    );
    setSprintState(prev => ({
      ...prev,
      backlog: prev.backlog.map(deal =>
        deal.categoryId === id ? { ...deal, categoryId: fallback } : deal
      ),
    }));
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

  const addChecklistItem = () => {
    setEditChecklist(prev => [
      ...prev,
      { id: `chk-${nanoid(6)}`, text: "", done: false },
    ]);
  };

  const updateChecklistItem = (id: string, text: string) => {
    setEditChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, text } : item))
    );
  };

  const toggleChecklistItem = (id: string) => {
    setEditChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const removeChecklistItem = (id: string) => {
    setEditChecklist(prev => prev.filter(item => item.id !== id));
  };

  const addAttachmentField = () => {
    setEditAttachments(prev => [...prev, ""]);
  };

  const updateAttachmentField = (index: number, value: string) => {
    setEditAttachments(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const removeAttachmentField = (index: number) => {
    setEditAttachments(prev => prev.filter((_, idx) => idx !== index));
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
    setColumns(prev =>
      prev.map(column =>
        column.id === editingColumn.id
          ? { ...column, title: nextTitle, description: nextDescription }
          : column
      )
    );
    setEditingColumn(null);
  };

  const handleArchiveColumn = (columnId: string) => {
    setColumns(prev =>
      prev.map(column =>
        column.id === columnId ? { ...column, archived: true } : column
      )
    );
  };

  const handleRestoreColumn = (columnId: string) => {
    setColumns(prev =>
      prev.map(column =>
        column.id === columnId ? { ...column, archived: false } : column
      )
    );
  };

  const handleRemoveColumnById = (columnId: string) => {
    setColumns(prev => prev.filter(column => column.id !== columnId));
    if (editingColumn?.id === columnId) {
      setEditingColumn(null);
    }
  };

  const handleRequestRemoveColumn = (column: Column) => {
    setRemoveColumnTarget(column);
    setRemoveColumnOpen(true);
  };

  const handleConfirmRemoveColumn = () => {
    if (!removeColumnTarget) {
      return;
    }
    handleRemoveColumnById(removeColumnTarget.id);
    setRemoveColumnTarget(null);
    setRemoveColumnOpen(false);
  };

  const reorderActiveColumns = (
    prev: Column[],
    activeId: string,
    overId: string
  ) => {
    const activeList = prev.filter(column => !column.archived);
    const archivedList = prev.filter(column => column.archived);
    const oldIndex = activeList.findIndex(column => column.id === activeId);
    const newIndex = activeList.findIndex(column => column.id === overId);
    if (oldIndex === -1 || newIndex === -1) {
      return prev;
    }
    const nextActive = arrayMove(activeList, oldIndex, newIndex);
    return [...nextActive, ...archivedList];
  };

  const handleColumnReorder = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId || activeId === overId) {
      return;
    }
    setColumns(prev => reorderActiveColumns(prev, activeId, overId));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
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
      const activeColumnId = stripPrefix(activeId);
      const overColumnId = stripPrefix(overId);
      if (activeColumnId !== overColumnId) {
        setColumns(prev =>
          reorderActiveColumns(prev, activeColumnId, overColumnId)
        );
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
          deal => deal.id === overCardId
        );
      } else if (isColumnId(overId)) {
        destinationColumn = columns.find(
          column => column.id === stripPrefix(overId)
        );
        destinationIndex = destinationColumn
          ? destinationColumn.deals.length
          : 0;
      } else {
        return;
      }

      if (!destinationColumn) {
        return;
      }

      if (sourceColumn.id === destinationColumn.id) {
        const oldIndex = sourceColumn.deals.findIndex(
          deal => deal.id === activeCardId
        );
        if (oldIndex === -1 || oldIndex === destinationIndex) {
          return;
        }
        setColumns(prev =>
          prev.map(column =>
            column.id === sourceColumn.id
              ? {
                  ...column,
                  deals: arrayMove(column.deals, oldIndex, destinationIndex),
                }
              : column
          )
        );
        return;
      }

      const movingDeal = sourceColumn.deals.find(
        deal => deal.id === activeCardId
      );
      if (!movingDeal) {
        return;
      }

      setColumns(prev =>
        prev.map(column => {
          if (column.id === sourceColumn.id) {
            return {
              ...column,
              deals: column.deals.filter(deal => deal.id !== activeCardId),
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

  const handleDragEnd = (event: DragEndEvent) => {
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
          deal => deal.id === overCardId
        );
      } else if (isColumnId(overId)) {
        destinationColumn = columns.find(
          column => column.id === stripPrefix(overId)
        );
        destinationIndex = destinationColumn
          ? destinationColumn.deals.length
          : 0;
      } else {
        return;
      }

      if (!destinationColumn) {
        return;
      }

      if (sourceColumn.id === destinationColumn.id) {
        const oldIndex = sourceColumn.deals.findIndex(
          deal => deal.id === activeCardId
        );
        if (oldIndex === -1 || oldIndex === destinationIndex) {
          return;
        }
        setColumns(prev =>
          prev.map(column =>
            column.id === sourceColumn.id
              ? {
                  ...column,
                  deals: arrayMove(column.deals, oldIndex, destinationIndex),
                }
              : column
          )
        );
        return;
      }

      const movingDeal = sourceColumn.deals.find(
        deal => deal.id === activeCardId
      );
      if (!movingDeal) {
        return;
      }

      setColumns(prev =>
        prev.map(column => {
          if (column.id === sourceColumn.id) {
            return {
              ...column,
              deals: column.deals.filter(deal => deal.id !== activeCardId),
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
    if (!permissions.pipeline_edit_columns) {
      return;
    }
    const nextId = nanoid(6);
    const index = columns.length + 1;
    setColumns(prev => [
      ...prev,
      {
        id: `stage-${nextId}`,
        title: `Etapa ${index}`,
        deals: [],
        archived: false,
      },
    ]);
  };

  const handleAddDeal = (columnId: string) => {
    if (!permissions.pipeline_edit_tasks) {
      return;
    }
    const nextId = nanoid(6);
    const newDeal: Deal = {
      id: `deal-${nextId}`,
      name: "Nova tarefa",
      value: "R$ 0",
      owner: "Responsavel",
      responsibleIds: [],
      workerIds: [],
      watcherIds: [],
      descriptionHtml: "",
      categoryIds: [],
      categoryId: "",
      priority: "Media",
      dueDate: "",
      checklist: [],
      labels: [],
      estimate: "",
      timeSpent: "",
      attachments: [],
    };
    if (sprintState.enabled && !sprintState.activeSprint) {
      setSprintState(prev => ({
        ...prev,
        backlog: [newDeal, ...prev.backlog],
      }));
      setNewDealId(newDeal.id);
      handleEditOpen(newDeal);
      return;
    }
    setColumns(prev =>
      prev.map(column =>
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

  const handleToggleSprints = (enabled: boolean) => {
    if (!permissions.pipeline_edit_tasks) {
      return;
    }
    if (enabled) {
      if (sprintState.activeSprint) {
        setSprintState(prev => ({ ...prev, enabled: true }));
        return;
      }
      const now = new Date();
      const endDate = addSprintDuration(now, sprintState.duration);
      const nextSprint: SprintInfo = {
        id: `sprint-${Date.now()}`,
        name: `Sprint ${sprintState.history.length + 1}`,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
      };
      setSprintState(prev => ({
        ...prev,
        enabled: true,
        activeSprint: nextSprint,
      }));
      return;
    }
    setSprintState(prev => ({
      ...prev,
      enabled: false,
      activeSprint: null,
    }));
    if (sprintState.backlog.length) {
      setColumns(prev => {
        const targetIndex = prev.findIndex(column => !column.archived);
        if (targetIndex === -1) {
          return prev;
        }
        return prev.map((column, index) =>
          index === targetIndex
            ? { ...column, deals: [...sprintState.backlog, ...column.deals] }
            : column
        );
      });
      setSprintState(prev => ({ ...prev, backlog: [] }));
    }
  };

  const handleCreateSprint = () => {
    if (!permissions.pipeline_edit_tasks) {
      return;
    }
    if (sprintState.activeSprint) {
      return;
    }
    const now = new Date();
    const endDate = addSprintDuration(now, sprintState.duration);
    const nextSprint: SprintInfo = {
      id: `sprint-${Date.now()}`,
      name: `Sprint ${sprintState.history.length + 1}`,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
    };
    setSprintState(prev => ({
      ...prev,
      enabled: true,
      activeSprint: nextSprint,
    }));
  };

  const handleFinishSprint = () => {
    if (!permissions.pipeline_edit_tasks) {
      return;
    }
    if (!sprintState.activeSprint) {
      return;
    }
    const closedAt = new Date().toISOString();
    const snapshot = normalizeColumns(columns);
    setSprintState(prev => ({
      ...prev,
      activeSprint: null,
      history: [
        {
          ...prev.activeSprint!,
          closedAt,
          columns: snapshot,
        },
        ...prev.history,
      ],
      backlog: [...prev.backlog, ...columns.flatMap(column => column.deals)],
    }));
    setColumns(prev => prev.map(column => ({ ...column, deals: [] })));
  };

  const handleReopenSprint = (sprintId: string) => {
    if (!permissions.pipeline_edit_tasks) {
      return;
    }
    const target = sprintState.history.find(item => item.id === sprintId);
    if (!target) {
      return;
    }
    setSprintState(prev => ({
      ...prev,
      activeSprint: {
        id: target.id,
        name: target.name,
        startDate: target.startDate,
        endDate: target.endDate,
      },
      history: prev.history.filter(item => item.id !== sprintId),
      enabled: true,
    }));
    setColumns(target.columns.map(column => ({ ...column })));
  };

  const handleMoveToBacklog = (dealId: string) => {
    let removed: Deal | null = null;
    setColumns(prev =>
      prev.map(column => {
        const nextDeals = column.deals.filter(deal => {
          if (deal.id === dealId) {
            removed = deal;
            return false;
          }
          return true;
        });
        return nextDeals.length === column.deals.length
          ? column
          : { ...column, deals: nextDeals };
      })
    );
    if (removed) {
      setSprintState(prev => ({
        ...prev,
        backlog: [removed as Deal, ...prev.backlog],
      }));
    }
  };

  const handleMoveToSprint = (dealId: string) => {
    if (!sprintState.activeSprint) {
      return;
    }
    let moved: Deal | null = null;
    setSprintState(prev => ({
      ...prev,
      backlog: prev.backlog.filter(deal => {
        if (deal.id === dealId) {
          moved = deal;
          return false;
        }
        return true;
      }),
    }));
    if (!moved) {
      return;
    }
    setColumns(prev => {
      const targetIndex = prev.findIndex(column => !column.archived);
      if (targetIndex === -1) {
        return prev;
      }
      return prev.map((column, index) =>
        index === targetIndex
          ? { ...column, deals: [moved as Deal, ...column.deals] }
          : column
      );
    });
  };

  const handleScrollPointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
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

  const handleScrollPointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
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

  const pageActions = useMemo(
    () => (
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
        <Box
          sx={{
            flex: { xs: '1 1 auto', md: '3 1 520px' },
            width: { xs: '100%', md: 'auto' },
            minWidth: { xs: '100%', md: 440 },
          }}
        >
          <SearchField
            fullWidth
            placeholder="Buscar tasks"
            value={taskQuery}
            onChange={e => setTaskQuery(e.target.value)}
            onClear={() => setTaskQuery("")}
            ariaLabel="Buscar tasks"
          />
        </Box>
        <Box
          sx={{
            flex: { xs: '1 1 auto', md: '1 1 280px' },
            width: { xs: '100%', md: 'auto' },
            minWidth: { xs: '100%', md: 240 },
          }}
        >
          <CategoryFilter
            categories={categories}
            selectedIds={categoryFilters}
            onChange={setCategoryFilters}
            width="100%"
          />
        </Box>
        <SettingsIconButton
          onClick={() => setTaskFieldSettingsOpen(true)}
          disabled={!permissions.pipeline_edit_tasks}
        />
      </Stack>
    ),
    [taskQuery, categories, categoryFilters, permissions.pipeline_edit_tasks]
  );

  return (
    <PageContainer actionsSlot={pageActions}>
      <Stack spacing={3} sx={{ flex: 1, minHeight: 0 }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          autoScroll
        >
          {normalizedQuery && visibleColumns.length === 0 ? (
            <AppCard
              elevation={0}
              sx={{
                p: 3,
                border: 1,
                borderColor: "divider",
                backgroundColor: "background.paper",
                mb: 2,
              }}
            >
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Nenhuma tarefa encontrada.
              </Typography>
            </AppCard>
          ) : null}
          <SortableContext
            items={columnItems}
            strategy={horizontalListSortingStrategy}
          >
            <Box
              sx={{
                position: "relative",
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <IconButton
                onClick={() => scrollColumnsBy("left")}
                sx={theme => ({
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  transform: "translate(-35%, -50%)",
                  zIndex: 2,
                  width: 48,
                  height: 48,
                  borderRadius: theme.shape.borderRadius,
                  backgroundColor: "transparent",
                  border: "none",
                  color: "text.primary",
                  "&:hover": {
                    backgroundColor: "transparent",
                    color: "primary.main",
                  },
                  "&:active": { backgroundColor: "transparent" },
                })}
                aria-label="Voltar colunas"
              >
                <ChevronLeftRoundedIcon fontSize="large" />
              </IconButton>

              <IconButton
                onClick={() => scrollColumnsBy("right")}
                sx={theme => ({
                  position: "absolute",
                  top: "50%",
                  right: 0,
                  transform: "translate(35%, -50%)",
                  zIndex: 2,
                  width: 48,
                  height: 48,
                  borderRadius: theme.shape.borderRadius,
                  backgroundColor: "transparent",
                  border: "none",
                  color: "text.primary",
                  "&:hover": {
                    backgroundColor: "transparent",
                    color: "primary.main",
                  },
                  "&:active": { backgroundColor: "transparent" },
                })}
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
                sx={theme => ({
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflowX: "auto",
                  pb: 4,
                  cursor: "grab",
                  "&:active": { cursor: "grabbing" },
                  scrollbarWidth: "thin",
                  scrollbarColor: `${theme.palette.divider} transparent`,
                  "&::-webkit-scrollbar": {
                    height: 10,
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "transparent",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: theme.palette.divider,
                    
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    backgroundColor: theme.palette.text.secondary,
                  },
                })}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="stretch"
                  sx={{ width: "max-content", minWidth: "100%", minHeight: "100%" }}
                >
                  {visibleColumns.map(column => (
                    <SortableColumn
                      key={column.id}
                      column={column}
                      onEdit={handleViewOpen}
                      onEditColumn={handleColumnEditOpen}
                      onAddDeal={handleAddDeal}
                      filteredDeals={filterDealsByQuery(
                        column,
                        normalizedQuery
                      )}
                      categoryMap={categoryMap}
                      getDealOwnerLabel={getDealOwnerLabel}
                      showValue={taskFieldSettings.value}
                      canEditTasks={canEditTasksOnBoard}
                      canEditColumns={permissions.pipeline_edit_columns}
                    />
                  ))}
                  {permissions.pipeline_edit_columns ? (
                    <AppCard
                      elevation={0}
                      onClick={handleAddColumn}
                      data-draggable
                      sx={theme => ({
                        p: 2.5,
                        minWidth: 280,
                        border: "1px dashed",
                        borderColor: "divider",
                        backgroundColor: "background.paper",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: theme.transitions.create(
                          ["background-color", "border-color"],
                          { duration: theme.transitions.duration.short }
                        ),
                        "&:hover": { backgroundColor: "action.hover" },
                        "&:active": { backgroundColor: "action.selected" },
                      })}
                    >
                      <Stack spacing={1} alignItems="center">
                        <AddRoundedIcon />
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          Adicionar coluna
                        </Typography>
                      </Stack>
                    </AppCard>
                  ) : null}
                </Stack>
              </Box>
            </Box>
          </SortableContext>
          <DragOverlay>
            {activeDragId
              ? isColumnId(activeDragId)
                ? (() => {
                    const column = findColumn(stripPrefix(activeDragId));
                    if (!column) {
                      return null;
                    }
                    return (
                      <AppCard
                        elevation={0}
                        sx={theme => ({
                          p: 2.5,
                          minWidth: 280,
                          
                          border: 1,
                          borderColor: "divider",
                          backgroundColor: "background.paper",
                          boxShadow: theme.shadows[2],
                        })}
                      >
                        <Stack spacing={2}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 700 }}
                            >
                              {column.title}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary", fontWeight: 600 }}
                            >
                              {column.deals.length}
                            </Typography>
                          </Box>
                          <Divider />
                          <Stack spacing={1.5}>
                            {column.deals.slice(0, 3).map(deal => (
                              <Box
                                key={deal.id}
                                sx={theme => ({
                                  p: 2,
                                  border: 1,
                                  borderColor: "divider",
                                  borderRadius: theme.shape.borderRadius,
                                  backgroundColor: "background.paper",
                                })}
                              >
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {deal.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "text.secondary" }}
                                >
                                  {getDealOwnerLabel(deal)}
                                </Typography>
                              </Box>
                            ))}
                            {column.deals.length > 3 ? (
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                +{column.deals.length - 3} tasks
                              </Typography>
                            ) : null}
                          </Stack>
                        </Stack>
                      </AppCard>
                    );
                  })()
                : isCardId(activeDragId)
                  ? (() => {
                      const deal = findDeal(stripPrefix(activeDragId));
                      if (!deal) {
                        return null;
                      }
                      return (
                        <Box
                          sx={theme => ({
                            p: 2,
                            border: 1,
                            borderColor: "divider",
                            borderRadius: theme.shape.borderRadius,
                            backgroundColor: "background.paper",
                            boxShadow: theme.shadows[2],
                          })}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                          >
                            {deal.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            {getDealOwnerLabel(deal)}
                          </Typography>
                          {taskFieldSettings.value ? (
                            <Typography
                              variant="body2"
                              sx={{ mt: 0.5, fontWeight: 600 }}
                            >
                              {deal.value}
                            </Typography>
                          ) : null}
                        </Box>
                      );
                    })()
                  : null
              : null}
          </DragOverlay>
        </DndContext>
        {sprintState.enabled ? (
          <Stack spacing={2}>
            <AppCard
              elevation={0}
              variant="outlined"
              sx={{
                p: 2.5,
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
              >
                <Stack spacing={0.5}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Sprint ativa
                  </Typography>
                  {sprintState.activeSprint ? (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      {sprintState.activeSprint.name} -{" "}
                      {new Date(
                        sprintState.activeSprint.startDate
                      ).toLocaleDateString("pt-BR")}{" "}
                      -{" "}
                      {new Date(
                        sprintState.activeSprint.endDate
                      ).toLocaleDateString("pt-BR")}
                    </Typography>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Nenhuma sprint ativa.
                    </Typography>
                  )}
                </Stack>
                <Stack direction="row" spacing={2}>
                  {sprintState.activeSprint ? (
                    <Button
                      variant="outlined"
                      onClick={handleFinishSprint}
                      disabled={!permissions.pipeline_edit_tasks}
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      Finalizar sprint
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={handleCreateSprint}
                      disabled={!permissions.pipeline_edit_tasks}
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      Criar sprint
                    </Button>
                  )}
                </Stack>
              </Stack>
            </AppCard>

            <AppCard
              elevation={0}
              variant="outlined"
              sx={{
                p: 2.5,
              }}
            >
              <Stack spacing={2}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Backlog
                </Typography>
                {filteredBacklog.length === 0 ? (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Nenhuma tarefa no backlog.
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(260px, 1fr))",
                      gap: 2,
                    }}
                  >
                    {filteredBacklog.map(deal => (
                      <AppCard
                        key={deal.id}
                        elevation={0}
                        onClick={() => handleViewOpen(deal)}
                        sx={theme => ({
                          p: 2,
                          cursor: "pointer",
                          ...interactiveCardSx(theme),
                        })}
                      >
                        <Stack spacing={2}>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 600 }}
                            >
                              {deal.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary" }}
                            >
                              {getDealOwnerLabel(deal)}
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            onClick={event => {
                              event.stopPropagation();
                              handleMoveToSprint(deal.id);
                            }}
                            disabled={
                              !sprintState.activeSprint ||
                              !permissions.pipeline_edit_tasks
                            }
                            sx={{
                              textTransform: "none",
                              fontWeight: 600,
                              alignSelf: "flex-start",
                            }}
                          >
                            Adicionar a sprint
                          </Button>
                        </Stack>
                      </AppCard>
                    ))}
                  </Box>
                )}
              </Stack>
            </AppCard>
          </Stack>
        ) : null}

        <Dialog
          open={Boolean(viewingDeal)}
          onClose={handleViewClose}
          maxWidth={false}
          fullWidth
          PaperProps={{
            sx: {
              m: { xs: 2, sm: 3 },
              width: { xs: "calc(100% - 32px)", sm: "80%", md: "70%" },
              maxWidth: { sm: "80%", md: "70%", xl: 960 },
            },
          }}
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
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 0 }}>
                  <TextField
                    value={viewingDeal?.name || ""}
                    onChange={event => handleUpdateViewingDealName(event.target.value)}
                    size="small"
                    placeholder="Título"
                    inputProps={{
                      "aria-label": "Título da tarefa",
                      size: Math.min(48, Math.max(6, (viewingDeal?.name || "").length || 6)),
                    }}
                    sx={{
                      width: "auto",
                      flex: "0 1 auto",
                      minWidth: 0,
                      maxWidth: { xs: "60vw", sm: "62vw", md: "65%" },
                      "& .MuiOutlinedInput-notchedOutline": { border: 0 },
                      "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": { border: 0 },
                      "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { border: 0 },
                      "& .MuiInputBase-input": {
                        typography: "h6",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      },
                    }}
                  />
                  {viewingDeal ? (
                    <Tooltip title="Copiar link" placement="top">
                      <IconButton
                        size="small"
                        onClick={() => handleCopyLink(viewingDeal.id)}
                        sx={theme => ({
                          color: "text.secondary",
                          border: 1,
                          borderColor: "divider",
                          borderRadius: theme.shape.borderRadius,
                        })}
                      >
                        <LinkRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                </Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", whiteSpace: "nowrap" }}
                  >
                    {formatDealDateLabel(viewingDeal)}
                  </Typography>
                  <IconButton
                    onClick={handleViewClose}
                    sx={{ color: "text.secondary" }}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
              {taskFieldSettings.value ? (
                <Stack spacing={0.5}>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "text.secondary" }}
                  >
                    Valor
                  </Typography>
                  <Typography variant="body1">
                    {viewingDeal?.value || "-"}
                  </Typography>
                </Stack>
              ) : null}
              <Stack spacing={0.5}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "text.secondary" }}
                >
                  Responsaveis
                </Typography>
                <Typography variant="body1">
                  {viewingDeal
                    ? getPersonLabels(viewingDeal.responsibleIds).join(", ") ||
                      viewingDeal.owner
                    : "-"}
                </Typography>
              </Stack>
              <Stack spacing={0.5}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "text.secondary" }}
                >
                  Pessoas na tarefa
                </Typography>
                <Typography variant="body1">
                  {viewingDeal
                    ? getPersonLabels(viewingDeal.workerIds).join(", ") || "-"
                    : "-"}
                </Typography>
              </Stack>
              {taskFieldSettings.link ? (
                <Stack spacing={0.5}>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "text.secondary" }}
                  >
                    Link
                  </Typography>
                  <Typography variant="body1">
                    {viewingDeal?.link || "-"}
                  </Typography>
                </Stack>
              ) : null}
              <Stack spacing={0.5}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "text.secondary" }}
                >
                  Categorias
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {viewingDeal?.categoryIds?.length ? (
                    viewingDeal.categoryIds.map(id => {
                      const cat = categoryMap.get(id);
                      if (!cat) {
                        return null;
                      }
                      return (
                        <CategoryChip
                          key={id}
                          label={cat.name}
                          categoryColor={cat.color}
                        />
                      );
                    })
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Sem categoria
                    </Typography>
                  )}
                </Stack>
              </Stack>
              <Stack spacing={0.5}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "text.secondary" }}
                >
                  Descrição
                </Typography>
                <Box
                  sx={theme => ({
                    border: 1,
                    borderColor: "divider",
                    borderRadius: theme.shape.borderRadius,
                    backgroundColor: "background.paper",
                    p: 2,
                    minHeight: 120,
                  })}
                  dangerouslySetInnerHTML={{
                    __html:
                      viewingDeal?.descriptionHtml ||
                      viewingDeal?.comments ||
                      "",
                  }}
                />
              </Stack>

              {taskFieldSettings.checklist ? (
                <CardSection size="xs">
                  <Stack spacing={1.25}>
                    <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                      Subtarefas
                    </Typography>

                    <Stack spacing={0.5}>
                      {(viewingDeal?.checklist || []).map(item => (
                        <Stack
                          key={item.id}
                          direction={{ xs: "column", sm: "row" }}
                          spacing={0.75}
                          alignItems={{ xs: "stretch", sm: "center" }}
                          sx={{ width: "100%",  p: 0.5 }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                            <Checkbox
                              checked={item.done}
                              onChange={event =>
                                handleToggleViewingChecklistDone(
                                  item.id,
                                  event.target.checked
                                )
                              }
                              size="small"
                              sx={{ p: 0.5 }}
                            />
                            <TextField
                              value={item.text}
                              onChange={event =>
                                handleUpdateViewingChecklistText(
                                  item.id,
                                  event.target.value
                                )
                              }
                              fullWidth
                              size="small"
                              placeholder="Subtarefa"
                              sx={{
                                "& .MuiOutlinedInput-notchedOutline": { border: 0 },
                                "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": { border: 0 },
                                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { border: 0 },
                              }}
                            />
                          </Stack>
                          <IconButton
                            onClick={() => handleRemoveViewingChecklistItem(item.id)}
                            size="small"
                            sx={{ color: "text.secondary", p: 0.5, alignSelf: { xs: "flex-end", sm: "center" } }}
                            aria-label="Remover subtarefa"
                          >
                            <CloseRoundedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}

                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={0.75}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        sx={{ width: "100%",  p: 0.5 }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                          <Checkbox size="small" disabled sx={{ visibility: "hidden", p: 0.5 }} />
                          <TextField
                            inputRef={viewingChecklistDraftInputRef}
                            value={viewingChecklistDraftText}
                            onChange={event => setViewingChecklistDraftText(event.target.value)}
                            onKeyDown={event => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                handleAddViewingChecklistItem();
                              }
                            }}
                            fullWidth
                            size="small"
                            placeholder="Escreva uma subtarefa e aperte Enter"
                            sx={{
                              "& .MuiOutlinedInput-notchedOutline": { border: 0 },
                              "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": { border: 0 },
                              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { border: 0 },
                            }}
                          />
                        </Stack>
                        <IconButton
                          onClick={() => handleAddViewingChecklistItem()}
                          size="small"
                          sx={{ p: 0.5, alignSelf: { xs: "flex-end", sm: "center" } }}
                          aria-label="Adicionar subtarefa"
                        >
                          <AddRoundedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Stack>
                </CardSection>
              ) : null}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="flex-end"
              >
                {permissions.pipeline_edit_tasks ? (
                  <Button
                    color="error"
                    variant="outlined"
                    onClick={() => setRemoveDealOpen(true)}
                    sx={{ width: { xs: "100%", sm: "auto" } }}
                  >
                    Remover
                  </Button>
                ) : null}
                {permissions.pipeline_edit_tasks ? (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      if (!viewingDeal) {
                        return;
                      }
                      handleRequestDuplicateDeal(viewingDeal);
                    }}
                    startIcon={<FileCopyRoundedIcon fontSize="small" />}
                    sx={{ width: { xs: "100%", sm: "auto" } }}
                  >
                    Duplicar
                  </Button>
                ) : null}
                {permissions.pipeline_edit_tasks ? (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      handleOpenEditFromView();
                    }}
                    sx={{ width: { xs: "100%", sm: "auto" } }}
                  >
                    Editar
                  </Button>
                ) : null}
                <Button
                  variant="contained"
                  onClick={handleViewClose}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Fechar
                </Button>
              </Stack>
            </Stack>
          </DialogContent>
        </Dialog>
        <SettingsDialog
          open={taskFieldSettingsOpen}
          onClose={() => {
            setTaskFieldSettingsOpen(false);
            cancelEditCategory();
            setConfigAccordion(false);
          }}
          title="Configurações"
          maxWidth="sm"
          onRestoreDefaults={handleRestorePipelineDefaults}
          sections={[
            {
              key: "sprints",
              title: "Sprints e backlog",
              content: (
                <Stack spacing={2}>
                  <Box
                    sx={theme => ({
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      cursor: "pointer",
                      ...interactiveCardSx(theme),
                    })}
                    onClick={() => handleToggleSprints(!sprintState.enabled)}
                  >
                    <Typography variant="subtitle2">
                      Usar sprints e backlog
                    </Typography>
                    <ToggleCheckbox
                      checked={sprintState.enabled}
                      onChange={event =>
                        handleToggleSprints(event.target.checked)
                      }
                      onClick={event => event.stopPropagation()}
                      disabled={!permissions.pipeline_edit_tasks}
                    />
                  </Box>
                  <TextField
                    select
                    label="Duração da sprint"
                    value={sprintState.duration}
                    onChange={event =>
                      setSprintState(prev => ({
                        ...prev,
                        duration: event.target.value as SprintState["duration"],
                      }))
                    }
                    disabled={
                      !sprintState.enabled || !permissions.pipeline_edit_tasks
                    }
                  >
                    <MenuItem value="1w">1 semana</MenuItem>
                    <MenuItem value="2w">2 semanas</MenuItem>
                    <MenuItem value="1m">1 mes</MenuItem>
                  </TextField>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      onClick={handleCreateSprint}
                      disabled={
                        !sprintState.enabled ||
                        !!sprintState.activeSprint ||
                        !permissions.pipeline_edit_tasks
                      }
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      Criar sprint
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleFinishSprint}
                      disabled={
                        !sprintState.enabled ||
                        !sprintState.activeSprint ||
                        !permissions.pipeline_edit_tasks
                      }
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      Finalizar sprint
                    </Button>
                  </Stack>
                  <Stack spacing={1.5}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "text.secondary" }}
                    >
                      Historico de sprints
                    </Typography>
                    {sprintState.history.length === 0 ? (
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        Nenhuma sprint finalizada.
                      </Typography>
                    ) : (
                      <Stack spacing={1}>
                        {sprintState.history.map(sprint => (
                          <CardSection size="compact" key={sprint.id}>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={2}
                              alignItems="center"
                              justifyContent="space-between"
                            >
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {sprint.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "text.secondary" }}
                                >
                                  {new Date(
                                    sprint.startDate
                                  ).toLocaleDateString("pt-BR")}{" "}
                                  -{" "}
                                  {new Date(sprint.endDate).toLocaleDateString(
                                    "pt-BR"
                                  )}
                                </Typography>
                              </Box>
                              <Button
                                variant="outlined"
                                onClick={() => handleReopenSprint(sprint.id)}
                                sx={{
                                  textTransform: "none",
                                  fontWeight: 600,
                                }}
                                disabled={!permissions.pipeline_edit_tasks}
                              >
                                Reabrir sprint
                              </Button>
                            </Stack>
                          </CardSection>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </Stack>
              ),
            },
            {
              key: "fields",
              title: "Campos da tarefa",
              content: (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 1.5,
                  }}
                >
                  {[
                    { key: "value", label: "Mostrar valor" },
                    { key: "link", label: "Mostrar link" },
                    { key: "description", label: "Mostrar descricao" },
                    { key: "priority", label: "Prioridade" },
                    { key: "dueDate", label: "Data de entrega" },
                    { key: "checklist", label: "Checklist" },
                    { key: "labels", label: "Labels" },
                    { key: "estimate", label: "Estimativa" },
                    { key: "timeSpent", label: "Tempo gasto" },
                    { key: "watchers", label: "Observadores" },
                    { key: "attachments", label: "Anexos" },
                    { key: "sprintInfo", label: "Sprint" },
                  ].map(field => (
                    <Box
                      key={field.key}
                      sx={theme => ({
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 1.5,
                        borderColor: "divider",
                        cursor: "pointer",
                        ...interactiveCardSx(theme),
                      })}
                      onClick={() =>
                        setTaskFieldSettings(prev => ({
                          ...prev,
                          [field.key]:
                            !prev[field.key as keyof typeof taskFieldSettings],
                        }))
                      }
                    >
                      <Typography variant="subtitle2">{field.label}</Typography>
                      <ToggleCheckbox
                        checked={Boolean(
                          taskFieldSettings[
                            field.key as keyof typeof taskFieldSettings
                          ]
                        )}
                        onChange={event =>
                          setTaskFieldSettings(prev => ({
                            ...prev,
                            [field.key]: event.target.checked,
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
              key: "categories",
              title: "Categorias",
              content: (
                <Stack spacing={1.5}>
                  {editingCategoryId ? (
                    <CardSection size="xs">
                      <Stack spacing={1.5}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
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
                              sx={theme => ({
                                width: 28,
                                height: 28,
                                
                                backgroundColor: color,
                                borderStyle: "solid",
                                borderWidth:
                                  editingCategoryColor === color ? 2 : 1,
                                borderColor: "divider",
                                cursor: "pointer",
                              })}
                            />
                          ))}
                        </Stack>
                        <Stack
                          direction="row"
                          spacing={2}
                          justifyContent="flex-end"
                        >
                          <Button
                            variant="outlined"
                            onClick={cancelEditCategory}
                          >
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
                      <CategoryChip
                        key={cat.id}
                        label={cat.name}
                        onClick={() => startEditCategory(cat)}
                        onDelete={() => handleRemoveCategory(cat.id)}
                        categoryColor={cat.color}
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
                              sx={theme => ({
                                width: 28,
                                height: 28,
                                
                                backgroundColor: color,
                                borderStyle: "solid",
                                borderWidth: newCategoryColor === color ? 2 : 1,
                                borderColor: "divider",
                                cursor: "pointer",
                              })}
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
              key: "columns",
              title: "Colunas",
              content: (
                <Stack spacing={2}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Renomeie, reorganize ou arquive colunas.
                  </Typography>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragEnd={handleColumnReorder}
                  >
                    <SortableContext
                      items={activeColumns.map(column => column.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <Stack spacing={1.5}>
                        {activeColumns.map(column => (
                          <SortableColumnRow
                            key={column.id}
                            column={column}
                            onRename={nextTitle => {
                              setColumns(prev =>
                                prev.map(item =>
                                  item.id === column.id
                                    ? { ...item, title: nextTitle }
                                    : item
                                )
                              );
                            }}
                            onArchive={() => handleArchiveColumn(column.id)}
                            onRemove={() => handleRequestRemoveColumn(column)}
                          />
                        ))}
                      </Stack>
                    </SortableContext>
                  </DndContext>
                  <AppAccordion
                    elevation={0}
                    summary={
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Colunas arquivadas ({archivedColumns.length})
                      </Typography>
                    }
                    sx={theme => ({
                      "&:before": { display: "none" },
                      ...interactiveCardSx(theme),
                      "&.Mui-expanded": { marginTop: 1.5 },
                      "& .MuiAccordionSummary-root": {
                        minHeight: 48,
                        "&.Mui-expanded": { minHeight: 48 },
                      },
                      "& .MuiAccordionSummary-content": { my: 0 },
                    })}
                  >
                    {archivedColumns.length === 0 ? (
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        Nenhuma coluna arquivada.
                      </Typography>
                    ) : (
                      <Stack spacing={1.5}>
                        {archivedColumns.map(column => (
                          <CardSection size="xs" key={column.id}>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={2}
                              alignItems="center"
                            >
                              <Typography variant="subtitle2" sx={{ flex: 1 }}>
                                {column.title}
                              </Typography>
                              <Stack direction="row" spacing={1}>
                                <Tooltip title="Restaurar" placement="top">
                                  <IconButton
                                    onClick={() =>
                                      handleRestoreColumn(column.id)
                                    }
                                    sx={{
                                      border: 1,
                                      borderColor: "divider",
                                    }}
                                    aria-label={`Restaurar ${column.title}`}
                                  >
                                    <RestoreFromTrashRoundedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Remover" placement="top">
                                  <IconButton
                                    onClick={() =>
                                      handleRequestRemoveColumn(column)
                                    }
                                    sx={{
                                      border: 1,
                                      borderColor: "divider",
                                    }}
                                    aria-label={`Remover ${column.title}`}
                                  >
                                    <DeleteRoundedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Stack>
                          </CardSection>
                        ))}
                      </Stack>
                    )}
                  </AppAccordion>
                </Stack>
              ),
            },
          ]}
        />
        <Dialog
          open={removeDealOpen}
          onClose={() => setRemoveDealOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              m: { xs: 2, sm: 3 },
              width: { xs: "calc(100% - 32px)", sm: "auto" },
            },
          }}
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
                <Typography variant="h6">Remover tarefa</Typography>
                <IconButton
                  onClick={() => setRemoveDealOpen(false)}
                  sx={{ color: "text.secondary" }}
                >
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Você confirma a exclusão desta tarefa? Essa ação não pode ser
                desfeita.
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="flex-end"
              >
                <Button
                  variant="outlined"
                  onClick={() => setRemoveDealOpen(false)}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Cancelar
                </Button>
                <Button
                  color="error"
                  variant="contained"
                  onClick={() => {
                    if (!viewingDeal) {
                      return;
                    }
                    setColumns(prev =>
                      prev.map(column => ({
                        ...column,
                        deals: column.deals.filter(
                          deal => deal.id !== viewingDeal.id
                        ),
                      }))
                    );
                    setViewingDeal(null);
                    setRemoveDealOpen(false);
                  }}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Remover
                </Button>
              </Stack>
            </Stack>
          </DialogContent>
        </Dialog>
        <Dialog
          open={duplicateDealOpen}
          onClose={handleCloseDuplicateDeal}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              m: { xs: 2, sm: 3 },
              width: { xs: "calc(100% - 32px)", sm: "auto" },
            },
          }}
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
                <Typography variant="h6">Duplicar tarefa</Typography>
                <IconButton
                  onClick={handleCloseDuplicateDeal}
                  sx={{ color: "text.secondary" }}
                >
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Você confirma a duplicação desta tarefa?
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="flex-end"
              >
                <Button
                  variant="outlined"
                  onClick={handleCloseDuplicateDeal}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleConfirmDuplicateDeal}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Duplicar
                </Button>
              </Stack>
            </Stack>
          </DialogContent>
        </Dialog>
        <Dialog
          open={removeColumnOpen}
          onClose={() => {
            setRemoveColumnOpen(false);
            setRemoveColumnTarget(null);
          }}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              m: { xs: 2, sm: 3 },
              width: { xs: "calc(100% - 32px)", sm: "auto" },
            },
          }}
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
                <Typography variant="h6">Remover coluna</Typography>
                <IconButton
                  onClick={() => {
                    setRemoveColumnOpen(false);
                    setRemoveColumnTarget(null);
                  }}
                  sx={{ color: "text.secondary" }}
                >
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Você confirma a exclusão da coluna{" "}
                {removeColumnTarget?.title || ""}? Todas as tarefas nela serao
                removidas.
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="flex-end"
              >
                <Button
                  variant="outlined"
                  onClick={() => {
                    setRemoveColumnOpen(false);
                    setRemoveColumnTarget(null);
                  }}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Cancelar
                </Button>
                <Button
                  color="error"
                  variant="contained"
                  onClick={handleConfirmRemoveColumn}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Remover
                </Button>
              </Stack>
            </Stack>
          </DialogContent>
        </Dialog>
        <Dialog
          open={Boolean(editingDeal)}
          onClose={handleEditClose}
          maxWidth={false}
          fullWidth
          PaperProps={{
            sx: {
              m: { xs: 2, sm: 3 },
              width: { xs: "calc(100% - 32px)", sm: "80%", md: "70%" },
              maxWidth: { sm: "80%", md: "70%", xl: 960 },
            },
          }}
        >
          <DialogContent>
            <Stack spacing={2.5}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="h6">Editar tarefa</Typography>
                <IconButton onClick={handleEditClose} sx={{ color: "text.secondary" }}>
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Box>
              <TextField
                label="Titulo"
                fullWidth
                value={editName}
                onChange={event => setEditName(event.target.value)}
              />
              {taskFieldSettings.value ? (
                <TextField
                  label="Valor"
                  fullWidth
                  value={editValue}
                  onChange={event => setEditValue(event.target.value)}
                />
              ) : null}
              <Autocomplete
                multiple
                options={personOptions}
                value={selectPersonsByIds(editResponsibleIds)}
                onChange={(_, value) =>
                  setEditResponsibleIds(value.map(person => person.id))
                }
                getOptionLabel={option => formatPersonLabel(option)}
                noOptionsText="Nenhum usuario"
                renderInput={params => (
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
                onChange={(_, value) =>
                  setEditWorkerIds(value.map(person => person.id))
                }
                getOptionLabel={option => formatPersonLabel(option)}
                noOptionsText="Nenhum usuario"
                renderInput={params => (
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
                  onChange={event => setEditLink(event.target.value)}
                />
              ) : null}
              <Autocomplete
                multiple
                options={categories}
                value={categories.filter(cat =>
                  editCategoryIds.includes(cat.id)
                )}
                onChange={(_, value) =>
                  setEditCategoryIds(value.map(cat => cat.id))
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
                    <CategoryChip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={option.name}
                      categoryColor={option.color}
                    />
                  ))
                }
              />
              <Stack spacing={1}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "text.secondary" }}
                >
                  Descrição
                </Typography>
                <RichTextEditor
                  value={editDescription}
                  onChange={setEditDescription}
                  placeholder="Escreva a descricao da tarefa..."
                />
              </Stack>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="flex-end"
              >
                <Button
                  color="error"
                  variant="outlined"
                  onClick={handleDealRemove}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Remover
                </Button>
                <Button variant="outlined" onClick={handleBackToViewFromEdit}>
                  Voltar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleEditSave}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Salvar
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
                onClick={handleUndoRestorePipelineDefaults}
              >
                Reverter
              </Button>
            }
            sx={{ width: "100%" }}
          >
            Configurações restauradas.
          </Alert>
        </Snackbar>

        <Dialog
          open={Boolean(editingColumn)}
          onClose={handleColumnEditClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              m: { xs: 2, sm: 3 },
              width: { xs: "calc(100% - 32px)", sm: "auto" },
            },
          }}
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
                onChange={event => setEditColumnTitle(event.target.value)}
              />
              <TextField
                label="Descrição"
                fullWidth
                multiline
                minRows={3}
                value={editColumnDescription}
                onChange={event => setEditColumnDescription(event.target.value)}
              />
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="flex-end"
              >
                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => {
                    if (editingColumn) {
                      handleRequestRemoveColumn(editingColumn);
                    }
                  }}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
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
      </Stack>
    </PageContainer>
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
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
    <AppCard
      ref={setNodeRef}
      elevation={0}
      variant="outlined"
      sx={{
        p: 2.5,
        flex: "0 0 280px",
        minWidth: 280,
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      style={style}
    >
      <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "space-between",
            cursor: canEditColumns ? "grab" : "default",
            touchAction: canEditColumns ? "none" : "auto",
          }}
          {...(canEditColumns
            ? { ...attributes, ...listeners, "data-draggable": true }
            : {})}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
            }}
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
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontWeight: 600 }}
            >
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
        <Divider />
        <SortableContext
          items={filteredDeals.map(deal => cardDragId(deal.id))}
          strategy={verticalListSortingStrategy}
        >
          <Stack spacing={1.5} sx={{ flex: 1, minHeight: 0 }}>
            {filteredDeals.map(deal => (
              <SortableDeal
                key={deal.id}
                deal={deal}
                onEdit={onEdit}
                ownerLabel={getDealOwnerLabel(deal)}
                showValue={showValue}
                canEditTasks={canEditTasks}
              />
            ))}
          </Stack>
        </SortableContext>
      </Stack>
    </AppCard>
  );
}

function SortableDeal({
  deal,
  onEdit,
  ownerLabel,
  showValue,
  canEditTasks,
}: {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  ownerLabel: string;
  showValue: boolean;
  canEditTasks: boolean;
}) {
  const dragId = cardDragId(deal.id);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
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
      sx={theme => ({
        p: 2,
        border: 1,
        borderColor: "divider",
        borderRadius: theme.shape.borderRadius,
        backgroundColor: "background.paper",
        cursor: canEditTasks ? "grab" : "pointer",
        touchAction: canEditTasks ? "none" : "auto",
      })}
      style={style}
      {...(canEditTasks ? { ...attributes, ...listeners } : {})}
      onClick={() => onEdit(deal)}
      data-draggable
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
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
  onArchive,
  onRemove,
}: {
  column: Column;
  onRename: (nextTitle: string) => void;
  onArchive: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
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
    <AppCard
      ref={setNodeRef}
      elevation={0}
      sx={{
        p: 2,
        border: 1,
        borderColor: "divider",
        backgroundColor: "background.paper",
      }}
      style={style}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems="center"
      >
        <TextField
          label="Nome da coluna"
          fullWidth
          value={column.title}
          onChange={event => onRename(event.target.value)}
        />
        <Stack direction="row" spacing={1}>
          <Tooltip title="Arquivar" placement="top">
            <IconButton
              onClick={onArchive}
              sx={theme => ({
                border: 1,
                borderColor: "divider",
                borderRadius: theme.shape.borderRadius,
              })}
              aria-label={`Arquivar ${column.title}`}
            >
              <ArchiveRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remover" placement="top">
            <IconButton
              onClick={onRemove}
              sx={theme => ({
                border: 1,
                borderColor: "divider",
                borderRadius: theme.shape.borderRadius,
              })}
              aria-label={`Remover ${column.title}`}
            >
              <DeleteRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton
            {...attributes}
            {...listeners}
            sx={theme => ({
              border: 1,
              borderColor: "divider",
              borderRadius: theme.shape.borderRadius,
              cursor: "grab",
            })}
            aria-label={`Arrastar ${column.title}`}
          >
            <DragIndicatorRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
    </AppCard>
  );
}
