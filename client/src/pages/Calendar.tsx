import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Badge,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "wouter";
import {
  DragEndEvent,
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import FormatBoldRoundedIcon from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRoundedIcon from "@mui/icons-material/FormatItalicRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import LooksOneRoundedIcon from "@mui/icons-material/LooksOneRounded";
import LooksTwoRoundedIcon from "@mui/icons-material/LooksTwoRounded";
import Looks3RoundedIcon from "@mui/icons-material/Looks3Rounded";
import BackspaceRoundedIcon from "@mui/icons-material/BackspaceRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import api from "../api";
import ToggleCheckbox from "../components/ToggleCheckbox";
import { interactiveCardSx } from "../styles/interactiveCard";
import SettingsIconButton from "../components/SettingsIconButton";

type Category = {
  id: string;
  name: string;
  color: string;
};

type CalendarTask = {
  id: string;
  name: string;
  link?: string;
  descriptionHtml?: string;
  responsibleIds?: string[];
  workerIds?: string[];
  categoryIds?: string[];
  calendarId?: string;
  date: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  reminder?: "none" | "10m" | "30m" | "1h" | "1d";
  repeat?: "none" | "daily" | "weekly" | "monthly" | "yearly";
  visibility?: "public" | "private";
  notification?: "app" | "email" | "push";
  allDay?: boolean;
  done?: boolean;
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
  { id: "cat-reunioes", name: "Reuniões", color: DEFAULT_COLORS[0] },
  { id: "cat-trabalho", name: "Trabalho", color: DEFAULT_COLORS[1] },
  { id: "cat-pessoal", name: "Pessoal", color: DEFAULT_COLORS[2] },
  { id: "cat-aniversario", name: "Aniversários", color: DEFAULT_COLORS[3] },
  { id: "cat-viagem", name: "Viagem", color: DEFAULT_COLORS[4] },
  { id: "cat-saude", name: "Saude", color: DEFAULT_COLORS[5] },
  { id: "cat-estudos", name: "Estudos", color: DEFAULT_COLORS[6] },
  { id: "cat-financas", name: "Pagamentos", color: DEFAULT_COLORS[7] },
  { id: "cat-feriados", name: "Feriados", color: DEFAULT_COLORS[8] },
  { id: "cat-lembretes", name: "Lembretes", color: DEFAULT_COLORS[9] },
];

const defaultCalendars: CalendarSource[] = [
  { id: "cal-trabalho", name: "Trabalho", color: "#1d4ed8", enabled: true },
  { id: "cal-pessoal", name: "Pessoal", color: "#16a34a", enabled: true },
  { id: "cal-equipe", name: "Equipe", color: "#7c3aed", enabled: true },
  { id: "cal-financas", name: "Financeiro", color: "#ea580c", enabled: true },
];

const monthLabels = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const weekLabels = ["D", "S", "T", "Q", "Q", "S", "S"];

const darkenColor = (value: string, factor: number) => {
  const color = value.replace("#", "");
  if (color.length !== 6) {
    return value;
  }
  const r = Math.max(0, Math.min(255, Math.floor(parseInt(color.slice(0, 2), 16) * factor)));
  const g = Math.max(0, Math.min(255, Math.floor(parseInt(color.slice(2, 4), 16) * factor)));
  const b = Math.max(0, Math.min(255, Math.floor(parseInt(color.slice(4, 6), 16) * factor)));
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

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

const getCalendarDays = (base: Date) => {
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  const days: Array<Date | null> = [];
  const startOffset = start.getDay();
  for (let i = 0; i < startOffset; i += 1) {
    days.push(null);
  }
  for (let day = 1; day <= end.getDate(); day += 1) {
    days.push(new Date(base.getFullYear(), base.getMonth(), day));
  }
  while (days.length % 7 !== 0) {
    days.push(null);
  }
  return days;
};

const getSampleTasks = (base: Date): CalendarTask[] => {
  const year = base.getFullYear();
  const month = base.getMonth();
  const makeDate = (day: number) => formatDateKey(new Date(year, month, day));
  return [
    {
      id: "cal-sample-1",
      name: "Reuniao de kickoff",
      calendarId: "cal-equipe",
      categoryIds: ["cat-reunioes"],
      date: makeDate(3),
      startTime: "09:00",
      endTime: "10:00",
      location: "Sala Orion",
      reminder: "10m",
      repeat: "none",
      visibility: "public",
      notification: "app",
      allDay: false,
      descriptionHtml: "<p>Alinhar metas e entregas da semana.</p>",
      link: "https://meet.google.com/abc-defg-hij",
      done: false,
    },
    {
      id: "cal-sample-2",
      name: "Entrega do relatorio financeiro",
      calendarId: "cal-financas",
      categoryIds: ["cat-financas"],
      date: makeDate(5),
      startTime: "14:00",
      endTime: "15:30",
      location: "Financeiro",
      reminder: "1h",
      repeat: "monthly",
      visibility: "private",
      notification: "email",
      allDay: false,
      descriptionHtml: "<p>Enviar relatorio mensal para diretoria.</p>",
      done: true,
    },
    {
      id: "cal-sample-3",
      name: "Consulta medica",
      calendarId: "cal-pessoal",
      categoryIds: ["cat-saude"],
      date: makeDate(7),
      startTime: "11:00",
      endTime: "12:00",
      location: "Clinica Central",
      reminder: "30m",
      repeat: "none",
      visibility: "private",
      notification: "push",
      allDay: false,
      descriptionHtml: "<p>Levar exames anteriores.</p>",
      done: false,
    },
    {
      id: "cal-sample-4",
      name: "Feriado municipal",
      calendarId: "cal-trabalho",
      categoryIds: ["cat-feriados"],
      date: makeDate(9),
      reminder: "1d",
      repeat: "none",
      visibility: "public",
      notification: "app",
      allDay: true,
      descriptionHtml: "<p>Sem expediente.</p>",
      done: true,
    },
    {
      id: "cal-sample-5",
      name: "Planejamento de sprint",
      calendarId: "cal-equipe",
      categoryIds: ["cat-trabalho", "cat-reunioes"],
      date: makeDate(11),
      startTime: "10:00",
      endTime: "11:30",
      location: "Online",
      reminder: "30m",
      repeat: "weekly",
      visibility: "public",
      notification: "app",
      allDay: false,
      descriptionHtml: "<p>Definir backlog e prioridades.</p>",
      link: "https://zoom.us/j/123456789",
      done: false,
    },
    {
      id: "cal-sample-6",
      name: "Aniversário da Ana",
      calendarId: "cal-pessoal",
      categoryIds: ["cat-aniversario"],
      date: makeDate(13),
      reminder: "1d",
      repeat: "yearly",
      visibility: "private",
      notification: "push",
      allDay: true,
      descriptionHtml: "<p>Comprar presente.</p>",
      done: false,
    },
    {
      id: "cal-sample-7",
      name: "Pagamento do aluguel",
      calendarId: "cal-financas",
      categoryIds: ["cat-financas"],
      date: makeDate(15),
      reminder: "1d",
      repeat: "monthly",
      visibility: "private",
      notification: "email",
      allDay: true,
      descriptionHtml: "<p>Agendar transferencia.</p>",
      done: true,
    },
    {
      id: "cal-sample-8",
      name: "Estudo de UX",
      calendarId: "cal-trabalho",
      categoryIds: ["cat-estudos"],
      date: makeDate(18),
      startTime: "16:00",
      endTime: "17:30",
      location: "Sala 2",
      reminder: "10m",
      repeat: "none",
      visibility: "public",
      notification: "app",
      allDay: false,
      descriptionHtml: "<p>Revisar guidelines de acessibilidade.</p>",
      done: false,
    },
    {
      id: "cal-sample-9",
      name: "Viagem para cliente",
      calendarId: "cal-trabalho",
      categoryIds: ["cat-viagem"],
      date: makeDate(21),
      reminder: "1d",
      repeat: "none",
      visibility: "public",
      notification: "app",
      allDay: true,
      descriptionHtml: "<p>Levar material de apresentação.</p>",
      done: false,
    },
    {
      id: "cal-sample-10",
      name: "Lembrete pessoal",
      calendarId: "cal-pessoal",
      categoryIds: ["cat-lembretes"],
      date: makeDate(24),
      startTime: "08:30",
      endTime: "09:00",
      location: "Casa",
      reminder: "10m",
      repeat: "none",
      visibility: "private",
      notification: "app",
      allDay: false,
      descriptionHtml: "<p>Separar documentos do dia.</p>",
      done: false,
    },
  ];
};

export default function Calendar() {
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [calendarSources, setCalendarSources] =
    useState<CalendarSource[]>(defaultCalendars);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [users, setUsers] = useState<PipelineUser[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [calendarSettingsOpen, setCalendarSettingsOpen] = useState(false);
  const [configAccordion, setConfigAccordion] = useState<"fields" | "categories" | false>(false);
  const [calendarSettings, setCalendarSettings] = useState({
    showAllDay: true,
    showTime: true,
    showLocation: true,
    showParticipants: true,
    showReminders: true,
    showRepeat: true,
    showCategories: true,
    showDescription: true,
    showMeetingLink: true,
    showVisibility: true,
    showNotifications: true,
  });
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(DEFAULT_COLORS[0]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryColor, setEditingCategoryColor] = useState(DEFAULT_COLORS[0]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [agendaPage, setAgendaPage] = useState(1);
  const [agendaPerPage, setAgendaPerPage] = useState(3);
  const [draftTask, setDraftTask] = useState<CalendarTask | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<CalendarTask | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const datePickerAnchorRef = useRef<HTMLButtonElement | null>(null);
  const pipelineSnapshotRef = useRef<{ columns: unknown[]; sprints?: unknown } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }));

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_TASKS);
    if (!stored) {
      const sample = getSampleTasks(new Date());
      setTasks(sample);
      window.localStorage.setItem(STORAGE_TASKS, JSON.stringify(sample));
      return;
    }
    try {
      const parsed = JSON.parse(stored) as CalendarTask[];
      if (Array.isArray(parsed) && parsed.length) {
        setTasks(parsed);
        return;
      }
      const sample = getSampleTasks(new Date());
      setTasks(sample);
      window.localStorage.setItem(STORAGE_TASKS, JSON.stringify(sample));
    } catch {
      window.localStorage.removeItem(STORAGE_TASKS);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_CATEGORIES);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as Category[];
      if (Array.isArray(parsed) && parsed.length) {
        setCategories(parsed);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_CATEGORIES);
    }
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_CALENDARS);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as CalendarSource[];
      if (Array.isArray(parsed) && parsed.length) {
        setCalendarSources(parsed);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_CALENDARS);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_CALENDARS, JSON.stringify(calendarSources));
  }, [calendarSources]);

  useEffect(() => {
    const loadPipelineCategories = async () => {
      try {
        const response = await api.get("/api/pipeline/board");
        const pipeline = response?.data?.pipeline;
        const nextCategories = Array.isArray(pipeline?.categories)
          ? (pipeline.categories as Category[])
          : [];
        if (nextCategories.length) {
          setCategories(nextCategories);
          window.localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(nextCategories));
        }
        pipelineSnapshotRef.current = {
          columns: Array.isArray(pipeline?.columns) ? pipeline.columns : [],
          sprints: pipeline?.sprints,
        };
      } catch {
        // Keep local categories if pipeline fetch fails.
      }
    };
    void loadPipelineCategories();
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
        // Keep empty on failure.
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
    const stored = window.localStorage.getItem("sc_calendar_settings");
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as Partial<typeof calendarSettings>;
      setCalendarSettings({
        showAllDay: parsed.showAllDay !== undefined ? Boolean(parsed.showAllDay) : true,
        showTime: parsed.showTime !== undefined ? Boolean(parsed.showTime) : true,
        showLocation: parsed.showLocation !== undefined ? Boolean(parsed.showLocation) : true,
        showParticipants:
          parsed.showParticipants !== undefined ? Boolean(parsed.showParticipants) : true,
        showReminders: parsed.showReminders !== undefined ? Boolean(parsed.showReminders) : true,
        showRepeat: parsed.showRepeat !== undefined ? Boolean(parsed.showRepeat) : true,
        showCategories: parsed.showCategories !== undefined ? Boolean(parsed.showCategories) : true,
        showDescription:
          parsed.showDescription !== undefined ? Boolean(parsed.showDescription) : true,
        showMeetingLink:
          parsed.showMeetingLink !== undefined ? Boolean(parsed.showMeetingLink) : true,
        showVisibility:
          parsed.showVisibility !== undefined ? Boolean(parsed.showVisibility) : true,
        showNotifications:
          parsed.showNotifications !== undefined ? Boolean(parsed.showNotifications) : true,
      });
    } catch {
      window.localStorage.removeItem("sc_calendar_settings");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("sc_calendar_settings", JSON.stringify(calendarSettings));
    window.dispatchEvent(new Event("task-fields-change"));
  }, [calendarSettings]);

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
    window.localStorage.setItem(STORAGE_CATEGORY_FILTER, JSON.stringify(categoryFilter));
  }, [categoryFilter]);

  const personOptions = useMemo<PersonOption[]>(() => {
    const userOptions = users.map((user) => ({
      id: `user:${user.id}`,
      name: user.name?.trim() ? user.name : user.email,
      email: user.email,
      type: "user" as const,
    }));
    const contactOptions = contacts.map((contact) => ({
      id: `contact:${contact.id}`,
      name: contact.name || contact.emails?.[0] || "Contato",
      email: contact.emails?.[0],
      type: "contact" as const,
    }));
    return [...userOptions, ...contactOptions];
  }, [users, contacts]);

  const formatPersonLabel = (person?: PersonOption) => {
    if (!person) {
      return "";
    }
    return person.name || person.email || "";
  };

  const calendarMap = useMemo(() => {
    const map = new Map<string, CalendarSource>();
    calendarSources.forEach((source) => map.set(source.id, source));
    return map;
  }, [calendarSources]);

  const selectPersonsByIds = (ids?: string[]) =>
    personOptions.filter((person) => ids?.includes(person.id));

  const activeCalendarIds = useMemo(
    () => new Set(calendarSources.filter((item) => item.enabled).map((item) => item.id)),
    [calendarSources]
  );

  const tasksByDate = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    tasks.forEach((task) => {
      if (task.calendarId && !activeCalendarIds.has(task.calendarId)) {
        return;
      }
      if (task.done) {
        return;
      }
      if (categoryFilter.length) {
        const taskCategories = task.categoryIds || [];
        const hasMatch = taskCategories.some((id) => categoryFilter.includes(id));
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
    map.forEach((list) =>
      list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }))
    );
    return map;
  }, [tasks, activeCalendarIds, categoryFilter]);

  const statusCounts = useMemo(() => {
    let pending = 0;
    let done = 0;
    tasks.forEach((task) => {
      if (task.calendarId && !activeCalendarIds.has(task.calendarId)) {
        return;
      }
      if (categoryFilter.length) {
        const taskCategories = task.categoryIds || [];
        const hasMatch = taskCategories.some((id) => categoryFilter.includes(id));
        if (!hasMatch) {
          return;
        }
      }
      if (task.done) {
        done += 1;
      } else {
        pending += 1;
      }
    });
    return { pending, done };
  }, [tasks, activeCalendarIds, categoryFilter]);

  const agendaDays = useMemo(() => {
    const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
    const days: Date[] = [];
    for (let day = 1; day <= monthEnd.getDate(); day += 1) {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
      const key = formatDateKey(date);
      if (tasksByDate.has(key) || key === formatDateKey(selectedDate)) {
        days.push(date);
      }
    }
    return days;
  }, [selectedMonth, selectedDate, tasksByDate]);

  const totalAgendaPages = Math.max(1, Math.ceil(agendaDays.length / agendaPerPage));

  useEffect(() => {
    if (agendaPage > totalAgendaPages) {
      setAgendaPage(totalAgendaPages);
    }
  }, [agendaPage, totalAgendaPages]);

  const pagedAgendaDays = useMemo(() => {
    const start = (agendaPage - 1) * agendaPerPage;
    return agendaDays.slice(start, start + agendaPerPage);
  }, [agendaDays, agendaPage, agendaPerPage]);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const taskId = active.data.current?.taskId as string | undefined;
    const nextDate = over?.data.current?.dateKey as string | undefined;
    if (!taskId || !nextDate) {
      return;
    }
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, date: nextDate } : task))
    );
  };

  const DraggableTaskCard = ({
    taskId,
    onClick,
    children,
  }: {
    taskId: string;
    onClick: () => void;
    children: ReactNode;
  }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: taskId,
      data: { taskId },
    });
    return (
      <Paper
        ref={setNodeRef}
        elevation={0}
        onClick={onClick}
        {...attributes}
        {...listeners}
        sx={(theme) => ({
          p: 1.5,
          borderRadius: "var(--radius-card)",
          border: 1,
          borderColor: "divider",
          backgroundColor: "background.paper",
          cursor: isDragging ? "grabbing" : "grab",
          opacity: isDragging ? 0.7 : 1,
          transform: CSS.Transform.toString(transform),
          touchAction: "none",
          userSelect: "none",
          ...interactiveCardSx(theme),
        })}
      >
        {children}
      </Paper>
    );
  };

  const DroppableDay = ({
    dateKey,
    children,
  }: {
    dateKey: string;
    children: ReactNode;
  }) => {
    const { isOver, setNodeRef } = useDroppable({
      id: `day-${dateKey}`,
      data: { dateKey },
    });
    return (
      <Paper
        ref={setNodeRef}
        elevation={0}
        variant="outlined"
        sx={{
          p: 2,
          borderColor: isOver ? "primary.main" : "divider",
          backgroundColor: isOver ? "action.hover" : "background.paper",
          transition: "border-color 0.2s ease, background-color 0.2s ease",
        }}
      >
        {children}
      </Paper>
    );
  };

  const handleCreateTask = (date?: Date) => {
    const targetDate = date || selectedDate;
    const defaultCalendar = calendarSources.find((item) => item.enabled) || calendarSources[0];
    const newTask: CalendarTask = {
      id: `cal-${Date.now()}`,
      name: "Nova tarefa",
      link: "",
      location: "",
      responsibleIds: [],
      workerIds: [],
      descriptionHtml: "",
      categoryIds: [],
      calendarId: defaultCalendar?.id,
      date: formatDateKey(targetDate),
      startTime: "",
      endTime: "",
      reminder: "none",
      repeat: "none",
      visibility: "private",
      notification: "app",
      allDay: true,
      done: false,
    };
    setDraftTask(newTask);
    setEditOpen(true);
  };

  const handleViewTask = (task: CalendarTask) => {
    setViewingTask(task);
  };

  const handleOpenEditFromView = () => {
    if (!viewingTask) {
      return;
    }
    setDraftTask({ ...viewingTask });
    setViewingTask(null);
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setDraftTask(null);
  };

  const openDatePicker = () => {
    const base = draftTask?.date ? parseDateKey(draftTask.date) : selectedDate;
    setDatePickerMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    setDatePickerOpen(true);
  };

  const handleCloseView = () => {
    setViewingTask(null);
  };

  const saveDraftTask = () => {
    if (!draftTask) {
      return;
    }
    setTasks((prev) => {
      const exists = prev.some((item) => item.id === draftTask.id);
      if (exists) {
        return prev.map((item) => (item.id === draftTask.id ? draftTask : item));
      }
      return [draftTask, ...prev];
    });
    handleCloseEdit();
  };

  const removeDraftTask = () => {
    if (!draftTask) {
      return;
    }
    setTasks((prev) => prev.filter((item) => item.id !== draftTask.id));
    handleCloseEdit();
  };

  const handleSaveCategories = (nextCategories: Category[]) => {
    setCategories(nextCategories);
    window.localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(nextCategories));
    if (pipelineSnapshotRef.current) {
      void api.put("/api/pipeline/board", {
        data: {
          columns: pipelineSnapshotRef.current.columns,
          categories: nextCategories,
          sprints: pipelineSnapshotRef.current.sprints,
        },
      });
    }
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) {
      return;
    }
    const nextCategory = {
      id: `cat-${Date.now()}`,
      name,
      color: newCategoryColor,
    };
    handleSaveCategories([...categories, nextCategory]);
    setNewCategoryName("");
    setNewCategoryColor(DEFAULT_COLORS[0]);
  };

  const startEditCategory = (category: Category) => {
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
    const nextCategories = categories.map((cat) =>
      cat.id === editingCategoryId
        ? { ...cat, name, color: editingCategoryColor }
        : cat
    );
    handleSaveCategories(nextCategories);
    cancelEditCategory();
  };

  const handleRemoveCategory = (id: string) => {
    const nextCategories = categories.filter((cat) => cat.id !== id);
    handleSaveCategories(nextCategories);
    setTasks((prev) =>
      prev.map((task) => ({
        ...task,
        categoryIds: (task.categoryIds || []).filter((catId) => catId !== id),
      }))
    );
  };

  const renderCreateReminderCard = (date?: Date) => (
    <Paper
      elevation={0}
      variant="outlined"
      onClick={() => handleCreateTask(date)}
      sx={(theme) => ({
        p: 1.5,
        borderRadius: "var(--radius-card)",
        border: 1,
        borderColor: "divider",
        backgroundColor: "background.paper",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        ...interactiveCardSx(theme),
      })}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        Criar lembrete
      </Typography>
      <AddRoundedIcon fontSize="small" />
    </Paper>
  );

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Calendário
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="outlined"
              component={RouterLink}
              href="/calendario/concluidas"
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Ver tarefas feitas
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                const today = new Date();
                setSelectedDate(today);
                setSelectedMonth(new Date(today.getFullYear(), today.getMonth(), 1));
              }}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Hoje
            </Button>
            <SettingsIconButton onClick={() => setCalendarSettingsOpen(true)} />
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "280px 1fr" },
            gap: 2.5,
          }}
        >
          <Stack spacing={2.5}>
            <Autocomplete
              multiple
              options={categories}
              value={categories.filter((item) => categoryFilter.includes(item.id))}
              onChange={(_, value) => setCategoryFilter(value.map((item) => item.id))}
              getOptionLabel={(option) => option.name}
              noOptionsText="Sem categorias"
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <Checkbox checked={selected} size="small" sx={{ mr: 1 }} />
                  {option.name}
                </li>
              )}
              renderInput={(params) => (
                <TextField {...params} label="Filtrar categorias" fullWidth />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.name}
                    size="small"
                  />
                ))
              }
            />
            <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <IconButton
                    size="small"
                    onClick={() =>
                      setSelectedMonth(
                        new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1)
                      )
                    }
                  >
                    <ChevronLeftRoundedIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {monthLabels[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() =>
                      setSelectedMonth(
                        new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1)
                      )
                    }
                  >
                    <ChevronRightRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 0.5,
                  }}
                >
                  {weekLabels.map((label) => (
                    <Typography
                      key={label}
                      variant="caption"
                      sx={{ textAlign: "center", color: "text.secondary" }}
                    >
                      {label}
                    </Typography>
                  ))}
                  {getCalendarDays(selectedMonth).map((day, index) => {
                    const isToday = day ? formatDateKey(day) === formatDateKey(new Date()) : false;
                    const isSelected =
                      day ? formatDateKey(day) === formatDateKey(selectedDate) : false;
                    const hasTasks = day ? tasksByDate.has(formatDateKey(day)) : false;
                    return (
                      <Box
                        key={`${day ? day.toISOString() : "empty"}-${index}`}
                        onClick={() => {
                          if (!day) {
                            return;
                          }
                          setSelectedDate(day);
                          setSelectedMonth(new Date(day.getFullYear(), day.getMonth(), 1));
                        }}
                        sx={(theme) => ({
                          height: 36,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "12px",
                          border: isSelected ? 1 : "1px solid transparent",
                          borderColor: isSelected ? "primary.main" : "transparent",
                          cursor: day ? "pointer" : "default",
                          color: isSelected
                            ? "primary.main"
                            : isToday
                              ? "text.primary"
                              : "text.secondary",
                          fontWeight: isToday ? 600 : 500,
                          position: "relative",
                          ...interactiveCardSx(theme),
                        })}
                      >
                        {day ? day.getDate() : ""}
                        {hasTasks ? (
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: 4,
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              backgroundColor: "primary.main",
                            }}
                          />
                        ) : null}
                      </Box>
                    );
                  })}
                </Box>
              </Stack>
            </Paper>

            <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Calendários
                </Typography>
                <Stack spacing={1.5}>
                  {calendarSources.map((source) => (
                    <Box
                      key={source.id}
                      onClick={() =>
                        setCalendarSources((prev) =>
                          prev.map((item) =>
                            item.id === source.id
                              ? { ...item, enabled: !item.enabled }
                              : item
                          )
                        )
                      }
                      sx={(theme) => ({
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 1,
                        py: 0.5,
                        borderRadius: "var(--radius-card)",
                        cursor: "pointer",
                        ...interactiveCardSx(theme),
                      })}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: source.color,
                          }}
                        />
                        <Typography variant="body2">{source.name}</Typography>
                      </Stack>
                      <Checkbox
                        checked={source.enabled}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) =>
                          setCalendarSources((prev) =>
                            prev.map((item) =>
                              item.id === source.id
                                ? { ...item, enabled: event.target.checked }
                                : item
                            )
                          )
                        }
                        size="small"
                      />
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </Paper>
          </Stack>

          <Stack spacing={2.5}>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "flex-start", md: "center" }}
                justifyContent="space-between"
              >
                <TextField
                  select
                  label="Itens por pagina"
                  value={agendaPerPage}
                  onChange={(event) => {
                    setAgendaPerPage(Number(event.target.value));
                    setAgendaPage(1);
                  }}
                  sx={{ minWidth: 180 }}
                >
                  {[3, 5, 7, 10].map((value) => (
                    <MenuItem key={value} value={value}>
                      {value} dias
                    </MenuItem>
                  ))}
                </TextField>
                <Pagination
                  count={totalAgendaPages}
                  page={agendaPage}
                  onChange={(_, value) => setAgendaPage(value)}
                  color="primary"
                  variant="outlined"
                  shape="rounded"
                  size="medium"
                  sx={{
                    "& .MuiPaginationItem-root": {
                      borderRadius: "999px",
                    },
                  }}
                />
              </Stack>
              {agendaDays.length === 0 ? (
                renderCreateReminderCard(selectedDate)
              ) : (
                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                  <Stack spacing={2}>
                    {pagedAgendaDays.map((day) => {
                      const dateKey = formatDateKey(day);
                      const dayTasks = tasksByDate.get(dateKey) || [];
                      return (
                        <DroppableDay key={dateKey} dateKey={dateKey}>
                          <Stack spacing={1.5}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Stack>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                  {day.toLocaleDateString("pt-BR", {
                                    weekday: "short",
                                    day: "2-digit",
                                    month: "short",
                                  })}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                  {dayTasks.length} tarefas
                                </Typography>
                              </Stack>
                              <IconButton
                                size="small"
                                onClick={() => handleCreateTask(day)}
                                sx={{ border: 1, borderColor: "divider" }}
                              >
                                <AddRoundedIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                            <Divider />
                            {dayTasks.length === 0 ? (
                              renderCreateReminderCard(day)
                            ) : (
                              <Stack spacing={1.5}>
                                {dayTasks.map((task) => (
                                  <DraggableTaskCard
                                    key={task.id}
                                    taskId={task.id}
                                    onClick={() => handleViewTask(task)}
                                  >
                                    <Stack
                                      direction={{ xs: "column", sm: "row" }}
                                      spacing={1.5}
                                      alignItems={{ xs: "flex-start", sm: "center" }}
                                      justifyContent="space-between"
                                    >
                                      <Stack spacing={0.5}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                          <Box
                                            sx={{
                                              width: 8,
                                              height: 8,
                                              borderRadius: "50%",
                                              backgroundColor:
                                                calendarSources.find(
                                                  (source) => source.id === task.calendarId
                                                )?.color || "primary.main",
                                            }}
                                          />
                                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            {task.name}
                                          </Typography>
                                        </Stack>
                                        {calendarSettings.showTime ? (
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
                                        ) : null}
                                        {calendarSettings.showLocation && task.location ? (
                                          <Typography
                                            variant="caption"
                                            sx={{ color: "text.secondary" }}
                                          >
                                            {task.location}
                                          </Typography>
                                        ) : null}
                                      </Stack>
                                      <Stack direction="row" spacing={1} alignItems="center">
                                        {calendarSettings.showCategories
                                          ? (task.categoryIds || [])
                                              .map((id) => categories.find((cat) => cat.id === id))
                                              .filter(Boolean)
                                              .map((cat) => (
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
                                              ))
                                          : null}
                                        <Checkbox
                                          checked={Boolean(task.done)}
                                          onClick={(event) => event.stopPropagation()}
                                          onChange={(event) =>
                                            setTasks((prev) =>
                                              prev.map((item) =>
                                                item.id === task.id
                                                  ? { ...item, done: event.target.checked }
                                                  : item
                                              )
                                            )
                                          }
                                          size="small"
                                        />
                                      </Stack>
                                    </Stack>
                                  </DraggableTaskCard>
                                ))}
                                {renderCreateReminderCard(day)}
                              </Stack>
                            )}
                          </Stack>
                        </DroppableDay>
                      );
                    })}
                  </Stack>
                </DndContext>
              )}
            </Stack>
          </Stack>
        </Box>
      </Stack>

      <Dialog open={Boolean(viewingTask)} onClose={handleCloseView} maxWidth="sm" fullWidth>
        <DialogContent>
          <Stack spacing={2.5}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6">Detalhes do lembrete</Typography>
              <IconButton onClick={handleCloseView} sx={{ color: "text.secondary" }}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            <Stack spacing={0.5}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {viewingTask?.name || ""}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {calendarMap.get(viewingTask?.calendarId || "")?.name || "Calendário"}
              </Typography>
            </Stack>
            <Divider />
            <Stack spacing={1.5}>
              {viewingTask ? (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: "var(--radius-card)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    backgroundColor: "background.paper",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Checkbox
                      checked={Boolean(viewingTask.done)}
                      onChange={(event) => {
                        const nextDone = event.target.checked;
                        setTasks((prev) =>
                          prev.map((item) =>
                            item.id === viewingTask.id ? { ...item, done: nextDone } : item
                          )
                        );
                        setViewingTask((prev) => (prev ? { ...prev, done: nextDone } : prev));
                      }}
                    />
                    <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Marcar como feita
                    </Typography>
                  </Stack>
                  <Chip
                    label={viewingTask.done ? "Feita" : "Pendente"}
                    color={viewingTask.done ? "success" : "default"}
                    variant={viewingTask.done ? "filled" : "outlined"}
                    icon={
                      viewingTask.done ? (
                        <CheckCircleRoundedIcon fontSize="small" />
                      ) : (
                        <RadioButtonUncheckedRoundedIcon fontSize="small" />
                      )
                    }
                    sx={{ fontWeight: 600 }}
                  />
                </Paper>
              ) : null}
              <Typography variant="body2">
                {viewingTask?.date
                  ? parseDateKey(viewingTask.date).toLocaleDateString("pt-BR")
                  : ""}
              </Typography>
              {calendarSettings.showTime ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {viewingTask?.allDay
                    ? "Dia todo"
                    : [viewingTask?.startTime, viewingTask?.endTime]
                        .filter(Boolean)
                        .join(" - ") || "Horário livre"}
                </Typography>
              ) : null}
              {calendarSettings.showLocation && viewingTask?.location ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {viewingTask.location}
                </Typography>
              ) : null}
              {calendarSettings.showMeetingLink && viewingTask?.link ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {viewingTask.link}
                </Typography>
              ) : null}
              {calendarSettings.showReminders ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Lembrete: {viewingTask?.reminder || "none"}
                </Typography>
              ) : null}
              {calendarSettings.showRepeat ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Repetição: {viewingTask?.repeat || "none"}
                </Typography>
              ) : null}
              {calendarSettings.showVisibility ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Visibilidade: {viewingTask?.visibility || "private"}
                </Typography>
              ) : null}
              {calendarSettings.showNotifications ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Notificação: {viewingTask?.notification || "app"}
                </Typography>
              ) : null}
              {calendarSettings.showCategories && viewingTask?.categoryIds?.length ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {viewingTask.categoryIds
                    .map((id) => categories.find((cat) => cat.id === id))
                    .filter(Boolean)
                    .map((cat) => (
                      <Chip
                        key={cat?.id}
                        label={cat?.name}
                        size="small"
                        sx={{
                          color: "#e6edf3",
                          backgroundColor: cat ? darkenColor(cat.color, 0.5) : "transparent",
                        }}
                      />
                    ))}
                </Stack>
              ) : null}
              {calendarSettings.showDescription && viewingTask?.descriptionHtml ? (
                <Box
                  sx={{
                    borderRadius: "var(--radius-card)",
                    border: 1,
                    borderColor: "divider",
                    p: 2,
                    backgroundColor: "background.paper",
                    "& p": { margin: 0 },
                  }}
                  dangerouslySetInnerHTML={{ __html: viewingTask.descriptionHtml }}
                />
              ) : null}
            </Stack>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={handleOpenEditFromView}>
                Editar
              </Button>
              <Button variant="contained" onClick={handleCloseView}>
                Fechar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogContent>
          <Stack spacing={2.5}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6">Editar tarefa</Typography>
              <IconButton onClick={handleCloseEdit} sx={{ color: "text.secondary" }}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            <TextField
              label="Titulo"
              fullWidth
              value={draftTask?.name || ""}
              onChange={(event) =>
                setDraftTask((prev) => (prev ? { ...prev, name: event.target.value } : prev))
              }
            />
            <TextField
              select
              label="Calendário"
              fullWidth
              value={draftTask?.calendarId || ""}
              onChange={(event) => {
                const nextId = event.target.value;
                setDraftTask((prev) =>
                  prev ? { ...prev, calendarId: nextId } : prev
                );
                setCalendarSources((prev) =>
                  prev.map((item) =>
                    item.id === nextId ? { ...item, enabled: true } : item
                  )
                );
              }}
            >
              {calendarSources.map((source) => (
                <MenuItem key={source.id} value={source.id}>
                  {source.name}
                </MenuItem>
              ))}
            </TextField>
            {calendarSettings.showParticipants ? (
              <Stack spacing={2}>
                <Autocomplete
                  multiple
                  options={personOptions}
                  value={selectPersonsByIds(draftTask?.responsibleIds)}
                  onChange={(_, value) =>
                    setDraftTask((prev) =>
                      prev ? { ...prev, responsibleIds: value.map((person) => person.id) } : prev
                    )
                  }
                  getOptionLabel={(option) => formatPersonLabel(option)}
                  noOptionsText="Nenhum usuario"
                  renderInput={(params) => (
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
                  value={selectPersonsByIds(draftTask?.workerIds)}
                  onChange={(_, value) =>
                    setDraftTask((prev) =>
                      prev ? { ...prev, workerIds: value.map((person) => person.id) } : prev
                    )
                  }
                  getOptionLabel={(option) => formatPersonLabel(option)}
                  noOptionsText="Nenhum usuario"
                  renderInput={(params) => (
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
              </Stack>
            ) : null}
            {calendarSettings.showMeetingLink ? (
              <TextField
                label="Link da reuniao"
                fullWidth
                value={draftTask?.link || ""}
                onChange={(event) =>
                  setDraftTask((prev) => (prev ? { ...prev, link: event.target.value } : prev))
                }
              />
            ) : null}
            {calendarSettings.showLocation ? (
              <TextField
                label="Local"
                fullWidth
                value={draftTask?.location || ""}
                onChange={(event) =>
                  setDraftTask((prev) =>
                    prev ? { ...prev, location: event.target.value } : prev
                  )
                }
              />
            ) : null}
            {calendarSettings.showCategories ? (
              <Autocomplete
                multiple
                options={categories}
                value={categories.filter((cat) => (draftTask?.categoryIds || []).includes(cat.id))}
                onChange={(_, value) =>
                  setDraftTask((prev) =>
                    prev ? { ...prev, categoryIds: value.map((cat) => cat.id) } : prev
                  )
                }
                getOptionLabel={(option) => option.name}
                disableCloseOnSelect
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox checked={selected} size="small" sx={{ mr: 1 }} />
                    {option.name}
                  </li>
                )}
                renderInput={(params) => <TextField {...params} label="Categorias" fullWidth />}
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
            ) : null}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Dia do calendario"
                value={
                  draftTask?.date
                    ? parseDateKey(draftTask.date).toLocaleDateString("pt-BR")
                    : ""
                }
                onClick={openDatePicker}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={openDatePicker}
                        ref={datePickerAnchorRef}
                        aria-label="Selecionar data"
                      >
                        <CalendarTodayRoundedIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                fullWidth
              />
              {calendarSettings.showAllDay ? (
                <TextField
                  select
                  label="Dia todo"
                  value={draftTask?.allDay ? "sim" : "nao"}
                  onChange={(event) =>
                    setDraftTask((prev) =>
                      prev ? { ...prev, allDay: event.target.value === "sim" } : prev
                    )
                  }
                  fullWidth
                >
                  <MenuItem value="sim">Sim</MenuItem>
                  <MenuItem value="nao">Nao</MenuItem>
                </TextField>
              ) : null}
            </Stack>
            {calendarSettings.showTime ? (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Inicio"
                  type="time"
                  value={draftTask?.startTime || ""}
                  onChange={(event) =>
                    setDraftTask((prev) =>
                      prev ? { ...prev, startTime: event.target.value } : prev
                    )
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  disabled={Boolean(draftTask?.allDay)}
                />
                <TextField
                  label="Fim"
                  type="time"
                  value={draftTask?.endTime || ""}
                  onChange={(event) =>
                    setDraftTask((prev) =>
                      prev ? { ...prev, endTime: event.target.value } : prev
                    )
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  disabled={Boolean(draftTask?.allDay)}
                />
              </Stack>
            ) : null}
            {calendarSettings.showReminders ? (
              <TextField
                select
                label="Lembrete"
                fullWidth
                value={draftTask?.reminder || "none"}
                onChange={(event) =>
                  setDraftTask((prev) =>
                    prev
                      ? {
                          ...prev,
                          reminder: event.target.value as CalendarTask["reminder"],
                        }
                      : prev
                  )
                }
              >
                <MenuItem value="none">Sem lembrete</MenuItem>
                <MenuItem value="10m">10 minutos antes</MenuItem>
                <MenuItem value="30m">30 minutos antes</MenuItem>
                <MenuItem value="1h">1 hora antes</MenuItem>
                <MenuItem value="1d">1 dia antes</MenuItem>
              </TextField>
            ) : null}
            {calendarSettings.showRepeat ? (
              <TextField
                select
                label="Repetir"
                fullWidth
                value={draftTask?.repeat || "none"}
                onChange={(event) =>
                  setDraftTask((prev) =>
                    prev
                      ? {
                          ...prev,
                          repeat: event.target.value as CalendarTask["repeat"],
                        }
                      : prev
                  )
                }
              >
                <MenuItem value="none">Nao repetir</MenuItem>
                <MenuItem value="daily">Todos os dias</MenuItem>
                <MenuItem value="weekly">Toda semana</MenuItem>
                <MenuItem value="monthly">Todo mes</MenuItem>
                <MenuItem value="yearly">Todo ano</MenuItem>
              </TextField>
            ) : null}
            {calendarSettings.showVisibility ? (
              <TextField
                select
                label="Visibilidade"
                fullWidth
                value={draftTask?.visibility || "private"}
                onChange={(event) =>
                  setDraftTask((prev) =>
                    prev
                      ? {
                          ...prev,
                          visibility: event.target.value as CalendarTask["visibility"],
                        }
                      : prev
                  )
                }
              >
                <MenuItem value="private">Privado</MenuItem>
                <MenuItem value="public">Publico</MenuItem>
              </TextField>
            ) : null}
            {calendarSettings.showNotifications ? (
              <TextField
                select
                label="Notificar por"
                fullWidth
                value={draftTask?.notification || "app"}
                onChange={(event) =>
                  setDraftTask((prev) =>
                    prev
                      ? {
                          ...prev,
                          notification: event.target.value as CalendarTask["notification"],
                        }
                      : prev
                  )
                }
              >
                <MenuItem value="app">App</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="push">Push</MenuItem>
              </TextField>
            ) : null}
            {calendarSettings.showDescription ? (
              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                  Descrição
                </Typography>
                <RichTextEditor
                  value={draftTask?.descriptionHtml || ""}
                  onChange={(nextValue) =>
                    setDraftTask((prev) =>
                      prev ? { ...prev, descriptionHtml: nextValue } : prev
                    )
                  }
                />
              </Stack>
            ) : null}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button color="error" variant="outlined" onClick={removeDraftTask}>
                Remover
              </Button>
              <Button variant="outlined" onClick={handleCloseEdit}>
                Cancelar
              </Button>
              <Button variant="contained" onClick={saveDraftTask}>
                Salvar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
      <Popover
        open={datePickerOpen}
        anchorEl={datePickerAnchorRef.current}
        onClose={() => setDatePickerOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Box sx={{ p: 2, width: 280 }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <IconButton
                size="small"
                onClick={() =>
                  setDatePickerMonth(
                    new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth() - 1, 1)
                  )
                }
              >
                <ChevronLeftRoundedIcon fontSize="small" />
              </IconButton>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {monthLabels[datePickerMonth.getMonth()]} {datePickerMonth.getFullYear()}
              </Typography>
              <IconButton
                size="small"
                onClick={() =>
                  setDatePickerMonth(
                    new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth() + 1, 1)
                  )
                }
              >
                <ChevronRightRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 0.5,
              }}
            >
              {weekLabels.map((label) => (
                <Typography
                  key={`picker-${label}`}
                  variant="caption"
                  sx={{ textAlign: "center", color: "text.secondary" }}
                >
                  {label}
                </Typography>
              ))}
              {getCalendarDays(datePickerMonth).map((day, index) => {
                const isSelected =
                  day && draftTask?.date
                    ? formatDateKey(day) === draftTask.date
                    : false;
                return (
                  <Box
                    key={`picker-${day ? day.toISOString() : "empty"}-${index}`}
                    onClick={() => {
                      if (!day) {
                        return;
                      }
                      setDraftTask((prev) =>
                        prev ? { ...prev, date: formatDateKey(day) } : prev
                      );
                      setDatePickerOpen(false);
                    }}
                    sx={(theme) => ({
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "10px",
                      border: isSelected ? 1 : "1px solid transparent",
                      borderColor: isSelected ? "primary.main" : "transparent",
                      cursor: day ? "pointer" : "default",
                      color: isSelected ? "primary.main" : "text.secondary",
                      fontWeight: isSelected ? 600 : 500,
                      ...interactiveCardSx(theme),
                    })}
                  >
                    {day ? day.getDate() : ""}
                  </Box>
                );
              })}
            </Box>
          </Stack>
        </Box>
      </Popover>

      <Dialog
        open={calendarSettingsOpen}
        onClose={() => setCalendarSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Stack spacing={2.5}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6">Configurações do calendário</Typography>
              <IconButton onClick={() => setCalendarSettingsOpen(false)}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            <Accordion
              elevation={0}
              expanded={configAccordion === "fields"}
              onChange={(_, isExpanded) => setConfigAccordion(isExpanded ? "fields" : false)}
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: "var(--radius-card)",
                backgroundColor: "background.paper",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Campos do evento
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
                  {[
                    { key: "showAllDay", label: "Campo dia todo" },
                    { key: "showTime", label: "Horário" },
                    { key: "showLocation", label: "Local" },
                    { key: "showParticipants", label: "Participantes" },
                    { key: "showMeetingLink", label: "Link da reuniao" },
                    { key: "showReminders", label: "Lembretes" },
                    { key: "showRepeat", label: "Repetição" },
                    { key: "showCategories", label: "Categorias" },
                    { key: "showDescription", label: "Descrição" },
                    { key: "showVisibility", label: "Visibilidade" },
                    { key: "showNotifications", label: "Notificações" },
                  ].map((item) => (
                    <Box
                      key={item.key}
                      sx={(theme) => ({
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 1.5,
                        borderRadius: "var(--radius-card)",
                        border: 1,
                        borderColor: "divider",
                        backgroundColor: "background.paper",
                        cursor: "pointer",
                        ...interactiveCardSx(theme),
                      })}
                      onClick={() =>
                        setCalendarSettings((prev) => ({
                          ...prev,
                          [item.key]: !prev[item.key as keyof typeof calendarSettings],
                        }))
                      }
                    >
                      <Typography variant="subtitle2">{item.label}</Typography>
                      <ToggleCheckbox
                        checked={Boolean(calendarSettings[item.key as keyof typeof calendarSettings])}
                        onChange={(event) =>
                          setCalendarSettings((prev) => ({
                            ...prev,
                            [item.key]: event.target.checked,
                          }))
                        }
                        onClick={(event) => event.stopPropagation()}
                      />
                    </Box>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
            <Accordion
              elevation={0}
              expanded={configAccordion === "categories"}
              onChange={(_, isExpanded) => setConfigAccordion(isExpanded ? "categories" : false)}
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: "var(--radius-card)",
                backgroundColor: "background.paper",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Categorias
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1.5}>
                  {editingCategoryId ? (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: "var(--radius-card)",
                        border: 1,
                        borderColor: "divider",
                        backgroundColor: "background.paper",
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
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
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
      Image,
      Placeholder.configure({
        placeholder: "Escreva a descricao da tarefa...",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      handleDrop: (_view, event, _slice, moved) => {
        if (moved) {
          return false;
        }
        const files = Array.from(event.dataTransfer?.files || []).filter((file) =>
          file.type.startsWith("image/")
        );
        if (!files.length) {
          return false;
        }
        files.forEach((file) => {
          const reader = new FileReader();
          reader.onload = () => {
            const src = String(reader.result || "");
            editor?.chain().focus().setImage({ src }).run();
          };
          reader.readAsDataURL(file);
        });
        return true;
      },
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItems = items.filter((item) => item.type.startsWith("image/"));
        if (!imageItems.length) {
          return false;
        }
        imageItems.forEach((item) => {
          const file = item.getAsFile();
          if (!file) {
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const src = String(reader.result || "");
            editor?.chain().focus().setImage({ src }).run();
          };
          reader.readAsDataURL(file);
        });
        return true;
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || "", false);
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
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            color={editor?.isActive("heading", { level: 1 }) ? "primary" : "default"}
            aria-label="Titulo 1"
          >
            <LooksOneRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Titulo 2" placement="top">
          <IconButton
            {...iconButtonProps}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            color={editor?.isActive("heading", { level: 2 }) ? "primary" : "default"}
            aria-label="Titulo 2"
          >
            <LooksTwoRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Titulo 3" placement="top">
          <IconButton
            {...iconButtonProps}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            color={editor?.isActive("heading", { level: 3 }) ? "primary" : "default"}
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
            onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
            aria-label="Limpar formatação"
          >
            <BackspaceRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Box
        sx={{
          borderRadius: "var(--radius-card)",
          border: 1,
          borderColor: "divider",
          backgroundColor: "background.paper",
          "& .tiptap": {
            minHeight: 180,
            outline: "none",
            padding: "16px",
          },
          "& .tiptap h1": { fontSize: "1.25rem", fontWeight: 700 },
          "& .tiptap h2": { fontSize: "1.1rem", fontWeight: 700 },
          "& .tiptap h3": { fontSize: "1rem", fontWeight: 700 },
          "& .tiptap img": { maxWidth: "100%", borderRadius: "12px" },
          "& .tiptap img.ProseMirror-selectednode": {
            outline: "2px solid",
            outlineColor: "primary.main",
            boxShadow: "0 0 0 4px rgba(34, 201, 166, 0.2)",
          },
          "& .tiptap p.is-editor-empty:first-of-type::before": {
            content: "attr(data-placeholder)",
            color: "rgba(230, 237, 243, 0.5)",
            float: "left",
            height: 0,
            pointerEvents: "none",
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Stack>
  );
}






