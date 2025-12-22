import { useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "wouter";
import api from "../api";
import ToggleCheckbox from "../components/ToggleCheckbox";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import SettingsIconButton from "../components/SettingsIconButton";
import PageContainer from "../components/layout/PageContainer";
import AppCard from "../components/layout/AppCard";
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
};

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
  const [homeConfigAccordion, setHomeConfigAccordion] = useState<
    false | "pipeline" | "finance" | "access" | "links"
  >(false);
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
  }, [sections]);

  useEffect(() => {
    window.localStorage.setItem(DASHBOARD_ITEMS_KEY, JSON.stringify(items));
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

  return (
    <PageContainer>
      <Stack spacing={3}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: "100%" }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, minWidth: 0 }}>
            Home
          </Typography>
          <SettingsIconButton
            title="Configurações da home"
            onClick={() => setSectionsDialogOpen(true)}
          />
        </Stack>

        {visibleQuickLinks.length ? (
          <AppCard sx={{ p: { xs: 2, md: 2.5 } }}>
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{ alignItems: "center" }}
            >
              {visibleQuickLinks.map(link => (
                <Chip
                  key={link.href}
                  component={RouterLink}
                  href={link.href}
                  clickable
                  label={link.label}
                  variant="outlined"
                />
              ))}
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

      <Dialog
        open={sectionsDialogOpen}
        onClose={() => setSectionsDialogOpen(false)}
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
              <Typography variant="h6">Configurações da home</Typography>
              <IconButton
                onClick={() => setSectionsDialogOpen(false)}
                aria-label="Fechar"
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            <Stack spacing={1.5}>
              {(
                [
                  { key: "pipeline", label: "Pipeline" },
                  { key: "finance", label: "Finanças" },
                  { key: "access", label: "Gestão" },
                ] as const
              ).map(section => {
                const enabled = sections[section.key];
                return (
                  <Accordion
                    key={section.key}
                    expanded={homeConfigAccordion === section.key}
                    onChange={(_, expanded) =>
                      setHomeConfigAccordion(expanded ? section.key : false)
                    }
                    disableGutters
                    elevation={0}
                    sx={theme => ({
                      borderColor: "divider",
                      borderRadius: "var(--radius-card)",
                      overflow: "hidden",
                      "&:before": { display: "none" },
                      ...interactiveCardSx(theme),
                      ...(homeConfigAccordion === section.key ? {} : { mb: 0 }),
                    })}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreRoundedIcon />}
                      sx={{
                        px: 2,
                        py: 0.5,
                        "& .MuiAccordionSummary-content": {
                          my: 1,
                          alignItems: "center",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          gap: 2,
                        }}
                      >
                        <Typography variant="subtitle2">
                          {section.label}
                        </Typography>
                        <ToggleCheckbox
                          checked={enabled}
                          onChange={event =>
                            setSections(prev => ({
                              ...prev,
                              [section.key]: event.target.checked,
                            }))
                          }
                          onClick={event => event.stopPropagation()}
                        />
                      </Box>
                    </AccordionSummary>

                    <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
                      <Stack
                        spacing={1}
                        sx={{
                          opacity: enabled ? 1 : 0.5,
                        }}
                      >
                        {section.key === "pipeline" ? (
                          <>
                            <Paper
                              variant="outlined"
                              onClick={() =>
                                enabled
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
                                p: 1.5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: enabled ? "pointer" : "default",
                                ...interactiveCardSx(theme),
                              })}
                            >
                              <Typography variant="body2">
                                Total de cards
                              </Typography>
                              <ToggleCheckbox
                                checked={items.pipeline.totalCards}
                                disabled={!enabled}
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
                            </Paper>

                            <Paper
                              variant="outlined"
                              onClick={() =>
                                enabled
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
                                p: 1.5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: enabled ? "pointer" : "default",
                                ...interactiveCardSx(theme),
                              })}
                            >
                              <Typography variant="body2">
                                Valor total
                              </Typography>
                              <ToggleCheckbox
                                checked={items.pipeline.totalValue}
                                disabled={!enabled}
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
                            </Paper>

                            <Paper
                              variant="outlined"
                              onClick={() =>
                                enabled
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
                                p: 1.5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: enabled ? "pointer" : "default",
                                ...interactiveCardSx(theme),
                              })}
                            >
                              <Typography variant="body2">
                                Ticket medio
                              </Typography>
                              <ToggleCheckbox
                                checked={items.pipeline.avgTicket}
                                disabled={!enabled}
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
                            </Paper>
                          </>
                        ) : null}

                        {section.key === "finance" ? (
                          <>
                            <Paper
                              variant="outlined"
                              onClick={() =>
                                enabled
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
                                p: 1.5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: enabled ? "pointer" : "default",
                                ...interactiveCardSx(theme),
                              })}
                            >
                              <Typography variant="body2">
                                Total de gastos
                              </Typography>
                              <ToggleCheckbox
                                checked={items.finance.totalSpend}
                                disabled={!enabled}
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
                            </Paper>

                            <Paper
                              variant="outlined"
                              onClick={() =>
                                enabled
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
                                p: 1.5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: enabled ? "pointer" : "default",
                                ...interactiveCardSx(theme),
                              })}
                            >
                              <Typography variant="body2">
                                Categoria em destaque
                              </Typography>
                              <ToggleCheckbox
                                checked={items.finance.topCategory}
                                disabled={!enabled}
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
                            </Paper>
                          </>
                        ) : null}

                        {section.key === "access" ? (
                          <>
                            <Paper
                              variant="outlined"
                              onClick={() =>
                                enabled
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
                                p: 1.5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: enabled ? "pointer" : "default",
                                ...interactiveCardSx(theme),
                              })}
                            >
                              <Typography variant="body2">
                                Papéis ativos
                              </Typography>
                              <ToggleCheckbox
                                checked={items.access.roles}
                                disabled={!enabled}
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
                            </Paper>

                            <Paper
                              variant="outlined"
                              onClick={() =>
                                enabled
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
                                p: 1.5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: enabled ? "pointer" : "default",
                                ...interactiveCardSx(theme),
                              })}
                            >
                              <Typography variant="body2">
                                Modulos ativos
                              </Typography>
                              <ToggleCheckbox
                                checked={items.access.modules}
                                disabled={!enabled}
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
                            </Paper>
                          </>
                        ) : null}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                );
              })}

              <Accordion
                expanded={homeConfigAccordion === "links"}
                onChange={(_, expanded) =>
                  setHomeConfigAccordion(expanded ? "links" : false)
                }
                disableGutters
                elevation={0}
                sx={theme => ({
                  borderColor: "divider",
                  borderRadius: "var(--radius-card)",
                  overflow: "hidden",
                  "&:before": { display: "none" },
                  ...interactiveCardSx(theme),
                  ...(homeConfigAccordion === "links" ? {} : { mb: 0 }),
                })}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreRoundedIcon />}
                  sx={{
                    px: 2,
                    py: 0.5,
                    "& .MuiAccordionSummary-content": {
                      my: 1,
                      alignItems: "center",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      gap: 2,
                    }}
                  >
                    <Typography variant="subtitle2">Links rápidos</Typography>
                    <ToggleCheckbox
                      checked={quickLinksEnabled}
                      onChange={event =>
                        setQuickLinksEnabled(event.target.checked)
                      }
                      onClick={event => event.stopPropagation()}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
                  <Stack
                    spacing={1}
                    sx={{ opacity: quickLinksEnabled ? 1 : 0.5 }}
                  >
                    {dashboardQuickLinks.map(link => (
                      <Paper
                        key={link.href}
                        variant="outlined"
                        onClick={() =>
                          quickLinksEnabled
                            ? setQuickLinksVisible(prev => ({
                                ...prev,
                                [link.href]: !prev[link.href],
                              }))
                            : undefined
                        }
                        sx={theme => ({
                          p: 1.5,
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
                      </Paper>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Stack>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="flex-end"
            >
              <Button
                variant="outlined"
                onClick={handleRestoreDashboardDefaults}
              >
                Restaurar padrão
              </Button>
              <Button
                variant="outlined"
                onClick={() => setSectionsDialogOpen(false)}
              >
                Fechar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

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
