import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink, useLocation } from "wouter";
import api from "../api";
import { saveUserStorage } from "../userStorage";
import ToggleCheckbox from "../components/ToggleCheckbox";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import SettingsIconButton from "../components/SettingsIconButton";
import { PageContainer } from "../ui/PageContainer/PageContainer";
import AppCard from "../components/layout/AppCard";
import CardSection from "../components/layout/CardSection";
import { Card } from "../ui/Card";
import { CardSection as VeCardSection } from "../ui/CardSection";
import SettingsDialog from "../components/SettingsDialog";
import { interactiveCardSx } from "../styles/interactiveCard";

type Deal = {
  id: string;
  value: string;
};

type Column = {
  id: string;
  title: string;
  deals: Deal[];
};

type Expense = {
  id: string;
  amount: number;
  categoryId: string;
};

type Category = {
  id: string;
  name: string;
};

type Role = {
  id: number;
  name: string;
  members: number;
};

type Module = {
  id: number;
  name: string;
  enabled: boolean;
};

type Invite = {
  id: number;
  status: string;
};

type CompletedTaskNotification = {
  id: string;
  taskId: string;
  taskName: string;
  completedAt: string;
};

const parseValue = (value: string) => {
  const normalized = value.replace(/\s/g, "").toLowerCase();
  const numberMatch = normalized.match(/([\d.,]+)/);
  if (!numberMatch) {
    return 0;
  }
  const raw = numberMatch[1].replace(/\./g, "").replace(",", ".");
  const base = Number(raw) || 0;
  const suffix = normalized.match(/([km])/);
  if (!suffix) {
    return base;
  }
  return suffix[1] === "m" ? base * 1_000_000 : base * 1_000;
};

