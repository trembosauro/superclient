import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Link as RouterLink } from "wouter";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api";
import { interactiveCardSx } from "../styles/interactiveCard";

type PipelineSummary = {
  id: string;
  stage: string;
  count: number;
  value: string;
  valueTotal: number;
};

type Category = {
  id: string;
  name: string;
  color: string;
};

type Column = {
  id: string;
  title: string;
  deals: Deal[];
};

type Deal = {
  id: string;
  name: string;
  value: string;
  owner: string;
  stage?: string;
  columnId?: string;
};

type DealForm = Deal & { columnId: string };

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

export default function PipelineData() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [showValueFields, setShowValueFields] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [dealForm, setDealForm] = useState<DealForm | null>(null);
  const boardLoadedRef = useRef(false);
  const boardSaveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const loadBoard = async () => {
      try {
        const response = await api.get("/api/pipeline/board");
        const pipeline = response?.data?.pipeline;
        if (Array.isArray(pipeline)) {
          setColumns(pipeline);
        } else if (pipeline?.columns) {
          setColumns(pipeline.columns);
          if (Array.isArray(pipeline.categories)) {
            setCategories(pipeline.categories);
          }
        }
      } catch {
        // Keep empty if the request fails.
      } finally {
        boardLoadedRef.current = true;
      }
    };
    void loadBoard();
  }, []);

  useEffect(() => {
    const applySettings = () => {
      const stored = window.localStorage.getItem("sc_task_fields");
      if (!stored) {
        setShowValueFields(false);
        return;
      }
      try {
        const parsed = JSON.parse(stored) as { value?: boolean };
        setShowValueFields(Boolean(parsed.value));
      } catch {
        window.localStorage.removeItem("sc_task_fields");
        setShowValueFields(false);
      }
    };
    applySettings();
    const handleSettingsChange = () => applySettings();
    window.addEventListener("task-fields-change", handleSettingsChange);
    return () => {
      window.removeEventListener("task-fields-change", handleSettingsChange);
    };
  }, []);

  useEffect(() => {
    if (!boardLoadedRef.current) {
      return;
    }
    if (boardSaveTimeoutRef.current) {
      window.clearTimeout(boardSaveTimeoutRef.current);
    }
    boardSaveTimeoutRef.current = window.setTimeout(() => {
      const payload = categories ? { columns, categories } : { columns };
      void api.put("/api/pipeline/board", { data: payload });
    }, 600);
    return () => {
      if (boardSaveTimeoutRef.current) {
        window.clearTimeout(boardSaveTimeoutRef.current);
      }
    };
  }, [columns, categories]);

  const pipeline = useMemo<PipelineSummary[]>(
    () =>
      columns.map(column => {
        const total = column.deals.reduce(
          (sum, deal) => sum + parseValue(deal.value),
          0
        );
        return {
          id: column.id,
          stage: column.title,
          count: column.deals.length,
          value: formatValue(total),
          valueTotal: total,
        };
      }),
    [columns]
  );

  const pipelineChart = useMemo(
    () =>
      pipeline.map(item => ({
        name: item.stage,
        count: item.count,
        valueTotal: item.valueTotal,
      })),
    [pipeline]
  );

  const pipelineTotals = useMemo(() => {
    const totalCount = pipeline.reduce((sum, item) => sum + item.count, 0);
    const totalValue = pipeline.reduce((sum, item) => sum + item.valueTotal, 0);
    const avgTicket = totalCount > 0 ? totalValue / totalCount : 0;
    const topStage = pipeline.reduce<PipelineSummary | null>((best, item) => {
      if (!best || item.valueTotal > best.valueTotal) {
        return item;
      }
      return best;
    }, null);
    return {
      totalCount,
      totalValue,
      avgTicket,
      topStage,
    };
  }, [pipeline]);

  const taskStatusTotals = useMemo(() => {
    const normalized = (title: string) => title.trim().toLowerCase();
    const pending = columns.reduce((sum, column) => {
      return normalized(column.title).includes("pendente")
        ? sum + column.deals.length
        : sum;
    }, 0);
    const inProgress = columns.reduce((sum, column) => {
      const name = normalized(column.title);
      if (name.includes("execucao") || name.includes("teste")) {
        return sum + column.deals.length;
      }
      return sum;
    }, 0);
    const completed = columns.reduce((sum, column) => {
      const name = normalized(column.title);
      if (name.includes("finalizado") || name.includes("arquivado")) {
        return sum + column.deals.length;
      }
      return sum;
    }, 0);
    return { pending, inProgress, completed };
  }, [columns]);

  const deals = useMemo(
    () =>
      columns.flatMap(column =>
        column.deals.map(deal => ({
          ...deal,
          stage: column.title,
          columnId: column.id,
        }))
      ),
    [columns]
  );

  const openDeal = (deal: Deal & { columnId: string }) => {
    setEditingDeal(deal);
    setDealForm({ ...deal, columnId: deal.columnId });
  };

  const handleDealSave = () => {
    if (!editingDeal || !dealForm) {
      return;
    }
    setColumns(prev => {
      const next = prev.map(column => ({
        ...column,
        deals: column.deals.filter(deal => deal.id !== editingDeal.id),
      }));
      const targetIndex = next.findIndex(
        column => column.id === dealForm.columnId
      );
      if (targetIndex === -1) {
        return prev;
      }
      next[targetIndex] = {
        ...next[targetIndex],
        deals: [
          ...next[targetIndex].deals,
          {
            id: editingDeal.id,
            name: dealForm.name,
            value: dealForm.value,
            owner: dealForm.owner,
          },
        ],
      };
      return next;
    });
    setEditingDeal(null);
    setDealForm(null);
  };

  return (
    <Box sx={{ maxWidth: 1100 }}>
      <Stack spacing={3}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Dados
            </Typography>
          </Box>
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
          {pipeline.map(item => (
            <Paper
              key={item.id}
              elevation={0}
              sx={{
                p: 2.5,
                flex: 1,
                border: 1,
                borderColor: "divider",
                backgroundColor: "background.paper",
              }}
            >
              <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                {item.stage}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {item.count}
              </Typography>
              {showValueFields ? (
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {item.value}
                </Typography>
              ) : null}
            </Paper>
          ))}
        </Stack>

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
            <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
              Tarefas pendentes
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {taskStatusTotals.pending}
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
            <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
              Tarefas em andamento
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {taskStatusTotals.inProgress}
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
            <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
              Tarefas concluidas
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {taskStatusTotals.completed}
            </Typography>
          </Paper>
        </Stack>

        {showValueFields ? (
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
              <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                Valor total
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {formatValue(pipelineTotals.totalValue)}
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
              <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                Ticket medio
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {formatValue(pipelineTotals.avgTicket)}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {pipelineTotals.topStage
                  ? `Maior etapa: ${pipelineTotals.topStage.stage}`
                  : "Sem dados"}
              </Typography>
            </Paper>
          </Stack>
        ) : null}

        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: 1,
            borderColor: "divider",
            backgroundColor: "background.paper",
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Evolucao por etapa
            </Typography>
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineChart}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#9aa6b2", fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: "#9aa6b2", fontSize: 12 }} />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "count") {
                        return [value, "Cards"];
                      }
                      if (name === "valueTotal") {
                        return showValueFields
                          ? [formatValue(Number(value)), "Valor total"]
                          : null;
                      }
                      return [value, name];
                    }}
                    labelFormatter={label => String(label)}
                    contentStyle={{
                      background: "rgba(12, 18, 26, 0.98)",
                      border: 1,
                      borderColor: "divider",
                      color: "#e6edf3",
                    }}
                    itemStyle={{ color: "#e6edf3" }}
                  />
                  <Bar dataKey="count" fill="#22c9a6" radius={[8, 8, 0, 0]} />
                  {showValueFields ? (
                    <Bar
                      dataKey="valueTotal"
                      fill="#1d4ed8"
                      radius={[8, 8, 0, 0]}
                    />
                  ) : null}
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Stack>
        </Paper>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              flex: 1,
              border: 1,
              borderColor: "divider",
              backgroundColor: "background.paper",
            }}
          >
            <Stack spacing={2.5}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Oportunidades chave
              </Typography>
              <Divider />
              <Stack spacing={2}>
                {deals.map(deal => (
                  <Box
                    key={deal.id}
                    onClick={() => openDeal(deal)}
                    sx={theme => ({
                      p: 2,
                      borderRadius: "var(--radius-card)",
                      cursor: "pointer",
                      ...interactiveCardSx(theme),
                    })}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {deal.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {deal.stage} - {deal.owner}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                      {deal.value}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Stack>

      <Dialog
        open={Boolean(editingDeal)}
        onClose={() => setEditingDeal(null)}
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
              <Typography variant="h6">Editar oportunidade</Typography>
              <IconButton
                onClick={() => setEditingDeal(null)}
                sx={{ color: "text.secondary" }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            <TextField
              label="Nome"
              fullWidth
              value={dealForm?.name || ""}
              onChange={event =>
                setDealForm(prev =>
                  prev ? { ...prev, name: event.target.value } : prev
                )
              }
            />
            <TextField
              select
              label="Etapa"
              fullWidth
              value={dealForm?.columnId || ""}
              onChange={event =>
                setDealForm(prev =>
                  prev ? { ...prev, columnId: event.target.value } : prev
                )
              }
            >
              {columns.map(column => (
                <MenuItem key={column.id} value={column.id}>
                  {column.title}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Valor"
              fullWidth
              value={dealForm?.value || ""}
              onChange={event =>
                setDealForm(prev =>
                  prev ? { ...prev, value: event.target.value } : prev
                )
              }
            />
            <TextField
              label="Responsavel"
              fullWidth
              value={dealForm?.owner || ""}
              onChange={event =>
                setDealForm(prev =>
                  prev ? { ...prev, owner: event.target.value } : prev
                )
              }
            />
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="flex-end"
            >
              <Button variant="outlined" onClick={() => setEditingDeal(null)}>
                Cancelar
              </Button>
              <Button variant="contained" onClick={handleDealSave}>
                Salvar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
