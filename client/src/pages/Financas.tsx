import { useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Checkbox,
  Dialog,
  DialogContent,
  Autocomplete,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SettingsIconButton from "../components/SettingsIconButton";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { useLocation } from "wouter";
import api from "../api";
import ToggleCheckbox from "../components/ToggleCheckbox";
import { interactiveCardSx } from "../styles/interactiveCard";

type Category = {
  id: string;
  name: string;
  color: string;
};

type Expense = {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  comment: string;
  createdAt: string;
  contactIds?: string[];
};

type Contact = {
  id: string;
  name: string;
  emails: string[];
};

const STORAGE_KEY = "finance_data_v1";
const TABLE_FIELDS_KEY = "finance_table_fields_v1";
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
  { id: "cat-moradia", name: "Pessoal", color: DEFAULT_COLORS[0] },
  { id: "cat-alimentacao", name: "Operacional", color: DEFAULT_COLORS[1] },
  { id: "cat-transporte", name: "Marketing", color: DEFAULT_COLORS[2] },
  { id: "cat-saude", name: "Vendas", color: DEFAULT_COLORS[3] },
  { id: "cat-lazer", name: "Tecnologia", color: DEFAULT_COLORS[4] },
  { id: "cat-educacao", name: "Infraestrutura", color: DEFAULT_COLORS[5] },
  { id: "cat-assinaturas", name: "Servicos", color: DEFAULT_COLORS[6] },
  { id: "cat-impostos", name: "Impostos", color: DEFAULT_COLORS[7] },
  { id: "cat-investimentos", name: "Viagens", color: DEFAULT_COLORS[8] },
  { id: "cat-viagem", name: "Treinamento", color: DEFAULT_COLORS[9] },
  { id: "cat-compras", name: "Fornecedores", color: DEFAULT_COLORS[10] },
  { id: "cat-outros", name: "Outros", color: DEFAULT_COLORS[11] },
];

const LEGACY_FINANCE_NAMES = new Set([
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

const NEW_FINANCE_NAMES = new Set([
  "Pessoal",
  "Operacional",
  "Marketing",
  "Vendas",
  "Tecnologia",
  "Infraestrutura",
  "Servicos",
  "Viagens",
  "Treinamento",
  "Fornecedores",
]);

const normalizeCategory = (cat: Partial<Category> | null | undefined, index: number): Category | null => {
  if (!cat || typeof cat.name !== "string") {
    return null;
  }
  const name = cat.name.trim();
  if (!name) {
    return null;
  }
  const id =
    typeof cat.id === "string" && cat.id.trim()
      ? cat.id.trim()
      : `cat-${Date.now()}-${index}`;
  const color =
    typeof cat.color === "string" && cat.color.trim()
      ? cat.color.trim()
      : DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  return { id, name, color };
};

const sanitizeCategories = (input: unknown): Category[] => {
  if (!Array.isArray(input)) {
    return [];
  }
  return input
    .map((cat, index) => normalizeCategory(cat as Partial<Category>, index))
    .filter((cat): cat is Category => Boolean(cat));
};

const shouldResetFinanceCategories = (cats: Category[]) => {
  if (!cats.length) {
    return true;
  }
  const hasNew = cats.some((cat) => NEW_FINANCE_NAMES.has(cat.name));
  return !hasNew;
};

const defaultExpenses: Expense[] = [
  {
    id: "exp-1",
    title: "Assinatura Cloud",
    amount: 2800,
    categoryId: "cat-assinaturas",
    comment: "Infra mensal",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "exp-2",
    title: "Equipe de suporte",
    amount: 9200,
    categoryId: "cat-outros",
    comment: "Fixo",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: "exp-3",
    title: "Aluguel escritorio",
    amount: 5400,
    categoryId: "cat-moradia",
    comment: "Mensal",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: "exp-4",
    title: "Plano de saude",
    amount: 1600,
    categoryId: "cat-saude",
    comment: "Equipe",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
  },
  {
    id: "exp-5",
    title: "Passagens e deslocamento",
    amount: 1200,
    categoryId: "cat-transporte",
    comment: "Visitas",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 24).toISOString(),
  },
  {
    id: "exp-6",
    title: "Workshop interno",
    amount: 900,
    categoryId: "cat-educacao",
    comment: "Treinamento",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 31).toISOString(),
  },
  {
    id: "exp-7",
    title: "Campanha digital",
    amount: 2400,
    categoryId: "cat-compras",
    comment: "Midia paga",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 38).toISOString(),
  },
  {
    id: "exp-8",
    title: "Happy hour time",
    amount: 680,
    categoryId: "cat-lazer",
    comment: "Equipe",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
  },
  {
    id: "exp-9",
    title: "Impostos trimestrais",
    amount: 3100,
    categoryId: "cat-impostos",
    comment: "DARF",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 52).toISOString(),
  },
  {
    id: "exp-10",
    title: "Reserva investimento",
    amount: 3500,
    categoryId: "cat-investimentos",
    comment: "Caixa",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
  },
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

