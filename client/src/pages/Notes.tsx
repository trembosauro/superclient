import { useEffect, useMemo, useRef, useState } from "react";
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
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import FormatBoldRoundedIcon from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRoundedIcon from "@mui/icons-material/FormatItalicRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import LooksOneRoundedIcon from "@mui/icons-material/LooksOneRounded";
import LooksTwoRoundedIcon from "@mui/icons-material/LooksTwoRounded";
import Looks3RoundedIcon from "@mui/icons-material/Looks3Rounded";
import UnarchiveRoundedIcon from "@mui/icons-material/UnarchiveRounded";
import BackspaceRoundedIcon from "@mui/icons-material/BackspaceRounded";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { APP_RADIUS, APP_RADIUS_PX } from "../designTokens";
import { interactiveItemSx } from "../styles/interactiveCard";
import SettingsIconButton from "../components/SettingsIconButton";
import ToggleCheckbox from "../components/ToggleCheckbox";
import CardSection from "../components/layout/CardSection";
import AppAccordion from "../components/layout/AppAccordion";
import PageContainer from "../components/layout/PageContainer";
import { Link as RouterLink, useLocation } from "wouter";

type NoteCategory = {
  id: string;
  name: string;
  color: string;
};

type NoteSubcategory = {
  id: string;
  name: string;
  categoryId: string;
  color: string;
};

type NoteLink = {
  id: string;
  label: string;
  url: string;
};

type Note = {
  id: string;
  title: string;
  categoryIds: string[];
  subcategoryIds: string[];
  contentHtml: string;
  links: NoteLink[];
  updatedAt: string;
  archived: boolean;
  isDraft?: boolean;
  parentId?: string;
  relatedNoteIds?: string[];
};

const STORAGE_NOTES = "notes_v1";
const STORAGE_NOTE_CATEGORIES = "note_categories_v1";
const STORAGE_NOTE_SUBCATEGORIES = "note_subcategories_v1";
const STORAGE_NOTE_FIELDS = "note_fields_v1";

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
];

const defaultCategories: NoteCategory[] = [
  { id: "note-cat-estrategia", name: "Estrategia", color: DEFAULT_COLORS[0] },
  { id: "note-cat-reunioes", name: "Reuniões", color: DEFAULT_COLORS[1] },
  { id: "note-cat-projeto", name: "Projeto", color: DEFAULT_COLORS[2] },
  { id: "note-cat-aprendizado", name: "Aprendizado", color: DEFAULT_COLORS[3] },
];

const defaultSubcategories: NoteSubcategory[] = [
  {
    id: "note-sub-plano",
    name: "Plano de ação",
    categoryId: "note-cat-estrategia",
    color: DEFAULT_COLORS[0],
  },
  {
    id: "note-sub-kpis",
    name: "KPIs",
    categoryId: "note-cat-estrategia",
    color: DEFAULT_COLORS[1],
  },
  {
    id: "note-sub-ata",
    name: "Ata",
    categoryId: "note-cat-reunioes",
    color: DEFAULT_COLORS[2],
  },
  {
    id: "note-sub-followup",
    name: "Follow-up",
    categoryId: "note-cat-reunioes",
    color: DEFAULT_COLORS[3],
  },
  {
    id: "note-sub-fluxos",
    name: "Fluxos",
    categoryId: "note-cat-projeto",
    color: DEFAULT_COLORS[4],
  },
  {
    id: "note-sub-research",
    name: "Pesquisa",
    categoryId: "note-cat-aprendizado",
    color: DEFAULT_COLORS[5],
  },
];

