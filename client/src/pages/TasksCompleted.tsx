import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Link as RouterLink } from "wouter";
import { interactiveCardSx, interactiveItemSx } from "../styles/interactiveCard";
import CardSection from "../components/layout/CardSection";
import { PageContainer } from "../ui/PageContainer/PageContainer";
import { resolveThemeColor } from "../lib/resolveThemeColor";
import { loadUserStorage, saveUserStorage } from "../userStorage";
import { useIsMobile } from "../hooks/useMobile";

type Category = {
  id: string;
  name: string;
  color: string;
};

type CalendarTask = {
  id: string;
  name: string;
  descriptionHtml?: string;
  categoryIds?: string[];
  date: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  done?: boolean;
};

const STORAGE_TASKS = "calendar_tasks_v1";
const STORAGE_CATEGORIES = "calendar_categories_v1";
const STORAGE_CATEGORY_FILTER = "sc_calendar_category_filter";

const UNCAT_ID = "__uncategorized__";

const normalizeSearch = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export default function TasksCompleted() {
  const isMobile = useIsMobile();
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [showTaskSearch, setShowTaskSearch] = useState(false);
  const [taskQuery, setTaskQuery] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const selectedCategoryId = categoryFilter[0] || "";

  useEffect(() => {
    let active = true;

    const load = async () => {
      const fromDb = await loadUserStorage<CalendarTask[]>(STORAGE_TASKS);
      if (!active) return;
      if (Array.isArray(fromDb)) {
        setTasks(fromDb);
        window.localStorage.setItem(STORAGE_TASKS, JSON.stringify(fromDb));
        return;
      }

      const stored = window.localStorage.getItem(STORAGE_TASKS);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as CalendarTask[];
          if (Array.isArray(parsed)) {
            setTasks(parsed);
            void saveUserStorage(STORAGE_TASKS, parsed);
            return;
          }
        } catch {
          // ignore
        }
      }
      setTasks([]);
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_TASKS, JSON.stringify(tasks));
    void saveUserStorage(STORAGE_TASKS, tasks);
  }, [tasks]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const fromDb = await loadUserStorage<Category[]>(STORAGE_CATEGORIES);
      if (!active) return;
      if (Array.isArray(fromDb)) {
        setCategories(fromDb);
        window.localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(fromDb));
        return;
      }

      const stored = window.localStorage.getItem(STORAGE_CATEGORIES);
      if (!stored) {
        setCategories([]);
        return;
      }
      try {
        const parsed = JSON.parse(stored) as Category[];
        if (Array.isArray(parsed)) {
          setCategories(parsed);
          void saveUserStorage(STORAGE_CATEGORIES, parsed);
          return;
        }
      } catch {
        window.localStorage.removeItem(STORAGE_CATEGORIES);
      }
      setCategories([]);
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_CATEGORY_FILTER);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as string[];
      if (Array.isArray(parsed)) {
        setCategoryFilter(parsed);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_CATEGORY_FILTER);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_CATEGORY_FILTER,
      JSON.stringify(categoryFilter)
    );
  }, [categoryFilter]);

  const completedTasks = useMemo(() => tasks.filter(task => Boolean(task.done)), [tasks]);

  const filteredCompletedTasks = useMemo(() => {
    const query = normalizeSearch(taskQuery);
    return completedTasks
      .filter(task => {
        if (!query) return true;
        return normalizeSearch(task.name).includes(query);
      })
      .filter(task => {
        if (!selectedCategoryId) return true;
        const primaryCategoryId = task.categoryIds?.[0] || "";
        return primaryCategoryId === selectedCategoryId;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
      });
  }, [completedTasks, selectedCategoryId, taskQuery]);

  const tasksByCategory = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    filteredCompletedTasks.forEach(task => {
      const primaryCategoryId = task.categoryIds?.[0] || UNCAT_ID;
      if (!map.has(primaryCategoryId)) {
        map.set(primaryCategoryId, []);
      }
      map.get(primaryCategoryId)?.push(task);
    });
    return map;
  }, [filteredCompletedTasks]);

  const categorySections = useMemo(() => {
    if (selectedCategoryId) {
      const selected = categories.find(cat => cat.id === selectedCategoryId);
      const list = tasksByCategory.get(selectedCategoryId) || [];
      if (!selected) {
        return [] as Array<{ id: string; name: string; color: string; tasks: CalendarTask[] }>;
      }
      return [{ id: selected.id, name: selected.name, color: selected.color, tasks: list }];
    }

    const sections: Array<{ id: string; name: string; color: string; tasks: CalendarTask[] }> = [];
    categories.forEach(cat => {
      const list = tasksByCategory.get(cat.id);
      if (list && list.length) {
        sections.push({ id: cat.id, name: cat.name, color: cat.color, tasks: list });
      }
    });

    const uncategorized = tasksByCategory.get(UNCAT_ID) || [];
    if (uncategorized.length) {
      sections.push({
        id: UNCAT_ID,
        name: "Sem categoria",
        color: "mui.grey.900",
        tasks: uncategorized,
      });
    }

    return sections;
  }, [categories, selectedCategoryId, tasksByCategory]);

  const sidebar = (
    <CardSection size="xs">
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Box
            onClick={() => {
              const next = !showTaskSearch;
              setShowTaskSearch(next);
              if (!next) {
                setTaskQuery("");
              }
            }}
            sx={theme => ({
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1,
              py: 0.75,
              cursor: "pointer",
              borderRadius: "var(--radius-button)",
              ...interactiveItemSx(theme),
              backgroundColor: showTaskSearch
                ? theme.palette.action.selected
                : undefined,
            })}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <SearchRoundedIcon fontSize="small" />
              <Typography variant="body2">Busca</Typography>
            </Stack>
          </Box>
        </Stack>

        <Stack spacing={0.5}>
          <Box
            onClick={() => setCategoryFilter([])}
            sx={theme => ({
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1,
              py: 0.75,
              cursor: "pointer",
              borderRadius: "var(--radius-button)",
              ...interactiveItemSx(theme),
              backgroundColor:
                selectedCategoryId === ""
                  ? theme.palette.action.selected
                  : undefined,
            })}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={theme => ({
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: resolveThemeColor(theme, "mui.grey.900"),
                  border: 1,
                  borderColor: "divider",
                })}
              />
              <Typography variant="body2">Todas</Typography>
            </Stack>
          </Box>
          {categories.map(cat => (
            <Box
              key={cat.id}
              onClick={() => setCategoryFilter([cat.id])}
              sx={theme => ({
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 1,
                py: 0.75,
                cursor: "pointer",
                borderRadius: "var(--radius-button)",
                ...interactiveItemSx(theme),
                backgroundColor:
                  selectedCategoryId === cat.id
                    ? theme.palette.action.selected
                    : undefined,
              })}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={theme => ({
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: resolveThemeColor(theme, cat.color),
                    border: 1,
                    borderColor: "divider",
                  })}
                />
                <Typography variant="body2">{cat.name}</Typography>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Stack>
    </CardSection>
  );

  return (
    <PageContainer
      actionsSlot={
        <Button
          variant="outlined"
          component={RouterLink}
          href="/tarefas"
          sx={{ textTransform: "none", fontWeight: 600, whiteSpace: "nowrap" }}
        >
          Tarefas
        </Button>
      }
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "280px 1fr" },
          gap: 2.5,
        }}
      >
        <Stack
          spacing={2.5}
          sx={{
            display: { xs: "none", md: "flex" },
            position: "sticky",
            top: 16,
            alignSelf: "start",
            height: "fit-content",
          }}
        >
          {sidebar}
        </Stack>

        <Stack spacing={{ xs: 2, md: 2.5 }}>
          {isMobile ? (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="outlined"
                onClick={() => setMobileSidebarOpen(true)}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  textTransform: "none",
                  fontWeight: 600,
                  justifyContent: "space-between",
                }}
              >
                Categorias
              </Button>
              <Button
                variant="outlined"
                component={RouterLink}
                href="/tarefas"
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  minWidth: 0,
                }}
              >
                Tarefas
              </Button>
            </Stack>
          ) : null}

          {showTaskSearch ? (
            <TextField
              placeholder="Buscar tarefa"
              label="Buscar tarefa"
              variant="outlined"
              size="medium"
              fullWidth
              autoFocus
              value={taskQuery}
              onChange={event => setTaskQuery(event.target.value)}
            />
          ) : null}

          {filteredCompletedTasks.length === 0 ? (
            <CardSection size="xs">
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Nenhuma tarefa concluída ainda.
              </Typography>
            </CardSection>
          ) : (
            <Stack spacing={2}>
              {categorySections.map(section => (
                <CardSection key={section.id} size="xs">
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={theme => ({
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor:
                            section.id === UNCAT_ID
                              ? resolveThemeColor(theme, "mui.grey.900")
                              : resolveThemeColor(theme, section.color),
                          border: 1,
                          borderColor: "divider",
                        })}
                      />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {section.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {section.tasks.length}
                      </Typography>
                    </Stack>

                    <Stack spacing={1.25}>
                      {section.tasks.map(task => (
                        <CardSection
                          key={task.id}
                          size="compact"
                          sx={theme => ({
                            ...interactiveCardSx(theme),
                          })}
                        >
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.5}
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            justifyContent="space-between"
                          >
                            <Stack spacing={0.5}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {task.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                {task.date}
                              </Typography>
                            </Stack>

                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() =>
                                setTasks(prev =>
                                  prev.map(item =>
                                    item.id === task.id
                                      ? { ...item, done: false }
                                      : item
                                  )
                                )
                              }
                              sx={{ textTransform: "none", fontWeight: 600, minWidth: 0 }}
                            >
                              Desfazer
                            </Button>
                          </Stack>
                        </CardSection>
                      ))}
                    </Stack>
                  </Stack>
                </CardSection>
              ))}
            </Stack>
          )}
        </Stack>
      </Box>

      <Dialog
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        fullScreen={isMobile}
        fullWidth
        maxWidth="sm"
        disableRestoreFocus
      >
        <DialogContent>
          <Stack spacing={2.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Categorias
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    const next = !showTaskSearch;
                    setShowTaskSearch(next);
                    if (!next) {
                      setTaskQuery("");
                    }
                  }}
                  startIcon={<SearchRoundedIcon />}
                  sx={{ textTransform: "none", fontWeight: 600, minWidth: 0 }}
                >
                  Busca
                </Button>
                <Tooltip title="Fechar" placement="top">
                  <IconButton onClick={() => setMobileSidebarOpen(false)} aria-label="Fechar">
                    <CloseRoundedIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            <CardSection size="xs">
              <Stack spacing={0.5}>
                <Box
                  onClick={() => {
                    setCategoryFilter([]);
                    setMobileSidebarOpen(false);
                  }}
                  sx={theme => ({
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 1,
                    py: 0.75,
                    cursor: "pointer",
                    borderRadius: "var(--radius-button)",
                    ...interactiveItemSx(theme),
                    backgroundColor:
                      selectedCategoryId === "" ? theme.palette.action.selected : undefined,
                  })}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={theme => ({
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: resolveThemeColor(theme, "mui.grey.900"),
                        border: 1,
                        borderColor: "divider",
                      })}
                    />
                    <Typography variant="body2">Todas</Typography>
                  </Stack>
                </Box>
                {categories.map(cat => (
                  <Box
                    key={cat.id}
                    onClick={() => {
                      setCategoryFilter([cat.id]);
                      setMobileSidebarOpen(false);
                    }}
                    sx={theme => ({
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 1,
                      py: 0.75,
                      cursor: "pointer",
                      borderRadius: "var(--radius-button)",
                      ...interactiveItemSx(theme),
                      backgroundColor:
                        selectedCategoryId === cat.id
                          ? theme.palette.action.selected
                          : undefined,
                    })}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={theme => ({
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: resolveThemeColor(theme, cat.color),
                          border: 1,
                          borderColor: "divider",
                        })}
                      />
                      <Typography variant="body2">{cat.name}</Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardSection>
          </Stack>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