export default function Financas() {
  const [, setLocation] = useLocation();
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [expenses, setExpenses] = useState<Expense[]>(defaultExpenses);
  const [open, setOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategories[0]?.id || "");
  const [comment, setComment] = useState("");
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [expenseQuery, setExpenseQuery] = useState("");
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(DEFAULT_COLORS[0]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryColor, setEditingCategoryColor] = useState(DEFAULT_COLORS[0]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsAccordion, setSettingsAccordion] = useState<
    "categories" | "table" | false
  >(false);
  const [tableFields, setTableFields] = useState({
    title: true,
    category: true,
    amount: true,
    date: true,
    comment: true,
  });
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [removeExpenseOpen, setRemoveExpenseOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [permissions, setPermissions] = useState(() => ({
    pipeline_view: true,
    pipeline_edit_tasks: true,
    pipeline_edit_columns: true,
    finance_view: true,
    finance_edit: true,
  }));
  const isLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);

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
    const defaults = {
      pipeline_view: true,
      pipeline_edit_tasks: true,
      pipeline_edit_columns: true,
      finance_view: true,
      finance_edit: true,
    };
    return { ...defaults, ...(rolePermissions[roleName] || {}) };
  };

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/api/finance/data");
        const data = response?.data?.data;
        const incomingCategories = sanitizeCategories(data?.categories);
        const nextCategories = shouldResetFinanceCategories(incomingCategories)
          ? defaultCategories
          : incomingCategories;
        setCategories(nextCategories);
        if (Array.isArray(data?.expenses)) {
          setExpenses(data.expenses);
        }
        if (nextCategories !== incomingCategories) {
          void api.put("/api/finance/data", {
            categories: nextCategories,
            expenses: Array.isArray(data?.expenses) ? data.expenses : expenses,
          });
        }
      } catch {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as {
              categories?: Category[];
              expenses?: Expense[];
            };
            const incomingCategories = sanitizeCategories(parsed.categories);
            const nextCategories = shouldResetFinanceCategories(incomingCategories)
              ? defaultCategories
              : incomingCategories;
            setCategories(nextCategories);
            if (Array.isArray(parsed.expenses)) {
              setExpenses(parsed.expenses);
            }
            if (nextCategories !== incomingCategories) {
              window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                  categories: nextCategories,
                  expenses: Array.isArray(parsed.expenses) ? parsed.expenses : expenses,
                })
              );
            }
          } catch {
            window.localStorage.removeItem(STORAGE_KEY);
          }
        }
      } finally {
        isLoadedRef.current = true;
      }
    };
    void load();
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
          const sanitized = parsed.filter((item) => item && typeof item.id === "string");
          setContacts(sanitized);
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
    if (!isLoadedRef.current) {
      return;
    }
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      const data = { categories, expenses };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      void api.put("/api/finance/data", data);
    }, 600);
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [categories, expenses]);

  useEffect(() => {
    if (!permissions.finance_view) {
      setLocation("/home");
    }
  }, [permissions.finance_view, setLocation]);

  useEffect(() => {
    const stored = window.localStorage.getItem(TABLE_FIELDS_KEY);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as Partial<typeof tableFields>;
      setTableFields((prev) => ({
        ...prev,
        ...parsed,
      }));
    } catch {
      window.localStorage.removeItem(TABLE_FIELDS_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(TABLE_FIELDS_KEY, JSON.stringify(tableFields));
  }, [tableFields]);

  useEffect(() => {
    if (!isLoadedRef.current) {
      return;
    }
    if (!categories.length) {
      setCategories(defaultCategories);
      return;
    }
    if (shouldResetFinanceCategories(categories)) {
      setCategories(defaultCategories);
    }
  }, [categories]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  const contactMap = useMemo(() => {
    const map = new Map<string, Contact>();
    contacts.forEach((contact) => map.set(contact.id, contact));
    return map;
  }, [contacts]);

  useEffect(() => {
    if (categoryId && categories.some((cat) => cat.id === categoryId)) {
      return;
    }
    setCategoryId(categories[0]?.id || "");
  }, [categories, categoryId]);

  const totalsByCategory = useMemo(() => {
    const totals = new Map<string, number>();
    expenses.forEach((expense) => {
      totals.set(
        expense.categoryId,
        (totals.get(expense.categoryId) || 0) + expense.amount
      );
    });
    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      value: totals.get(cat.id) || 0,
      color: cat.color,
    }));
  }, [categories, expenses]);

  const totalsByMonth = useMemo(() => {
    const buckets = new Map<string, number>();
    expenses.forEach((expense) => {
      const date = new Date(expense.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      buckets.set(key, (buckets.get(key) || 0) + expense.amount);
    });
    return Array.from(buckets.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-6)
      .map(([month, value]) => ({ month, value }));
  }, [expenses]);

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    const normalizedQuery = expenseQuery.trim().toLowerCase();
    return sortedExpenses.filter((expense) => {
      if (categoryFilters.length > 0 && !categoryFilters.includes(expense.categoryId)) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      const haystack = `${expense.title} ${expense.comment}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [sortedExpenses, expenseQuery, categoryFilters]);

  const visibleTableColumns = useMemo(() => {
    const columns = [
      { key: "title", label: "Titulo" },
      { key: "category", label: "Categoria" },
      { key: "amount", label: "Valor" },
      { key: "date", label: "Data" },
      { key: "comment", label: "Comentario" },
    ];
    return columns.filter((column) => tableFields[column.key as keyof typeof tableFields]);
  }, [tableFields]);

  const tableColumnCount = Math.max(1, visibleTableColumns.length);

  const handleSaveExpense = () => {
    if (!permissions.finance_edit) {
      return;
    }
    const parsed = Number(amount.replace(",", "."));
    if (!title.trim() || Number.isNaN(parsed)) {
      return;
    }
    if (editingExpenseId) {
      setExpenses((prev) =>
        prev.map((expense) =>
          expense.id === editingExpenseId
            ? {
                ...expense,
                title: title.trim(),
                amount: parsed,
                categoryId,
                comment: comment.trim(),
                contactIds,
              }
            : expense
        )
      );
    } else {
      const id = `exp-${Date.now()}`;
      setExpenses((prev) => [
        {
          id,
          title: title.trim(),
          amount: parsed,
          categoryId,
          comment: comment.trim(),
          contactIds,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    setTitle("");
    setAmount("");
    setComment("");
    setContactIds([]);
    setEditingExpenseId(null);
    setOpen(false);
  };

  const handleViewOpen = (expense: Expense) => {
    setViewingExpense(expense);
  };

  const handleViewClose = () => {
    setViewingExpense(null);
    setRemoveExpenseOpen(false);
  };

  const handleEditOpen = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setTitle(expense.title);
    setAmount(String(expense.amount));
    setCategoryId(expense.categoryId);
    setComment(expense.comment);
    setContactIds(expense.contactIds || []);
    setOpen(true);
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    const color = newCategoryColor;
    if (!name) {
      return;
    }
    const id = `cat-${Date.now()}`;
    setCategories((prev) => [...prev, { id, name, color }]);
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
    setCategoryId(fallback);
    setExpenses((prev) =>
      prev.map((expense) =>
        expense.categoryId === id ? { ...expense, categoryId: fallback } : expense
      )
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
    const color = editingCategoryColor;
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === editingCategoryId ? { ...cat, name, color } : cat
      )
    );
    setEditingCategoryId(null);
  };

  return (
    <Box sx={{ maxWidth: 1200 }}>
      <Stack spacing={3}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Finanças
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <SettingsIconButton onClick={() => setSettingsOpen(true)} />
            <Button
              variant="contained"
              onClick={() => {
                setEditingExpenseId(null);
                setTitle("");
                setAmount("");
                setComment("");
                setCategoryId(categories[0]?.id || "");
                setContactIds([]);
                setOpen(true);
              }}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Adicionar gasto
            </Button>
          </Stack>
        </Box>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Paper
            variant="outlined"
            sx={{ p: 3, flex: 1 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Gastos por categoria
            </Typography>
            <Box sx={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={totalsByCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    label={({ name }) => `${name}`}
                    labelLine={false}
                    labelStyle={{ fill: "#e6edf3", fontSize: 12 }}
                  >
                    {totalsByCategory.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      background: "rgba(12, 18, 26, 0.98)",
                      border: 1,
                      borderColor: "divider",
                      color: "#e6edf3",
                    }}
                    labelStyle={{ color: "#e6edf3" }}
                    itemStyle={{ color: "#e6edf3" }}
                    cursor={{ fill: "rgba(12, 18, 26, 0.45)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          <Paper
            variant="outlined"
            sx={{ p: 3, flex: 1 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Evolucao mensal
            </Typography>
            <Box sx={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={totalsByMonth}>
                  <XAxis dataKey="month" tick={{ fill: "#9aa6b2", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#9aa6b2", fontSize: 12 }} />
                  <RechartsTooltip
                    contentStyle={{
                      background: "rgba(12, 18, 26, 0.98)",
                      border: 1,
                      borderColor: "divider",
                      color: "#e6edf3",
                    }}
                    labelStyle={{ color: "#e6edf3" }}
                    itemStyle={{ color: "#e6edf3" }}
                    cursor={{ fill: "rgba(12, 18, 26, 0.45)" }}
                  />
                  <Bar dataKey="value" fill="#22c9a6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Stack>

        <Paper
          variant="outlined"
          sx={{ p: 3 }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Detalhe dos gastos
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Buscar gastos"
                value={expenseQuery}
                onChange={(event) => setExpenseQuery(event.target.value)}
                sx={{ minWidth: { xs: "100%", sm: 240 } }}
                InputProps={{
                  endAdornment: expenseQuery ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setExpenseQuery("")}
                        aria-label="Limpar busca"
                      >
                        <CloseRoundedIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
              <Autocomplete
                multiple
                options={categories}
                value={categories.filter((cat) => categoryFilters.includes(cat.id))}
                onChange={(_, value) => setCategoryFilters(value.map((cat) => cat.id))}
                getOptionLabel={(option) => option.name}
                disableCloseOnSelect
                ListboxProps={{
                  style: { maxHeight: 240 },
                }}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox checked={selected} size="small" sx={{ mr: 1 }} />
                    {option.name}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Filtrar categorias" fullWidth />
                )}
                renderTags={(value, getTagProps) => {
                  const visible = value.slice(0, 2);
                  const hiddenCount = value.length - visible.length;
                  return (
                    <>
                      {visible.map((option, index) => (
                        <Chip
                          {...getTagProps({ index })}
                          key={option.id}
                          label={option.name}
                          size="small"
                          sx={{
                            color: "#e6edf3",
                            backgroundColor: darkenColor(option.color, 0.5),
                            maxWidth: 120,
                            "& .MuiChip-label": {
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 100,
                            },
                          }}
                        />
                      ))}
                      {hiddenCount > 0 ? (
                        <Chip
                          label={`+${hiddenCount}`}
                          size="small"
                          sx={{
                            color: "text.secondary",
                            border: 1,
                      borderColor: "divider",
                          }}
                        />
                      ) : null}
                    </>
                  );
                }}
                sx={{
                  minWidth: { xs: "100%", sm: 280 },
                  "& .MuiAutocomplete-inputRoot": { minHeight: 44 },
                }}
              />
            </Stack>
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {tableFields.title ? (
                    <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Titulo
                    </TableCell>
                  ) : null}
                  {tableFields.category ? (
                    <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Categoria
                    </TableCell>
                  ) : null}
                  {tableFields.amount ? (
                    <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Valor
                    </TableCell>
                  ) : null}
                  {tableFields.date ? (
                    <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Data
                    </TableCell>
                  ) : null}
                  {tableFields.comment ? (
                    <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Comentario
                    </TableCell>
                  ) : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableColumnCount} sx={{ color: "text.secondary" }}>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Nenhum gasto encontrado.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => {
                    const category = categoryMap.get(expense.categoryId);
                    return (
                      <TableRow
                        key={expense.id}
                        hover
                        onClick={() => handleViewOpen(expense)}
                        sx={{ cursor: "pointer" }}
                      >
                        {tableFields.title ? (
                          <TableCell>{expense.title}</TableCell>
                        ) : null}
                        {tableFields.category ? (
                          <TableCell>
                            {category ? (
                              <Chip
                                size="small"
                                label={category.name}
                                sx={{
                                  color: "#e6edf3",
                                  backgroundColor: darkenColor(category.color, 0.5),
                                }}
                              />
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        ) : null}
                        {tableFields.amount ? (
                          <TableCell>{expense.amount.toLocaleString("pt-BR")}</TableCell>
                        ) : null}
                        {tableFields.date ? (
                          <TableCell>
                            {new Date(expense.createdAt).toLocaleDateString("pt-BR")}
                          </TableCell>
                        ) : null}
                        {tableFields.comment ? (
                          <TableCell sx={{ color: "text.secondary" }}>
                            {expense.comment || "-"}
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Stack>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingExpenseId(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Stack spacing={2.5}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6">
                {editingExpenseId ? "Editar gasto" : "Adicionar gasto"}
              </Typography>
              <IconButton
                onClick={() => {
                  setOpen(false);
                  setEditingExpenseId(null);
                }}
                sx={{ color: "text.secondary" }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>

            <Stack spacing={2}>
              <TextField
                label="Titulo do gasto"
                fullWidth
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={!permissions.finance_edit}
              />
              <TextField
                label="Valor"
                fullWidth
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={!permissions.finance_edit}
              />
              <TextField
                select
                label="Categoria"
                fullWidth
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                disabled={!permissions.finance_edit}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Comentario"
                fullWidth
                multiline
                minRows={3}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                disabled={!permissions.finance_edit}
              />
              <Autocomplete
                multiple
                options={contacts}
                value={contacts.filter((contact) => contactIds.includes(contact.id))}
                onChange={(_, value) => setContactIds(value.map((contact) => contact.id))}
                getOptionLabel={(option) => option?.name || option?.emails?.[0] || "Contato"}
                noOptionsText="Nenhum contato"
                disabled={!permissions.finance_edit}
                renderInput={(params) => (
                  <TextField {...params} label="Contatos associados" fullWidth />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={option.name || option.emails?.[0] || "Contato"}
                      size="small"
                    />
                  ))
                }
              />
            </Stack>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveExpense}
                disabled={!permissions.finance_edit}
              >
                {editingExpenseId ? "Salvar alterações" : "Salvar gasto"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          cancelEditCategory();
          setSettingsAccordion(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Stack spacing={2.5}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6">Configurações</Typography>
              <IconButton
                onClick={() => {
                  setSettingsOpen(false);
                  cancelEditCategory();
                  setSettingsAccordion(false);
                }}
                sx={{ color: "text.secondary" }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>

            <Accordion
              expanded={settingsAccordion === "categories"}
              onChange={(_, isExpanded) =>
                setSettingsAccordion(isExpanded ? "categories" : false)
              }
            >
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Categorias
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1.5}>
                  {editingCategoryId ? (
                    <Paper variant="outlined" sx={{ p: 2 }}>
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
                              onClick={() => {
                                setEditingCategoryColor(color);
                              }}
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: 1,
                                backgroundColor: color,
                                borderStyle: "solid",
                                borderWidth: editingCategoryColor === color ? 2 : 1,
                                borderColor: "divider",
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
                    </Paper>
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
                              onClick={() => {
                                setNewCategoryColor(color);
                              }}
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
                          sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 600 }}
                        >
                          Criar categoria
                        </Button>
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion
              expanded={settingsAccordion === "table"}
              onChange={(_, isExpanded) =>
                setSettingsAccordion(isExpanded ? "table" : false)
              }
            >
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Tabela de financas
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 1.5,
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={(theme) => ({
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      cursor: "pointer",
                      ...interactiveCardSx(theme),
                    })}
                    onClick={() =>
                      setTableFields((prev) => ({ ...prev, title: !prev.title }))
                    }
                  >
                    <Typography variant="subtitle2">Titulo</Typography>
                    <ToggleCheckbox
                      checked={tableFields.title}
                      onChange={(event) =>
                        setTableFields((prev) => ({
                          ...prev,
                          title: event.target.checked,
                        }))
                      }
                      onClick={(event) => event.stopPropagation()}
                    />
                  </Paper>
                  <Paper
                    variant="outlined"
                    sx={(theme) => ({
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      cursor: "pointer",
                      ...interactiveCardSx(theme),
                    })}
                    onClick={() =>
                      setTableFields((prev) => ({ ...prev, category: !prev.category }))
                    }
                  >
                    <Typography variant="subtitle2">Categoria</Typography>
                    <ToggleCheckbox
                      checked={tableFields.category}
                      onChange={(event) =>
                        setTableFields((prev) => ({
                          ...prev,
                          category: event.target.checked,
                        }))
                      }
                      onClick={(event) => event.stopPropagation()}
                    />
                  </Paper>
                  <Paper
                    variant="outlined"
                    sx={(theme) => ({
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      cursor: "pointer",
                      ...interactiveCardSx(theme),
                    })}
                    onClick={() =>
                      setTableFields((prev) => ({ ...prev, amount: !prev.amount }))
                    }
                  >
                    <Typography variant="subtitle2">Valor</Typography>
                    <ToggleCheckbox
                      checked={tableFields.amount}
                      onChange={(event) =>
                        setTableFields((prev) => ({
                          ...prev,
                          amount: event.target.checked,
                        }))
                      }
                      onClick={(event) => event.stopPropagation()}
                    />
                  </Paper>
                  <Paper
                    variant="outlined"
                    sx={(theme) => ({
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      cursor: "pointer",
                      ...interactiveCardSx(theme),
                    })}
                    onClick={() =>
                      setTableFields((prev) => ({ ...prev, date: !prev.date }))
                    }
                  >
                    <Typography variant="subtitle2">Data</Typography>
                    <ToggleCheckbox
                      checked={tableFields.date}
                      onChange={(event) =>
                        setTableFields((prev) => ({
                          ...prev,
                          date: event.target.checked,
                        }))
                      }
                      onClick={(event) => event.stopPropagation()}
                    />
                  </Paper>
                  <Paper
                    variant="outlined"
                    sx={(theme) => ({
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      cursor: "pointer",
                      ...interactiveCardSx(theme),
                    })}
                    onClick={() =>
                      setTableFields((prev) => ({ ...prev, comment: !prev.comment }))
                    }
                  >
                    <Typography variant="subtitle2">Comentario</Typography>
                    <ToggleCheckbox
                      checked={tableFields.comment}
                      onChange={(event) =>
                        setTableFields((prev) => ({
                          ...prev,
                          comment: event.target.checked,
                        }))
                      }
                      onClick={(event) => event.stopPropagation()}
                    />
                  </Paper>
                </Box>
              </AccordionDetails>
            </Accordion>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="text"
                onClick={() => {
                  setTableFields({
                    title: true,
                    category: true,
                    amount: true,
                    date: true,
                    comment: true,
                  });
                }}
                sx={{ textTransform: "none", fontWeight: 600, color: "text.secondary" }}
              >
                Restaurar padrao
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setSettingsOpen(false);
                  cancelEditCategory();
                  setSettingsAccordion(false);
                }}
              >
                Fechar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(viewingExpense)}
        onClose={handleViewClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Stack spacing={2.5}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6">
                {viewingExpense?.title || "Detalhes do gasto"}
              </Typography>
              <IconButton onClick={handleViewClose} sx={{ color: "text.secondary" }}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                Categoria
              </Typography>
              <Typography variant="body1">
                {viewingExpense
                  ? categoryMap.get(viewingExpense.categoryId)?.name || "-"
                  : "-"}
              </Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                Valor
              </Typography>
              <Typography variant="body1">
                {viewingExpense?.amount.toLocaleString("pt-BR") || "-"}
              </Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                Data
              </Typography>
              <Typography variant="body1">
                {viewingExpense
                  ? new Date(viewingExpense.createdAt).toLocaleDateString("pt-BR")
                  : "-"}
              </Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                Comentario
              </Typography>
              <Typography variant="body1">
                {viewingExpense?.comment || "-"}
              </Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                Contatos associados
              </Typography>
              {viewingExpense?.contactIds?.length ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {viewingExpense.contactIds
                    .map((id) => contactMap.get(id))
                    .filter(Boolean)
                    .map((contact) => (
                      <Chip
                        key={contact?.id}
                        label={contact?.name || contact?.emails?.[0] || "Contato"}
                        size="small"
                      />
                    ))}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Nenhum contato associado.
                </Typography>
              )}
            </Stack>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              {permissions.finance_edit ? (
                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => setRemoveExpenseOpen(true)}
                >
                  Remover
                </Button>
              ) : null}
              {permissions.finance_edit ? (
                <Button
                  variant="outlined"
                  onClick={() => {
                    if (viewingExpense) {
                      handleEditOpen(viewingExpense);
                      setViewingExpense(null);
                    }
                  }}
                >
                  Editar
                </Button>
              ) : null}
              <Button variant="contained" onClick={handleViewClose}>
                Fechar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={removeExpenseOpen}
        onClose={() => setRemoveExpenseOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6">Remover gasto</Typography>
              <IconButton onClick={() => setRemoveExpenseOpen(false)} sx={{ color: "text.secondary" }}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Você confirma a exclusão deste gasto? Essa ação não pode ser desfeita.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => setRemoveExpenseOpen(false)}>
                Cancelar
              </Button>
              <Button
                color="error"
                variant="contained"
                onClick={() => {
                  if (!viewingExpense) {
                    return;
                  }
                  setExpenses((prev) =>
                    prev.filter((expense) => expense.id !== viewingExpense.id)
                  );
                  setViewingExpense(null);
                  setRemoveExpenseOpen(false);
                }}
              >
                Remover
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