const defaultNotes: Note[] = [
  {
    id: "note-1",
    title: "Próximos passos do projeto",
    categoryIds: ["note-cat-projeto"],
    subcategoryIds: ["note-sub-fluxos"],
    contentHtml:
      "<p>Mapear entregas por etapa e alinhar milestones com o time.</p><ul><li>Kickoff</li><li>Design sprint</li><li>Entrega beta</li></ul>",
    links: [
      {
        id: "note-link-1",
        label: "Board do projeto",
        url: "https://trello.com",
      },
    ],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  {
    id: "note-2",
    title: "Resumo da reunião de status",
    categoryIds: ["note-cat-reunioes"],
    subcategoryIds: ["note-sub-ata"],
    contentHtml:
      "<p>Principais alinhamentos:</p><ol><li>Priorizar backlog A</li><li>Revisar riscos da entrega</li></ol>",
    links: [
      { id: "note-link-2", label: "Gravação", url: "https://meet.google.com" },
    ],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  {
    id: "note-3",
    title: "Mapa de riscos",
    categoryIds: ["note-cat-projeto"],
    subcategoryIds: ["note-sub-fluxos"],
    contentHtml: "<p>Listar riscos e planos de mitigação.</p>",
    links: [],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  {
    id: "note-4",
    title: "Checklist de kickoff",
    categoryIds: ["note-cat-reunioes"],
    subcategoryIds: ["note-sub-followup"],
    contentHtml:
      "<ul><li>Alinhar objetivos</li><li>Definir stakeholders</li></ul>",
    links: [],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  {
    id: "note-5",
    title: "Pesquisa com usuários",
    categoryIds: ["note-cat-aprendizado"],
    subcategoryIds: ["note-sub-research"],
    contentHtml: "<p>Resumo das entrevistas e principais insights.</p>",
    links: [],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  {
    id: "note-6",
    title: "Metas do trimestre",
    categoryIds: ["note-cat-estrategia"],
    subcategoryIds: ["note-sub-kpis"],
    contentHtml: "<p>OKRs e metas do time.</p>",
    links: [],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  {
    id: "note-7",
    title: "Plano de ação semanal",
    categoryIds: ["note-cat-estrategia"],
    subcategoryIds: ["note-sub-plano"],
    contentHtml: "<p>Prioridades e entregas da semana.</p>",
    links: [],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  {
    id: "note-8",
    title: "Roadmap de produto",
    categoryIds: ["note-cat-projeto"],
    subcategoryIds: ["note-sub-fluxos"],
    contentHtml: "<p>Fases, dependências e entregas.</p>",
    links: [],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  {
    id: "note-9",
    title: "Retrospectiva",
    categoryIds: ["note-cat-reunioes"],
    subcategoryIds: ["note-sub-ata"],
    contentHtml: "<p>O que funcionou e o que melhorar.</p>",
    links: [],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  {
    id: "note-10",
    title: "Leituras recomendadas",
    categoryIds: ["note-cat-aprendizado"],
    subcategoryIds: ["note-sub-research"],
    contentHtml: "<p>Links e referências para estudo.</p>",
    links: [],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
];

const darkenColor = (value: string, factor: number) => {
  const color = value.replace("#", "");
  if (color.length !== 6) {
    return value;
  }
  const r = Math.max(
    0,
    Math.min(255, Math.floor(parseInt(color.slice(0, 2), 16) * factor))
  );
  const g = Math.max(
    0,
    Math.min(255, Math.floor(parseInt(color.slice(2, 4), 16) * factor))
  );
  const b = Math.max(
    0,
    Math.min(255, Math.floor(parseInt(color.slice(4, 6), 16) * factor))
  );
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

const emptyNote = (categoryId: string): Note => ({
  id: `note-${Date.now()}`,
  title: "Nova nota",
  categoryIds: [categoryId],
  subcategoryIds: [],
  contentHtml: "",
  links: [],
  updatedAt: new Date().toISOString(),
  archived: false,
  isDraft: true,
  relatedNoteIds: [],
});
const defaultNoteFieldSettings = {
  showCategories: true,
  showSubcategories: true,
  showLinks: true,
  showUpdatedAt: true,
  showCategoryCounts: true,
};

export default function Notes() {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const isArchiveView = location.startsWith("/notas/arquivo");
  const [categories, setCategories] =
    useState<NoteCategory[]>(defaultCategories);
  const [subcategories, setSubcategories] =
    useState<NoteSubcategory[]>(defaultSubcategories);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(
    defaultCategories[0]?.id || ""
  );
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(
    null
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(DEFAULT_COLORS[0]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryColor, setEditingCategoryColor] = useState(
    DEFAULT_COLORS[0]
  );
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [newSubcategoryCategory, setNewSubcategoryCategory] = useState(
    defaultCategories[0]?.id || ""
  );
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<
    string | null
  >(null);
  const [editingSubcategoryName, setEditingSubcategoryName] = useState("");
  const [editingSubcategoryCategory, setEditingSubcategoryCategory] = useState(
    defaultCategories[0]?.id || ""
  );
  const [editingSubcategoryColor, setEditingSubcategoryColor] = useState(
    DEFAULT_COLORS[0]
  );
  const [newSubcategoryColor, setNewSubcategoryColor] = useState(
    DEFAULT_COLORS[0]
  );
  const [noteQuery, setNoteQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsAccordion, setSettingsAccordion] = useState<
    "categories" | "subcategories" | "display" | false
  >(false);
  const [fieldSettings, setFieldSettings] = useState({
    ...defaultNoteFieldSettings,
  });
  const [confirmRemove, setConfirmRemove] = useState<{
    type: "category" | "subcategory";
    id: string;
  } | null>(null);
  const [noteConfirm, setNoteConfirm] = useState<{
    type: "archive" | "restore" | "delete";
    id: string;
  } | null>(null);
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>(
    defaultCategories[0]?.id || ""
  );
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const restoreDefaultsSnapshotRef = useRef<{
    categories: NoteCategory[];
    subcategories: NoteSubcategory[];
    fieldSettings: typeof fieldSettings;
    activeCategory: string;
    subcategoryFilter: string;
    activeSubcategory: string | null;
    settingsAccordion: typeof settingsAccordion;
    newCategoryName: string;
    newCategoryColor: string;
    editingCategoryId: string | null;
    editingCategoryName: string;
    editingCategoryColor: string;
    newSubcategoryName: string;
    newSubcategoryCategory: string;
    newSubcategoryColor: string;
    editingSubcategoryId: string | null;
    editingSubcategoryName: string;
    editingSubcategoryCategory: string;
    editingSubcategoryColor: string;
  } | null>(null);
  const [restoreDefaultsSnackbarOpen, setRestoreDefaultsSnackbarOpen] =
    useState(false);
  const handleRestoreNoteDefaults = () => {
    restoreDefaultsSnapshotRef.current = {
      categories,
      subcategories,
      fieldSettings,
      activeCategory,
      subcategoryFilter,
      activeSubcategory,
      settingsAccordion,
      newCategoryName,
      newCategoryColor,
      editingCategoryId,
      editingCategoryName,
      editingCategoryColor,
      newSubcategoryName,
      newSubcategoryCategory,
      newSubcategoryColor,
      editingSubcategoryId,
      editingSubcategoryName,
      editingSubcategoryCategory,
      editingSubcategoryColor,
    };
    setCategories(defaultCategories);
    setSubcategories(defaultSubcategories);
    setFieldSettings({ ...defaultNoteFieldSettings });
    setActiveCategory(defaultCategories[0]?.id || "");
    setSubcategoryFilter(defaultCategories[0]?.id || "");
    setActiveSubcategory(null);
    cancelEditCategory();
    cancelEditSubcategory();
    setNewCategoryName("");
    setNewCategoryColor(DEFAULT_COLORS[0]);
    setNewSubcategoryName("");
    setNewSubcategoryCategory(defaultCategories[0]?.id || "");
    setNewSubcategoryColor(DEFAULT_COLORS[0]);
    setSettingsAccordion(false);
    setRestoreDefaultsSnackbarOpen(true);
  };

  const handleUndoRestoreNoteDefaults = () => {
    const snapshot = restoreDefaultsSnapshotRef.current;
    if (!snapshot) {
      setRestoreDefaultsSnackbarOpen(false);
      return;
    }
    setCategories(snapshot.categories);
    setSubcategories(snapshot.subcategories);
    setFieldSettings(snapshot.fieldSettings);
    setActiveCategory(snapshot.activeCategory);
    setSubcategoryFilter(snapshot.subcategoryFilter);
    setActiveSubcategory(snapshot.activeSubcategory);
    setSettingsAccordion(snapshot.settingsAccordion);
    setNewCategoryName(snapshot.newCategoryName);
    setNewCategoryColor(snapshot.newCategoryColor);
    setEditingCategoryId(snapshot.editingCategoryId);
    setEditingCategoryName(snapshot.editingCategoryName);
    setEditingCategoryColor(snapshot.editingCategoryColor);
    setNewSubcategoryName(snapshot.newSubcategoryName);
    setNewSubcategoryCategory(snapshot.newSubcategoryCategory);
    setNewSubcategoryColor(snapshot.newSubcategoryColor);
    setEditingSubcategoryId(snapshot.editingSubcategoryId);
    setEditingSubcategoryName(snapshot.editingSubcategoryName);
    setEditingSubcategoryCategory(snapshot.editingSubcategoryCategory);
    setEditingSubcategoryColor(snapshot.editingSubcategoryColor);
    restoreDefaultsSnapshotRef.current = null;
    setRestoreDefaultsSnackbarOpen(false);
  };

  // Ao entrar na tela de lista (/notas ou /notas/arquivo), nunca manter nota aberta
  useEffect(() => {
    if (location === "/notas" || location === "/notas/arquivo") {
      setSelectedNoteId(null);
      setExpandedNoteId(null);
    }
  }, [location]);

  useEffect(() => {
    const storedNotes = window.localStorage.getItem(STORAGE_NOTES);
    if (storedNotes) {
      try {
        const parsed = JSON.parse(storedNotes) as Array<
          Note & { categoryId?: string; subcategoryId?: string }
        >;
        if (Array.isArray(parsed) && parsed.length) {
          const normalized: Note[] = parsed.map(note => ({
            ...note,
            categoryIds: note.categoryIds?.length
              ? note.categoryIds
              : note.categoryId
                ? [note.categoryId]
                : [],
            subcategoryIds: note.subcategoryIds?.length
              ? note.subcategoryIds
              : note.subcategoryId
                ? [note.subcategoryId]
                : [],
            archived: Boolean(note.archived),
            isDraft: Boolean(note.isDraft),
            relatedNoteIds: Array.isArray(note.relatedNoteIds)
              ? note.relatedNoteIds
              : [],
          }));
          const existingIds = new Set(normalized.map(note => note.id));
          const merged = [...normalized];
          defaultNotes.forEach(note => {
            if (!existingIds.has(note.id)) {
              merged.push(note);
            }
          });
          setNotes(merged);
        } else {
          setNotes(defaultNotes);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_NOTES);
      }
    } else {
      setNotes(defaultNotes);
    }

    const storedCategories = window.localStorage.getItem(
      STORAGE_NOTE_CATEGORIES
    );
    if (storedCategories) {
      try {
        const parsed = JSON.parse(storedCategories) as NoteCategory[];
        if (Array.isArray(parsed) && parsed.length) {
          setCategories(parsed);
          setActiveCategory(parsed[0].id);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_NOTE_CATEGORIES);
      }
    }

    const storedSubcategories = window.localStorage.getItem(
      STORAGE_NOTE_SUBCATEGORIES
    );
    if (storedSubcategories) {
      try {
        const parsed = JSON.parse(storedSubcategories) as NoteSubcategory[];
        if (Array.isArray(parsed)) {
          setSubcategories(parsed);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_NOTE_SUBCATEGORIES);
      }
    }
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_NOTE_FIELDS);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as Partial<typeof fieldSettings>;
      setFieldSettings(prev => ({ ...prev, ...parsed }));
    } catch {
      window.localStorage.removeItem(STORAGE_NOTE_FIELDS);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_NOTE_FIELDS,
      JSON.stringify(fieldSettings)
    );
  }, [fieldSettings]);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_NOTE_CATEGORIES,
      JSON.stringify(categories)
    );
  }, [categories]);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_NOTE_SUBCATEGORIES,
      JSON.stringify(subcategories)
    );
  }, [subcategories]);

  useEffect(() => {
    if (!categories.length) {
      return;
    }
    if (!categories.some(category => category.id === subcategoryFilter)) {
      setSubcategoryFilter(categories[0].id);
    }
  }, [categories, subcategoryFilter]);

  useEffect(() => {
    if (!activeSubcategory) {
      return;
    }
    const belongsToActive = subcategories.some(
      subcategory =>
        subcategory.id === activeSubcategory &&
        subcategory.categoryId === activeCategory
    );
    if (!belongsToActive) {
      setActiveSubcategory(null);
    }
  }, [activeCategory, activeSubcategory, subcategories]);

  const activeSubcategories = useMemo(
    () => subcategories.filter(item => item.categoryId === activeCategory),
    [subcategories, activeCategory]
  );

  const stripHtml = (value: string) => value.replace(/<[^>]+>/g, " ");

  const categoryMap = useMemo(
    () => new Map(categories.map(category => [category.id, category])),
    [categories]
  );
  const subcategoryMap = useMemo(
    () =>
      new Map(subcategories.map(subcategory => [subcategory.id, subcategory])),
    [subcategories]
  );

  const filteredNotes = useMemo(() => {
    const term = noteQuery.trim().toLowerCase();
    return notes.filter(note => {
      if (note.archived !== isArchiveView) {
        return false;
      }
      if (!note.categoryIds.includes(activeCategory)) {
        return false;
      }
      if (
        activeSubcategory &&
        !note.subcategoryIds.includes(activeSubcategory)
      ) {
        return false;
      }
      if (!term) {
        return true;
      }
      const categoryNames = note.categoryIds
        .map(id => categoryMap.get(id)?.name || "")
        .join(" ");
      const subcategoryNames = note.subcategoryIds
        .map(id => subcategoryMap.get(id)?.name || "")
        .join(" ");
      const haystack =
        `${note.title} ${stripHtml(note.contentHtml || "")} ${categoryNames} ${subcategoryNames}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [
    notes,
    activeCategory,
    activeSubcategory,
    noteQuery,
    isArchiveView,
    categoryMap,
    subcategoryMap,
  ]);

  const noteIdFromRoute = (() => {
    if (location.startsWith("/notas/arquivo/")) {
      return location.split("/")[3] || null;
    }
    if (
      location.startsWith("/notas/") &&
      location.split("/")[2] !== "arquivo"
    ) {
      return location.split("/")[2] || null;
    }
    return null;
  })();
  const selectedNote = notes.find(note => note.id === selectedNoteId) || null;

  const isPristineDraft = (note: Note) =>
    note.isDraft &&
    note.title.trim() === "Nova nota" &&
    !note.contentHtml.trim() &&
    !note.links.length &&
    !note.subcategoryIds.length;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
  }, [notes]);

  const discardIfPristine = (noteId: string | null) => {
    if (!noteId) {
      return;
    }
    const note = notes.find(item => item.id === noteId);
    if (note && isPristineDraft(note)) {
      setNotes(prev => prev.filter(item => item.id !== noteId));
    }
  };

  const prevSelectedNoteIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Não auto-seleciona nota nunca. Só abre nota quando a rota tem /notas/:id
    if (!noteIdFromRoute) {
      setSelectedNoteId(null);
      setExpandedNoteId(null);
      prevSelectedNoteIdRef.current = null;
      return;
    }

    if (noteIdFromRoute === selectedNoteId) {
      prevSelectedNoteIdRef.current = noteIdFromRoute;
      return;
    }

    const match = notes.find(note => note.id === noteIdFromRoute) || null;
    if (!match) {
      setSelectedNoteId(null);
      setExpandedNoteId(null);
      prevSelectedNoteIdRef.current = null;
      setLocation(isArchiveView ? "/notas/arquivo" : "/notas");
      return;
    }

    // Se a nota existe mas está no “lado” errado (arquivo vs notas), ajusta a rota
    if (match.archived !== isArchiveView) {
      setLocation(
        match.archived ? `/notas/arquivo/${match.id}` : `/notas/${match.id}`
      );
      return;
    }

    if (match.categoryIds?.length) {
      setActiveCategory(match.categoryIds[0]);
    }
    setSelectedNoteId(match.id);
    prevSelectedNoteIdRef.current = match.id;
  }, [noteIdFromRoute, notes, isArchiveView, selectedNoteId, setLocation]);

  const selectNote = (note: Note) => {
    discardIfPristine(selectedNoteId);
    setSelectedNoteId(note.id);
    if (note.categoryIds?.length) {
      setActiveCategory(note.categoryIds[0]);
    }
    setLocation(
      isArchiveView ? `/notas/arquivo/${note.id}` : `/notas/${note.id}`
    );
  };

  const updateNote = (next: Note) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === next.id ? { ...next, isDraft: false } : note
      )
    );
  };

  const addNote = () => {
    if (!activeCategory) {
      return;
    }
    discardIfPristine(selectedNoteId);
    const next = emptyNote(activeCategory);
    setNotes(prev => [next, ...prev]);
    setSelectedNoteId(next.id);
    setNoteQuery("");
    setLocation(`/notas/${next.id}`);
  };

  const addCategory = () => {
    const name = newCategoryName.trim();
    if (!name) {
      return;
    }
    const next = {
      id: `note-cat-${Date.now()}`,
      name,
      color: newCategoryColor,
    };
    setCategories(prev => [...prev, next]);
    setNewCategoryName("");
    setNewCategoryColor(DEFAULT_COLORS[0]);
    setActiveCategory(next.id);
    setNewSubcategoryCategory(next.id);
  };

  const removeCategory = (categoryId: string) => {
    const remaining = categories.filter(category => category.id !== categoryId);
    if (!remaining.length) {
      return;
    }
    const nextActive = remaining[0].id;
    setCategories(remaining);
    setSubcategories(prev =>
      prev.filter(item => item.categoryId !== categoryId)
    );
    setNotes(prev =>
      prev.map(note =>
        note.categoryIds.includes(categoryId)
          ? {
              ...note,
              categoryIds: note.categoryIds.filter(id => id !== categoryId)
                .length
                ? note.categoryIds.filter(id => id !== categoryId)
                : [nextActive],
              subcategoryIds: note.subcategoryIds.filter(
                subId =>
                  !subcategories.some(
                    item => item.id === subId && item.categoryId === categoryId
                  )
              ),
            }
          : note
      )
    );
    setActiveCategory(nextActive);
  };

  const addSubcategory = () => {
    const name = newSubcategoryName.trim();
    if (!name || !newSubcategoryCategory) {
      return;
    }
    const next = {
      id: `note-sub-${Date.now()}`,
      name,
      categoryId: newSubcategoryCategory,
      color: newSubcategoryColor,
    };
    setSubcategories(prev => [...prev, next]);
    setNewSubcategoryName("");
    setNewSubcategoryColor(DEFAULT_COLORS[0]);
  };

  const removeSubcategory = (subcategoryId: string) => {
    setSubcategories(prev => prev.filter(item => item.id !== subcategoryId));
    setNotes(prev =>
      prev.map(note =>
        note.subcategoryIds.includes(subcategoryId)
          ? {
              ...note,
              subcategoryIds: note.subcategoryIds.filter(
                id => id !== subcategoryId
              ),
            }
          : note
      )
    );
  };

  const startEditSubcategory = (subcategory: NoteSubcategory) => {
    setEditingSubcategoryId(subcategory.id);
    setEditingSubcategoryName(subcategory.name);
    setEditingSubcategoryCategory(subcategory.categoryId);
    setEditingSubcategoryColor(subcategory.color);
  };

  const cancelEditSubcategory = () => {
    setEditingSubcategoryId(null);
    setEditingSubcategoryName("");
    setEditingSubcategoryCategory(defaultCategories[0]?.id || "");
    setEditingSubcategoryColor(DEFAULT_COLORS[0]);
  };

  const saveSubcategory = () => {
    if (!editingSubcategoryId) {
      return;
    }
    const name = editingSubcategoryName.trim();
    if (!name || !editingSubcategoryCategory) {
      return;
    }
    setSubcategories(prev =>
      prev.map(subcategory =>
        subcategory.id === editingSubcategoryId
          ? {
              ...subcategory,
              name,
              categoryId: editingSubcategoryCategory,
              color: editingSubcategoryColor,
            }
          : subcategory
      )
    );
    cancelEditSubcategory();
  };
  const startEditCategory = (category: NoteCategory) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
    setEditingCategoryColor(category.color);
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName("");
    setEditingCategoryColor(DEFAULT_COLORS[0]);
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
      prev.map(category =>
        category.id === editingCategoryId
          ? { ...category, name, color: editingCategoryColor }
          : category
      )
    );
    cancelEditCategory();
  };

  const removeLink = (note: Note, linkId: string) => {
    updateNote({
      ...note,
      links: note.links.filter(link => link.id !== linkId),
      updatedAt: new Date().toISOString(),
    });
  };

  const addLink = (note: Note) => {
    updateNote({
      ...note,
      links: [
        ...note.links,
        { id: `note-link-${Date.now()}`, label: "", url: "" },
      ],
      updatedAt: new Date().toISOString(),
    });
  };

  const updateLink = (
    note: Note,
    linkId: string,
    key: "label" | "url",
    value: string
  ) => {
    updateNote({
      ...note,
      links: note.links.map(link =>
        link.id === linkId ? { ...link, [key]: value } : link
      ),
      updatedAt: new Date().toISOString(),
    });
  };

  const requestNoteAction = (
    note: Note,
    type: "archive" | "restore" | "delete"
  ) => {
    setNoteConfirm({ type, id: note.id });
  };

  const applyNoteAction = (
    noteId: string,
    type: "archive" | "restore" | "delete"
  ) => {
    if (type === "delete") {
      setNotes(prev => prev.filter(note => note.id !== noteId));
    } else {
      setNotes(prev =>
        prev.map(note =>
          note.id === noteId
            ? { ...note, archived: type === "archive" ? true : false }
            : note
        )
      );
    }
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
    }
    if (type === "archive") {
      setLocation("/notas");
      return;
    }
    if (type === "restore") {
      setLocation("/notas/arquivo");
      return;
    }
    setLocation(isArchiveView ? "/notas/arquivo" : "/notas");
  };

  const showSidebar =
    fieldSettings.showCategories || fieldSettings.showSubcategories;
  const showBackButton = Boolean(noteIdFromRoute);
  const archiveLink = isArchiveView
    ? { label: "Notas", href: "/notas" }
    : { label: "Arquivo", href: "/notas/arquivo" };

  return (
    <PageContainer>
      <Stack spacing={3}>
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
            sx={{ width: "100%" }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, minWidth: 0 }}>
              {isArchiveView ? "Arquivo" : "Notas"}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ display: { xs: "none", sm: "flex" } }}
              >
                <Button
                  component={RouterLink}
                  href={archiveLink.href}
                  variant="outlined"
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    minWidth: 0,
                    px: { xs: 1.25, sm: 1.75 },
                  }}
                >
                  {archiveLink.label}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={
                    <Box sx={{ display: { xs: "none", sm: "inline-flex" } }}>
                      <AddRoundedIcon />
                    </Box>
                  }
                  onClick={addNote}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    minWidth: 0,
                    px: { xs: 1.25, sm: 1.75 },
                  }}
                >
                  Nova nota
                </Button>
              </Stack>
              <SettingsIconButton onClick={() => setSettingsOpen(true)} />
            </Stack>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="flex-end"
            sx={{
              width: "100%",
              flexWrap: "nowrap",
              overflow: "hidden",
              display: { xs: "flex", sm: "none" },
            }}
          >
            <Button
              component={RouterLink}
              href={archiveLink.href}
              variant="outlined"
              sx={{
                textTransform: "none",
                fontWeight: 600,
                whiteSpace: "nowrap",
                minWidth: 0,
                px: { xs: 1.25, sm: 1.75 },
              }}
            >
              {archiveLink.label}
            </Button>
            <Button
              variant="outlined"
              startIcon={
                <Box sx={{ display: { xs: "none", sm: "inline-flex" } }}>
                  <AddRoundedIcon />
                </Box>
              }
              onClick={addNote}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                whiteSpace: "nowrap",
                minWidth: 0,
                px: { xs: 1.25, sm: 1.75 },
              }}
            >
              Nova nota
            </Button>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: showSidebar
              ? { xs: "1fr", md: "280px 1fr" }
              : "1fr",
            gap: 2.5,
          }}
        >
          {showSidebar ? (
            <Stack spacing={2}>
              {fieldSettings.showCategories ? (
                <CardSection size="xs">
                  <Stack spacing={2}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Categorias
                    </Typography>
                    <Stack spacing={1}>
                      {categories.map(category => {
                        const isActiveCategory = activeCategory === category.id;
                        return (
                          <Box key={category.id}>
                            <Box
                              onClick={() => {
                                setActiveCategory(category.id);
                                setActiveSubcategory(null);
                              }}
                              sx={theme => ({
                                ...interactiveItemSx(theme),
                                p: 1,
                                border: 1,
                                borderColor: isActiveCategory
                                  ? "primary.main"
                                  : "divider",
                                cursor: "pointer",
                              })}
                            >
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                              >
                                <Box
                                  sx={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: "50%",
                                    backgroundColor: category.color,
                                  }}
                                />
                                <Typography variant="body2">
                                  {category.name}
                                </Typography>
                                {fieldSettings.showCategoryCounts ? (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "text.secondary",
                                      fontWeight: 600,
                                      ml: "auto",
                                    }}
                                  >
                                    {
                                      notes.filter(
                                        note =>
                                          note.archived === isArchiveView &&
                                          note.categoryIds.includes(category.id)
                                      ).length
                                    }
                                  </Typography>
                                ) : null}
                              </Stack>
                            </Box>

                            {fieldSettings.showSubcategories &&
                            isActiveCategory ? (
                              <Box sx={{ mt: 1, pl: 2 }}>
                                {activeSubcategories.length ? (
                                  <Stack spacing={0.75}>
                                    {activeSubcategories.map(subcategory => {
                                      const isActive =
                                        activeSubcategory === subcategory.id;
                                      return (
                                        <Box
                                          key={subcategory.id}
                                          onClick={() => {
                                            setActiveSubcategory(prev =>
                                              prev === subcategory.id
                                                ? null
                                                : subcategory.id
                                            );
                                          }}
                                          sx={theme => ({
                                            ...interactiveItemSx(theme),
                                            px: 1,
                                            py: 0.75,
                                            border: 1,
                                            borderColor: isActive
                                              ? "primary.main"
                                              : "divider",
                                            cursor: "pointer",
                                          })}
                                        >
                                          <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                          >
                                            <Box
                                              sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: "50%",
                                                backgroundColor:
                                                  subcategory.color ||
                                                  darkenColor(
                                                    category.color,
                                                    0.7
                                                  ),
                                              }}
                                            />
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                color: "text.secondary",
                                                fontWeight: 600,
                                              }}
                                            >
                                              {subcategory.name}
                                            </Typography>
                                          </Stack>
                                        </Box>
                                      );
                                    })}
                                  </Stack>
                                ) : (
                                  <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary" }}
                                  >
                                    Sem subcategorias.
                                  </Typography>
                                )}
                              </Box>
                            ) : null}
                          </Box>
                        );
                      })}
                    </Stack>
                  </Stack>
                </CardSection>
              ) : null}
            </Stack>
          ) : null}

          <Stack spacing={2.5}>
            {!selectedNote ? (
              <CardSection size="xs">
                <Stack spacing={1.5}>
                  <TextField
                    label="Buscar nota"
                    size="small"
                    value={noteQuery}
                    onChange={event => setNoteQuery(event.target.value)}
                    sx={{ minWidth: 220 }}
                  />
                  {filteredNotes.length ? (
                    <Box
                      sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "1fr 1fr",
                          md: "1fr 1fr 1fr",
                          lg: "1fr 1fr 1fr",
                          xl: "1fr 1fr 1fr 1fr",
                        },
                      }}
                    >
                      {(expandedNoteId
                        ? filteredNotes.filter(
                            note => note.id === expandedNoteId
                          )
                        : filteredNotes
                      ).map(note => {
                        const noteCategories = categories.filter(cat =>
                          note.categoryIds.includes(cat.id)
                        );
                        const isExpanded = note.id === expandedNoteId;
                        const preview = stripHtml(
                          note.contentHtml || ""
                        ).trim();
                        return (
                          <Paper
                            key={note.id}
                            elevation={0}
                            onClick={() => {
                              if (isExpanded) {
                                setExpandedNoteId(null);
                              } else {
                                setExpandedNoteId(note.id);
                                selectNote(note);
                              }
                            }}
                            sx={theme => ({
                              ...interactiveItemSx(theme),
                              p: isExpanded ? 2.5 : 2,
                              border: 1,
                              borderColor: isExpanded
                                ? "primary.main"
                                : "divider",
                              backgroundColor: "background.paper",
                              cursor: "pointer",
                              minHeight: isExpanded ? "auto" : 120,
                            })}
                          >
                            <Stack spacing={isExpanded ? 1.5 : 1}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-start",
                                  flexWrap: "wrap",
                                  gap: 1,
                                  width: "100%",
                                }}
                              >
                                <Typography
                                  variant={
                                    isExpanded ? "subtitle1" : "subtitle2"
                                  }
                                  sx={{ fontWeight: 600 }}
                                >
                                  {note.title}
                                </Typography>
                                {fieldSettings.showCategories
                                  ? noteCategories.slice(0, 1).map(category => (
                                      <Chip
                                        key={category.id}
                                        label={category.name}
                                        size="small"
                                        sx={{
                                          color: "#e6edf3",
                                          backgroundColor: darkenColor(
                                            category.color,
                                            0.5
                                          ),
                                        }}
                                      />
                                    ))
                                  : null}
                                {fieldSettings.showUpdatedAt ? (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "text.secondary",
                                      ml: "auto",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {new Date(
                                      note.updatedAt
                                    ).toLocaleDateString("pt-BR")}
                                  </Typography>
                                ) : null}
                              </Box>
                              {isExpanded && preview ? (
                                <Typography
                                  variant="body2"
                                  sx={{ color: "text.secondary" }}
                                >
                                  {preview.length > 180
                                    ? `${preview.slice(0, 180)}...`
                                    : preview}
                                </Typography>
                              ) : null}
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      {isArchiveView
                        ? "Sem notas arquivadas nesta categoria."
                        : "Sem notas nesta categoria."}
                    </Typography>
                  )}
                </Stack>
              </CardSection>
            ) : null}

            {selectedNote ? (
              <CardSection size="xs">
                <Stack spacing={2}>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <TextField
                        label="Titulo"
                        value={selectedNote.title}
                        onChange={event =>
                          updateNote({
                            ...selectedNote,
                            title: event.target.value,
                            updatedAt: new Date().toISOString(),
                          })
                        }
                        fullWidth
                        sx={{
                          "& .MuiInputBase-input": {
                            fontSize: "1.35rem",
                            fontWeight: 700,
                            lineHeight: 1.3,
                          },
                        }}
                      />
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Fechar nota" placement="top">
                          <IconButton
                            onClick={e => {
                              e.stopPropagation();
                              e.preventDefault();
                              setSelectedNoteId(null);
                              setExpandedNoteId(null);
                              setLocation(
                                isArchiveView ? "/notas/arquivo" : "/notas"
                              );
                            }}
                          >
                            <CloseRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={
                            selectedNote.archived
                              ? "Restaurar nota"
                              : "Arquivar nota"
                          }
                          placement="top"
                        >
                          <IconButton
                            onClick={() =>
                              requestNoteAction(
                                selectedNote,
                                selectedNote.archived ? "restore" : "archive"
                              )
                            }
                          >
                            {selectedNote.archived ? (
                              <UnarchiveRoundedIcon fontSize="small" />
                            ) : (
                              <ArchiveRoundedIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remover nota" placement="top">
                          <IconButton
                            onClick={() =>
                              requestNoteAction(selectedNote, "delete")
                            }
                          >
                            <DeleteRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      {fieldSettings.showCategories ? (
                        <Autocomplete
                          multiple
                          options={categories}
                          value={categories.filter(item =>
                            selectedNote.categoryIds.includes(item.id)
                          )}
                          onChange={(_, value) => {
                            const nextIds = value.map(item => item.id);
                            updateNote({
                              ...selectedNote,
                              categoryIds: nextIds,
                              updatedAt: new Date().toISOString(),
                            });
                            if (nextIds.length) {
                              setActiveCategory(nextIds[0]);
                            }
                          }}
                          getOptionLabel={option => option.name}
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
                          renderInput={params => (
                            <TextField
                              {...params}
                              label="Categorias"
                              fullWidth
                            />
                          )}
                          sx={{ minWidth: 240, flex: 1 }}
                        />
                      ) : null}
                      {fieldSettings.showSubcategories ? (
                        <Autocomplete
                          multiple
                          options={subcategories.filter(item =>
                            selectedNote.categoryIds.includes(item.categoryId)
                          )}
                          value={subcategories.filter(item =>
                            selectedNote.subcategoryIds.includes(item.id)
                          )}
                          onChange={(_, value) =>
                            updateNote({
                              ...selectedNote,
                              subcategoryIds: value.map(item => item.id),
                              updatedAt: new Date().toISOString(),
                            })
                          }
                          getOptionLabel={option => option.name}
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
                          renderInput={params => (
                            <TextField
                              {...params}
                              label="Subcategorias"
                              fullWidth
                            />
                          )}
                          sx={{ minWidth: 240, flex: 1 }}
                        />
                      ) : null}
                    </Stack>
                  </Stack>

                  {fieldSettings.showLinks ? (
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Links
                      </Typography>
                      {selectedNote.links.map(link => (
                        <Stack
                          key={link.id}
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          <TextField
                            label="Titulo"
                            size="small"
                            value={link.label}
                            onChange={event =>
                              updateLink(
                                selectedNote,
                                link.id,
                                "label",
                                event.target.value
                              )
                            }
                            fullWidth
                          />
                          <TextField
                            label="URL"
                            size="small"
                            value={link.url}
                            onChange={event =>
                              updateLink(
                                selectedNote,
                                link.id,
                                "url",
                                event.target.value
                              )
                            }
                            fullWidth
                          />
                          <Tooltip title="Remover link" placement="top">
                            <IconButton
                              onClick={() => removeLink(selectedNote, link.id)}
                            >
                              <CloseRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Abrir link" placement="top">
                            <IconButton
                              component="a"
                              href={link.url || undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              disabled={!link.url}
                            >
                              <LinkRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      ))}
                      <Button
                        variant="outlined"
                        startIcon={<AddRoundedIcon />}
                        onClick={() => addLink(selectedNote)}
                        sx={{
                          alignSelf: "flex-start",
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        Adicionar link
                      </Button>
                    </Stack>
                  ) : null}

                  <RichTextEditor
                    value={selectedNote.contentHtml}
                    onChange={value =>
                      updateNote({
                        ...selectedNote,
                        contentHtml: value,
                        updatedAt: new Date().toISOString(),
                      })
                    }
                  />
                </Stack>
              </CardSection>
            ) : null}
          </Stack>
        </Box>
      </Stack>
      <Dialog
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          cancelEditCategory();
          cancelEditSubcategory();
          setSettingsAccordion(false);
        }}
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
              <Typography variant="h6">Configurações de notas</Typography>
              <IconButton
                onClick={() => {
                  setSettingsOpen(false);
                  cancelEditCategory();
                  cancelEditSubcategory();
                  setSettingsAccordion(false);
                }}
                aria-label="Fechar"
                sx={{
                  color: "text.secondary",
                  "&:hover": { backgroundColor: "action.hover" },
                }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            <AppAccordion
              expanded={settingsAccordion === "categories"}
              onChange={(_, isExpanded) =>
                setSettingsAccordion(isExpanded ? "categories" : false)
              }
              title="Categorias"
            >
              <Stack spacing={1.5}>
                {editingCategoryId ? (
                  <CardSection size="xs">
                    <Stack spacing={1.5}>
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
                          {t("common.cancel")}
                        </Button>
                        <Button variant="contained" onClick={saveCategory}>
                          {t("common.save")}
                        </Button>
                      </Stack>
                    </Stack>
                  </CardSection>
                ) : null}
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {categories.map(category => (
                    <Chip
                      key={category.id}
                      label={category.name}
                      onClick={() => startEditCategory(category)}
                      onDelete={() =>
                        setConfirmRemove({
                          type: "category",
                          id: category.id,
                        })
                      }
                      sx={{
                        color: "#e6edf3",
                        backgroundColor: darkenColor(category.color, 0.5),
                      }}
                    />
                  ))}
                </Stack>
                {editingCategoryId ? null : (
                  <Stack spacing={1.5}>
                    <TextField
                      label="Nova categoria"
                      fullWidth
                      value={newCategoryName}
                      onChange={event => setNewCategoryName(event.target.value)}
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
                      startIcon={<AddRoundedIcon />}
                      onClick={addCategory}
                      sx={{
                        alignSelf: "flex-start",
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      Criar categoria
                    </Button>
                  </Stack>
                )}
              </Stack>
            </AppAccordion>

            <AppAccordion
              expanded={settingsAccordion === "subcategories"}
              onChange={(_, isExpanded) =>
                setSettingsAccordion(isExpanded ? "subcategories" : false)
              }
              title="Subcategorias"
            >
              <Stack spacing={1.5}>
                {editingSubcategoryId ? (
                  <CardSection size="xs">
                    <Stack spacing={1.5}>
                      <TextField
                        label="Nome"
                        fullWidth
                        value={editingSubcategoryName}
                        onChange={event =>
                          setEditingSubcategoryName(event.target.value)
                        }
                      />
                      <TextField
                        select
                        label="Categoria"
                        value={editingSubcategoryCategory}
                        onChange={event =>
                          setEditingSubcategoryCategory(event.target.value)
                        }
                      >
                        {categories.map(category => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </TextField>
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        {DEFAULT_COLORS.map(color => (
                          <Box
                            key={color}
                            onClick={() => setEditingSubcategoryColor(color)}
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: 1,
                              backgroundColor: color,
                              borderStyle: "solid",
                              borderWidth:
                                editingSubcategoryColor === color ? 2 : 1,
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
                        <Button
                          variant="outlined"
                          onClick={cancelEditSubcategory}
                        >
                          {t("common.cancel")}
                        </Button>
                        <Button variant="contained" onClick={saveSubcategory}>
                          {t("common.save")}
                        </Button>
                      </Stack>
                    </Stack>
                  </CardSection>
                ) : null}
                {!editingSubcategoryId ? (
                  <TextField
                    select
                    label={t("common.category")}
                    value={subcategoryFilter}
                    onChange={event => {
                      setSubcategoryFilter(event.target.value);
                      setNewSubcategoryCategory(event.target.value);
                    }}
                  >
                    {categories.map(category => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : null}
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {subcategories
                    .filter(
                      subcategory =>
                        subcategory.categoryId === subcategoryFilter
                    )
                    .map(subcategory => {
                      const parentCategory = categories.find(
                        category => category.id === subcategory.categoryId
                      );
                      return (
                        <Chip
                          key={subcategory.id}
                          label={`${parentCategory?.name || "Categoria"} - ${subcategory.name}`}
                          onClick={() => startEditSubcategory(subcategory)}
                          onDelete={() =>
                            setConfirmRemove({
                              type: "subcategory",
                              id: subcategory.id,
                            })
                          }
                          sx={{
                            maxWidth: 320,
                            minHeight: 32,
                            color: "#e6edf3",
                            backgroundColor: darkenColor(
                              subcategory.color,
                              0.7
                            ),
                            "& .MuiChip-label": {
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            },
                          }}
                        />
                      );
                    })}
                  {!subcategories.filter(
                    subcategory => subcategory.categoryId === subcategoryFilter
                  ).length ? (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Nenhuma subcategoria criada.
                    </Typography>
                  ) : null}
                </Stack>
                {editingSubcategoryId ? null : (
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        select
                        label="Categoria"
                        value={newSubcategoryCategory}
                        onChange={event =>
                          setNewSubcategoryCategory(event.target.value)
                        }
                        sx={{ minWidth: 180 }}
                      >
                        {categories.map(category => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        label="Nova subcategoria"
                        fullWidth
                        value={newSubcategoryName}
                        onChange={event =>
                          setNewSubcategoryName(event.target.value)
                        }
                      />
                      <IconButton
                        onClick={addSubcategory}
                        aria-label="Adicionar subcategoria"
                      >
                        <AddRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {DEFAULT_COLORS.map(color => (
                        <Box
                          key={color}
                          onClick={() => setNewSubcategoryColor(color)}
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 1,
                            backgroundColor: color,
                            borderStyle: "solid",
                            borderWidth: newSubcategoryColor === color ? 2 : 1,
                            borderColor: "divider",
                            cursor: "pointer",
                          }}
                        />
                      ))}
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </AppAccordion>

            <AppAccordion
              expanded={settingsAccordion === "display"}
              onChange={(_, isExpanded) =>
                setSettingsAccordion(isExpanded ? "display" : false)
              }
              title="Exibição"
            >
              <Stack spacing={1.5}>
                {[
                  { key: "showCategories", label: "Mostrar categorias" },
                  {
                    key: "showSubcategories",
                    label: "Mostrar subcategorias",
                  },
                  {
                    key: "showCategoryCounts",
                    label: "Mostrar contagem por categoria",
                  },
                  { key: "showLinks", label: "Mostrar links" },
                  {
                    key: "showUpdatedAt",
                    label: "Mostrar última atualização",
                  },
                ].map(item => (
                  <Box
                    key={item.key}
                    sx={theme => ({
                      ...interactiveItemSx(theme),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      cursor: "pointer",
                    })}
                    onClick={() =>
                      setFieldSettings(prev => ({
                        ...prev,
                        [item.key]:
                          !prev[item.key as keyof typeof fieldSettings],
                      }))
                    }
                  >
                    <Typography variant="subtitle2">{item.label}</Typography>
                    <ToggleCheckbox
                      checked={Boolean(
                        fieldSettings[item.key as keyof typeof fieldSettings]
                      )}
                      onChange={event =>
                        setFieldSettings(prev => ({
                          ...prev,
                          [item.key]: event.target.checked,
                        }))
                      }
                      onClick={event => event.stopPropagation()}
                    />
                  </Box>
                ))}
              </Stack>
            </AppAccordion>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="flex-end"
            >
              <Button
                variant="outlined"
                onClick={handleRestoreNoteDefaults}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Restaurar padrão
              </Button>
              <Button variant="outlined" onClick={() => setSettingsOpen(false)}>
                Fechar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={Boolean(confirmRemove)}
        title={
          confirmRemove?.type === "category"
            ? "Remover categoria"
            : "Remover subcategoria"
        }
        description={
          confirmRemove?.type === "category"
            ? "Você confirma a remoção desta categoria? As notas serão movidas."
            : "Você confirma a remoção desta subcategoria? Ela será removida das notas."
        }
        onCancel={() => setConfirmRemove(null)}
        onConfirm={() => {
          if (!confirmRemove) {
            return;
          }
          if (confirmRemove.type === "category") {
            removeCategory(confirmRemove.id);
          } else {
            removeSubcategory(confirmRemove.id);
          }
          setConfirmRemove(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(noteConfirm)}
        title={
          noteConfirm?.type === "delete"
            ? "Remover nota"
            : noteConfirm?.type === "archive"
              ? "Arquivar nota"
              : "Restaurar nota"
        }
        description={
          noteConfirm?.type === "delete"
            ? "Você confirma a remoção desta nota? Esta ação não poderá ser desfeita."
            : noteConfirm?.type === "archive"
              ? "Você confirma o envio desta nota para o arquivo?"
              : "Você confirma a restauração desta nota para a lista principal?"
        }
        onCancel={() => setNoteConfirm(null)}
        onConfirm={() => {
          if (!noteConfirm) {
            return;
          }
          applyNoteAction(noteConfirm.id, noteConfirm.type);
          setNoteConfirm(null);
        }}
      />

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
              onClick={handleUndoRestoreNoteDefaults}
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

function ConfirmDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {description}
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="flex-end"
          >
            <Button variant="outlined" onClick={onCancel}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={onConfirm}>
              Confirmar
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
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
      Placeholder.configure({
        placeholder: "Escreva sua nota...",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  const iconButtonProps = {
    size: "small" as const,
    sx: {
      border: 1,
      borderColor: "divider",
      backgroundColor: "background.paper",
      "&:hover": { backgroundColor: "action.hover" },
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
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 1 }).run()
            }
            color={
              editor?.isActive("heading", { level: 1 }) ? "primary" : "default"
            }
            aria-label="Titulo 1"
          >
            <LooksOneRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Titulo 2" placement="top">
          <IconButton
            {...iconButtonProps}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
            color={
              editor?.isActive("heading", { level: 2 }) ? "primary" : "default"
            }
            aria-label="Titulo 2"
          >
            <LooksTwoRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Titulo 3" placement="top">
          <IconButton
            {...iconButtonProps}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run()
            }
            color={
              editor?.isActive("heading", { level: 3 }) ? "primary" : "default"
            }
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
        <Tooltip title="Limpar formatação" placement="top">
          <IconButton
            {...iconButtonProps}
            onClick={() =>
              editor?.chain().focus().unsetAllMarks().clearNodes().run()
            }
            aria-label="Limpar formatação"
          >
            <BackspaceRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Box
        sx={theme => ({
          borderRadius: APP_RADIUS,
          border: 1,
          borderColor: "divider",
          backgroundColor: "background.paper",
          "& .tiptap": {
            minHeight: 200,
            outline: "none",
            padding: "16px",
          },
          "& .tiptap h1": { fontSize: "1.25rem", fontWeight: 700 },
          "& .tiptap h2": { fontSize: "1.1rem", fontWeight: 700 },
          "& .tiptap h3": { fontSize: "1rem", fontWeight: 700 },
          "& .tiptap p.is-editor-empty:first-of-type::before": {
            content: "attr(data-placeholder)",
            color: "rgba(230, 237, 243, 0.5)",
            float: "left",
            height: 0,
            pointerEvents: "none",
          },
        })}
      >
        <EditorContent editor={editor} />
      </Box>
    </Stack>
  );
}
