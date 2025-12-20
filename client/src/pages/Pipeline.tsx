import { useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogContent,
  Snackbar,
  IconButton,
  Paper,
  Alert,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "wouter";
import { nanoid } from "nanoid";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
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
  description?: string;
  responsibleIds?: number[];
  workerIds?: number[];
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
  { id: "cat-moradia", name: "Moradia", color: DEFAULT_COLORS[0] },
  { id: "cat-alimentacao", name: "Alimentacao", color: DEFAULT_COLORS[1] },
  { id: "cat-transporte", name: "Transporte", color: DEFAULT_COLORS[2] },
  { id: "cat-saude", name: "Saude", color: DEFAULT_COLORS[3] },
  { id: "cat-lazer", name: "Lazer", color: DEFAULT_COLORS[4] },
  { id: "cat-educacao", name: "Educacao", color: DEFAULT_COLORS[5] },
  { id: "cat-assinaturas", name: "Assinaturas", color: DEFAULT_COLORS[6] },
  { id: "cat-impostos", name: "Impostos", color: DEFAULT_COLORS[7] },
  { id: "cat-investimentos", name: "Investimentos", color: DEFAULT_COLORS[8] },
  { id: "cat-viagem", name: "Viagem", color: DEFAULT_COLORS[9] },
  { id: "cat-compras", name: "Compras", color: DEFAULT_COLORS[10] },
  { id: "cat-outros", name: "Outros", color: DEFAULT_COLORS[11] },
];

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
      },
      {
        id: "silo",
        name: "Silo Retail",
        value: "R$ 22k",
        owner: "Lucas M.",
        categoryId: defaultCategories[0]?.id,
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
      },
      {
        id: "nova",
        name: "Nova Terra",
        value: "R$ 36k",
        owner: "Sofia L.",
        categoryId: defaultCategories[1]?.id,
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
      },
      {
        id: "bluebay",
        name: "Bluebay",
        value: "R$ 41k",
        owner: "Joana S.",
        categoryId: defaultCategories[2]?.id,
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
      },
      {
        id: "gema",
        name: "Gema Labs",
        value: "R$ 31k",
        owner: "Diego M.",
        categoryId: defaultCategories[3]?.id,
      },
    ],
  },
  {
    id: "arquivado",
    title: "Arquivado",
    deals: [],
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

const normalizeColumns = (incoming: Column[]) => incoming;

export default function Pipeline() {
  const [columns, setColumns] = useState<Column[]>(() => defaultColumns);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
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
  const [editResponsibleIds, setEditResponsibleIds] = useState<number[]>([]);
  const [editWorkerIds, setEditWorkerIds] = useState<number[]>([]);
  const [editOwnerFallback, setEditOwnerFallback] = useState("");
  const [editCategoryIds, setEditCategoryIds] = useState<string[]>([]);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [editColumnTitle, setEditColumnTitle] = useState("");
  const [editColumnDescription, setEditColumnDescription] = useState("");
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [users, setUsers] = useState<PipelineUser[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(DEFAULT_COLORS[0]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryColor, setEditingCategoryColor] = useState(DEFAULT_COLORS[0]);
  const [taskQuery, setTaskQuery] = useState("");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [columnManagerOpen, setColumnManagerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const isLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);
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
          if (incomingCategories.length) {
            setCategories(incomingCategories);
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

  const columnItems = useMemo(
    () => columns.map((column) => columnDragId(column.id)),
    [columns]
  );
  const normalizedQuery = taskQuery.trim().toLowerCase();

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  const userMap = useMemo(() => {
    const map = new Map<number, PipelineUser>();
    users.forEach((user) => map.set(user.id, user));
    return map;
  }, [users]);

  const formatUserLabel = (user?: PipelineUser) => {
    if (!user) {
      return "";
    }
    return user.name?.trim() ? user.name : user.email;
  };

  const getUserLabels = (ids?: number[]) =>
    (ids || []).map((id) => formatUserLabel(userMap.get(id))).filter(Boolean);

  const stripHtml = (value: string) => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

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

  const getDealOwnerLabel = (deal: Deal) => {
    const labels = getUserLabels(deal.responsibleIds);
    if (labels.length) {
      return labels.join(", ");
    }
    return deal.owner;
  };

  const selectUsersByIds = (ids: number[]) =>
    users.filter((user) => ids.includes(user.id));

  const findColumn = (columnId: string) =>
    columns.find((column) => column.id === columnId) || null;

  const handleEditOpen = (deal: Deal) => {
    setEditingDeal(deal);
    setEditName(deal.name);
    setEditValue(deal.value);
    setEditLink(deal.link || "");
    setEditDescription(deal.description || deal.comments || "");
    setEditResponsibleIds(deal.responsibleIds || []);
    setEditWorkerIds(deal.workerIds || []);
    setEditOwnerFallback(deal.owner);
    setEditCategoryIds(deal.categoryIds || (deal.categoryId ? [deal.categoryId] : []));
    setEditingCategoryId(null);
  };

  const handleEditClose = () => {
    setEditingDeal(null);
  };

  const handleEditSave = () => {
    if (!editingDeal) {
      return;
    }
    const ownerLabels = getUserLabels(editResponsibleIds);
    const ownerLabel = ownerLabels.length ? ownerLabels.join(", ") : editOwnerFallback;
    setColumns((prev) =>
      prev.map((column) => ({
        ...column,
        deals: column.deals.map((deal) =>
          deal.id === editingDeal.id
            ? {
                ...deal,
                name: editName.trim() || deal.name,
                value: editValue.trim() || deal.value,
                owner: ownerLabel.trim() || deal.owner,
                link: editLink.trim(),
                comments: stripHtml(editDescription),
                description: editDescription,
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
    setColumns((prev) =>
      prev.map((column) =>
        column.id === columnId
          ? {
              ...column,
              deals: [
                  ...column.deals,
                  {
                    id: `deal-${nextId}`,
                    name: "Nova tarefa",
                    value: "R$ 0",
                    owner: "Responsavel",
                    responsibleIds: [],
                    workerIds: [],
                    description: "",
                    categoryIds: [],
                    categoryId: "",
                  },
              ],
            }
          : column
      )
    );
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
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              Visualize oportunidades por estagio e acompanhe o responsavel.
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
            >
              Categorias
            </Button>
            <Button
              variant="outlined"
              onClick={() => setColumnManagerOpen(true)}
              sx={{ textTransform: "none", fontWeight: 600 }}
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
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: "rgba(7, 9, 13, 0.85)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  "&:hover": { backgroundColor: "rgba(7, 9, 13, 0.95)" },
                }}
                aria-label="Voltar colunas"
              >
                <ArrowBackRoundedIcon fontSize="large" />
              </IconButton>
              <IconButton
                onClick={() => scrollColumnsBy("right")}
                sx={{
                  position: "absolute",
                  top: "50%",
                  right: 0,
                  transform: "translate(35%, -50%)",
                  zIndex: 2,
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: "rgba(7, 9, 13, 0.85)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  "&:hover": { backgroundColor: "rgba(7, 9, 13, 0.95)" },
                }}
                aria-label="Avancar colunas"
              >
                <ArrowForwardRoundedIcon fontSize="large" />
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
                {columns.map((column) => (
                  <SortableColumn
                    key={column.id}
                    column={column}
                    onEdit={handleEditOpen}
                    onEditColumn={handleColumnEditOpen}
                    onAddDeal={handleAddDeal}
                    categoryMap={categoryMap}
                    taskQuery={normalizedQuery}
                    getDealOwnerLabel={getDealOwnerLabel}
                    stripHtml={stripHtml}
                  />
                ))}
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
                        width: 260,
                        borderRadius: 2,
                        border: "1px solid rgba(255,255,255,0.08)",
                        backgroundColor: "rgba(15, 23, 32, 0.95)",
                        boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
                      }}
                    >
                      <Stack spacing={1}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {column.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {column.deals.length} tasks
                        </Typography>
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
                        borderRadius: 2,
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
                      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                        {deal.value}
                      </Typography>
                    </Box>
                  );
                })()
              ) : null
            ) : null}
          </DragOverlay>
        </DndContext>
      </Stack>

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
            <TextField
              label="Valor"
              fullWidth
              value={editValue}
              onChange={(event) => setEditValue(event.target.value)}
            />
            <Autocomplete
              multiple
              options={users}
              value={selectUsersByIds(editResponsibleIds)}
              onChange={(_, value) => setEditResponsibleIds(value.map((user) => user.id))}
              getOptionLabel={(option) => formatUserLabel(option)}
              noOptionsText="Nenhum usuario"
              renderInput={(params) => (
                <TextField {...params} label="Responsaveis" fullWidth />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={formatUserLabel(option)}
                    size="small"
                  />
                ))
              }
            />
            <Autocomplete
              multiple
              options={users}
              value={selectUsersByIds(editWorkerIds)}
              onChange={(_, value) => setEditWorkerIds(value.map((user) => user.id))}
              getOptionLabel={(option) => formatUserLabel(option)}
              noOptionsText="Nenhum usuario"
              renderInput={(params) => (
                <TextField {...params} label="Pessoas na tarefa" fullWidth />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={formatUserLabel(option)}
                    size="small"
                  />
                ))
              }
            />
            <TextField
              label="Link"
              fullWidth
              value={editLink}
              onChange={(event) => setEditLink(event.target.value)}
            />
            <Autocomplete
              multiple
              options={categories}
              value={categories.filter((cat) => editCategoryIds.includes(cat.id))}
              onChange={(_, value) => setEditCategoryIds(value.map((cat) => cat.id))}
              getOptionLabel={(option) => option.name}
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
              <MarkdownEditor
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
  categoryMap,
  taskQuery,
  getDealOwnerLabel,
  stripHtml,
}: {
  column: Column;
  onEdit: (deal: Deal) => void;
  onEditColumn: (column: Column) => void;
  onAddDeal: (columnId: string) => void;
  categoryMap: Map<string, Category>;
  taskQuery: string;
  getDealOwnerLabel: (deal: Deal) => string;
  stripHtml: (value: string) => string;
}) {
  const filteredDeals = taskQuery
    ? column.deals.filter((deal) => {
        const description = stripHtml(deal.descriptionHtml || deal.comments || "");
        const haystack = `${deal.name} ${getDealOwnerLabel(deal)} ${deal.value} ${description}`.toLowerCase();
        return haystack.includes(taskQuery);
      })
    : column.deals;
  const displayCount = taskQuery ? filteredDeals.length : column.deals.length;
  const dragId = columnDragId(column.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: dragId,
      data: { type: "column" },
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
        cursor: "grab",
        touchAction: "none",
      }}
      style={style}
      {...attributes}
      {...listeners}
      data-draggable
    >
      <Stack spacing={2}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}
            onClick={() => onEditColumn(column)}
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
              onClick={() => onAddDeal(column.id)}
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
  category,
}: {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  ownerLabel: string;
  category?: Category;
}) {
  const dragId = cardDragId(deal.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: dragId,
      data: { type: "card" },
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
        cursor: "grab",
        touchAction: "none",
      }}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onEdit(deal)}
      data-draggable
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {deal.name}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {ownerLabel}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
        {deal.value}
      </Typography>
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

function MarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (nextValue: string) => void;
}) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const updateValue = (nextValue: string) => {
    onChange(nextValue);
  };

  const wrapSelection = (before: string, after = before) => {
    const input = inputRef.current;
    if (!input) {
      return;
    }
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const selected = value.slice(start, end) || "texto";
    const nextValue = `${value.slice(0, start)}${before}${selected}${after}${value.slice(
      end
    )}`;
    updateValue(nextValue);
    const cursor = start + before.length + selected.length + after.length;
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(cursor, cursor);
    });
  };

  const prefixLines = (prefix: string) => {
    const input = inputRef.current;
    if (!input) {
      return;
    }
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const before = value.slice(0, start);
    const selection = value.slice(start, end) || "texto";
    const after = value.slice(end);
    const nextSelection = selection
      .split("\n")
      .map((line) => `${prefix}${line}`)
      .join("\n");
    const nextValue = `${before}${nextSelection}${after}`;
    updateValue(nextValue);
    const cursor = start + nextSelection.length;
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(cursor, cursor);
    });
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(event.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (!imageItem) {
      return;
    }
    event.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const input = inputRef.current;
      if (!input) {
        return;
      }
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const imageTag = `![imagem](${String(reader.result || "")})`;
      const nextValue = `${value.slice(0, start)}${imageTag}${value.slice(end)}`;
      updateValue(nextValue);
      const cursor = start + imageTag.length;
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(cursor, cursor);
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Button
          variant="outlined"
          size="small"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => wrapSelection("**")}
        >
          Bold
        </Button>
        <Button
          variant="outlined"
          size="small"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => wrapSelection("*")}
        >
          Italic
        </Button>
        <Button
          variant="outlined"
          size="small"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => wrapSelection("__")}
        >
          Underline
        </Button>
        <Button
          variant="outlined"
          size="small"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => prefixLines("# ")}
        >
          H1
        </Button>
        <Button
          variant="outlined"
          size="small"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => prefixLines("## ")}
        >
          H2
        </Button>
        <Button
          variant="outlined"
          size="small"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => prefixLines("### ")}
        >
          H3
        </Button>
        <Button
          variant="outlined"
          size="small"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => prefixLines("- ")}
        >
          Lista
        </Button>
        <Button
          variant="outlined"
          size="small"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => prefixLines("1. ")}
        >
          Numeros
        </Button>
        <Button
          variant="outlined"
          size="small"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => prefixLines("> ")}
        >
          Quote
        </Button>
      </Stack>
      <TextField
        multiline
        minRows={6}
        fullWidth
        value={value}
        onChange={(event) => updateValue(event.target.value)}
        onPaste={handlePaste}
        inputRef={inputRef}
        placeholder="Escreva a descricao da tarefa..."
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "rgba(10, 16, 23, 0.75)",
          },
        }}
      />
    </Stack>
  );
}
