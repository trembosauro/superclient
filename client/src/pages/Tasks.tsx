import {
  memo,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Autocomplete,
  Alert,
  Box,
  Button,
  Checkbox,
  ClickAwayListener,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  ListItemIcon,
  Menu,
  MenuItem,
  Popover,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "wouter";
import { useTranslation } from "react-i18next";
import {
  type DragEndEvent,
  useDraggable,
  useDroppable,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CheckBoxOutlineBlankRoundedIcon from "@mui/icons-material/CheckBoxOutlineBlankRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import api from "../api";
import ToggleCheckbox from "../components/ToggleCheckbox";
import RichTextEditor from "../components/RichTextEditor";
import {
  getInteractiveItemRadiusPx,
  interactiveItemSx,
  staticCardSx,
} from "../styles/interactiveCard";
import SettingsIconButton from "../components/SettingsIconButton";
import { PageContainer } from "../ui/PageContainer/PageContainer";
import AppCard from "../components/layout/AppCard";
import CardSection from "../components/layout/CardSection";
import { CategoryChip } from "../components/CategoryChip";
import { CategoryColorPicker } from "../components/CategoryColorPicker";
import SettingsDialog from "../components/SettingsDialog";
import { loadUserStorage, saveUserStorage } from "../userStorage";
import {
  CATEGORY_COLOR_OPTIONS,
  resolveThemeColor,
} from "../lib/resolveThemeColor";

type Category = {
  id: string;
  name: string;
  color: string;
};

type CalendarTask = {
  id: string;
  name: string;
  sortOrder?: number;
  link?: string;
  descriptionHtml?: string;
  subtasks?: Array<{
    id: string;
    title: string;
    done: boolean;
  }>;
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

type CalendarDaySection = {
  dateKey: string;
  date: Date;
  tasks: CalendarTask[];
};

const STORAGE_TASKS = "calendar_tasks_v1";
const STORAGE_CATEGORIES = "calendar_categories_v1";
const STORAGE_CATEGORY_FILTER = "sc_calendar_category_filter";
const STORAGE_AGENDA_DAYS_COUNT = "sc_tasks_agenda_days_count";

// NOTE: category/task colors accept MUI palette tokens (e.g. "primary", "primary.dark")
// and legacy hex values. Rendering is normalized via resolveThemeColor().

const defaultCategories: Category[] = [
  { id: "cat-reunioes", name: "Reuniões", color: "info" },
  { id: "cat-trabalho", name: "Trabalho", color: "primary" },
  { id: "cat-pessoal", name: "Pessoal", color: "success" },
  { id: "cat-aniversario", name: "Aniversários", color: "secondary" },
  { id: "cat-viagem", name: "Viagem", color: "warning" },
  { id: "cat-saude", name: "Saude", color: "error" },
  { id: "cat-estudos", name: "Estudos", color: "secondary" },
  { id: "cat-financas", name: "Pagamentos", color: "warning" },
  { id: "cat-feriados", name: "Feriados", color: "info" },
  { id: "cat-lembretes", name: "Lembretes", color: "primary" },
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

const defaultCalendarSettings = {
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
  showAgendaTaskCount: false,
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

const extractInlineTaskDate = (rawTitle: string) => {
  const original = rawTitle;
  const trimmed = original.trim();
  if (!trimmed) {
    return { title: original, date: null as Date | null };
  }

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const DATE_TOKEN_REGEX =
    /(^|[\s,;:()\[\]{}-])(\d{1,2}\/\d{1,2}\/\d{4})(?=$|[\s,;:()\[\]{}.!?-])/;

  const dateTokenMatch = trimmed.match(DATE_TOKEN_REGEX);
  if (dateTokenMatch) {
    const [dayStr, monthStr, yearStr] = dateTokenMatch[2].split("/");
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);
    const candidate = new Date(year, month - 1, day);
    if (
      candidate.getFullYear() === year &&
      candidate.getMonth() === month - 1 &&
      candidate.getDate() === day
    ) {
      const nextTitle = trimmed
        .replace(DATE_TOKEN_REGEX, (_full, lead: string) => {
          if (!lead) return "";
          if (/^\s+$/.test(lead)) return " ";
          return lead;
        })
        .replace(/\s{2,}/g, " ")
        .trim();
      candidate.setHours(0, 0, 0, 0);
      return { title: nextTitle, date: candidate };
    }
  }

  const WEEKDAY_TOKEN_REGEX =
    /(^|[\s,;:()\[\]{}-])((?:dom(?:ingo)?|seg(?:unda)?|ter(?:ca|ça)?|qua(?:rta)?|qui(?:nta)?|sex(?:ta)?|sab(?:ado)?|s[aá]b(?:ado)?))(?:-feira)?(?=$|[\s,;:()\[\]{}.!?-])/iu;

  const weekdayMatch = trimmed.match(WEEKDAY_TOKEN_REGEX);
  if (weekdayMatch) {
    const token = normalize(weekdayMatch[2]);
    const targetDow = (() => {
      if (token.startsWith("dom")) return 0;
      if (token.startsWith("seg")) return 1;
      if (token.startsWith("ter")) return 2;
      if (token.startsWith("qua")) return 3;
      if (token.startsWith("qui")) return 4;
      if (token.startsWith("sex")) return 5;
      if (token.startsWith("sab")) return 6;
      return null;
    })();

    if (targetDow != null) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const candidate = new Date(today);
      while (candidate.getDay() !== targetDow) {
        candidate.setDate(candidate.getDate() + 1);
      }
      const nextTitle = trimmed
        .replace(WEEKDAY_TOKEN_REGEX, (_full, lead: string) => {
          if (!lead) return "";
          if (/^\s+$/.test(lead)) return " ";
          return lead;
        })
        .replace(/\s{2,}/g, " ")
        .trim();
      return { title: nextTitle, date: candidate };
    }
  }

  return { title: original, date: null as Date | null };
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
  const addDays = (offset: number) => {
    const next = new Date(base);
    next.setHours(0, 0, 0, 0);
    next.setDate(next.getDate() + offset);
    return next;
  };
  const makeDate = (offset: number) => formatDateKey(addDays(offset));
  const seed = formatDateKey(base);
  const makeId = (suffix: string) => `cal-seed-${seed}-${suffix}`;

  return [
    {
      id: makeId("1"),
      name: "Reunião de alinhamento",
      calendarId: "cal-equipe",
      categoryIds: ["cat-reunioes", "cat-trabalho"],
      date: makeDate(0),
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
      id: makeId("2"),
      name: "Entrega do relatorio financeiro",
      calendarId: "cal-financas",
      categoryIds: ["cat-financas"],
      date: makeDate(1),
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
      id: makeId("3"),
      name: "Consulta medica",
      calendarId: "cal-pessoal",
      categoryIds: ["cat-saude"],
      date: makeDate(2),
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
      id: makeId("4"),
      name: "Feriado municipal",
      calendarId: "cal-trabalho",
      categoryIds: ["cat-feriados"],
      date: makeDate(3),
      reminder: "1d",
      repeat: "none",
      visibility: "public",
      notification: "app",
      allDay: true,
      descriptionHtml: "<p>Sem expediente.</p>",
      done: true,
    },
    {
      id: makeId("5"),
      name: "Planejamento de sprint",
      calendarId: "cal-equipe",
      categoryIds: ["cat-trabalho", "cat-reunioes"],
      date: makeDate(4),
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
      id: makeId("6"),
      name: "Aniversário da Ana",
      calendarId: "cal-pessoal",
      categoryIds: ["cat-aniversario"],
      date: makeDate(6),
      reminder: "1d",
      repeat: "yearly",
      visibility: "private",
      notification: "push",
      allDay: true,
      descriptionHtml: "<p>Comprar presente.</p>",
      done: false,
    },
    {
      id: makeId("7"),
      name: "Pagamento do aluguel",
      calendarId: "cal-financas",
      categoryIds: ["cat-financas"],
      date: makeDate(7),
      reminder: "1d",
      repeat: "monthly",
      visibility: "private",
      notification: "email",
      allDay: true,
      descriptionHtml: "<p>Agendar transferencia.</p>",
      done: true,
    },
    {
      id: makeId("8"),
      name: "Estudo de UX",
      calendarId: "cal-trabalho",
      categoryIds: ["cat-estudos"],
      date: makeDate(8),
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
      id: makeId("9"),
      name: "Viagem para cliente",
      calendarId: "cal-trabalho",
      categoryIds: ["cat-viagem"],
      date: makeDate(10),
      reminder: "1d",
      repeat: "none",
      visibility: "public",
      notification: "app",
      allDay: true,
      descriptionHtml: "<p>Levar material de apresentação.</p>",
      done: false,
    },
    {
      id: makeId("10"),
      name: "Lembrete pessoal",
      calendarId: "cal-pessoal",
      categoryIds: ["cat-lembretes"],
      date: makeDate(11),
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

const createSeedTasks = (base: Date): CalendarTask[] => {
  const now = new Date(base);
  now.setHours(0, 0, 0, 0);
  const inTwoWeeks = new Date(now);
  inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);
  return [...getSampleTasks(now), ...getSampleTasks(inTwoWeeks)].map(task => ({
    ...task,
    categoryIds: task.categoryIds ? task.categoryIds.slice(0, 1) : [],
  }));
};

const shouldReplaceWithSeed = (value: CalendarTask[]) => {
  if (!Array.isArray(value) || value.length === 0) {
    return true;
  }
  // Seed antigo eram apenas task-1..task-3.
  if (value.length <= 3 && value.every(task => /^task-\d+$/.test(task.id))) {
    return true;
  }
  return false;
};

const InlineAddTaskRow = memo(function InlineAddTaskRow({
  dateKey,
  placeholder,
  onAdd,
  onFocusChange,
}: {
  dateKey: string;
  placeholder: string;
  onAdd: (dateKey: string, title: string) => boolean;
  onFocusChange: (focused: boolean) => void;
}) {
  const [draftTitle, setDraftTitle] = useState("");

  const hasRecognizedDate = useMemo(() => {
    if (!draftTitle.trim()) return false;
    return Boolean(extractInlineTaskDate(draftTitle).date);
  }, [draftTitle]);

  const handleSubmit = () => {
    const parsed = extractInlineTaskDate(draftTitle);
    const nextTitle = parsed.title;
    const nextDateKey = parsed.date ? formatDateKey(parsed.date) : dateKey;

    if (nextTitle !== draftTitle) {
      setDraftTitle(nextTitle);
    }

    const added = onAdd(nextDateKey, nextTitle);
    if (added) {
      setDraftTitle("");
    }
  };

  return (
    <AppCard
      elevation={0}
      data-inline-task-row={dateKey}
      sx={theme => ({
        p: 1.5,
        border: 0,
        borderColor: "transparent",
        backgroundColor: hasRecognizedDate
          ? alpha(theme.palette.grey[900], theme.palette.mode === "dark" ? 0.18 : 0.08)
          : "transparent",
        borderRadius: "var(--radius-card)",
        "&:hover": {
          backgroundColor: hasRecognizedDate
            ? alpha(theme.palette.grey[900], theme.palette.mode === "dark" ? 0.18 : 0.08)
            : "transparent",
        },
        "&:active": {
          backgroundColor: hasRecognizedDate
            ? alpha(theme.palette.grey[900], theme.palette.mode === "dark" ? 0.18 : 0.08)
            : "transparent",
        },
      })}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ width: "100%" }}
      >
        <IconButton
          onMouseDown={event => {
            // Keep focus in the input when clicking the checkbox icon.
            event.preventDefault();
          }}
          onPointerDownCapture={event => event.stopPropagation()}
          onClick={handleSubmit}
          size="small"
          sx={{ p: 0.5, color: "text.secondary" }}
          aria-label={placeholder}
        >
          <CheckBoxOutlineBlankRoundedIcon fontSize="small" />
        </IconButton>

        <TextField
          value={draftTitle}
          onFocus={() => onFocusChange(true)}
          onBlur={() => onFocusChange(false)}
          onPointerDownCapture={event => event.stopPropagation()}
          onChange={event => setDraftTitle(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSubmit();
            }
          }}
          fullWidth
          size="small"
          variant="standard"
          InputProps={{ disableUnderline: true }}
          placeholder={placeholder}
          sx={theme => ({
            "& .MuiInputBase-input": {
              ...theme.typography.subtitle2,
              padding: 0,
            },
            "& .MuiInputBase-input::placeholder": {
              opacity: 1,
              color: theme.palette.text.secondary,
            },
          })}
        />
      </Stack>
    </AppCard>
  );
});

export default function Tasks() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [users, setUsers] = useState<PipelineUser[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [calendarSettingsOpen, setCalendarSettingsOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [configAccordion, setConfigAccordion] = useState<
    "fields" | "agenda" | "categories" | "notifications" | false
  >(false);
  const [calendarSettings, setCalendarSettings] = useState({
    ...defaultCalendarSettings,
  });
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState<string>(
    CATEGORY_COLOR_OPTIONS[0]
  );
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryColor, setEditingCategoryColor] = useState<string>(
    CATEGORY_COLOR_OPTIONS[0]
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [agendaDaysCount, setAgendaDaysCount] = useState<number>(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_AGENDA_DAYS_COUNT);
      const parsed = stored ? Number(stored) : 15;
      if (!Number.isFinite(parsed)) {
        return 15;
      }
      const normalized = Math.max(1, Math.min(30, Math.floor(parsed)));
      if (normalized !== 7 && normalized !== 15 && normalized !== 30) {
        return 15;
      }
      return normalized;
    } catch {
      return 15;
    }
  });
  const [miniCalendarMonth, setMiniCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [miniCalendarAnchorEl, setMiniCalendarAnchorEl] = useState<HTMLElement | null>(
    null
  );
  const [showTaskSearch, setShowTaskSearch] = useState(false);
  const [taskQuery, setTaskQuery] = useState("");
  const deferredTaskQuery = useDeferredValue(taskQuery);
  const [miniCalendarYearInput, setMiniCalendarYearInput] = useState(() =>
    String(new Date().getFullYear())
  );
  const [isMiniCalendarYearEditing, setIsMiniCalendarYearEditing] = useState(false);
  const [draftTask, setDraftTask] = useState<CalendarTask | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<CalendarTask | null>(null);
    const [viewingSubtaskDraftTitle, setViewingSubtaskDraftTitle] = useState("");
    const viewingSubtaskDraftInputRef = useRef<HTMLInputElement | null>(null);
  const [editCameFromView, setEditCameFromView] = useState(false);
  const [editSourceTaskId, setEditSourceTaskId] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const datePickerAnchorRef = useRef<HTMLButtonElement | null>(null);
  const pipelineSnapshotRef = useRef<{
    columns: unknown[];
    sprints?: unknown;
  } | null>(null);
  const restoreDefaultsSnapshotRef = useRef<{
    categories: Category[];
    calendarSettings: typeof calendarSettings;
    configAccordion: typeof configAccordion;
    newCategoryName: string;
    newCategoryColor: string;
    editingCategoryId: string | null;
    editingCategoryName: string;
    editingCategoryColor: string;
  } | null>(null);
  const [restoreDefaultsSnackbarOpen, setRestoreDefaultsSnackbarOpen] =
    useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  );

  const handleInlineAddTaskFocusChange = () => undefined;

  const [taskContextMenu, setTaskContextMenu] = useState<{
    task: CalendarTask;
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const fromDb = await loadUserStorage<CalendarTask[]>(STORAGE_TASKS);
        if (cancelled) {
          return;
        }
        if (Array.isArray(fromDb) && fromDb.length) {
          if (shouldReplaceWithSeed(fromDb)) {
            const seeded = createSeedTasks(new Date());
            setTasks(seeded);
            window.localStorage.setItem(STORAGE_TASKS, JSON.stringify(seeded));
            void saveUserStorage(STORAGE_TASKS, seeded);
            return;
          }
          setTasks(
            fromDb.map(task => ({
              ...task,
              categoryIds: task.categoryIds ? task.categoryIds.slice(0, 1) : [],
            }))
          );
          window.localStorage.setItem(STORAGE_TASKS, JSON.stringify(fromDb));
          return;
        }
      } catch {
        // Ignore and fallback.
      }

      const stored = window.localStorage.getItem(STORAGE_TASKS);
      if (!stored) {
        const seeded = createSeedTasks(new Date());
        setTasks(seeded);
        window.localStorage.setItem(STORAGE_TASKS, JSON.stringify(seeded));
        void saveUserStorage(STORAGE_TASKS, seeded);
        return;
      }
      try {
        const parsed = JSON.parse(stored) as CalendarTask[];
        if (Array.isArray(parsed) && parsed.length && !shouldReplaceWithSeed(parsed)) {
          setTasks(
            parsed.map(task => ({
              ...task,
              categoryIds: task.categoryIds ? task.categoryIds.slice(0, 1) : [],
            }))
          );
          void saveUserStorage(STORAGE_TASKS, parsed);
          return;
        }
        const seeded = createSeedTasks(new Date());
        setTasks(seeded);
        window.localStorage.setItem(STORAGE_TASKS, JSON.stringify(seeded));
        void saveUserStorage(STORAGE_TASKS, seeded);
      } catch {
        window.localStorage.removeItem(STORAGE_TASKS);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_TASKS, JSON.stringify(tasks));
    const t = window.setTimeout(() => {
      void saveUserStorage(STORAGE_TASKS, tasks);
    }, 250);
    return () => window.clearTimeout(t);
  }, [tasks]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const fromDb = await loadUserStorage<Category[]>(STORAGE_CATEGORIES);
        if (cancelled) {
          return;
        }
        if (Array.isArray(fromDb) && fromDb.length) {
          setCategories(fromDb);
          window.localStorage.setItem(
            STORAGE_CATEGORIES,
            JSON.stringify(fromDb)
          );
          return;
        }
      } catch {
        // Ignore and fallback.
      }

      const stored = window.localStorage.getItem(STORAGE_CATEGORIES);
      if (!stored) {
        return;
      }
      try {
        const parsed = JSON.parse(stored) as Category[];
        if (Array.isArray(parsed) && parsed.length) {
          setCategories(parsed);
          void saveUserStorage(STORAGE_CATEGORIES, parsed);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_CATEGORIES);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!categories.length) {
      return;
    }
    window.localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(categories));
    const t = window.setTimeout(() => {
      void saveUserStorage(STORAGE_CATEGORIES, categories);
    }, 250);
    return () => window.clearTimeout(t);
  }, [categories]);

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
          window.localStorage.setItem(
            STORAGE_CATEGORIES,
            JSON.stringify(nextCategories)
          );
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
    let cancelled = false;
    const loadContacts = async () => {
      try {
        const dbContacts = await loadUserStorage<Contact[]>("contacts_v1");
        if (!cancelled && Array.isArray(dbContacts)) {
          setContacts(dbContacts);
          window.localStorage.setItem(
            "contacts_v1",
            JSON.stringify(dbContacts)
          );
          return;
        }
      } catch {
        // Ignore and fallback.
      }

      const stored = window.localStorage.getItem("contacts_v1");
      if (!stored) {
        if (!cancelled) {
          setContacts([]);
        }
        return;
      }
      try {
        const parsed = JSON.parse(stored) as Contact[];
        if (!cancelled && Array.isArray(parsed)) {
          setContacts(parsed);
        }
      } catch {
        window.localStorage.removeItem("contacts_v1");
        if (!cancelled) {
          setContacts([]);
        }
      }
    };

    void loadContacts();
    const handleContactsChange = () => void loadContacts();
    window.addEventListener("contacts-change", handleContactsChange);
    return () => {
      cancelled = true;
      window.removeEventListener("contacts-change", handleContactsChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const hydrate = (parsed: Partial<typeof calendarSettings>) => {
      setCalendarSettings({
        showAllDay:
          parsed.showAllDay !== undefined ? Boolean(parsed.showAllDay) : true,
        showTime:
          parsed.showTime !== undefined ? Boolean(parsed.showTime) : true,
        showLocation:
          parsed.showLocation !== undefined
            ? Boolean(parsed.showLocation)
            : true,
        showParticipants:
          parsed.showParticipants !== undefined
            ? Boolean(parsed.showParticipants)
            : true,
        showReminders:
          parsed.showReminders !== undefined
            ? Boolean(parsed.showReminders)
            : true,
        showRepeat:
          parsed.showRepeat !== undefined ? Boolean(parsed.showRepeat) : true,
        showCategories:
          parsed.showCategories !== undefined
            ? Boolean(parsed.showCategories)
            : true,
        showDescription:
          parsed.showDescription !== undefined
            ? Boolean(parsed.showDescription)
            : true,
        showMeetingLink:
          parsed.showMeetingLink !== undefined
            ? Boolean(parsed.showMeetingLink)
            : true,
        showVisibility:
          parsed.showVisibility !== undefined
            ? Boolean(parsed.showVisibility)
            : true,
        showNotifications:
          parsed.showNotifications !== undefined
            ? Boolean(parsed.showNotifications)
            : true,
        showAgendaTaskCount:
          parsed.showAgendaTaskCount !== undefined
            ? Boolean(parsed.showAgendaTaskCount)
            : false,
      });
    };

    const load = async () => {
      try {
        const fromDb = await loadUserStorage<Partial<typeof calendarSettings>>(
          "sc_calendar_settings"
        );
        if (!cancelled && fromDb && typeof fromDb === "object") {
          hydrate(fromDb);
          window.localStorage.setItem(
            "sc_calendar_settings",
            JSON.stringify(fromDb)
          );
          return;
        }
      } catch {
        // Ignore and fallback.
      }

      const stored = window.localStorage.getItem("sc_calendar_settings");
      if (!stored) {
        return;
      }
      try {
        const parsed = JSON.parse(stored) as Partial<typeof calendarSettings>;
        hydrate(parsed);
        void saveUserStorage("sc_calendar_settings", parsed);
      } catch {
        window.localStorage.removeItem("sc_calendar_settings");
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "sc_calendar_settings",
      JSON.stringify(calendarSettings)
    );
    window.dispatchEvent(new Event("task-fields-change"));
    const t = window.setTimeout(() => {
      void saveUserStorage("sc_calendar_settings", calendarSettings);
    }, 250);
    return () => window.clearTimeout(t);
  }, [calendarSettings]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const fromDb = await loadUserStorage<string[]>(STORAGE_CATEGORY_FILTER);
        if (!cancelled && Array.isArray(fromDb)) {
          setCategoryFilter(fromDb);
          window.localStorage.setItem(
            STORAGE_CATEGORY_FILTER,
            JSON.stringify(fromDb)
          );
          return;
        }
      } catch {
        // Ignore and fallback.
      }

      const stored = window.localStorage.getItem(STORAGE_CATEGORY_FILTER);
      if (!stored) {
        return;
      }
      try {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed)) {
          setCategoryFilter(parsed);
          void saveUserStorage(STORAGE_CATEGORY_FILTER, parsed);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_CATEGORY_FILTER);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_CATEGORY_FILTER,
      JSON.stringify(categoryFilter)
    );
    const t = window.setTimeout(() => {
      void saveUserStorage(STORAGE_CATEGORY_FILTER, categoryFilter);
    }, 250);
    return () => window.clearTimeout(t);
  }, [categoryFilter]);

  const personOptions = useMemo<PersonOption[]>(() => {
    const userOptions = users.map(user => ({
      id: `user:${user.id}`,
      name: user.name?.trim() ? user.name : user.email,
      email: user.email,
      type: "user" as const,
    }));
    const contactOptions = contacts.map(contact => ({
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

  const selectPersonsByIds = (ids?: string[]) =>
    personOptions.filter(person => ids?.includes(person.id));

  const selectedCategoryId = categoryFilter[0] || "";
  const isCategoryListMode = Boolean(selectedCategoryId);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_AGENDA_DAYS_COUNT,
        String(agendaDaysCount)
      );
    } catch {
      // ignore
    }
  }, [agendaDaysCount]);

  useEffect(() => {
    if (isCategoryListMode) {
      return;
    }

    if (miniCalendarAnchorEl) {
      return;
    }

    if (
      selectedDate.getHours() !== 0 ||
      selectedDate.getMinutes() !== 0 ||
      selectedDate.getSeconds() !== 0 ||
      selectedDate.getMilliseconds() !== 0
    ) {
      const normalized = new Date(selectedDate);
      normalized.setHours(0, 0, 0, 0);
      setSelectedDate(normalized);
      return;
    }

    const nextMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );
    if (
      nextMonth.getFullYear() !== miniCalendarMonth.getFullYear() ||
      nextMonth.getMonth() !== miniCalendarMonth.getMonth()
    ) {
      setMiniCalendarMonth(nextMonth);
    }
  }, [selectedDate, isCategoryListMode, miniCalendarMonth, miniCalendarAnchorEl]);

  const taskSearchIndex = useMemo(() => {
    const stripHtml = (value: string) => value.replace(/<[^>]+>/g, " ");
    const index = new Map<string, string>();
    for (const task of tasks) {
      const haystack = [
        task.name,
        task.link,
        task.location,
        stripHtml(task.descriptionHtml || ""),
        (task.subtasks || []).map(sub => sub.title).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      index.set(task.id, haystack);
    }
    return index;
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const term = deferredTaskQuery.trim().toLowerCase();
    const matchesSearch = (task: CalendarTask) => {
      if (!term) {
        return true;
      }
      return (taskSearchIndex.get(task.id) || "").includes(term);
    };

    const filtered = tasks.filter(task => {
      if (task.done) {
        return false;
      }
      if (!matchesSearch(task)) {
        return false;
      }
      if (!categoryFilter.length) {
        return true;
      }
      const taskCategories = task.categoryIds || [];
      return taskCategories.some(id => categoryFilter.includes(id));
    });
    return filtered.sort((a, b) => {
      const aOrder = a.sortOrder ?? Number.POSITIVE_INFINITY;
      const bOrder = b.sortOrder ?? Number.POSITIVE_INFINITY;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
    });
  }, [tasks, categoryFilter, deferredTaskQuery, taskSearchIndex]);

  const visibleTaskIds = useMemo(
    () => visibleTasks.map(task => task.id),
    [visibleTasks]
  );

  const handleAgendaDragEnd = ({ active, over }: DragEndEvent) => {
    const taskId = active.data.current?.taskId as string | undefined;
    const nextDate = over?.data.current?.dateKey as string | undefined;
    if (!taskId || !nextDate) {
      return;
    }

    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, date: nextDate, sortOrder: Date.now() }
          : task
      )
    );
  };

  const DroppableAgendaDay = ({
    dateKey,
    children,
  }: {
    dateKey: string;
    children: ReactNode;
  }) => {
    const { setNodeRef } = useDroppable({
      id: `day-${dateKey}`,
      data: { dateKey },
    });

    return (
      <Box
        ref={setNodeRef}
        sx={{ borderRadius: "var(--radius-card)" }}
      >
        {children}
      </Box>
    );
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) {
      return;
    }
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) {
      return;
    }
    const oldIndex = visibleTaskIds.indexOf(activeId);
    const newIndex = visibleTaskIds.indexOf(overId);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    const nextIds = arrayMove(visibleTaskIds, oldIndex, newIndex);
    setTasks(prev => {
      const nextOrder = new Map(nextIds.map((id, index) => [id, index] as const));
      return prev.map(task =>
        nextOrder.has(task.id)
          ? { ...task, sortOrder: nextOrder.get(task.id) }
          : task
      );
    });
  };

  const DraggableTaskCard = ({
    taskId,
    onClick,
    onContextMenu,
    children,
  }: {
    taskId: string;
    onClick: () => void;
    onContextMenu?: (event: React.MouseEvent) => void;
    children: ReactNode;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: taskId });

    const stableTransform = transform
      ? { ...transform, scaleX: 1, scaleY: 1 }
      : null;

    return (
      <AppCard
        ref={setNodeRef}
        elevation={0}
        onClick={onClick}
        onContextMenu={onContextMenu}
        {...attributes}
        {...listeners}
        sx={theme => ({
          ...staticCardSx(theme),
          p: 1,
          border: 0,
          borderColor: "transparent",
          borderRadius: "var(--radius-card)",
          cursor: isDragging ? "grabbing" : "grab",
          opacity: isDragging ? 0.7 : 1,
          width: "100%",
          boxSizing: "border-box",
          transform: CSS.Transform.toString(stableTransform),
          transition,
          touchAction: "none",
          userSelect: "none",
          "&:hover": {
            backgroundColor: theme.palette.background.paper,
          },
          "&:active": {
            backgroundColor: theme.palette.background.paper,
          },
        })}
      >
        {children}
      </AppCard>
    );
  };

  const AgendaDraggableTaskCard = ({
    taskId,
    onClick,
    onContextMenu,
    children,
  }: {
    taskId: string;
    onClick: () => void;
    onContextMenu?: (event: React.MouseEvent) => void;
    children: ReactNode;
  }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
      useDraggable({
        id: taskId,
        data: { taskId },
      });

    const stableTransform = transform
      ? { ...transform, scaleX: 1, scaleY: 1 }
      : null;

    return (
      <AppCard
        ref={setNodeRef}
        elevation={0}
        onClick={onClick}
        onContextMenu={onContextMenu}
        {...attributes}
        {...listeners}
        sx={theme => ({
          ...staticCardSx(theme),
          p: 1,
          border: 0,
          borderColor: "transparent",
          borderRadius: "var(--radius-card)",
          cursor: isDragging ? "grabbing" : "grab",
          opacity: isDragging ? 0.7 : 1,
          width: "100%",
          boxSizing: "border-box",
          transform: CSS.Transform.toString(stableTransform),
          touchAction: "none",
          userSelect: "none",
          "&:hover": {
            backgroundColor: theme.palette.background.paper,
          },
          "&:active": {
            backgroundColor: theme.palette.background.paper,
          },
        })}
      >
        {children}
      </AppCard>
    );
  };

  const handleAddInlineTask = (dateKey: string, titleRaw: string) => {
    const title = titleRaw.trim();
    if (!title) {
      return false;
    }

    const newTask: CalendarTask = {
      id: `cal-${Date.now()}`,
      name: title,
      sortOrder: Date.now(),
      link: "",
      location: "",
      responsibleIds: [],
      workerIds: [],
      descriptionHtml: "",
      subtasks: [],
      categoryIds: [],
      date: dateKey,
      startTime: "",
      endTime: "",
      reminder: "none",
      repeat: "none",
      visibility: "private",
      notification: "app",
      allDay: false,
      done: false,
    };

    setTasks(prev => [...prev, newTask]);
    return true;
  };

  const handleAddInlineTaskForSelectedCategory = (
    dateKey: string,
    titleRaw: string
  ) => {
    const title = titleRaw.trim();
    if (!title) {
      return false;
    }

    const newTask: CalendarTask = {
      id: `cal-${Date.now()}`,
      name: title,
      sortOrder: Date.now(),
      link: "",
      location: "",
      responsibleIds: [],
      workerIds: [],
      descriptionHtml: "",
      subtasks: [],
      categoryIds: selectedCategoryId ? [selectedCategoryId] : [],
      date: dateKey,
      startTime: "",
      endTime: "",
      reminder: "none",
      repeat: "none",
      visibility: "private",
      notification: "app",
      allDay: false,
      done: false,
    };

    setTasks(prev => [...prev, newTask]);
    return true;
  };

  const calendarDaySections = useMemo<CalendarDaySection[]>(() => {
    if (isCategoryListMode) {
      return [];
    }

    const term = deferredTaskQuery.trim().toLowerCase();
    const matchesSearch = (task: CalendarTask) => {
      if (!term) {
        return true;
      }
      return (taskSearchIndex.get(task.id) || "").includes(term);
    };

    const pendingTasks = tasks.filter(task => !task.done && matchesSearch(task));

    const base = new Date(selectedDate);
    base.setHours(0, 0, 0, 0);
    const rangeKeys: string[] = [];
    const safeCount = Math.max(1, Math.min(30, Math.floor(agendaDaysCount)));
    for (let offset = 0; offset < safeCount; offset += 1) {
      const next = new Date(base);
      next.setDate(base.getDate() + offset);
      rangeKeys.push(formatDateKey(next));
    }

    return rangeKeys.map(dateKey => {
      const dayTasks = pendingTasks
        .filter(task => task.date === dateKey)
        .sort((a, b) => {
          const aOrder = a.sortOrder ?? Number.POSITIVE_INFINITY;
          const bOrder = b.sortOrder ?? Number.POSITIVE_INFINITY;
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
        });

      return {
        dateKey,
        date: parseDateKey(dateKey),
        tasks: dayTasks,
      };
    });
  }, [
    tasks,
    isCategoryListMode,
    selectedDate,
    agendaDaysCount,
    deferredTaskQuery,
    taskSearchIndex,
  ]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    for (const task of tasks) {
      if (task.done) {
        continue;
      }
      if (!task.date) {
        continue;
      }
      const existing = map.get(task.date);
      if (existing) {
        existing.push(task);
      } else {
        map.set(task.date, [task]);
      }
    }
    return map;
  }, [tasks]);

  const miniCalendarYearOptions = useMemo(() => {
    const years = new Set<number>();
    for (const task of tasks) {
      if (!task.date) {
        continue;
      }
      const year = Number(task.date.slice(0, 4));
      if (Number.isFinite(year)) {
        years.add(year);
      }
    }
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => a - b);
  }, [tasks]);

  useEffect(() => {
    if (isMiniCalendarYearEditing) {
      return;
    }
    setMiniCalendarYearInput(String(miniCalendarMonth.getFullYear()));
  }, [miniCalendarMonth, isMiniCalendarYearEditing]);

  const parseYearInput = (value: unknown) => {
    const raw = typeof value === "number" ? String(value) : String(value ?? "");
    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    const year = Math.floor(parsed);
    if (year < 1900 || year > 9999) {
      return null;
    }
    return year;
  };

  const setMiniCalendarYear = (nextYear: number) => {
    setMiniCalendarMonth(new Date(nextYear, miniCalendarMonth.getMonth(), 1));
    const nextSelected = new Date(
      nextYear,
      miniCalendarMonth.getMonth(),
      Math.min(
        selectedDate.getDate(),
        getDaysInMonth(nextYear, miniCalendarMonth.getMonth())
      )
    );
    nextSelected.setHours(0, 0, 0, 0);
    setSelectedDate(nextSelected);
  };

  const getDaysInMonth = (year: number, monthIndex: number) =>
    new Date(year, monthIndex + 1, 0).getDate();

  const agendaDaysOptions = [7, 15, 30] as const;

  const formatCalendarDayLabel = (date: Date) =>
    date.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });

  const formatTaskRelativeDateLabel = (dateKey?: string) => {
    if (!dateKey) {
      return "";
    }
    const date = parseDateKey(dateKey);
    date.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round(
      (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) {
      return "today";
    }
    if (diffDays > 0 && diffDays < 7) {
      const label = date.toLocaleDateString("pt-BR", { weekday: "long" });
      return label
        ? label.charAt(0).toUpperCase() + label.slice(1)
        : label;
    }
    return date.toLocaleDateString("pt-BR");
  };

  const handleOpenEditForTask = (task: CalendarTask) => {
    setDraftTask({ ...task });
    setEditCameFromView(false);
    setEditSourceTaskId(null);
    setEditOpen(true);
  };

  const handleDuplicateTask = (task: CalendarTask) => {
    const cloned: CalendarTask = {
      ...task,
      id: `cal-${Date.now()}`,
      done: false,
    };
    setTasks(prev => [...prev, cloned]);
    handleViewTask(cloned);
  };

  const handleRemoveTaskById = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    setViewingTask(prev => (prev?.id === taskId ? null : prev));
    setDraftTask(prev => (prev?.id === taskId ? null : prev));
  };

  const handleViewTask = (task: CalendarTask) => {
    setViewingTask(task);
  };

  const handleOpenEditFromView = () => {
    if (!viewingTask) {
      return;
    }
    setDraftTask({ ...viewingTask });
    setEditCameFromView(true);
    setEditSourceTaskId(viewingTask.id);
    setViewingTask(null);
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setDraftTask(null);
    setEditCameFromView(false);
    setEditSourceTaskId(null);
  };

  const handleBackToViewFromEdit = () => {
    if (!editCameFromView || !editSourceTaskId) {
      handleCloseEdit();
      return;
    }
    const nextTask = tasks.find(task => task.id === editSourceTaskId) || null;
    setEditOpen(false);
    setDraftTask(null);
    setEditCameFromView(false);
    setEditSourceTaskId(null);
    setViewingTask(nextTask);
  };

  const handleToggleViewingSubtaskDone = (
    task: CalendarTask,
    subtaskId: string,
    nextDone: boolean
  ) => {
    setTasks(prev =>
      prev.map(item => {
        if (item.id !== task.id) {
          return item;
        }
        const nextSubtasks = (item.subtasks || []).map(subtask =>
          subtask.id === subtaskId
            ? { ...subtask, done: nextDone }
            : subtask
        );
        return { ...item, subtasks: nextSubtasks };
      })
    );
    if (viewingTask?.id === task.id) {
      setViewingTask(prev => {
        if (!prev) {
          return prev;
        }
        const nextSubtasks = (prev.subtasks || []).map(subtask =>
          subtask.id === subtaskId
            ? { ...subtask, done: nextDone }
            : subtask
        );
        return { ...prev, subtasks: nextSubtasks };
      });
    }
  };

  const openDatePicker = () => {
    const base = draftTask?.date ? parseDateKey(draftTask.date) : selectedDate;
    setDatePickerMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    setDatePickerOpen(true);
  };

  const handleCloseView = () => {
    setViewingTask(null);
    setViewingSubtaskDraftTitle("");
  };

  const handleUpdateViewingTaskName = (nextName: string) => {
    if (!viewingTask) {
      return;
    }

    setTasks(prev =>
      prev.map(task =>
        task.id === viewingTask.id ? { ...task, name: nextName } : task
      )
    );

    setViewingTask(prev => (prev ? { ...prev, name: nextName } : prev));
  };

  const formatTaskDateTimeLabel = (task: CalendarTask) => {
    const dateLabel = task.date
      ? parseDateKey(task.date).toLocaleDateString("pt-BR")
      : "";

    if (!calendarSettings.showTime) {
      return dateLabel;
    }

    const timeLabel = task.allDay
      ? "Dia todo"
      : [task.startTime, task.endTime].filter(Boolean).join(" - ") || "";

    return timeLabel ? [dateLabel, timeLabel].filter(Boolean).join(" • ") : dateLabel;
  };

  const handleAddViewingSubtask = (title?: string) => {
    if (!viewingTask) {
      return;
    }
    const nextTitle = (title ?? viewingSubtaskDraftTitle).trim();
    if (!nextTitle) {
      return;
    }

    const nextSubtask = {
      id: `sub-${Date.now()}`,
      title: nextTitle,
      done: false,
    };

    setTasks(prev =>
      prev.map(task =>
        task.id === viewingTask.id
          ? { ...task, subtasks: [...(task.subtasks || []), nextSubtask] }
          : task
      )
    );

    setViewingTask(prev =>
      prev
        ? { ...prev, subtasks: [...(prev.subtasks || []), nextSubtask] }
        : prev
    );

    setViewingSubtaskDraftTitle("");
    queueMicrotask(() => viewingSubtaskDraftInputRef.current?.focus());
  };

  const handleUpdateViewingSubtaskTitle = (subtaskId: string, nextTitle: string) => {
    if (!viewingTask) {
      return;
    }
    setTasks(prev =>
      prev.map(task =>
        task.id === viewingTask.id
          ? {
              ...task,
              subtasks: (task.subtasks || []).map(subtask =>
                subtask.id === subtaskId ? { ...subtask, title: nextTitle } : subtask
              ),
            }
          : task
      )
    );

    setViewingTask(prev =>
      prev
        ? {
            ...prev,
            subtasks: (prev.subtasks || []).map(subtask =>
              subtask.id === subtaskId ? { ...subtask, title: nextTitle } : subtask
            ),
          }
        : prev
    );
  };

  const handleRemoveViewingSubtask = (subtaskId: string) => {
    if (!viewingTask) {
      return;
    }
    setTasks(prev =>
      prev.map(task =>
        task.id === viewingTask.id
          ? {
              ...task,
              subtasks: (task.subtasks || []).filter(subtask => subtask.id !== subtaskId),
            }
          : task
      )
    );

    setViewingTask(prev =>
      prev
        ? {
            ...prev,
            subtasks: (prev.subtasks || []).filter(subtask => subtask.id !== subtaskId),
          }
        : prev
    );
  };

  // Notificações
  const COMPLETED_TASKS_KEY = "sc_completed_tasks_notifications";

  const requestNotificationPermission = async () => {
    if (typeof Notification === "undefined") {
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const sendBrowserNotification = (task: CalendarTask) => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      return;
    }
    new Notification("Tarefa concluída!", {
      body: task.name,
      icon: "/favicon.ico",
    });
  };

  const saveCompletedTaskNotification = (task: CalendarTask) => {
    const stored = window.localStorage.getItem(COMPLETED_TASKS_KEY);
    let notifications: Array<{
      id: string;
      taskId: string;
      taskName: string;
      completedAt: string;
    }> = [];
    if (stored) {
      try {
        notifications = JSON.parse(stored);
      } catch {
        notifications = [];
      }
    }
    notifications.unshift({
      id: `notif-${Date.now()}`,
      taskId: task.id,
      taskName: task.name,
      completedAt: new Date().toISOString(),
    });
    // Manter apenas as últimas 50 notificações
    notifications = notifications.slice(0, 50);
    window.localStorage.setItem(COMPLETED_TASKS_KEY, JSON.stringify(notifications));
    void saveUserStorage(COMPLETED_TASKS_KEY, notifications);
    window.dispatchEvent(new Event("task-completed"));
  };

  const handleToggleTaskDone = (task: CalendarTask, nextDone: boolean) => {
    setTasks(prev => {
      const next = prev.map(item =>
        item.id === task.id ? { ...item, done: nextDone } : item
      );
      window.localStorage.setItem(STORAGE_TASKS, JSON.stringify(next));
      return next;
    });
    if (viewingTask?.id === task.id) {
      setViewingTask(prev => (prev ? { ...prev, done: nextDone } : prev));
    }
    // Se marcou como feita, enviar notificações
    if (nextDone) {
      saveCompletedTaskNotification(task);
      sendBrowserNotification(task);
    }
  };

  useEffect(() => {
    if (!editOpen || !draftTask) {
      return;
    }
    setTasks(prev => {
      const exists = prev.some(item => item.id === draftTask.id);
      if (exists) {
        return prev.map(item => (item.id === draftTask.id ? draftTask : item));
      }
      return [draftTask, ...prev];
    });
  }, [editOpen, draftTask]);

  const removeDraftTask = () => {
    if (!draftTask) {
      return;
    }
    setTasks(prev => prev.filter(item => item.id !== draftTask.id));
    handleCloseEdit();
  };

  const handleSaveCategories = (nextCategories: Category[]) => {
    setCategories(nextCategories);
    window.localStorage.setItem(
      STORAGE_CATEGORIES,
      JSON.stringify(nextCategories)
    );

    const nextCategoryIdSet = new Set(nextCategories.map(cat => cat.id));

    setCategoryFilter(prev => prev.filter(id => nextCategoryIdSet.has(id)));

    setTasks(prev =>
      prev.map(task => {
        const current = task.categoryIds || [];
        const next = current.filter(id => nextCategoryIdSet.has(id));
        if (next.length === current.length) {
          return task;
        }
        return { ...task, categoryIds: next };
      })
    );

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
      color: (CATEGORY_COLOR_OPTIONS as readonly string[]).includes(newCategoryColor)
        ? newCategoryColor
        : CATEGORY_COLOR_OPTIONS[0],
    };
    handleSaveCategories([...categories, nextCategory]);
    setNewCategoryName("");
    setNewCategoryColor(CATEGORY_COLOR_OPTIONS[0]);
  };

  const startEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
    setEditingCategoryColor(
      (CATEGORY_COLOR_OPTIONS as readonly string[]).includes(category.color)
        ? category.color
        : CATEGORY_COLOR_OPTIONS[0]
    );
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName("");
    setEditingCategoryColor(CATEGORY_COLOR_OPTIONS[0]);
  };

  const handleRestoreCalendarDefaults = () => {
    restoreDefaultsSnapshotRef.current = {
      categories,
      calendarSettings,
      configAccordion,
      newCategoryName,
      newCategoryColor,
      editingCategoryId,
      editingCategoryName,
      editingCategoryColor,
    };
    cancelEditCategory();
    setNewCategoryName("");
    setNewCategoryColor(CATEGORY_COLOR_OPTIONS[0]);
    setConfigAccordion(false);
    setCalendarSettings({ ...defaultCalendarSettings });
    handleSaveCategories(defaultCategories);
    setRestoreDefaultsSnackbarOpen(true);
  };

  const handleUndoRestoreCalendarDefaults = () => {
    const snapshot = restoreDefaultsSnapshotRef.current;
    if (!snapshot) {
      setRestoreDefaultsSnackbarOpen(false);
      return;
    }
    setEditingCategoryId(snapshot.editingCategoryId);
    setEditingCategoryName(snapshot.editingCategoryName);
    setEditingCategoryColor(snapshot.editingCategoryColor);
    setNewCategoryName(snapshot.newCategoryName);
    setNewCategoryColor(snapshot.newCategoryColor);
    setConfigAccordion(snapshot.configAccordion);
    setCalendarSettings(snapshot.calendarSettings);
    handleSaveCategories(snapshot.categories);
    restoreDefaultsSnapshotRef.current = null;
    setRestoreDefaultsSnackbarOpen(false);
  };

  const saveCategory = () => {
    if (!editingCategoryId) {
      return;
    }
    const name = editingCategoryName.trim();
    if (!name) {
      return;
    }
    const color = (CATEGORY_COLOR_OPTIONS as readonly string[]).includes(
      editingCategoryColor
    )
      ? editingCategoryColor
      : CATEGORY_COLOR_OPTIONS[0];
    const nextCategories = categories.map(cat =>
      cat.id === editingCategoryId
        ? { ...cat, name, color }
        : cat
    );
    handleSaveCategories(nextCategories);
    cancelEditCategory();
  };

  const handleRemoveCategory = (id: string) => {
    const nextCategories = categories.filter(cat => cat.id !== id);
    handleSaveCategories(nextCategories);
    setTasks(prev =>
      prev.map(task => ({
        ...task,
        categoryIds: (task.categoryIds || []).filter(catId => catId !== id),
      }))
    );
  };

  const pageActions = (
    <Stack direction="row" spacing={1} alignItems="center">
      <Button
        variant="outlined"
        onClick={() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          setCategoryFilter([]);
          setSelectedDate(today);
        }}
        sx={{
          textTransform: "none",
          fontWeight: 600,
          minWidth: 0,
          whiteSpace: "nowrap",
        }}
      >
        Hoje
      </Button>
      <Button
        variant="outlined"
        component={RouterLink}
        href="/tarefas/concluidas"
        sx={{
          textTransform: "none",
          fontWeight: 600,
          minWidth: 0,
          whiteSpace: "nowrap",
        }}
      >
        Tarefas feitas
      </Button>
      <SettingsIconButton onClick={() => setCalendarSettingsOpen(true)} />
    </Stack>
  );

  return (
    <PageContainer actionsSlot={pageActions}>
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
          </Stack>

          <Stack spacing={{ xs: 2, md: 2.5 }}>
            {isSmDown ? (
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
                  onClick={() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    setCategoryFilter([]);
                    setSelectedDate(today);
                  }}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    minWidth: 0,
                  }}
                >
                  Hoje
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
                onKeyDown={event => {
                  if (event.key === "Escape") {
                    setTaskQuery("");
                    setShowTaskSearch(false);
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {taskQuery ? (
                        <IconButton
                          size="small"
                          onClick={() => setTaskQuery("")}
                          aria-label="Limpar busca"
                          sx={{ width: 48, height: 48 }}
                        >
                          <CloseRoundedIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <Box sx={{ width: 48, height: 48 }} />
                      )}
                    </InputAdornment>
                  ),
                }}
              />
            ) : null}

            <Stack spacing={2}>
              {isCategoryListMode ? (
                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                  <SortableContext items={visibleTaskIds} strategy={verticalListSortingStrategy}>
                    <AppCard
                      elevation={0}
                      sx={theme => ({
                        ...staticCardSx(theme),
                        p: 2,
                      })}
                    >
                      <Stack spacing={0.5}>
                        {visibleTasks.map(task => {
                          const subtaskCount = task.subtasks?.length ?? 0;
                          const taskCategoryId = task.categoryIds?.[0];
                          const taskCategory = taskCategoryId
                            ? categories.find(cat => cat.id === taskCategoryId)
                            : null;
                          const taskDateLabel = formatTaskRelativeDateLabel(task.date);

                          return (
                            <DraggableTaskCard
                              key={task.id}
                              taskId={task.id}
                              onClick={() => handleViewTask(task)}
                              onContextMenu={event => {
                                event.preventDefault();
                                setTaskContextMenu({
                                  task,
                                  mouseX: event.clientX,
                                  mouseY: event.clientY,
                                });
                              }}
                            >
                              <Stack spacing={0.25}>
                                <Stack
                                  direction="row"
                                  spacing={1.5}
                                  alignItems="center"
                                  justifyContent="space-between"
                                >
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    sx={{ flex: 1, minWidth: 0 }}
                                  >
                                    <Checkbox
                                      checked={Boolean(task.done)}
                                      size="small"
                                      onPointerDown={event => event.stopPropagation()}
                                      onClick={event => event.stopPropagation()}
                                      onChange={event =>
                                        handleToggleTaskDone(task, event.target.checked)
                                      }
                                      sx={{ ml: 0.25 }}
                                    />
                                    <Typography
                                      variant="subtitle2"
                                      sx={{
                                        fontWeight: 600,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        flex: 1,
                                        minWidth: 0,
                                        textDecoration: task.done ? "line-through" : "none",
                                        color: task.done ? "text.secondary" : "text.primary",
                                      }}
                                    >
                                      {task.name}
                                    </Typography>
                                  </Stack>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "text.secondary",
                                      whiteSpace: "nowrap",
                                      flexShrink: 0,
                                      maxWidth: 160,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {taskCategory ? taskCategory.name : ""}
                                  </Typography>
                                </Stack>

                                {taskDateLabel || subtaskCount > 0 ? (
                                  <Stack
                                    direction="row"
                                    spacing={1.25}
                                    alignItems="center"
                                    sx={{ pl: 4.5, lineHeight: 1.2 }}
                                  >
                                    {taskDateLabel ? (
                                      <Typography
                                        variant="caption"
                                        sx={{ color: "text.secondary" }}
                                      >
                                        {taskDateLabel}
                                      </Typography>
                                    ) : null}
                                    {subtaskCount > 0 ? (
                                      <Typography
                                        variant="caption"
                                        sx={{ color: "text.secondary" }}
                                      >
                                        {subtaskCount} subtarefas
                                      </Typography>
                                    ) : null}
                                  </Stack>
                                ) : null}
                              </Stack>
                            </DraggableTaskCard>
                          );
                        })}

                        <InlineAddTaskRow
                          dateKey={formatDateKey(new Date())}
                          placeholder={t("Adicionar tarefa")}
                          onAdd={handleAddInlineTaskForSelectedCategory}
                          onFocusChange={handleInlineAddTaskFocusChange}
                        />
                      </Stack>
                    </AppCard>
                  </SortableContext>
                </DndContext>
              ) : (
                <AppCard
                  elevation={0}
                  sx={theme => ({
                    ...staticCardSx(theme),
                    p: 2,
                  })}
                >
                  <Box
                    onClick={event =>
                      setMiniCalendarAnchorEl(prev =>
                        prev ? null : (event.currentTarget as HTMLElement)
                      )
                    }
                    sx={theme => ({
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      px: 1,
                      py: 0.75,
                      mb: 1,
                      cursor: "pointer",
                      borderRadius: "var(--radius-button)",
                      border: 0,
                      width: "fit-content",
                      maxWidth: "100%",
                      backgroundColor: miniCalendarAnchorEl
                        ? theme.palette.action.selected
                        : "transparent",
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                      },
                      "&:active": {
                        backgroundColor: theme.palette.action.selected,
                      },
                    })}
                    aria-haspopup="dialog"
                    aria-expanded={Boolean(miniCalendarAnchorEl)}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <CalendarTodayRoundedIcon fontSize="small" />
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {monthLabels[miniCalendarMonth.getMonth()]}{" "}
                          {miniCalendarMonth.getFullYear()}
                        </Typography>
                        <ChevronRightRoundedIcon
                          fontSize="small"
                          sx={{
                            transform: miniCalendarAnchorEl
                              ? "rotate(-90deg)"
                              : "rotate(90deg)",
                            transition: "transform 120ms ease",
                          }}
                        />
                      </Stack>
                    </Stack>
                  </Box>

                  <Popover
                    open={Boolean(miniCalendarAnchorEl)}
                    anchorEl={miniCalendarAnchorEl}
                    onClose={() => setMiniCalendarAnchorEl(null)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                    transformOrigin={{ vertical: "top", horizontal: "left" }}
                    disableRestoreFocus
                    slotProps={{
                      paper: {
                        sx: theme => ({
                          mt: 1,
                          overflow: "visible",
                          borderRadius: "var(--radius)",
                          border: 1,
                          borderColor: "divider",
                          backgroundColor: "background.paper",
                          width: 280,
                          maxWidth: "calc(100vw - 32px)",
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            top: -6,
                            left: 28,
                            width: 12,
                            height: 12,
                            transform: "rotate(45deg)",
                            backgroundColor: theme.palette.background.paper,
                            borderLeft: `1px solid ${theme.palette.divider}`,
                            borderTop: `1px solid ${theme.palette.divider}`,
                          },
                        }),
                      },
                    }}
                    PaperProps={{
                      sx: theme => ({
                        mt: 1,
                        overflow: "visible",
                        borderRadius: "var(--radius)",
                        border: 1,
                        borderColor: "divider",
                        backgroundColor: "background.paper",
                        width: 280,
                        maxWidth: "calc(100vw - 32px)",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: -6,
                          left: 28,
                          width: 12,
                          height: 12,
                          transform: "rotate(45deg)",
                          backgroundColor: theme.palette.background.paper,
                          borderLeft: `1px solid ${theme.palette.divider}`,
                          borderTop: `1px solid ${theme.palette.divider}`,
                        },
                      }),
                    }}
                  >
                    <ClickAwayListener onClickAway={() => setMiniCalendarAnchorEl(null)}>
                      <Box sx={{ p: 1.5 }}>
                        <Stack spacing={1.5}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <IconButton
                              size="small"
                              onClick={() =>
                                setMiniCalendarMonth(
                                  new Date(
                                    miniCalendarMonth.getFullYear(),
                                    miniCalendarMonth.getMonth() - 1,
                                    1
                                  )
                                )
                              }
                              aria-label="Mês anterior"
                            >
                              <ChevronLeftRoundedIcon fontSize="small" />
                            </IconButton>

                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {monthLabels[miniCalendarMonth.getMonth()]}{" "}
                              {miniCalendarMonth.getFullYear()}
                            </Typography>

                            <IconButton
                              size="small"
                              onClick={() =>
                                setMiniCalendarMonth(
                                  new Date(
                                    miniCalendarMonth.getFullYear(),
                                    miniCalendarMonth.getMonth() + 1,
                                    1
                                  )
                                )
                              }
                              aria-label="Próximo mês"
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
                            {weekLabels.map((label, index) => (
                              <Typography
                                key={`mini-main-weekday-${index}`}
                                variant="caption"
                                sx={{ textAlign: "center", color: "text.secondary" }}
                              >
                                {label}
                              </Typography>
                            ))}
                            {getCalendarDays(miniCalendarMonth).map((day, index) => {
                              const selectedKey = formatDateKey(selectedDate);
                              const dayKey = day ? formatDateKey(day) : "";
                              const isSelected = Boolean(day && dayKey === selectedKey);
                              const hasTasks = Boolean(day && tasksByDate.has(dayKey));

                              return (
                                <Box
                                  key={`mini-main-${day ? day.toISOString() : "empty"}-${index}`}
                                  onClick={() => {
                                    if (!day) {
                                      return;
                                    }
                                    const next = new Date(day);
                                    next.setHours(0, 0, 0, 0);
                                    setSelectedDate(next);
                                    setMiniCalendarAnchorEl(null);
                                  }}
                                  sx={theme => ({
                                    ...interactiveItemSx(theme),
                                    height: 32,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "var(--radius-button)",
                                    border: isSelected ? 1 : "1px solid transparent",
                                    borderColor: isSelected ? "primary.main" : "transparent",
                                    cursor: day ? "pointer" : "default",
                                    color: isSelected ? "primary.main" : "text.secondary",
                                    fontWeight: isSelected ? 600 : 500,
                                    position: "relative",
                                  })}
                                >
                                  {day ? day.getDate() : ""}
                                  {hasTasks ? (
                                    <Box
                                      sx={theme => ({
                                        width: 6,
                                        height: 6,
                                        borderRadius: "50%",
                                        backgroundColor: theme.palette.text.secondary,
                                        position: "absolute",
                                        bottom: 4,
                                      })}
                                    />
                                  ) : null}
                                </Box>
                              );
                            })}
                          </Box>

                          <Autocomplete
                            freeSolo
                            options={miniCalendarYearOptions}
                            getOptionLabel={option => String(option)}
                            value={miniCalendarMonth.getFullYear()}
                            inputValue={miniCalendarYearInput}
                            onInputChange={(_, value) => setMiniCalendarYearInput(value)}
                            onChange={(_, value) => {
                              const parsed = parseYearInput(value);
                              if (parsed == null) {
                                return;
                              }
                              setMiniCalendarYear(parsed);
                            }}
                            renderInput={params => (
                              <TextField
                                {...params}
                                label="Ano"
                                size="small"
                                onFocus={() => setIsMiniCalendarYearEditing(true)}
                                onBlur={() => {
                                  setIsMiniCalendarYearEditing(false);
                                  const parsed = parseYearInput(miniCalendarYearInput);
                                  if (parsed == null) {
                                    setMiniCalendarYearInput(
                                      String(miniCalendarMonth.getFullYear())
                                    );
                                    return;
                                  }
                                  setMiniCalendarYear(parsed);
                                }}
                              />
                            )}
                          />
                        </Stack>
                      </Box>
                    </ClickAwayListener>
                  </Popover>

                  <DndContext
                    sensors={sensors}
                    onDragEnd={handleAgendaDragEnd}
                  >
                    <Stack spacing={1.25}>
                      {calendarDaySections.map(section => (
                        <Stack key={section.dateKey} spacing={0.75}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{ pt: 0.5 }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700, textTransform: "capitalize" }}
                          >
                            {formatCalendarDayLabel(section.date)}
                          </Typography>
                          {calendarSettings.showAgendaTaskCount ? (
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary" }}
                            >
                              {section.tasks.length}
                            </Typography>
                          ) : null}
                        </Stack>

                        <DroppableAgendaDay dateKey={section.dateKey}>
                          <Stack spacing={0.5}>
                            {section.tasks.map(task => {
                                  const subtaskCount = task.subtasks?.length ?? 0;
                                  const taskCategoryId = task.categoryIds?.[0];
                                  const taskCategory = taskCategoryId
                                    ? categories.find(cat => cat.id === taskCategoryId)
                                    : null;

                                  return (
                                    <AgendaDraggableTaskCard
                                      key={task.id}
                                      taskId={task.id}
                                      onClick={() => handleViewTask(task)}
                                      onContextMenu={event => {
                                        event.preventDefault();
                                        setTaskContextMenu({
                                          task,
                                          mouseX: event.clientX,
                                          mouseY: event.clientY,
                                        });
                                      }}
                                    >
                                      <Stack spacing={0.25}>
                                        <Stack
                                          direction="row"
                                          spacing={1.5}
                                          alignItems="center"
                                          justifyContent="space-between"
                                        >
                                          <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            sx={{ flex: 1, minWidth: 0 }}
                                          >
                                            <Checkbox
                                              checked={Boolean(task.done)}
                                              size="small"
                                              onPointerDown={event => event.stopPropagation()}
                                              onClick={event => event.stopPropagation()}
                                              onChange={event =>
                                                handleToggleTaskDone(
                                                  task,
                                                  event.target.checked
                                                )
                                              }
                                              sx={{ ml: 0.25 }}
                                            />
                                            <Typography
                                              variant="subtitle2"
                                              sx={{
                                                fontWeight: 600,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                flex: 1,
                                                minWidth: 0,
                                                textDecoration: task.done
                                                  ? "line-through"
                                                  : "none",
                                                color: task.done
                                                  ? "text.secondary"
                                                  : "text.primary",
                                              }}
                                            >
                                              {task.name}
                                            </Typography>
                                          </Stack>
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              color: "text.secondary",
                                              whiteSpace: "nowrap",
                                              flexShrink: 0,
                                              maxWidth: 160,
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                            }}
                                          >
                                            {taskCategory ? taskCategory.name : ""}
                                          </Typography>
                                        </Stack>

                                        {subtaskCount > 0 ? (
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              color: "text.secondary",
                                              pl: 4.5,
                                              lineHeight: 1.2,
                                            }}
                                          >
                                            {subtaskCount} subtarefas
                                          </Typography>
                                        ) : null}
                                      </Stack>
                                    </AgendaDraggableTaskCard>
                                  );
                                })}

                            <InlineAddTaskRow
                              dateKey={section.dateKey}
                              placeholder={t("Adicionar tarefa")}
                              onAdd={handleAddInlineTask}
                              onFocusChange={handleInlineAddTaskFocusChange}
                            />
                          </Stack>
                        </DroppableAgendaDay>
                      </Stack>
                      ))}
                    </Stack>
                  </DndContext>
                </AppCard>
              )}
            </Stack>
          </Stack>
      </Box>

      <Dialog
        open={Boolean(viewingTask)}
        onClose={handleCloseView}
        maxWidth={false}
        fullWidth
        disableRestoreFocus
        PaperProps={{
          sx: {
            width: { xs: "calc(100% - 32px)", sm: "80%", md: "70%" },
            maxWidth: { sm: "80%", md: "70%", xl: 960 },
            m: { xs: 2, sm: 3 },
          },
        }}
      >
        <DialogContent>
          <Stack spacing={2.5}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                <Checkbox
                  checked={Boolean(viewingTask?.done)}
                  onChange={event => viewingTask && handleToggleTaskDone(viewingTask, event.target.checked)}
                  sx={{ ml: 0.5, mr: 1, p: 0.5, alignSelf: "center" }}
                />
                <TextField
                  value={viewingTask?.name || ""}
                  onChange={event => handleUpdateViewingTaskName(event.target.value)}
                  size="small"
                  variant="standard"
                  placeholder="Título"
                  inputProps={{
                    "aria-label": "Título da tarefa",
                    size: Math.min(
                      48,
                      Math.max(6, (viewingTask?.name || "").length || 6)
                    ),
                  }}
                  InputProps={{ disableUnderline: true }}
                  sx={{
                    width: "auto",
                    flex: "0 1 auto",
                    minWidth: 0,
                    maxWidth: { xs: "46vw", sm: "52vw", md: "60%" },
                    "& .MuiInputBase-root": {
                      alignItems: "center",
                    },
                    "& .MuiInputBase-input": {
                      typography: "h6",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    },
                  }}
                />
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    whiteSpace: "nowrap",
                    maxWidth: { xs: 140, sm: 220 },
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {viewingTask?.categoryIds?.[0]
                    ? categories.find(cat => cat.id === viewingTask.categoryIds?.[0])
                        ?.name || "Categoria"
                    : "Categoria"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", whiteSpace: "nowrap" }}
                >
                  •
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", whiteSpace: "nowrap" }}
                >
                  {viewingTask ? formatTaskDateTimeLabel(viewingTask) : ""}
                </Typography>
                <Tooltip title="Fechar" placement="top">
                  <IconButton
                    onClick={handleCloseView}
                    sx={{ color: "text.secondary" }}
                    aria-label="Fechar"
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
            <Stack spacing={1.5}>
              {calendarSettings.showCategories && viewingTask?.categoryIds?.length ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {categories.find(cat => cat.id === viewingTask.categoryIds?.[0])
                    ?.name || ""}
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
              {calendarSettings.showDescription &&
              viewingTask?.descriptionHtml ? (
                <CardSection size="xs" sx={{ "& p": { margin: 0 } }}>
                  <Box
                    dangerouslySetInnerHTML={{
                      __html: viewingTask.descriptionHtml,
                    }}
                  />
                </CardSection>
              ) : null}

              <CardSection size="xs">
                <Stack spacing={1.25}>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "text.secondary" }}
                  >
                    Subtarefas
                  </Typography>

                  <Stack spacing={0.5}>
                    {(viewingTask?.subtasks || []).map(subtask => (
                      <Stack
                        key={subtask.id}
                        direction={{ xs: "column", sm: "row" }}
                        spacing={0.75}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        sx={{
                          width: "100%",
                          
                          p: 0.5,
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ flex: 1, minWidth: 0 }}
                        >
                          <Checkbox
                            checked={subtask.done}
                            onChange={event =>
                              viewingTask &&
                              handleToggleViewingSubtaskDone(
                                viewingTask,
                                subtask.id,
                                event.target.checked
                              )
                            }
                            size="small"
                            sx={{ p: 0.5 }}
                          />
                          <TextField
                            value={subtask.title}
                            onChange={event =>
                              handleUpdateViewingSubtaskTitle(
                                subtask.id,
                                event.target.value
                              )
                            }
                            fullWidth
                            size="small"
                            variant="standard"
                            InputProps={{ disableUnderline: true }}
                            placeholder="Subtarefa"
                          />
                        </Stack>
                        <IconButton
                          onClick={() => handleRemoveViewingSubtask(subtask.id)}
                          size="small"
                          sx={{
                            color: "text.secondary",
                            p: 0.5,
                            alignSelf: { xs: "flex-end", sm: "center" },
                          }}
                          aria-label="Remover subtarefa"
                        >
                          <CloseRoundedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={0.75}
                      alignItems={{ xs: "stretch", sm: "center" }}
                      sx={{
                        width: "100%",
                        
                        p: 0.5,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ flex: 1, minWidth: 0 }}
                      >
                        <Checkbox
                          size="small"
                          disabled
                          sx={{ visibility: "hidden", p: 0.5 }}
                        />
                        <TextField
                          inputRef={viewingSubtaskDraftInputRef}
                          value={viewingSubtaskDraftTitle}
                          onChange={event =>
                            setViewingSubtaskDraftTitle(event.target.value)
                          }
                          onKeyDown={event => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleAddViewingSubtask();
                            }
                          }}
                          fullWidth
                          size="small"
                          variant="standard"
                          InputProps={{ disableUnderline: true }}
                          placeholder="Adicionar sub tarefa"
                        />
                      </Stack>
                      <IconButton
                        onClick={() => handleAddViewingSubtask()}
                        size="small"
                        sx={{
                          p: 0.5,
                          alignSelf: { xs: "flex-end", sm: "center" },
                        }}
                        aria-label="Adicionar sub tarefa"
                      >
                        <AddRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Stack>
              </CardSection>
            </Stack>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="flex-end"
            >
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

      <Dialog
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        fullScreen={isSmDown}
        fullWidth
        maxWidth="sm"
        disableRestoreFocus
      >
        <DialogContent>
          <Stack spacing={2.5}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
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
                  <IconButton
                    onClick={() => setMobileSidebarOpen(false)}
                    aria-label="Fechar"
                  >
                    <CloseRoundedIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            {showTaskSearch ? (
              null
            ) : null}

            <CardSection size="xs">
              <Stack spacing={2}>
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
              </Stack>
            </CardSection>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onClose={handleCloseEdit}
        maxWidth={false}
        fullWidth
        disableRestoreFocus
        PaperProps={{
          sx: {
            width: { xs: "calc(100% - 32px)", sm: "80%", md: "70%" },
            maxWidth: { sm: "80%", md: "70%", xl: 960 },
            m: { xs: 2, sm: 3 },
          },
        }}
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
              <Typography variant="h6">Editar tarefa</Typography>
              <Tooltip title="Fechar" placement="top">
                <IconButton
                  onClick={handleCloseEdit}
                  sx={{ color: "text.secondary" }}
                  aria-label="Fechar"
                >
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <TextField
              label="Titulo"
              fullWidth
              value={draftTask?.name || ""}
              onChange={event =>
                setDraftTask(prev =>
                  prev ? { ...prev, name: event.target.value } : prev
                )
              }
            />

            <TextField
              select
              label="Categoria"
              fullWidth
              value={draftTask?.categoryIds?.[0] || ""}
              onChange={event => {
                const nextId = event.target.value;
                setDraftTask(prev =>
                  prev
                    ? { ...prev, categoryIds: nextId ? [nextId] : [] }
                    : prev
                );
              }}
            >
              <MenuItem value="">Sem categoria</MenuItem>
              {categories.map(cat => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
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
                    setDraftTask(prev =>
                      prev
                        ? {
                            ...prev,
                            responsibleIds: value.map(person => person.id),
                          }
                        : prev
                    )
                  }
                  getOptionLabel={option => formatPersonLabel(option)}
                  noOptionsText="Nenhum usuario"
                  renderInput={params => (
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
                    setDraftTask(prev =>
                      prev
                        ? { ...prev, workerIds: value.map(person => person.id) }
                        : prev
                    )
                  }
                  getOptionLabel={option => formatPersonLabel(option)}
                  noOptionsText="Nenhum usuario"
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Pessoas na tarefa"
                      fullWidth
                    />
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
                onChange={event =>
                  setDraftTask(prev =>
                    prev ? { ...prev, link: event.target.value } : prev
                  )
                }
              />
            ) : null}
            {calendarSettings.showLocation ? (
              <TextField
                label="Local"
                fullWidth
                value={draftTask?.location || ""}
                onChange={event =>
                  setDraftTask(prev =>
                    prev ? { ...prev, location: event.target.value } : prev
                  )
                }
              />
            ) : null}
            {calendarSettings.showCategories ? (
              <Autocomplete
                options={categories}
                value={
                  draftTask?.categoryIds?.[0]
                    ? categories.find(cat => cat.id === draftTask.categoryIds?.[0]) ??
                      null
                    : null
                }
                onChange={(_, value) =>
                  setDraftTask(prev =>
                    prev
                      ? { ...prev, categoryIds: value ? [value.id] : [] }
                      : prev
                  )
                }
                getOptionLabel={option => option.name}
                renderInput={params => (
                  <TextField {...params} label="Categorias" fullWidth />
                )}
              />
            ) : null}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Data"
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
                  onChange={event =>
                    setDraftTask(prev =>
                      prev
                        ? { ...prev, allDay: event.target.value === "sim" }
                        : prev
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
                  onChange={event =>
                    setDraftTask(prev =>
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
                  onChange={event =>
                    setDraftTask(prev =>
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
                onChange={event =>
                  setDraftTask(prev =>
                    prev
                      ? {
                          ...prev,
                          reminder: event.target
                            .value as CalendarTask["reminder"],
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
                onChange={event =>
                  setDraftTask(prev =>
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
                onChange={event =>
                  setDraftTask(prev =>
                    prev
                      ? {
                          ...prev,
                          visibility: event.target
                            .value as CalendarTask["visibility"],
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
                onChange={event =>
                  setDraftTask(prev =>
                    prev
                      ? {
                          ...prev,
                          notification: event.target
                            .value as CalendarTask["notification"],
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
                <Typography
                  variant="subtitle2"
                  sx={{ color: "text.secondary" }}
                >
                  Descrição
                </Typography>
                <RichTextEditor
                  value={draftTask?.descriptionHtml || ""}
                  onChange={nextValue =>
                    setDraftTask(prev =>
                      prev ? { ...prev, descriptionHtml: nextValue } : prev
                    )
                  }
                  placeholder="Escreva a descricao da tarefa..."
                />
              </Stack>
            ) : null}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="flex-end"
            >
              <Button
                color="error"
                variant="outlined"
                onClick={removeDraftTask}
              >
                {t("common.delete")}
              </Button>
              <Button variant="outlined" onClick={handleBackToViewFromEdit}>
                Voltar
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
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <IconButton
                size="small"
                onClick={() =>
                  setDatePickerMonth(
                    new Date(
                      datePickerMonth.getFullYear(),
                      datePickerMonth.getMonth() - 1,
                      1
                    )
                  )
                }
              >
                <ChevronLeftRoundedIcon fontSize="small" />
              </IconButton>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {monthLabels[datePickerMonth.getMonth()]}{" "}
                {datePickerMonth.getFullYear()}
              </Typography>
              <IconButton
                size="small"
                onClick={() =>
                  setDatePickerMonth(
                    new Date(
                      datePickerMonth.getFullYear(),
                      datePickerMonth.getMonth() + 1,
                      1
                    )
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
              {weekLabels.map((label, index) => (
                <Typography
                  key={`picker-weekday-${index}`}
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
                      setDraftTask(prev =>
                        prev ? { ...prev, date: formatDateKey(day) } : prev
                      );
                      setDatePickerOpen(false);
                    }}
                    sx={theme => ({
                      ...interactiveItemSx(theme),
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "var(--radius-button)",
                      border: isSelected ? 1 : "1px solid transparent",
                      borderColor: isSelected ? "primary.main" : "transparent",
                      cursor: day ? "pointer" : "default",
                      color: isSelected ? "primary.main" : "text.secondary",
                      fontWeight: isSelected ? 600 : 500,
                    })}
                  >
                    {day ? day.getDate() : ""}
                  </Box>
                );
              })}
            </Box>

            <TextField
              select
              size="small"
              label="Ano"
              value={datePickerMonth.getFullYear()}
              onChange={event => {
                const nextYear = Number(event.target.value);
                setDatePickerMonth(
                  new Date(nextYear, datePickerMonth.getMonth(), 1)
                );
              }}
            >
              {Array.from({ length: 21 }, (_, index) => {
                const year = datePickerMonth.getFullYear() - 10 + index;
                return (
                  <MenuItem key={`picker-year-${year}`} value={year}>
                    {year}
                  </MenuItem>
                );
              })}
            </TextField>
          </Stack>
        </Box>
      </Popover>

      <SettingsDialog
        open={calendarSettingsOpen}
        onClose={() => setCalendarSettingsOpen(false)}
        title="Configurações de tarefas"
        maxWidth="sm"
        onRestoreDefaults={handleRestoreCalendarDefaults}
        sections={[
          {
            key: "fields",
            title: "Campos do evento",
            content: (
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
                ].map(item => (
                  <Box
                    key={item.key}
                    sx={theme => ({
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      borderColor: "divider",
                      cursor: "pointer",
                      borderRadius: "var(--radius-button)",
                      ...interactiveItemSx(theme),
                    })}
                    onClick={() =>
                      setCalendarSettings(prev => ({
                        ...prev,
                        [item.key]:
                          !prev[item.key as keyof typeof calendarSettings],
                      }))
                    }
                  >
                    <Typography variant="subtitle2">{item.label}</Typography>
                    <ToggleCheckbox
                      checked={Boolean(
                        calendarSettings[
                          item.key as keyof typeof calendarSettings
                        ]
                      )}
                      onChange={event =>
                        setCalendarSettings(prev => ({
                          ...prev,
                          [item.key]: event.target.checked,
                        }))
                      }
                      onClick={event => event.stopPropagation()}
                    />
                  </Box>
                ))}
              </Box>
            ),
          },
          {
            key: "agenda",
            title: "Agenda",
            content: (
              <Stack spacing={1.5}>
                <TextField
                  select
                  size="small"
                  label="Dias"
                  value={agendaDaysCount}
                  onChange={event => {
                    const next = Number(event.target.value);
                    if (
                      agendaDaysOptions.includes(
                        next as (typeof agendaDaysOptions)[number]
                      )
                    ) {
                      setAgendaDaysCount(next);
                    }
                  }}
                  disabled={isCategoryListMode}
                >
                  {agendaDaysOptions.map(value => (
                    <MenuItem key={`agenda-days-settings-${value}`} value={value}>
                      {value}
                    </MenuItem>
                  ))}
                </TextField>
                <Box
                  sx={theme => ({
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1.5,
                    borderColor: "divider",
                    cursor: "pointer",
                    borderRadius: "var(--radius-button)",
                    ...interactiveItemSx(theme),
                  })}
                  onClick={() =>
                    setCalendarSettings(prev => ({
                      ...prev,
                      showAgendaTaskCount: !prev.showAgendaTaskCount,
                    }))
                  }
                >
                  <Typography variant="subtitle2">
                    Mostrar quantidade de tarefas por dia
                  </Typography>
                  <ToggleCheckbox
                    checked={Boolean(calendarSettings.showAgendaTaskCount)}
                    onChange={event =>
                      setCalendarSettings(prev => ({
                        ...prev,
                        showAgendaTaskCount: event.target.checked,
                      }))
                    }
                    onClick={event => event.stopPropagation()}
                  />
                </Box>
              </Stack>
            ),
          },
          {
            key: "notifications",
            title: "Notificações do navegador",
            content: (
              <Stack spacing={2}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Ative as notificações do navegador para receber alertas quando
                  marcar uma tarefa como concluída.
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button
                    variant={notificationPermission === "granted" ? "outlined" : "contained"}
                    startIcon={<NotificationsActiveRoundedIcon />}
                    onClick={requestNotificationPermission}
                    disabled={notificationPermission === "granted"}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    {notificationPermission === "granted"
                      ? "Notificações ativadas"
                      : notificationPermission === "denied"
                      ? "Notificações bloqueadas"
                      : "Ativar notificações"}
                  </Button>
                  {notificationPermission === "granted" && (
                    <Chip
                      label="Ativo"
                      color="success"
                      size="small"
                      icon={<CheckCircleRoundedIcon fontSize="small" />}
                    />
                  )}
                  {notificationPermission === "denied" && (
                    <Typography variant="caption" sx={{ color: "error.main" }}>
                      As notificações foram bloqueadas. Altere nas configurações do navegador.
                    </Typography>
                  )}
                </Stack>
              </Stack>
            ),
          },
          {
            key: "categories",
            title: "Categorias",
            content: (
              <Stack spacing={1.5}>
                {editingCategoryId ? (
                  <CardSection size="xs">
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Editar categoria
                      </Typography>
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
                        <CategoryColorPicker
                          value={editingCategoryColor}
                          onChange={setEditingCategoryColor}
                        />
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
                  {categories.map(cat => (
                    <CategoryChip
                      key={cat.id}
                      label={cat.name}
                      onClick={() => startEditCategory(cat)}
                      onDelete={() => handleRemoveCategory(cat.id)}
                      categoryColor={cat.color}
                    />
                  ))}
                </Stack>
                {editingCategoryId ? null : (
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", mb: 1 }}
                    >
                      Nova categoria
                    </Typography>
                    <Stack spacing={1.5}>
                      <TextField
                        label="Nome"
                        fullWidth
                        value={newCategoryName}
                        onChange={event =>
                          setNewCategoryName(event.target.value)
                        }
                      />
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <CategoryColorPicker
                          value={newCategoryColor}
                          onChange={setNewCategoryColor}
                        />
                      </Stack>
                      <Button
                        variant="outlined"
                        onClick={handleAddCategory}
                        startIcon={<AddRoundedIcon />}
                        sx={{
                          alignSelf: "flex-start",
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        Criar categoria
                      </Button>
                    </Stack>
                  </Box>
                )}
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
              onClick={handleUndoRestoreCalendarDefaults}
            >
              Reverter
            </Button>
          }
          sx={{ width: "100%" }}
        >
          Configurações restauradas.
        </Alert>
      </Snackbar>

      <Menu
        open={Boolean(taskContextMenu)}
        onClose={() => setTaskContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          taskContextMenu
            ? { top: taskContextMenu.mouseY, left: taskContextMenu.mouseX }
            : undefined
        }
        slotProps={{
          paper: {
            sx: {
              borderRadius: "var(--radius-card)",
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (!taskContextMenu) {
              return;
            }
            handleOpenEditForTask(taskContextMenu.task);
            setTaskContextMenu(null);
          }}
        >
          <ListItemIcon>
            <EditRoundedIcon fontSize="small" />
          </ListItemIcon>
          Editar
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!taskContextMenu) {
              return;
            }
            handleDuplicateTask(taskContextMenu.task);
            setTaskContextMenu(null);
          }}
        >
          <ListItemIcon>
            <ContentCopyRoundedIcon fontSize="small" />
          </ListItemIcon>
          Duplicar
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!taskContextMenu) {
              return;
            }
            handleRemoveTaskById(taskContextMenu.task.id);
            setTaskContextMenu(null);
          }}
        >
          <ListItemIcon>
            <DeleteRoundedIcon fontSize="small" />
          </ListItemIcon>
          Remover
        </MenuItem>
      </Menu>
    </PageContainer>
  );
}


