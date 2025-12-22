import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "wouter";
import api from "../api";
import ToggleCheckbox from "../components/ToggleCheckbox";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SettingsIconButton from "../components/SettingsIconButton";
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

const defaultDashboardSections = {
  pipeline: true,
  finance: true,
  access: true,
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
  const [sectionsDialogOpen, setSectionsDialogOpen] = useState(false);
  const restoreDefaultsSnapshotRef = useRef<{
    sections: typeof sections;
  } | null>(null);
  const [restoreDefaultsSnackbarOpen, setRestoreDefaultsSnackbarOpen] =
    useState(false);

  const handleRestoreDashboardDefaults = () => {
    restoreDefaultsSnapshotRef.current = { sections };
    setSections({ ...defaultDashboardSections });
    setRestoreDefaultsSnackbarOpen(true);
  };

  const handleUndoRestoreDashboardDefaults = () => {
    const snapshot = restoreDefaultsSnapshotRef.current;
    if (!snapshot) {
      setRestoreDefaultsSnackbarOpen(false);
      return;
    }
    setSections(snapshot.sections);
    restoreDefaultsSnapshotRef.current = null;
    setRestoreDefaultsSnackbarOpen(false);
  };

  useEffect(() => {
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
    window.localStorage.setItem(
      DASHBOARD_SECTIONS_KEY,
      JSON.stringify(sections)
    );
  }, [sections]);

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
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Home
          </Typography>
          <SettingsIconButton
            title="Configurações da home"
            onClick={() => setSectionsDialogOpen(true)}
          />
        </Stack>

        {sections.pipeline ? (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              border: 1,
              borderColor: "divider",
              backgroundColor: "background.paper",
            }}
          >
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="h6">Pipeline</Typography>
                <Button
                  component={RouterLink}
                  href="/pipeline"
                  variant="outlined"
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Ver pipeline
                </Button>
              </Box>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    flex: 1,
                    border: 1,
                    borderColor: "divider",
                    backgroundColor: "background.paper",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "text.secondary" }}
                  >
                    Total de cards
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {pipelineSummary.totalCount}
                  </Typography>
                </Paper>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    flex: 1,
                    border: 1,
                    borderColor: "divider",
                    backgroundColor: "background.paper",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "text.secondary" }}
                  >
                    Valor total
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatValue(pipelineSummary.totalValue)}
                  </Typography>
                </Paper>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    flex: 1,
                    border: 1,
                    borderColor: "divider",
                    backgroundColor: "background.paper",
                  }}
                >
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
                </Paper>
              </Stack>
            </Stack>
          </Paper>
        ) : null}

        {sections.finance ? (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              border: 1,
              borderColor: "divider",
              backgroundColor: "background.paper",
            }}
          >
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="h6">Finanças</Typography>
                <Button
                  component={RouterLink}
                  href="/financas"
                  variant="outlined"
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Ver financas
                </Button>
              </Box>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    flex: 1,
                    border: 1,
                    borderColor: "divider",
                    backgroundColor: "background.paper",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "text.secondary" }}
                  >
                    Total de gastos
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    R$ {financeSummary.totalSpend.toLocaleString("pt-BR")}
                  </Typography>
                </Paper>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    flex: 1,
                    border: 1,
                    borderColor: "divider",
                    backgroundColor: "background.paper",
                  }}
                >
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
                </Paper>
              </Stack>
            </Stack>
          </Paper>
        ) : null}

        {sections.access ? (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              border: 1,
              borderColor: "divider",
              backgroundColor: "background.paper",
            }}
          >
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="h6">Gestão</Typography>
                <Button
                  component={RouterLink}
                  href="/access"
                  variant="outlined"
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Ver gestao
                </Button>
              </Box>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    flex: 1,
                    border: 1,
                    borderColor: "divider",
                    backgroundColor: "background.paper",
                  }}
                >
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
                </Paper>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    flex: 1,
                    border: 1,
                    borderColor: "divider",
                    backgroundColor: "background.paper",
                  }}
                >
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
                </Paper>
              </Stack>
            </Stack>
          </Paper>
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
              ).map(item => (
                <Paper
                  key={item.key}
                  variant="outlined"
                  onClick={() =>
                    setSections(prev => ({
                      ...prev,
                      [item.key]: !prev[item.key],
                    }))
                  }
                  sx={theme => ({
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    backgroundColor: "background.paper",
                    ...interactiveCardSx(theme),
                  })}
                >
                  <Typography variant="subtitle2">{item.label}</Typography>
                  <ToggleCheckbox
                    checked={sections[item.key]}
                    onChange={event =>
                      setSections(prev => ({
                        ...prev,
                        [item.key]: event.target.checked,
                      }))
                    }
                    onClick={event => event.stopPropagation()}
                  />
                </Paper>
              ))}
            </Stack>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
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
    </Box>
  );
}