const formatValue = (value: number) => {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace(".0", "")}M`;
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(0)}k`;
  }
  return `R$ ${Math.round(value).toLocaleString("pt-BR")}`;
};

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "agora mesmo";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days}d`;
  return date.toLocaleDateString("pt-BR");
};

const DASHBOARD_SECTIONS_KEY = "dashboard_sections_v1";

const DASHBOARD_ITEMS_KEY = "dashboard_items_v1";

const DASHBOARD_QUICK_LINKS_KEY = "dashboard_quick_links_v1";

const dashboardQuickLinks = [
  { label: "Pipeline", href: "/pipeline", module: "pipeline" },
  { label: "Finanças", href: "/financas", module: "finance" },
  { label: "Contatos", href: "/contatos", module: "contacts" },
  { label: "Calendário", href: "/calendario", module: "calendar" },
  { label: "Notas", href: "/notas", module: "notes" },
  { label: "Gestão", href: "/access", module: "access" },
] as const;

const defaultQuickLinksState = {
  enabled: true,
  visible: Object.fromEntries(
    dashboardQuickLinks.map(link => [link.href, true])
  ) as Record<(typeof dashboardQuickLinks)[number]["href"], boolean>,
};

const defaultDashboardSections = {
  pipeline: true,
  finance: true,
  access: true,
  notifications: true,
};

const defaultNotificationsCount = 3;
const NOTIFICATIONS_COUNT_KEY = "dashboard_notifications_count";
const COMPLETED_TASKS_KEY = "sc_completed_tasks_notifications";

const defaultDashboardItems = {
  pipeline: {
    totalCards: true,
    totalValue: true,
    avgTicket: true,
  },
  finance: {
    totalSpend: true,
    topCategory: true,
  },
  access: {
    roles: true,
    modules: true,
  },
};

export default function Dashboard() {
  const [location, navigate] = useLocation();
  const [columns, setColumns] = useState<Column[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [sections, setSections] = useState({
    ...defaultDashboardSections,
  });
  const [items, setItems] = useState({
    ...defaultDashboardItems,
  });
  const [sectionsDialogOpen, setSectionsDialogOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(defaultNotificationsCount);
  const [completedTasks, setCompletedTasks] = useState<CompletedTaskNotification[]>([]);
  const [quickLinksEnabled, setQuickLinksEnabled] = useState(
    defaultQuickLinksState.enabled
  );
  const [quickLinksVisible, setQuickLinksVisible] = useState<
    Record<string, boolean>
  >({ ...defaultQuickLinksState.visible });
  const [moduleAccess, setModuleAccess] = useState({
    pipeline: true,
    finance: true,
    contacts: true,
    calendar: true,
    notes: true,
    access: true,
  });
  const restoreDefaultsSnapshotRef = useRef<{
    sections: typeof sections;
    items: typeof items;
    quickLinksEnabled: typeof quickLinksEnabled;
    quickLinksVisible: typeof quickLinksVisible;
  } | null>(null);
  const [restoreDefaultsSnackbarOpen, setRestoreDefaultsSnackbarOpen] =
    useState(false);
  const pipelineLoadedRef = useRef(false);
  const financeLoadedRef = useRef(false);
  const accessLoadedRef = useRef(false);

  const handleRestoreDashboardDefaults = () => {
    restoreDefaultsSnapshotRef.current = {
      sections,
      items,
      quickLinksEnabled,
      quickLinksVisible,
    };
    setSections({ ...defaultDashboardSections });
    setItems({ ...defaultDashboardItems });
    setQuickLinksEnabled(defaultQuickLinksState.enabled);
    setQuickLinksVisible({ ...defaultQuickLinksState.visible });
    setRestoreDefaultsSnackbarOpen(true);
  };

  const handleUndoRestoreDashboardDefaults = () => {
    const snapshot = restoreDefaultsSnapshotRef.current;
    if (!snapshot) {
      setRestoreDefaultsSnackbarOpen(false);
      return;
    }
    setSections(snapshot.sections);
    setItems(snapshot.items);
    setQuickLinksEnabled(snapshot.quickLinksEnabled);
    setQuickLinksVisible(snapshot.quickLinksVisible);
    restoreDefaultsSnapshotRef.current = null;
    setRestoreDefaultsSnackbarOpen(false);
  };

  useEffect(() => {
    const applyFromPrefs = () => {
      const storedPrefs = window.localStorage.getItem("sc_prefs");
      if (!storedPrefs) {
        return;
      }
      try {
        const parsed = JSON.parse(storedPrefs) as {
          modulePipeline?: boolean;
          moduleFinance?: boolean;
          moduleContacts?: boolean;
          moduleCalendar?: boolean;
          moduleNotes?: boolean;
        };
        setModuleAccess({
          pipeline: Boolean(parsed.modulePipeline ?? true),
          finance: Boolean(parsed.moduleFinance ?? true),
          contacts: Boolean(parsed.moduleContacts ?? true),
          calendar: Boolean(parsed.moduleCalendar ?? true),
          notes: Boolean(parsed.moduleNotes ?? true),
          access: true,
        });
      } catch {
        window.localStorage.removeItem("sc_prefs");
      }
    };

    applyFromPrefs();
    window.addEventListener("prefs-change", applyFromPrefs);
    return () => window.removeEventListener("prefs-change", applyFromPrefs);
  }, []);

  useEffect(() => {
    if (pipelineLoadedRef.current) {
      return;
    }
    pipelineLoadedRef.current = true;
    const load = async () => {
      try {
        const response = await api.get("/api/pipeline/board");
        const pipeline = response?.data?.pipeline;
        if (Array.isArray(pipeline)) {
          setColumns(pipeline);
        } else if (pipeline?.columns) {
          setColumns(pipeline.columns);
        }
      } catch {
        // Keep empty on failure.
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (financeLoadedRef.current) {
      return;
    }
    financeLoadedRef.current = true;
    const loadFinance = async () => {
      try {
        const response = await api.get("/api/finance/data");
        const data = response?.data?.data;
        if (data?.expenses) {
          setExpenses(data.expenses);
        }
        if (data?.categories) {
          setCategories(data.categories);
        }
      } catch {
        // Keep empty on failure.
      }
    };
    void loadFinance();
  }, []);

  useEffect(() => {
    if (accessLoadedRef.current) {
      return;
    }
    accessLoadedRef.current = true;
    const loadAccess = async () => {
      try {
        const [rolesResponse, modulesResponse, invitesResponse] =
          await Promise.all([
            api.get("/api/access/roles"),
            api.get("/api/access/modules"),
            api.get("/api/access/invites"),
          ]);
        setRoles(rolesResponse?.data?.roles || []);
        setModules(modulesResponse?.data?.modules || []);
        setInvites(invitesResponse?.data?.invites || []);
      } catch {
        // Keep empty on failure.
      }
    };
    void loadAccess();
  }, []);

  // Load notifications
  useEffect(() => {
    const loadCompletedTasks = () => {
      const stored = window.localStorage.getItem(COMPLETED_TASKS_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as CompletedTaskNotification[];
          if (Array.isArray(parsed)) {
            setCompletedTasks(parsed);
          }
        } catch {
          setCompletedTasks([]);
        }
      }
    };

    const loadNotificationsCount = () => {
      const stored = window.localStorage.getItem(NOTIFICATIONS_COUNT_KEY);
      if (stored) {
        const count = Number(stored);
        if ([3, 6, 9].includes(count)) {
          setNotificationsCount(count);
        }
      }
    };

    loadCompletedTasks();
    loadNotificationsCount();

    const handleTaskCompleted = () => loadCompletedTasks();
    window.addEventListener("task-completed", handleTaskCompleted);
    return () => window.removeEventListener("task-completed", handleTaskCompleted);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(NOTIFICATIONS_COUNT_KEY, String(notificationsCount));
  }, [notificationsCount]);

  useEffect(() => {
    const stored = window.localStorage.getItem(DASHBOARD_SECTIONS_KEY);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as Partial<typeof sections>;
      setSections(prev => ({ ...prev, ...parsed }));
    } catch {
      window.localStorage.removeItem(DASHBOARD_SECTIONS_KEY);
    }
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(DASHBOARD_ITEMS_KEY);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as Partial<typeof items>;
      setItems(prev => ({
        ...prev,
        ...parsed,
        pipeline: { ...prev.pipeline, ...(parsed.pipeline || {}) },
        finance: { ...prev.finance, ...(parsed.finance || {}) },
        access: { ...prev.access, ...(parsed.access || {}) },
      }));
    } catch {
      window.localStorage.removeItem(DASHBOARD_ITEMS_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      DASHBOARD_SECTIONS_KEY,
      JSON.stringify(sections)
    );
    const timeoutId = setTimeout(() => {
      void saveUserStorage(DASHBOARD_SECTIONS_KEY, sections);
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [sections]);

  useEffect(() => {
    window.localStorage.setItem(DASHBOARD_ITEMS_KEY, JSON.stringify(items));
    const timeoutId = setTimeout(() => {
      void saveUserStorage(DASHBOARD_ITEMS_KEY, items);
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [items]);

  useEffect(() => {
    const stored = window.localStorage.getItem(DASHBOARD_QUICK_LINKS_KEY);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as {
        enabled?: boolean;
        visible?: Record<string, boolean>;
      };
      if (typeof parsed.enabled === "boolean") {
        setQuickLinksEnabled(parsed.enabled);
      }
      if (parsed.visible && typeof parsed.visible === "object") {
        setQuickLinksVisible(prev => ({ ...prev, ...parsed.visible }));
      }
    } catch {
      window.localStorage.removeItem(DASHBOARD_QUICK_LINKS_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      DASHBOARD_QUICK_LINKS_KEY,
      JSON.stringify({ enabled: quickLinksEnabled, visible: quickLinksVisible })
    );
    const timeoutId = setTimeout(() => {
      void saveUserStorage(DASHBOARD_QUICK_LINKS_KEY, { enabled: quickLinksEnabled, visible: quickLinksVisible });
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [quickLinksEnabled, quickLinksVisible]);

  const visibleQuickLinks = useMemo(() => {
    if (!quickLinksEnabled) {
      return [] as Array<(typeof dashboardQuickLinks)[number]>;
    }
    return dashboardQuickLinks
      .filter(link => {
        if (link.module === "pipeline") return moduleAccess.pipeline;
        if (link.module === "finance") return moduleAccess.finance;
        if (link.module === "contacts") return moduleAccess.contacts;
        if (link.module === "calendar") return moduleAccess.calendar;
        if (link.module === "notes") return moduleAccess.notes;
        return true;
      })
      .filter(link => Boolean(quickLinksVisible[link.href]));
  }, [moduleAccess, quickLinksEnabled, quickLinksVisible]);

  const pipelineSummary = useMemo(() => {
    const totalCount = columns.reduce(
      (sum, column) => sum + column.deals.length,
      0
    );
    const totalValue = columns.reduce(
      (sum, column) =>
        sum +
        column.deals.reduce((acc, deal) => acc + parseValue(deal.value), 0),
      0
    );
    const avgTicket = totalCount > 0 ? totalValue / totalCount : 0;
    const topStage = columns.reduce<Column | null>((best, column) => {
      const columnValue = column.deals.reduce(
        (acc, deal) => acc + parseValue(deal.value),
        0
      );
      const bestValue = best
        ? best.deals.reduce((acc, deal) => acc + parseValue(deal.value), 0)
        : -1;
      return columnValue > bestValue ? column : best;
    }, null);
    return { totalCount, totalValue, avgTicket, topStage };
  }, [columns]);

  const financeSummary = useMemo(() => {
    const totalSpend = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const totalsByCategory = new Map<string, number>();
    expenses.forEach(expense => {
      totalsByCategory.set(
        expense.categoryId,
        (totalsByCategory.get(expense.categoryId) || 0) + expense.amount
      );
    });
    let topCategoryId = "";
    let topCategoryValue = 0;
    totalsByCategory.forEach((value, id) => {
      if (value > topCategoryValue) {
        topCategoryValue = value;
        topCategoryId = id;
      }
    });
    const topCategory = categories.find(cat => cat.id === topCategoryId);
    return {
      totalSpend,
      topCategory,
      topCategoryValue,
    };
  }, [expenses, categories]);

  const accessSummary = useMemo(() => {
    const rolesCount = roles.length;
    const membersCount = roles.reduce((sum, role) => sum + role.members, 0);
    const enabledModules = modules.filter(module => module.enabled).length;
    const pendingInvites = invites.filter(
      invite => invite.status === "Pendente"
    ).length;
    return { rolesCount, membersCount, enabledModules, pendingInvites };
  }, [roles, modules, invites]);

  const pageActions = useMemo(
    () => (
      <SettingsIconButton
        title="Configurações da home"
        onClick={() => setSectionsDialogOpen(true)}
      />
    ),
    []
  );

  return (
    <PageContainer actionsSlot={pageActions}>
      <Stack spacing={3}>
        {visibleQuickLinks.length ? (
          <AppCard sx={{ p: { xs: 2, md: 2.5 }, display: { xs: "block", md: "none" } }}>
            <Stack
              direction="row"
              spacing={0}
              flexWrap="wrap"
              useFlexGap
              sx={{ alignItems: "center" }}
            >
              {visibleQuickLinks.map(link => (
                <Button
                  key={link.href}
                  component={RouterLink}
                  href={link.href}
                  variant="text"
                  color="inherit"
                  size="small"
                  sx={theme => ({
                    minWidth: 0,
                    fontWeight: 600,
                    borderRadius: theme.shape.borderRadius,
                    minHeight: 36,
                    px: 1.25,
                    py: 0.75,
                    color:
                      location === link.href
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary,
                    backgroundColor:
                      location === link.href
                        ? alpha(theme.palette.primary.main, 0.12)
                        : "transparent",
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                    },
                    "&:active": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.18),
                    },
                  })}
                >
                  {link.label}
                </Button>
              ))}
            </Stack>
          </AppCard>
        ) : null}

        {sections.notifications ? (
          <AppCard sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="h6">Notificações</Typography>
                <Tooltip title="Ir para Notificações" placement="top">
                  <IconButton
                    component={RouterLink}
                    href="/notifications"
                    aria-label="Ir para Notificações"
                    sx={theme => ({
                      border: 1,
                      borderColor: "divider",
                      borderRadius: theme.shape.borderRadius,
                    })}
                  >
                    <ArrowForwardRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              {completedTasks.length > 0 ? (
                <Stack spacing={1}>
                  {completedTasks.slice(0, notificationsCount).map(task => (
                    <VeCardSection
                      key={task.id}
                      size="compact"
                      interactive
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/calendario?task=${task.taskId}`)}
                      onKeyDown={event => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/calendario?task=${task.taskId}`);
                        }
                      }}
                    >
                      <Box>
                        <Typography variant="body2">{task.taskName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Concluída {formatTimeAgo(task.completedAt)}
                        </Typography>
                      </Box>
                    </VeCardSection>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma notificação recente
                </Typography>
              )}
            </Stack>
          </AppCard>
        ) : null}

        {sections.pipeline ? (
          <AppCard sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="h6">Pipeline</Typography>
                <Tooltip title="Ir para Pipeline" placement="top">
                  <IconButton
                    component={RouterLink}
                    href="/pipeline"
                    aria-label="Ir para Pipeline"
                    sx={{
                      border: 1,
                      borderColor: "divider",
                    }}
                  >
                    <ArrowForwardRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                {items.pipeline.totalCards ? (
                  <AppCard sx={{ p: 2.5, flex: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "text.secondary" }}
                    >
                      Total de cards
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {pipelineSummary.totalCount}
                    </Typography>
                  </AppCard>
                ) : null}

                {items.pipeline.totalValue ? (
                  <AppCard sx={{ p: 2.5, flex: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "text.secondary" }}
                    >
                      Valor total
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {formatValue(pipelineSummary.totalValue)}
                    </Typography>
                  </AppCard>
                ) : null}

                {items.pipeline.avgTicket ? (
                  <AppCard sx={{ p: 2.5, flex: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "text.secondary" }}
                    >
                      Ticket medio
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {formatValue(pipelineSummary.avgTicket)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {pipelineSummary.topStage
                        ? `Maior etapa: ${pipelineSummary.topStage.title}`
                        : "Sem dados"}
                    </Typography>
                  </AppCard>
                ) : null}
              </Stack>
            </Stack>
          </AppCard>
        ) : null}

        {sections.finance ? (
          <AppCard sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="h6">Finanças</Typography>
                <Tooltip title="Ir para Finanças" placement="top">
                  <IconButton
                    component={RouterLink}
                    href="/financas"
                    aria-label="Ir para Finanças"
                    sx={{
                      border: 1,
                      borderColor: "divider",
                    }}
                  >
                    <ArrowForwardRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                {items.finance.totalSpend ? (
                  <AppCard sx={{ p: 2.5, flex: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "text.secondary" }}
                    >
                      Total de gastos
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      R$ {financeSummary.totalSpend.toLocaleString("pt-BR")}
                    </Typography>
                  </AppCard>
                ) : null}

                {items.finance.topCategory ? (
                  <AppCard sx={{ p: 2.5, flex: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "text.secondary" }}
                    >
                      Categoria em destaque
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {financeSummary.topCategory?.name || "Sem dados"}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {financeSummary.topCategory
                        ? `R$ ${financeSummary.topCategoryValue.toLocaleString("pt-BR")} em gastos`
                        : "Sem gastos registrados"}
                    </Typography>
                  </AppCard>
                ) : null}
              </Stack>
            </Stack>
          </AppCard>
        ) : null}

        {sections.access ? (
          <AppCard sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="h6">Gestão</Typography>
                <Tooltip title="Ir para Gestão" placement="top">
                  <IconButton
                    component={RouterLink}
                    href="/access"
                    aria-label="Ir para Gestão"
                    sx={{
                      border: 1,
                      borderColor: "divider",
                    }}
                  >
                    <ArrowForwardRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                {items.access.roles ? (
                  <AppCard sx={{ p: 2.5, flex: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "text.secondary" }}
                    >
                      Papéis ativos
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {accessSummary.rolesCount}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {accessSummary.membersCount} membros no total
                    </Typography>
                  </AppCard>
                ) : null}

                {items.access.modules ? (
                  <AppCard sx={{ p: 2.5, flex: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "text.secondary" }}
                    >
                      Modulos ativos
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {accessSummary.enabledModules}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {accessSummary.pendingInvites} convites pendentes
                    </Typography>
                  </AppCard>
                ) : null}
              </Stack>
            </Stack>
          </AppCard>
        ) : null}

      </Stack>

      <SettingsDialog
        open={sectionsDialogOpen}
        onClose={() => setSectionsDialogOpen(false)}
        title="Configurações da home"
        maxWidth="xs"
        onRestoreDefaults={handleRestoreDashboardDefaults}
        sections={[
          {
            key: "pipeline",
            title: "Pipeline",
            headerToggle: (
              <ToggleCheckbox
                checked={sections.pipeline}
                onChange={event =>
                  setSections(prev => ({
                    ...prev,
                    pipeline: event.target.checked,
                  }))
                }
                onClick={event => event.stopPropagation()}
              />
            ),
            content: (
              <Stack spacing={1} sx={{ opacity: sections.pipeline ? 1 : 0.5 }}>
                <CardSection
                  size="compact"
                  onClick={() =>
                    sections.pipeline
                      ? setItems(prev => ({
                          ...prev,
                          pipeline: {
                            ...prev.pipeline,
                            totalCards: !prev.pipeline.totalCards,
                          },
                        }))
                      : undefined
                  }
                  sx={theme => ({
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: sections.pipeline ? "pointer" : "default",
                    ...interactiveCardSx(theme),
                  })}
                >
                  <Typography variant="body2">Total de cards</Typography>
                  <ToggleCheckbox
                    checked={items.pipeline.totalCards}
                    disabled={!sections.pipeline}
                    onChange={event =>
                      setItems(prev => ({
                        ...prev,
                        pipeline: {
                          ...prev.pipeline,
                          totalCards: event.target.checked,
                        },
                      }))
                    }
                    onClick={event => event.stopPropagation()}
                  />
                </CardSection>
                <CardSection
                  size="compact"
                  onClick={() =>
                    sections.pipeline
                      ? setItems(prev => ({
                          ...prev,
                          pipeline: {
                            ...prev.pipeline,
                            totalValue: !prev.pipeline.totalValue,
                          },
                        }))
                      : undefined
                  }
                  sx={theme => ({
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: sections.pipeline ? "pointer" : "default",
                    ...interactiveCardSx(theme),
                  })}
                >
                  <Typography variant="body2">Valor total</Typography>
                  <ToggleCheckbox
                    checked={items.pipeline.totalValue}
                    disabled={!sections.pipeline}
                    onChange={event =>
                      setItems(prev => ({
                        ...prev,
                        pipeline: {
                          ...prev.pipeline,
                          totalValue: event.target.checked,
                        },
                      }))
                    }
                    onClick={event => event.stopPropagation()}
                  />
                </CardSection>
                <CardSection
                  size="compact"
                  onClick={() =>
                    sections.pipeline
                      ? setItems(prev => ({
                          ...prev,
                          pipeline: {
                            ...prev.pipeline,
                            avgTicket: !prev.pipeline.avgTicket,
                          },
                        }))
                      : undefined
                  }
                  sx={theme => ({
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: sections.pipeline ? "pointer" : "default",
                    ...interactiveCardSx(theme),
                  })}
                >
                  <Typography variant="body2">Ticket medio</Typography>
                  <ToggleCheckbox
                    checked={items.pipeline.avgTicket}
                    disabled={!sections.pipeline}
                    onChange={event =>
                      setItems(prev => ({
                        ...prev,
                        pipeline: {
                          ...prev.pipeline,
                          avgTicket: event.target.checked,
                        },
                      }))
                    }
                    onClick={event => event.stopPropagation()}
                  />
                </CardSection>
              </Stack>
            ),
          },
          {
            key: "finance",
            title: "Finanças",
            headerToggle: (
              <ToggleCheckbox
                checked={sections.finance}
                onChange={event =>
                  setSections(prev => ({
                    ...prev,
                    finance: event.target.checked,
                  }))
                }
                onClick={event => event.stopPropagation()}
              />
            ),
            content: (
              <Stack spacing={1} sx={{ opacity: sections.finance ? 1 : 0.5 }}>
                <CardSection
                  size="compact"
                  onClick={() =>
                    sections.finance
                      ? setItems(prev => ({
                          ...prev,
                          finance: {
                            ...prev.finance,
                            totalSpend: !prev.finance.totalSpend,
                          },
                        }))
                      : undefined
                  }
                  sx={theme => ({
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: sections.finance ? "pointer" : "default",
                    ...interactiveCardSx(theme),
                  })}
                >
                  <Typography variant="body2">Total de gastos</Typography>
                  <ToggleCheckbox
                    checked={items.finance.totalSpend}
                    disabled={!sections.finance}
                    onChange={event =>
                      setItems(prev => ({
                        ...prev,
                        finance: {
                          ...prev.finance,
                          totalSpend: event.target.checked,
                        },
                      }))
                    }
                    onClick={event => event.stopPropagation()}
                  />
                </CardSection>
                <CardSection
                  size="compact"
                  onClick={() =>
                    sections.finance
                      ? setItems(prev => ({
                          ...prev,
                          finance: {
                            ...prev.finance,
                            topCategory: !prev.finance.topCategory,
                          },
                        }))
                      : undefined
                  }
                  sx={theme => ({
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: sections.finance ? "pointer" : "default",
                    ...interactiveCardSx(theme),
                  })}
                >
                  <Typography variant="body2">Categoria em destaque</Typography>
                  <ToggleCheckbox
                    checked={items.finance.topCategory}
                    disabled={!sections.finance}
                    onChange={event =>
                      setItems(prev => ({
                        ...prev,
                        finance: {
                          ...prev.finance,
                          topCategory: event.target.checked,
                        },
                      }))
                    }
                    onClick={event => event.stopPropagation()}
                  />
                </CardSection>
              </Stack>
            ),
          },
          {
            key: "access",
            title: "Gestão",
            headerToggle: (
              <ToggleCheckbox
                checked={sections.access}
                onChange={event =>
                  setSections(prev => ({
                    ...prev,
                    access: event.target.checked,
                  }))
                }
                onClick={event => event.stopPropagation()}
              />
            ),
            content: (
              <Stack spacing={1} sx={{ opacity: sections.access ? 1 : 0.5 }}>
                <CardSection
                  size="compact"
                  onClick={() =>
                    sections.access
                      ? setItems(prev => ({
                          ...prev,
                          access: {
                            ...prev.access,
                            roles: !prev.access.roles,
                          },
                        }))
                      : undefined
                  }
                  sx={theme => ({
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: sections.access ? "pointer" : "default",
                    ...interactiveCardSx(theme),
                  })}
                >
                  <Typography variant="body2">Papéis ativos</Typography>
                  <ToggleCheckbox
                    checked={items.access.roles}
                    disabled={!sections.access}
                    onChange={event =>
                      setItems(prev => ({
                        ...prev,
                        access: {
                          ...prev.access,
                          roles: event.target.checked,
                        },
                      }))
                    }
                    onClick={event => event.stopPropagation()}
                  />
                </CardSection>
                <CardSection
                  size="compact"
                  onClick={() =>
                    sections.access
                      ? setItems(prev => ({
                          ...prev,
                          access: {
                            ...prev.access,
                            modules: !prev.access.modules,
                          },
                        }))
                      : undefined
                  }
                  sx={theme => ({
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: sections.access ? "pointer" : "default",
                    ...interactiveCardSx(theme),
                  })}
                >
                  <Typography variant="body2">Modulos ativos</Typography>
                  <ToggleCheckbox
                    checked={items.access.modules}
                    disabled={!sections.access}
                    onChange={event =>
                      setItems(prev => ({
                        ...prev,
                        access: {
                          ...prev.access,
                          modules: event.target.checked,
                        },
                      }))
                    }
                    onClick={event => event.stopPropagation()}
                  />
                </CardSection>
              </Stack>
            ),
          },
          {
            key: "notifications",
            title: "Notificações",
            headerToggle: (
              <ToggleCheckbox
                checked={sections.notifications}
                onChange={event =>
                  setSections(prev => ({
                    ...prev,
                    notifications: event.target.checked,
                  }))
                }
                onClick={event => event.stopPropagation()}
              />
            ),
            content: (
              <Stack spacing={1} sx={{ opacity: sections.notifications ? 1 : 0.5 }}>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                  Quantidade de notificações a exibir na home
                </Typography>
                <TextField
                  select
                  size="small"
                  value={notificationsCount}
                  onChange={event => setNotificationsCount(Number(event.target.value))}
                  disabled={!sections.notifications}
                  fullWidth
                >
                  <MenuItem value={3}>3 notificações</MenuItem>
                  <MenuItem value={6}>6 notificações</MenuItem>
                  <MenuItem value={9}>9 notificações</MenuItem>
                </TextField>
              </Stack>
            ),
          },
          {
            key: "links",
            title: "Links rápidos",
            headerToggle: (
              <ToggleCheckbox
                checked={quickLinksEnabled}
                onChange={event => setQuickLinksEnabled(event.target.checked)}
                onClick={event => event.stopPropagation()}
              />
            ),
            content: (
              <Stack spacing={1} sx={{ opacity: quickLinksEnabled ? 1 : 0.5 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", mb: 0.5 }}>
                  Os links rápidos são exibidos apenas no mobile para agilizar a navegação em dispositivos móveis.
                </Typography>
                {dashboardQuickLinks.map(link => (
                  <CardSection
                    size="compact"
                    key={link.href}
                    onClick={() =>
                      quickLinksEnabled
                        ? setQuickLinksVisible(prev => ({
                            ...prev,
                            [link.href]: !prev[link.href],
                          }))
                        : undefined
                    }
                    sx={theme => ({
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: quickLinksEnabled ? "pointer" : "default",
                      ...interactiveCardSx(theme),
                    })}
                  >
                    <Typography variant="body2">{link.label}</Typography>
                    <ToggleCheckbox
                      checked={Boolean(quickLinksVisible[link.href])}
                      disabled={!quickLinksEnabled}
                      onChange={event =>
                        setQuickLinksVisible(prev => ({
                          ...prev,
                          [link.href]: event.target.checked,
                        }))
                      }
                      onClick={event => event.stopPropagation()}
                    />
                  </CardSection>
                ))}
              </Stack>
            ),
          },
        ]}
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
              onClick={handleUndoRestoreDashboardDefaults}
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
