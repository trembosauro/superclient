import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "wouter";
import { interactiveCardSx } from "../styles/interactiveCard";
import CardSection from "../components/layout/CardSection";
import PageContainer from "../components/layout/PageContainer";
import { CategoryChip } from "../components/CategoryChip";

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
  calendarId?: string;
  date: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  done?: boolean;
};

type CalendarSource = {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
};

const STORAGE_TASKS = "calendar_tasks_v1";
const STORAGE_CATEGORIES = "calendar_categories_v1";
const STORAGE_CALENDARS = "calendar_sources_v1";
const STORAGE_CATEGORY_FILTER = "sc_calendar_category_filter";

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateKey = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return new Date();
  }
  return new Date(year, month - 1, day);
};

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

export default function CalendarCompleted() {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [calendarSources, setCalendarSources] = useState<CalendarSource[]>([]);
  const [calendarFilter, setCalendarFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_TASKS);
    if (!stored) {
      setTasks([]);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as CalendarTask[];
      if (Array.isArray(parsed)) {
        setTasks(parsed);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_TASKS);
      setTasks([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_CATEGORIES);
    if (!stored) {
      setCategories([]);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as Category[];
      if (Array.isArray(parsed)) {
        setCategories(parsed);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_CATEGORIES);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_CALENDARS);
    if (!stored) {
      setCalendarSources([]);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as CalendarSource[];
      if (Array.isArray(parsed)) {
        setCalendarSources(parsed);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_CALENDARS);
      setCalendarSources([]);
    }
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

  const activeCalendarIds = useMemo(
    () =>
      new Set(
        calendarSources.filter(item => item.enabled).map(item => item.id)
      ),
    [calendarSources]
  );

  const doneTasksByDate = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    tasks.forEach(task => {
      if (!task.done) {
        return;
      }
      if (
        task.calendarId &&
        calendarSources.length &&
        !activeCalendarIds.has(task.calendarId)
      ) {
        return;
      }
      if (
        calendarFilter.length &&
        !calendarFilter.includes(task.calendarId || "")
      ) {
        return;
      }
      if (categoryFilter.length) {
        const taskCategories = task.categoryIds || [];
        const hasMatch = taskCategories.some(id => categoryFilter.includes(id));
        if (!hasMatch) {
          return;
        }
      }
      const key = task.date;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(task);
    });
    map.forEach(list =>
      list.sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
      )
    );
    return map;
  }, [
    tasks,
    calendarSources.length,
    activeCalendarIds,
    calendarFilter,
    categoryFilter,
  ]);

  const agendaDays = useMemo(() => {
    const days = Array.from(doneTasksByDate.keys())
      .map(parseDateKey)
      .sort((a, b) => a.getTime() - b.getTime());
    return days;
  }, [doneTasksByDate]);

  return (
    <PageContainer>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Tarefas feitas
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Tudo que foi concluido no calendario.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            component={RouterLink}
            href="/calendario"
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Voltar para o calendario
          </Button>
        </Stack>

        <CardSection size="xs">
          <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
            <Autocomplete
              multiple
              options={calendarSources}
              value={calendarSources.filter(item =>
                calendarFilter.includes(item.id)
              )}
              onChange={(_, value) =>
                setCalendarFilter(value.map(item => item.id))
              }
              getOptionLabel={option => option.name}
              disableCloseOnSelect
              ListboxProps={{ style: { maxHeight: 240 } }}
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <Checkbox checked={selected} size="small" sx={{ mr: 1 }} />
                  {option.name}
                </li>
              )}
              renderInput={params => (
                <TextField {...params} label="Filtrar calendarios" fullWidth />
              )}
              renderTags={(value, getTagProps) => {
                const visible = value.slice(0, 2);
                const hiddenCount = value.length - visible.length;
                return (
                  <>
                    {visible.map((option, index) => (
                      <CategoryChip
                        {...getTagProps({ index })}
                        key={option.id}
                        label={option.name}
                        categoryColor={option.color}
                        maxWidth={120}
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
                flex: 1,
                minWidth: 260,
                "& .MuiAutocomplete-inputRoot": { minHeight: 44 },
              }}
            />
            <Autocomplete
              multiple
              options={categories}
              value={categories.filter(item =>
                categoryFilter.includes(item.id)
              )}
              onChange={(_, value) =>
                setCategoryFilter(value.map(item => item.id))
              }
              getOptionLabel={option => option.name}
              disableCloseOnSelect
              ListboxProps={{ style: { maxHeight: 240 } }}
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <Checkbox checked={selected} size="small" sx={{ mr: 1 }} />
                  {option.name}
                </li>
              )}
              renderInput={params => (
                <TextField {...params} label="Filtrar categorias" fullWidth />
              )}
              renderTags={(value, getTagProps) => {
                const visible = value.slice(0, 2);
                const hiddenCount = value.length - visible.length;
                return (
                  <>
                    {visible.map((option, index) => (
                      <CategoryChip
                        {...getTagProps({ index })}
                        key={option.id}
                        label={option.name}
                        categoryColor={option.color}
                        maxWidth={120}
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
                flex: 1,
                minWidth: 260,
                "& .MuiAutocomplete-inputRoot": { minHeight: 44 },
              }}
            />
          </Stack>
        </CardSection>

        {agendaDays.length === 0 ? (
          <CardSection size="xs">
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Nenhuma tarefa concluida ainda.
            </Typography>
          </CardSection>
        ) : (
          <Stack spacing={2}>
            {agendaDays.map(day => {
              const dateKey = formatDateKey(day);
              const dayTasks = doneTasksByDate.get(dateKey) || [];
              return (
                <CardSection key={dateKey} size="xs">
                  <Stack spacing={1.5}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Stack>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          {day.toLocaleDateString("pt-BR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                          })}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          {dayTasks.length} tarefas
                        </Typography>
                      </Stack>
                    </Stack>
                    <Divider />
                    <Stack spacing={1.5}>
                      {dayTasks.map(task => (
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
                                      calendarSources.find(
                                        source => source.id === task.calendarId
                                      )?.color || "primary.main",
                                  }}
                                />
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {task.name}
                                </Typography>
                              </Stack>
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                {task.allDay
                                  ? "Dia todo"
                                  : [task.startTime, task.endTime]
                                      .filter(Boolean)
                                      .join(" - ") || "Horário livre"}
                              </Typography>
                              {task.location ? (
                                <Typography
                                  variant="caption"
                                  sx={{ color: "text.secondary" }}
                                >
                                  {task.location}
                                </Typography>
                              ) : null}
                            </Stack>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              {(task.categoryIds || [])
                                .map(id =>
                                  categories.find(cat => cat.id === id)
                                )
                                .filter(Boolean)
                                .map(cat => (
                                  <Chip
                                    key={cat?.id}
                                    label={cat?.name}
                                    size="small"
                                    sx={{
                                      color: "#e6edf3",
                                      backgroundColor: cat
                                        ? darkenColor(cat.color, 0.5)
                                        : "transparent",
                                    }}
                                  />
                                ))}
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
                                sx={{ textTransform: "none", fontWeight: 600 }}
                              >
                                Desfazer
                              </Button>
                            </Stack>
                          </Stack>
                        </CardSection>
                      ))}
                    </Stack>
                  </Stack>
                </CardSection>
              );
            })}
          </Stack>
        )}
      </Stack>
    </PageContainer>
  );
}
