import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Autocomplete,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  ClickAwayListener,
  Dialog,
  DialogContent,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import FormatBoldRoundedIcon from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRoundedIcon from "@mui/icons-material/FormatItalicRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import LooksOneRoundedIcon from "@mui/icons-material/LooksOneRounded";
import LooksTwoRoundedIcon from "@mui/icons-material/LooksTwoRounded";
import Looks3RoundedIcon from "@mui/icons-material/Looks3Rounded";
import UnarchiveRoundedIcon from "@mui/icons-material/UnarchiveRounded";
import BackspaceRoundedIcon from "@mui/icons-material/BackspaceRounded";
import FormatUnderlinedRoundedIcon from "@mui/icons-material/FormatUnderlinedRounded";
import ShuffleRoundedIcon from "@mui/icons-material/ShuffleRounded";
import { EditorContent, useEditor } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Suggestion from "@tiptap/suggestion";
import { APP_RADIUS, APP_RADIUS_PX } from "../designTokens";
import { interactiveItemSx, interactiveCardSx } from "../styles/interactiveCard";
import SettingsIconButton from "../components/SettingsIconButton";
import { usePageActions } from "../hooks/usePageActions";
import ToggleCheckbox from "../components/ToggleCheckbox";
import CardSection from "../components/layout/CardSection";
import AppCard from "../components/layout/AppCard";
import AppAccordion from "../components/layout/AppAccordion";
import PageContainer from "../components/layout/PageContainer";
import SettingsDialog from "../components/SettingsDialog";
import { Link as RouterLink, useLocation } from "wouter";
import { loadUserStorage, saveUserStorage } from "../userStorage";
import emojibasePtData from "emojibase-data/pt/data.json";

type NoteLink = {
  id: string;
  label: string;
  url: string;
};

type NoteAttachment = {
  id: string;
  name: string;
  mime: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
};

type Note = {
  id: string;
  title: string;
  emoji: string;
  contentHtml: string;
  links: NoteLink[];
  attachments: NoteAttachment[];
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  isDraft?: boolean;
  parentId?: string;
  relatedNoteIds?: string[];
};

type LegacyNote = Note & {
  categoryIds?: string[];
  subcategoryIds?: string[];
  categoryId?: string;
  subcategoryId?: string;
};

const STORAGE_NOTES = "notes_v2";
const STORAGE_NOTE_FIELDS = "note_fields_v2";

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
];

type NoteEmoji = { emoji: string; label: string };

const hexcodeToEmoji = (hexcode: string) => {
  try {
    return hexcode
      .split("-")
      .map(part => String.fromCodePoint(Number.parseInt(part, 16)))
      .join("");
  } catch {
    return "";
  }
};

const BASE_NOTE_EMOJIS: NoteEmoji[] = [
  // Escrita e documentos
  { emoji: "📝", label: "memo nota escrita" },
  { emoji: "📒", label: "caderno amarelo" },
  { emoji: "📓", label: "caderno" },
  { emoji: "📔", label: "caderno decorado" },
  { emoji: "📕", label: "livro vermelho" },
  { emoji: "📗", label: "livro verde" },
  { emoji: "📘", label: "livro azul" },
  { emoji: "📙", label: "livro laranja" },
  { emoji: "📚", label: "livros pilha" },
  { emoji: "📖", label: "livro aberto" },
  { emoji: "✏️", label: "lapis escrever" },
  { emoji: "🖊️", label: "caneta" },
  { emoji: "🖋️", label: "caneta tinteiro" },
  { emoji: "✒️", label: "pena escrever" },
  { emoji: "📌", label: "tachinha pin" },
  { emoji: "📍", label: "marcador local" },
  { emoji: "🔖", label: "marcador favorito" },
  { emoji: "💡", label: "lampada ideia" },
  { emoji: "💭", label: "balao pensamento" },
  { emoji: "💬", label: "balao conversa chat" },
  // Arte e entretenimento
  { emoji: "🎯", label: "alvo meta objetivo" },
  { emoji: "🎨", label: "paleta arte pintura" },
  { emoji: "🎭", label: "teatro mascaras" },
  { emoji: "🎪", label: "circo tenda" },
  { emoji: "🎬", label: "cinema filme claquete" },
  { emoji: "🎵", label: "musica nota" },
  { emoji: "🎶", label: "musica notas" },
  { emoji: "🎤", label: "microfone canto" },
  { emoji: "🎧", label: "fone ouvir" },
  { emoji: "🎹", label: "piano teclado" },
  // Natureza
  { emoji: "🌟", label: "estrela brilho" },
  { emoji: "⭐", label: "estrela favorito" },
  { emoji: "🌈", label: "arcoiris" },
  { emoji: "🌸", label: "flor cerejeira" },
  { emoji: "🌺", label: "flor hibisco" },
  { emoji: "🌻", label: "girassol" },
  { emoji: "🌼", label: "flor margarida" },
  { emoji: "🌷", label: "tulipa" },
  { emoji: "🍀", label: "trevo sorte" },
  { emoji: "🌿", label: "folha planta" },
  // Viagem e lugares
  { emoji: "🚀", label: "foguete espaco" },
  { emoji: "✈️", label: "aviao viagem" },
  { emoji: "🚗", label: "carro" },
  { emoji: "🏠", label: "casa lar" },
  { emoji: "🏢", label: "predio escritorio" },
  { emoji: "🏛️", label: "banco governo" },
  { emoji: "⛰️", label: "montanha" },
  { emoji: "🏖️", label: "praia ferias" },
  { emoji: "🌍", label: "mundo terra" },
  { emoji: "🗺️", label: "mapa" },
  // Trabalho e negócios
  { emoji: "💼", label: "maleta trabalho" },
  { emoji: "📊", label: "grafico barras" },
  { emoji: "📈", label: "grafico subindo crescimento" },
  { emoji: "📉", label: "grafico descendo" },
  { emoji: "🗂️", label: "pasta arquivos" },
  { emoji: "📁", label: "pasta" },
  { emoji: "🗄️", label: "arquivo gaveta" },
  { emoji: "📋", label: "clipboard lista" },
  { emoji: "📑", label: "separador abas" },
  { emoji: "🗒️", label: "bloco notas" },
  // Corações e amor
  { emoji: "❤️", label: "coracao vermelho amor" },
  { emoji: "🧡", label: "coracao laranja" },
  { emoji: "💛", label: "coracao amarelo" },
  { emoji: "💚", label: "coracao verde" },
  { emoji: "💙", label: "coracao azul" },
  { emoji: "💜", label: "coracao roxo" },
  { emoji: "🖤", label: "coracao preto" },
  { emoji: "🤍", label: "coracao branco" },
  { emoji: "💖", label: "coracao brilhante" },
  { emoji: "💝", label: "coracao presente" },
  // Celebração
  { emoji: "🎁", label: "presente gift" },
  { emoji: "🎀", label: "laco fita" },
  { emoji: "🎊", label: "confete festa" },
  { emoji: "🎉", label: "festa celebracao" },
  { emoji: "🏆", label: "trofeu vitoria" },
  { emoji: "🥇", label: "medalha ouro primeiro" },
  { emoji: "🏅", label: "medalha" },
  { emoji: "🎖️", label: "medalha militar" },
  { emoji: "👑", label: "coroa rei rainha" },
  { emoji: "💎", label: "diamante joia" },
  // Elementos
  { emoji: "🔥", label: "fogo chama hot" },
  { emoji: "⚡", label: "raio energia" },
  { emoji: "💫", label: "estrela tontura" },
  { emoji: "✨", label: "brilho sparkle" },
  { emoji: "🌙", label: "lua noite" },
  { emoji: "☀️", label: "sol dia" },
  { emoji: "🌤️", label: "sol nuvem" },
  { emoji: "🌊", label: "onda mar" },
  { emoji: "❄️", label: "neve frio" },
  { emoji: "🌪️", label: "tornado" },
  // Comida
  { emoji: "🍕", label: "pizza" },
  { emoji: "🍔", label: "hamburguer" },
  { emoji: "🍦", label: "sorvete" },
  { emoji: "🎂", label: "bolo aniversario" },
  { emoji: "🍰", label: "fatia bolo" },
  { emoji: "☕", label: "cafe" },
  { emoji: "🍵", label: "cha" },
  { emoji: "🥤", label: "copo bebida" },
  { emoji: "🍷", label: "vinho" },
  { emoji: "🍻", label: "cerveja brinde" },
];

const NOTE_EMOJIS: NoteEmoji[] = (() => {
  const seen = new Set<string>();
  const combined: NoteEmoji[] = [
    ...BASE_NOTE_EMOJIS,
    ...(emojibasePtData as unknown as Array<Record<string, unknown>>).flatMap(item => {
      const emojiRaw = typeof item?.emoji === "string" ? item.emoji : "";
      const hexcode = typeof item?.hexcode === "string" ? item.hexcode : "";
      const emoji = emojiRaw || (hexcode ? hexcodeToEmoji(hexcode) : "");
      if (!emoji) {
        return [];
      }

      const label =
        (typeof item?.label === "string" && item.label) ||
        (typeof item?.annotation === "string" && item.annotation) ||
        (typeof item?.name === "string" && item.name) ||
        "";
      const tags = Array.isArray(item?.tags)
        ? (item.tags as unknown[])
            .filter(tag => typeof tag === "string")
            .join(" ")
        : "";
      const combinedLabel = [label, tags].filter(Boolean).join(" ");

      return [
        {
          emoji,
          label: combinedLabel,
        },
      ];
    }),
  ];
  return combined.filter(item => {
    if (!item.emoji) {
      return false;
    }
    if (seen.has(item.emoji)) {
      return false;
    }
    seen.add(item.emoji);
    return true;
  });
})();

const getRandomEmoji = () =>
  NOTE_EMOJIS[Math.floor(Math.random() * NOTE_EMOJIS.length)]!.emoji;

const defaultNotes: unknown[] = [
  // Pessoal
  {
    id: "note-1",
    title: "Reflexões do dia",
    categoryIds: ["note-cat-pessoal"],
    subcategoryIds: ["note-sub-diario"],
    contentHtml: "<p>Hoje foi um dia produtivo. Consegui finalizar as tarefas pendentes e ainda tive tempo para organizar minha rotina da semana.</p><p>Coisas que funcionaram bem:</p><ul><li>Acordar mais cedo</li><li>Bloquear horários no calendário</li><li>Fazer pausas regulares</li></ul>",
    links: [],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  {
    id: "note-2",
    title: "Rotina de exercícios",
    categoryIds: ["note-cat-pessoal"],
    subcategoryIds: ["note-sub-saude"],
    contentHtml: "<p>Plano semanal de atividades físicas:</p><ul><li><strong>Segunda:</strong> Corrida 30min</li><li><strong>Terça:</strong> Musculação</li><li><strong>Quarta:</strong> Descanso ativo (caminhada)</li><li><strong>Quinta:</strong> Musculação</li><li><strong>Sexta:</strong> Corrida 30min</li><li><strong>Sábado:</strong> Esporte livre</li><li><strong>Domingo:</strong> Descanso</li></ul>",
    links: [],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  {
    id: "note-3",
    title: "Controle de gastos do mês",
    categoryIds: ["note-cat-pessoal"],
    subcategoryIds: ["note-sub-financas"],
    contentHtml: "<p>Orçamento mensal:</p><ul><li>Moradia: R$ 2.000</li><li>Alimentação: R$ 800</li><li>Transporte: R$ 400</li><li>Lazer: R$ 300</li><li>Reserva: R$ 500</li></ul><p>Meta: economizar 15% da renda.</p>",
    links: [],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  // Trabalho
  {
    id: "note-4",
    title: "Ata de reunião semanal",
    categoryIds: ["note-cat-trabalho"],
    subcategoryIds: ["note-sub-reunioes"],
    contentHtml: "<p><strong>Data:</strong> 23/12/2024</p><p><strong>Participantes:</strong> Time de produto</p><p><strong>Pauta:</strong></p><ol><li>Status das entregas</li><li>Bloqueios identificados</li><li>Próximos passos</li></ol><p><strong>Decisões:</strong></p><ul><li>Priorizar feature X</li><li>Adiar lançamento para janeiro</li></ul>",
    links: [],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  {
    id: "note-5",
    title: "Tarefas da semana",
    categoryIds: ["note-cat-trabalho"],
    subcategoryIds: ["note-sub-tarefas"],
    contentHtml: "<p>Prioridades:</p><ul><li>Finalizar relatório trimestral</li><li>Revisar proposta comercial</li><li>Agendar 1:1 com gestor</li><li>Preparar apresentação para cliente</li></ul>",
    links: [],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  // Ideias
  {
    id: "note-6",
    title: "Ideias para o app",
    categoryIds: ["note-cat-ideias"],
    subcategoryIds: ["note-sub-brainstorm"],
    contentHtml: "<p>Funcionalidades que poderiam agregar valor:</p><ul><li>Modo offline completo</li><li>Integração com calendário</li><li>Templates de notas</li><li>Busca por voz</li><li>Compartilhamento colaborativo</li></ul>",
    links: [],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  {
    id: "note-7",
    title: "Referências de design",
    categoryIds: ["note-cat-ideias"],
    subcategoryIds: ["note-sub-inspiracao"],
    contentHtml: "<p>Sites e apps com boas interfaces:</p><ul><li>Linear - minimalismo e foco</li><li>Notion - flexibilidade</li><li>Things - simplicidade</li><li>Craft - tipografia</li></ul>",
    links: [
      { id: "link-1", label: "Linear", url: "https://linear.app" },
      { id: "link-2", label: "Notion", url: "https://notion.so" },
    ],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  // Listas
  {
    id: "note-8",
    title: "Lista de compras",
    categoryIds: ["note-cat-listas"],
    subcategoryIds: ["note-sub-compras"],
    contentHtml: "<p><strong>Supermercado:</strong></p><ul><li>Frutas e verduras</li><li>Leite e derivados</li><li>Pão integral</li><li>Café</li><li>Produtos de limpeza</li></ul><p><strong>Farmácia:</strong></p><ul><li>Vitaminas</li><li>Protetor solar</li></ul>",
    links: [],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  {
    id: "note-9",
    title: "Metas do ano",
    categoryIds: ["note-cat-listas"],
    subcategoryIds: ["note-sub-metas"],
    contentHtml: "<p><strong>Profissional:</strong></p><ul><li>Conseguir promoção</li><li>Fazer 2 cursos de especialização</li><li>Ampliar rede de contatos</li></ul><p><strong>Pessoal:</strong></p><ul><li>Viajar para 2 lugares novos</li><li>Ler 12 livros</li><li>Manter rotina de exercícios</li></ul>",
    links: [],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  // Projetos
  {
    id: "note-10",
    title: "Projeto de reforma",
    categoryIds: ["note-cat-projetos"],
    subcategoryIds: ["note-sub-andamento"],
    contentHtml: "<p><strong>Escopo:</strong> Renovação do escritório</p><p><strong>Etapas:</strong></p><ol><li>Planejamento e orçamento</li><li>Compra de materiais</li><li>Execução</li><li>Acabamento</li></ol><p><strong>Status:</strong> Em fase de orçamento</p>",
    links: [],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  {
    id: "note-11",
    title: "Site pessoal",
    categoryIds: ["note-cat-projetos"],
    subcategoryIds: ["note-sub-concluidos"],
    contentHtml: "<p>Portfolio online finalizado com sucesso.</p><p><strong>Tecnologias:</strong> React, Tailwind, Vercel</p><p><strong>Aprendizados:</strong></p><ul><li>Deploy automatizado</li><li>SEO básico</li><li>Performance web</li></ul>",
    links: [{ id: "link-3", label: "Meu site", url: "https://meusite.com" }],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  // Estudos
  {
    id: "note-12",
    title: "Anotações do curso de React",
    categoryIds: ["note-cat-estudos"],
    subcategoryIds: ["note-sub-cursos"],
    contentHtml: "<p><strong>Módulo 1: Fundamentos</strong></p><ul><li>Componentes funcionais</li><li>Props e State</li><li>Hooks: useState, useEffect</li></ul><p><strong>Módulo 2: Avançado</strong></p><ul><li>Context API</li><li>Custom Hooks</li><li>Performance</li></ul>",
    links: [],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  {
    id: "note-13",
    title: "Resenha: Atomic Habits",
    categoryIds: ["note-cat-estudos"],
    subcategoryIds: ["note-sub-livros"],
    contentHtml: "<p><strong>Autor:</strong> James Clear</p><p><strong>Principais ideias:</strong></p><ul><li>Hábitos são compostos de gatilho, rotina e recompensa</li><li>Melhoria de 1% ao dia gera resultados exponenciais</li><li>Ambiente influencia comportamento</li><li>Identidade precede hábitos</li></ul><p><strong>Nota:</strong> 5/5</p>",
    links: [],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
  {
    id: "note-14",
    title: "Vocabulário em inglês",
    categoryIds: ["note-cat-estudos"],
    subcategoryIds: ["note-sub-cursos"],
    contentHtml: "<p>Palavras novas desta semana:</p><ul><li><strong>Serendipity:</strong> descoberta feliz por acaso</li><li><strong>Resilience:</strong> capacidade de recuperação</li><li><strong>Endeavor:</strong> esforço, empreendimento</li><li><strong>Ubiquitous:</strong> onipresente</li></ul>",
    links: [],
    updatedAt: new Date().toISOString(),
    archived: false,
    relatedNoteIds: [],
  },
];

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

const emptyNote = (): Note => ({
  id: `note-${Date.now()}`,
  title: "Nova nota",
  emoji: getRandomEmoji(),
  contentHtml: "",
  links: [],
  attachments: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  archived: false,
  isDraft: true,
  relatedNoteIds: [],
});
const defaultNoteFieldSettings = {
  showLinks: false,
  showFiles: false,
};

export default function Notes() {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const isArchiveView = location.startsWith("/notas/arquivo");
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [editorAutoFocusNoteId, setEditorAutoFocusNoteId] = useState<
    string | null
  >(null);
  const [mobileNotesExpanded, setMobileNotesExpanded] = useState(false);
  const [noteQuery, setNoteQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsAccordion, setSettingsAccordion] = useState<
    "display" | false
  >(false);
  const [fieldSettings, setFieldSettings] = useState({
    ...defaultNoteFieldSettings,
  });
  const [noteConfirm, setNoteConfirm] = useState<{
    type: "archive" | "restore" | "delete";
    id: string;
  } | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  type EmojiPickerAnchor = HTMLElement | { getBoundingClientRect: () => DOMRect };
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState<EmojiPickerAnchor | null>(
    null
  );
  const [emojiPickerMode, setEmojiPickerMode] = useState<"note" | "editor">(
    "note"
  );
  const emojiPickerOnPickRef = useRef<((emoji: string) => void) | null>(null);
  const [emojiSearch, setEmojiSearch] = useState("");
  const deferredEmojiSearch = useDeferredValue(emojiSearch);
  const [emojiVisibleCount, setEmojiVisibleCount] = useState(420);

  const openEmojiPicker = (
    anchor: HTMLElement | DOMRect,
    opts?: {
      mode?: "note" | "editor";
      onPick?: (emoji: string) => void;
    }
  ) => {
    setEmojiPickerMode(opts?.mode ?? "note");
    emojiPickerOnPickRef.current = opts?.onPick ?? null;
    if (anchor instanceof HTMLElement) {
      setEmojiPickerAnchor(anchor);
      return;
    }
    setEmojiPickerAnchor({
      getBoundingClientRect: () => anchor,
    });
  };

  useEffect(() => {
    if (!emojiPickerAnchor) {
      return;
    }
    setEmojiVisibleCount(420);
  }, [deferredEmojiSearch, emojiPickerAnchor]);
  const restoreDefaultsSnapshotRef = useRef<{
    fieldSettings: typeof fieldSettings;
    settingsAccordion: typeof settingsAccordion;
  } | null>(null);
  const [restoreDefaultsSnackbarOpen, setRestoreDefaultsSnackbarOpen] =
    useState(false);
  const handleRestoreNoteDefaults = () => {
    restoreDefaultsSnapshotRef.current = {
      fieldSettings,
      settingsAccordion,
    };
    setFieldSettings({ ...defaultNoteFieldSettings });
    setSettingsAccordion(false);
    setRestoreDefaultsSnackbarOpen(true);
  };

  const handleUndoRestoreNoteDefaults = () => {
    const snapshot = restoreDefaultsSnapshotRef.current;
    if (!snapshot) {
      setRestoreDefaultsSnackbarOpen(false);
      return;
    }
    setFieldSettings(snapshot.fieldSettings);
    setSettingsAccordion(snapshot.settingsAccordion);
    restoreDefaultsSnapshotRef.current = null;
    setRestoreDefaultsSnackbarOpen(false);
  };

  // Ao entrar na tela de lista (/notas ou /notas/arquivo), nunca manter nota aberta
  useEffect(() => {
    if (location === "/notas" || location === "/notas/arquivo") {
      setSelectedNoteId(null);
      setExpandedNoteId(null);
    }
  }, [location]);

  const normalizeNote = (value: unknown): Note => {
    const raw = (value ?? {}) as Partial<LegacyNote> & Record<string, unknown>;
    return {
      id:
        typeof raw.id === "string" && raw.id
          ? raw.id
          : `note-${Date.now()}`,
      title: typeof raw.title === "string" ? raw.title : "",
      emoji: typeof raw.emoji === "string" && raw.emoji ? raw.emoji : getRandomEmoji(),
      contentHtml: typeof raw.contentHtml === "string" ? raw.contentHtml : "",
      links: Array.isArray(raw.links)
        ? (raw.links
            .map(link => {
              const item = (link ?? {}) as Partial<NoteLink> &
                Record<string, unknown>;
              return {
                id:
                  typeof item.id === "string" && item.id
                    ? item.id
                    : `link-${Date.now()}`,
                label: typeof item.label === "string" ? item.label : "",
                url: typeof item.url === "string" ? item.url : "",
              };
            })
            .filter(link => Boolean(link.label || link.url)) as NoteLink[])
        : [],
      attachments: Array.isArray(raw.attachments)
        ? (raw.attachments
            .map(attachment => {
              const item = (attachment ?? {}) as Partial<NoteAttachment> &
                Record<string, unknown>;
              return {
                id:
                  typeof item.id === "string" && item.id
                    ? item.id
                    : `att-${Date.now()}`,
                name: typeof item.name === "string" ? item.name : "",
                mime: typeof item.mime === "string" ? item.mime : "",
                size: typeof item.size === "number" ? item.size : 0,
                dataUrl: typeof item.dataUrl === "string" ? item.dataUrl : "",
                uploadedAt:
                  typeof item.uploadedAt === "string" && item.uploadedAt
                    ? item.uploadedAt
                    : new Date().toISOString(),
              };
            })
            .filter(att => Boolean(att.name && att.dataUrl)) as NoteAttachment[])
        : [],
      createdAt:
        typeof raw.createdAt === "string" && raw.createdAt
          ? raw.createdAt
          : typeof raw.updatedAt === "string" && raw.updatedAt
            ? raw.updatedAt
            : new Date().toISOString(),
      updatedAt:
        typeof raw.updatedAt === "string" && raw.updatedAt
          ? raw.updatedAt
          : new Date().toISOString(),
      archived: Boolean(raw.archived),
      isDraft: Boolean(raw.isDraft),
      parentId: typeof raw.parentId === "string" ? raw.parentId : undefined,
      relatedNoteIds: Array.isArray(raw.relatedNoteIds)
        ? (raw.relatedNoteIds.filter((id): id is string => typeof id === "string") as string[])
        : [],
    };
  };

  const isLoadedRef = useRef(false);
  useEffect(() => {
    const load = async () => {
      const dbNotes = await loadUserStorage<unknown>(STORAGE_NOTES);
      if (Array.isArray(dbNotes) && dbNotes.length) {
        const normalized = dbNotes.map(normalizeNote);
        setNotes(normalized);
        window.localStorage.setItem(STORAGE_NOTES, JSON.stringify(normalized));
        isLoadedRef.current = true;
        return;
      }

      const storedNotes = window.localStorage.getItem(STORAGE_NOTES);
      if (storedNotes) {
        try {
          const parsed = JSON.parse(storedNotes) as unknown;
          if (Array.isArray(parsed) && parsed.length) {
            const normalized = parsed.map(normalizeNote);
            setNotes(normalized);
            isLoadedRef.current = true;
            void saveUserStorage(STORAGE_NOTES, normalized);
            return;
          }
        } catch {
          window.localStorage.removeItem(STORAGE_NOTES);
        }
      }

      const normalizedDefaults = defaultNotes.map(normalizeNote);
      setNotes(normalizedDefaults);
      window.localStorage.setItem(
        STORAGE_NOTES,
        JSON.stringify(normalizedDefaults)
      );
      isLoadedRef.current = true;
      void saveUserStorage(STORAGE_NOTES, normalizedDefaults);
    };

    void load();
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_NOTE_FIELDS);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as Partial<typeof fieldSettings>;
      setFieldSettings(prev => ({ ...prev, ...parsed }));
    } catch {
      window.localStorage.removeItem(STORAGE_NOTE_FIELDS);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_NOTE_FIELDS,
      JSON.stringify(fieldSettings)
    );
  }, [fieldSettings]);

  useEffect(() => {
    if (!isLoadedRef.current) {
      return;
    }
    window.localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
    void saveUserStorage(STORAGE_NOTES, notes);
  }, [notes]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (emojiPickerAnchor) {
        event.preventDefault();
        event.stopPropagation();
        setEmojiPickerAnchor(null);
        setEmojiSearch("");
        return;
      }

      if (selectedNoteId) {
        setLocation(isArchiveView ? "/notas/arquivo" : "/notas");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [emojiPickerAnchor, selectedNoteId, isArchiveView, setLocation]);

  const stripHtml = (value: string) => value.replace(/<[^>]+>/g, " ");

  const filteredNotes = useMemo(() => {
    const term = noteQuery.trim().toLowerCase();
    return notes.filter(note => {
      if (note.archived !== isArchiveView) {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack =
        `${note.title} ${stripHtml(note.contentHtml || "")}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [notes, noteQuery, isArchiveView]);

  const noteIdFromRoute = (() => {
    if (location.startsWith("/notas/arquivo/")) {
      return location.split("/")[3] || null;
    }
    if (
      location.startsWith("/notas/") &&
      location.split("/")[2] !== "arquivo"
    ) {
      return location.split("/")[2] || null;
    }
    return null;
  })();
  const selectedNote = notes.find(note => note.id === selectedNoteId) || null;

  useEffect(() => {
    if (selectedNoteId && editorAutoFocusNoteId === selectedNoteId) {
      setEditorAutoFocusNoteId(null);
    }
  }, [editorAutoFocusNoteId, selectedNoteId]);

  const isPristineDraft = useCallback(
    (note: Note) =>
      note.isDraft &&
      note.title.trim() === "Nova nota" &&
      !note.contentHtml.trim() &&
      !note.links.length &&
      !note.attachments.length,
    []
  );

  const discardIfPristine = useCallback(
    (noteId: string | null) => {
      if (!noteId) {
        return;
      }
      setNotes(prev => {
        const note = prev.find(item => item.id === noteId);
        if (note && isPristineDraft(note)) {
          return prev.filter(item => item.id !== noteId);
        }
        return prev;
      });
    },
    [isPristineDraft]
  );

  const prevSelectedNoteIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Não auto-seleciona nota nunca. Só abre nota quando a rota tem /notas/:id
    if (!noteIdFromRoute) {
      setSelectedNoteId(null);
      setExpandedNoteId(null);
      prevSelectedNoteIdRef.current = null;
      return;
    }

    if (noteIdFromRoute === selectedNoteId) {
      prevSelectedNoteIdRef.current = noteIdFromRoute;
      return;
    }

    const match = notes.find(note => note.id === noteIdFromRoute) || null;
    if (!match) {
      setSelectedNoteId(null);
      setExpandedNoteId(null);
      prevSelectedNoteIdRef.current = null;
      setLocation(isArchiveView ? "/notas/arquivo" : "/notas");
      return;
    }

    // Se a nota existe mas está no “lado” errado (arquivo vs notas), ajusta a rota
    if (match.archived !== isArchiveView) {
      setLocation(
        match.archived ? `/notas/arquivo/${match.id}` : `/notas/${match.id}`
      );
      return;
    }
    setSelectedNoteId(match.id);
    prevSelectedNoteIdRef.current = match.id;
  }, [noteIdFromRoute, notes, isArchiveView, selectedNoteId, setLocation]);

  const selectNote = (note: Note) => {
    discardIfPristine(selectedNoteId);
    setSelectedNoteId(note.id);
    setLocation(
      isArchiveView ? `/notas/arquivo/${note.id}` : `/notas/${note.id}`
    );
  };

  const updateNote = (next: Note) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === next.id ? { ...next, isDraft: false } : note
      )
    );
  };

  const addNote = useCallback(() => {
    discardIfPristine(selectedNoteId);
    const next = emptyNote();
    setNotes(prev => [next, ...prev]);
    setSelectedNoteId(next.id);
    setEditorAutoFocusNoteId(next.id);
    setNoteQuery("");
    setLocation(`/notas/${next.id}`);
  }, [discardIfPristine, selectedNoteId, setLocation]);

  const removeLink = (note: Note, linkId: string) => {
    updateNote({
      ...note,
      links: note.links.filter(link => link.id !== linkId),
      updatedAt: new Date().toISOString(),
    });
  };

  const addLink = (note: Note) => {
    updateNote({
      ...note,
      links: [
        ...note.links,
        { id: `note-link-${Date.now()}`, label: "", url: "" },
      ],
      updatedAt: new Date().toISOString(),
    });
  };

  const updateLink = (
    note: Note,
    linkId: string,
    key: "label" | "url",
    value: string
  ) => {
    updateNote({
      ...note,
      links: note.links.map(link =>
        link.id === linkId ? { ...link, [key]: value } : link
      ),
      updatedAt: new Date().toISOString(),
    });
  };

  const removeAttachment = (note: Note, attachmentId: string) => {
    updateNote({
      ...note,
      attachments: note.attachments.filter(att => att.id !== attachmentId),
      updatedAt: new Date().toISOString(),
    });
  };

  const addAttachments = async (note: Note, files: FileList | null) => {
    if (!files || !files.length) {
      return;
    }

    const readAsDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
        reader.onload = () => resolve(String(reader.result || ""));
        reader.readAsDataURL(file);
      });

    const fileArray = Array.from(files);
    const dataUrls = await Promise.all(fileArray.map(readAsDataUrl));
    const uploadedAt = new Date().toISOString();
    const nextAttachments: NoteAttachment[] = fileArray.map((file, index) => ({
      id: `att-${Date.now()}-${index}`,
      name: file.name,
      mime: file.type || "application/octet-stream",
      size: file.size,
      dataUrl: dataUrls[index] || "",
      uploadedAt,
    }));

    updateNote({
      ...note,
      attachments: [...note.attachments, ...nextAttachments].filter(att =>
        Boolean(att.name && att.dataUrl)
      ),
      updatedAt: uploadedAt,
    });
  };

  const createChildNote = (parent: Note): Note => {
    const next = emptyNote();
    next.title = "Página";
    next.parentId = parent.id;
    setNotes(prev => [next, ...prev]);
    setEditorAutoFocusNoteId(next.id);
    return next;
  };

  const requestNoteAction = (
    note: Note,
    type: "archive" | "restore" | "delete"
  ) => {
    setNoteConfirm({ type, id: note.id });
  };

  const applyNoteAction = (
    noteId: string,
    type: "archive" | "restore" | "delete"
  ) => {
    if (type === "delete") {
      setNotes(prev => prev.filter(note => note.id !== noteId));
    } else {
      setNotes(prev =>
        prev.map(note =>
          note.id === noteId
            ? { ...note, archived: type === "archive" ? true : false }
            : note
        )
      );
    }
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
    }
    if (type === "archive") {
      setLocation("/notas");
      return;
    }
    if (type === "restore") {
      setLocation("/notas/arquivo");
      return;
    }
    setLocation(isArchiveView ? "/notas/arquivo" : "/notas");
  };

  const showSidebar = true;
  const showBackButton = Boolean(noteIdFromRoute);
  const archiveLink = isArchiveView
    ? { label: "Notas", href: "/notas" }
    : { label: "Arquivo", href: "/notas/arquivo" };

  const [expandedSidebarIds, setExpandedSidebarIds] = useState<Set<string>>(
    () => new Set()
  );
  const toggleSidebarExpanded = (noteId: string) => {
    setExpandedSidebarIds(prev => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  };

  const sidebarTree = useMemo(() => {
    const candidates = notes.filter(note => note.archived === isArchiveView);
    const byId = new Map(candidates.map(note => [note.id, note] as const));
    const childrenByParentId = new Map<string, Note[]>();
    const roots: Note[] = [];

    for (const note of candidates) {
      const parentId = note.parentId;
      if (parentId && byId.has(parentId)) {
        const list = childrenByParentId.get(parentId) ?? [];
        list.push(note);
        childrenByParentId.set(parentId, list);
      } else {
        roots.push(note);
      }
    }

    const sortNotes = (items: Note[]) =>
      items.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));

    sortNotes(roots);
    Array.from(childrenByParentId.values()).forEach(list => sortNotes(list));

    return { roots, childrenByParentId, byId };
  }, [notes, isArchiveView]);

  useEffect(() => {
    if (!selectedNoteId) {
      return;
    }
    setExpandedSidebarIds(prev => {
      const next = new Set(prev);
      let current = sidebarTree.byId.get(selectedNoteId);
      let guard = 0;
      while (current?.parentId && guard < 20) {
        next.add(current.parentId);
        current = sidebarTree.byId.get(current.parentId);
        guard += 1;
      }
      return next;
    });
  }, [selectedNoteId, sidebarTree.byId]);

  const renderSidebarItems = (opts: {
    onSelect: (note: Note) => void;
    onAfterSelect?: () => void;
  }) => {
    const rows: JSX.Element[] = [];
    const stack: Array<{ note: Note; depth: number }> = [];
    for (let i = sidebarTree.roots.length - 1; i >= 0; i -= 1) {
      stack.push({ note: sidebarTree.roots[i]!, depth: 0 });
    }

    while (stack.length) {
      const item = stack.pop();
      if (!item) {
        continue;
      }
      const { note, depth } = item;
      const children = sidebarTree.childrenByParentId.get(note.id) ?? [];
      const hasChildren = children.length > 0;
      const isExpanded = expandedSidebarIds.has(note.id);
      const isActive = note.id === selectedNoteId;

      rows.push(
        <Box
          key={note.id}
          onClick={() => {
            opts.onSelect(note);
            opts.onAfterSelect?.();
          }}
          sx={theme => ({
            ...interactiveItemSx(theme),
            py: 1,
            pr: 1,
            pl: 1 + depth * 3,
            border: 1,
            borderColor: isActive ? "primary.main" : "transparent",
            cursor: "pointer",
          })}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 24,
                height: 24,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "0 0 auto",
              }}
            >
              {hasChildren ? (
                <IconButton
                  size="small"
                  onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggleSidebarExpanded(note.id);
                  }}
                  sx={{
                    color: "text.secondary",
                    p: 0.25,
                  }}
                  aria-label={isExpanded ? "Recolher" : "Expandir"}
                >
                  {isExpanded ? (
                    <ExpandMoreRoundedIcon fontSize="small" />
                  ) : (
                    <ChevronRightRoundedIcon fontSize="small" />
                  )}
                </IconButton>
              ) : null}
            </Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: depth > 0 ? 500 : 600,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "text.primary",
              }}
            >
              {note.emoji} {note.title || "Sem título"}
            </Typography>
          </Stack>
        </Box>
      );

      if (hasChildren && isExpanded && depth < 6) {
        for (let i = children.length - 1; i >= 0; i -= 1) {
          stack.push({ note: children[i]!, depth: depth + 1 });
        }
      }
    }

    return rows;
  };

  const pageActions = useMemo(
    () => (
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          component={RouterLink}
          href={archiveLink.href}
          variant="outlined"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            whiteSpace: "nowrap",
            minWidth: 0,
            px: 1.75,
          }}
        >
          {archiveLink.label}
        </Button>
        <Button
          variant="outlined"
          startIcon={
            <Box sx={{ display: { xs: "none", sm: "inline-flex" } }}>
              <AddRoundedIcon />
            </Box>
          }
          onClick={addNote}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            whiteSpace: "nowrap",
            minWidth: 0,
            px: 1.75,
          }}
        >
          Nova nota
        </Button>
        <SettingsIconButton onClick={() => setSettingsOpen(true)} />
      </Stack>
    ),
    [addNote, archiveLink.href, archiveLink.label]
  );

  usePageActions(pageActions);

  return (
    <PageContainer>
      <Stack spacing={3} sx={{ flex: 1, minHeight: 0 }}>
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="flex-end"
            sx={{ width: "100%", display: { xs: "flex", md: "none" } }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ display: { xs: "none", sm: "flex" } }}
              >
                <Button
                  component={RouterLink}
                  href={archiveLink.href}
                  variant="outlined"
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    minWidth: 0,
                    px: { xs: 1.25, sm: 1.75 },
                  }}
                >
                  {archiveLink.label}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={
                    <Box sx={{ display: { xs: "none", sm: "inline-flex" } }}>
                      <AddRoundedIcon />
                    </Box>
                  }
                  onClick={addNote}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    minWidth: 0,
                    px: { xs: 1.25, sm: 1.75 },
                  }}
                >
                  Nova nota
                </Button>
              </Stack>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ display: { xs: "flex", sm: "none" } }}
              >
                <Button
                  component={RouterLink}
                  href={archiveLink.href}
                  variant="outlined"
                  size="small"
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    minWidth: 0,
                    px: 1.25,
                  }}
                >
                  {archiveLink.label}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={addNote}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    minWidth: 0,
                    px: 1.25,
                  }}
                >
                  Nova
                </Button>
              </Stack>
              <SettingsIconButton onClick={() => setSettingsOpen(true)} />
            </Stack>
          </Stack>
        </Stack>

        {showSidebar ? (
          <Box sx={{ display: { xs: "block", md: "none" } }}>
            <AppAccordion
              expanded={mobileNotesExpanded}
              onChange={(_, expanded) => setMobileNotesExpanded(expanded)}
              title="Notas"
            >
              <Stack spacing={1}>
                {renderSidebarItems({
                  onSelect: note => selectNote(note),
                  onAfterSelect: () => setMobileNotesExpanded(false),
                })}
                {!sidebarTree.roots.length ? (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {isArchiveView ? "Sem notas arquivadas." : "Sem notas."}
                  </Typography>
                ) : null}
              </Stack>
            </AppAccordion>
          </Box>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: showSidebar
              ? { xs: "1fr", md: "280px 1fr" }
              : "1fr",
            gap: 2.5,
            flex: 1,
            minHeight: 0,
          }}
        >
          {showSidebar ? (
            <Stack spacing={2} sx={{ display: { xs: "none", md: "flex" } }}>
              <CardSection size="xs">
                <Stack spacing={2}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Notas
                  </Typography>
                  <Stack spacing={1}>
                    {renderSidebarItems({ onSelect: note => selectNote(note) })}
                    {!sidebarTree.roots.length ? (
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        {isArchiveView ? "Sem notas arquivadas." : "Sem notas."}
                      </Typography>
                    ) : null}
                  </Stack>
                </Stack>
              </CardSection>
            </Stack>
          ) : null}

          <Stack spacing={2.5} sx={{ flex: 1, minHeight: 0 }}>
            {!selectedNote ? (
              <CardSection size="xs">
                <Stack spacing={1.5}>
                  <TextField
                    label="Buscar nota"
                    size="small"
                    value={noteQuery}
                    onChange={event => setNoteQuery(event.target.value)}
                    sx={{ minWidth: 220 }}
                  />
                  {filteredNotes.length ? (
                    <Box
                      sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "1fr 1fr",
                          md: "1fr 1fr 1fr",
                          lg: "1fr 1fr 1fr",
                          xl: "1fr 1fr 1fr 1fr",
                        },
                      }}
                    >
                      {(expandedNoteId
                        ? filteredNotes.filter(
                            note => note.id === expandedNoteId
                          )
                        : filteredNotes
                      ).map(note => {
                        const isExpanded = note.id === expandedNoteId;
                        const preview = stripHtml(
                          note.contentHtml || ""
                        ).trim();
                        return (
                          <AppCard
                            key={note.id}
                            elevation={0}
                            onClick={() => {
                              if (isExpanded) {
                                setExpandedNoteId(null);
                              } else {
                                setExpandedNoteId(note.id);
                                selectNote(note);
                              }
                            }}
                            sx={theme => ({
                              ...interactiveItemSx(theme),
                              p: isExpanded ? 2.5 : 2,
                              border: 1,
                              borderColor: isExpanded
                                ? "primary.main"
                                : "divider",
                              backgroundColor: "background.paper",
                              cursor: "pointer",
                              minHeight: isExpanded ? "auto" : 120,
                            })}
                          >
                            <Stack spacing={isExpanded ? 1.5 : 1}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-start",
                                  gap: 1,
                                  width: "100%",
                                }}
                              >
                                <Typography
                                  variant={
                                    isExpanded ? "subtitle1" : "subtitle2"
                                  }
                                  sx={{ fontWeight: 600 }}
                                >
                                  {note.emoji} {note.title}
                                </Typography>
                              </Box>
                              {isExpanded && preview ? (
                                <Typography
                                  variant="body2"
                                  sx={{ color: "text.secondary" }}
                                >
                                  {preview.length > 180
                                    ? `${preview.slice(0, 180)}...`
                                    : preview}
                                </Typography>
                              ) : null}
                            </Stack>
                          </AppCard>
                        );
                      })}
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      {isArchiveView
                        ? "Sem notas arquivadas."
                        : "Sem notas."}
                    </Typography>
                  )}
                </Stack>
              </CardSection>
            ) : null}

            {selectedNote ? (
              <CardSection
                size="xs"
                sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
              >
                <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button
                        variant="outlined"
                        onClick={e => openEmojiPicker(e.currentTarget, { mode: "note" })}
                        sx={{
                          minWidth: 56,
                          width: 56,
                          height: 56,
                          minHeight: 56,
                          fontSize: "1.5rem",
                          lineHeight: 1,
                          p: 0,
                          borderColor: "divider",
                          "&:hover": { borderColor: "primary.main" },
                        }}
                      >
                        {selectedNote.emoji}
                      </Button>
                      <Popper
                        open={Boolean(emojiPickerAnchor)}
                        anchorEl={emojiPickerAnchor}
                        placement="bottom-start"
                        style={{ zIndex: 1300 }}
                      >
                        <ClickAwayListener onClickAway={() => {
                          setEmojiPickerAnchor(null);
                          setEmojiSearch("");
                        }}>
                          <Box
                            sx={{
                              bgcolor: "background.paper",
                              border: 1,
                              borderColor: "divider",
                              borderRadius: 2,
                              boxShadow: 3,
                              p: 1.5,
                              width: 280,
                              maxHeight: 320,
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              sx={{ mb: 1.5 }}
                            >
                              <TextField
                                size="small"
                                placeholder="Buscar emoji..."
                                value={emojiSearch}
                                onChange={e => setEmojiSearch(e.target.value)}
                                autoFocus
                                fullWidth
                              />
                              {emojiPickerMode === "note" ? (
                                <Tooltip title="Emoji aleatório" placement="top">
                                  <IconButton
                                    aria-label="Emoji aleatório"
                                    size="small"
                                    onClick={() => {
                                      updateNote({
                                        ...selectedNote,
                                        emoji: getRandomEmoji(),
                                        updatedAt: new Date().toISOString(),
                                      });
                                    }}
                                    sx={{
                                      border: "1px solid",
                                      borderColor: "divider",
                                      borderRadius: 1.5,
                                    }}
                                  >
                                    <ShuffleRoundedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              ) : null}
                            </Stack>
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                                overflowY: "auto",
                                overflowX: "hidden",
                                flex: 1,
                              }}
                              onScroll={event => {
                                const target = event.currentTarget;
                                const nearBottom =
                                  target.scrollTop + target.clientHeight >=
                                  target.scrollHeight - 120;
                                if (!nearBottom) {
                                  return;
                                }
                                setEmojiVisibleCount(current =>
                                  Math.min(current + 420, NOTE_EMOJIS.length)
                                );
                              }}
                            >
                              {NOTE_EMOJIS.filter(item => {
                                const term = deferredEmojiSearch.trim().toLowerCase();
                                if (!term) {
                                  return true;
                                }
                                return (
                                  item.emoji === deferredEmojiSearch ||
                                  item.label.toLowerCase().includes(term)
                                );
                              })
                                .slice(
                                  0,
                                  deferredEmojiSearch.trim()
                                    ? NOTE_EMOJIS.length
                                    : emojiVisibleCount
                                )
                                .map(item => (
                                <Button
                                  key={item.emoji}
                                  variant="text"
                                  color="inherit"
                                  onClick={() => {
                                    if (emojiPickerMode === "note") {
                                      updateNote({
                                        ...selectedNote,
                                        emoji: item.emoji,
                                        updatedAt: new Date().toISOString(),
                                      });
                                    } else {
                                      emojiPickerOnPickRef.current?.(item.emoji);
                                    }
                                    setEmojiPickerAnchor(null);
                                    setEmojiSearch("");
                                  }}
                                  sx={{
                                    minWidth: 0,
                                    width: 36,
                                    height: 36,
                                    fontSize: "1.25rem",
                                    p: 0,
                                    "&:hover": { bgcolor: "action.hover" },
                                  }}
                                >
                                  {item.emoji}
                                </Button>
                              ))}
                            </Box>
                          </Box>
                        </ClickAwayListener>
                      </Popper>
                      <TextField
                        label="Titulo"
                        value={selectedNote.title}
                        onChange={event =>
                          updateNote({
                            ...selectedNote,
                            title: event.target.value,
                            updatedAt: new Date().toISOString(),
                          })
                        }
                        fullWidth
                        sx={{
                          "& .MuiInputBase-root": {
                            height: 56,
                            alignItems: "center",
                          },
                          "& .MuiInputBase-input": {
                            fontSize: "1.25rem",
                            fontWeight: 600,
                            lineHeight: 1.25,
                          },
                        }}
                      />
                      <Stack direction="row" alignItems="center">
                        <Tooltip
                          title={`Criada em ${new Date(selectedNote.createdAt).toLocaleString(
                            "pt-BR"
                          )}`}
                          placement="top"
                        >
                          <IconButton size="small" sx={{ color: "text.secondary" }}>
                            <InfoOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Stack>

                  {fieldSettings.showLinks ? (
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Links
                      </Typography>
                      {selectedNote.links.map(link => (
                        <Stack
                          key={link.id}
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          <TextField
                            label="Titulo"
                            size="small"
                            value={link.label}
                            onChange={event =>
                              updateLink(
                                selectedNote,
                                link.id,
                                "label",
                                event.target.value
                              )
                            }
                            fullWidth
                          />
                          <TextField
                            label="URL"
                            size="small"
                            value={link.url}
                            onChange={event =>
                              updateLink(
                                selectedNote,
                                link.id,
                                "url",
                                event.target.value
                              )
                            }
                            fullWidth
                          />
                          <Tooltip title="Remover link" placement="top">
                            <IconButton
                              onClick={() => removeLink(selectedNote, link.id)}
                            >
                              <CloseRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Abrir link" placement="top">
                            <IconButton
                              component="a"
                              href={link.url || undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              disabled={!link.url}
                            >
                              <LinkRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      ))}
                      <Button
                        variant="outlined"
                        startIcon={<AddRoundedIcon />}
                        onClick={() => addLink(selectedNote)}
                        sx={{
                          alignSelf: "flex-start",
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        Adicionar link
                      </Button>
                    </Stack>
                  ) : null}

                  {fieldSettings.showFiles ? (
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Arquivos
                      </Typography>
                      {selectedNote.attachments.map(att => (
                        <Stack
                          key={att.id}
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          <TextField
                            label="Nome"
                            size="small"
                            value={att.name}
                            fullWidth
                            disabled
                          />
                          <Tooltip title="Remover arquivo" placement="top">
                            <IconButton
                              onClick={() => removeAttachment(selectedNote, att.id)}
                            >
                              <CloseRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Baixar" placement="top">
                            <IconButton
                              component="a"
                              href={att.dataUrl || undefined}
                              download={att.name || undefined}
                              disabled={!att.dataUrl}
                            >
                              <LinkRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      ))}
                      <Button
                        variant="outlined"
                        startIcon={<AddRoundedIcon />}
                        component="label"
                        sx={{
                          alignSelf: "flex-start",
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        Adicionar arquivos
                        <input
                          hidden
                          type="file"
                          multiple
                          onChange={event => {
                            void addAttachments(selectedNote, event.target.files);
                            event.target.value = "";
                          }}
                        />
                      </Button>
                    </Stack>
                  ) : null}

                  <RichTextEditor
                    key={selectedNote.id}
                    value={selectedNote.contentHtml}
                    onChange={value =>
                      updateNote({
                        ...selectedNote,
                        contentHtml: value,
                        updatedAt: new Date().toISOString(),
                      })
                    }
                    onNavigate={href => setLocation(href)}
                    onCreateChildPage={() => createChildNote(selectedNote)}
                    noteEmoji={"😊"}
                    onOpenEmojiPicker={(anchor, opts) => openEmojiPicker(anchor, opts)}
                    autoFocus={editorAutoFocusNoteId === selectedNote.id}
                  />

                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Remover" placement="top">
                      <Button
                        variant="outlined"
                        color="error"
                        aria-label="Remover"
                        onClick={() => requestNoteAction(selectedNote, "delete")}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          minWidth: 0,
                          px: 1.25,
                        }}
                      >
                        <DeleteRoundedIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Tooltip
                      title={selectedNote.archived ? "Restaurar" : "Arquivar"}
                      placement="top"
                    >
                      <Button
                        variant="outlined"
                        aria-label={selectedNote.archived ? "Restaurar" : "Arquivar"}
                        onClick={() =>
                          requestNoteAction(
                            selectedNote,
                            selectedNote.archived ? "restore" : "archive"
                          )
                        }
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          minWidth: 0,
                          px: 1.25,
                        }}
                      >
                        {selectedNote.archived ? (
                          <UnarchiveRoundedIcon fontSize="small" />
                        ) : (
                          <ArchiveRoundedIcon fontSize="small" />
                        )}
                      </Button>
                    </Tooltip>
                    <Tooltip title="Fechar nota" placement="top">
                      <Button
                        variant="outlined"
                        aria-label="Fechar nota"
                        onClick={() => {
                          setSelectedNoteId(null);
                          setExpandedNoteId(null);
                          setLocation(isArchiveView ? "/notas/arquivo" : "/notas");
                        }}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          minWidth: 0,
                          px: 1.25,
                        }}
                      >
                        <CloseRoundedIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardSection>
            ) : null}
          </Stack>
        </Box>
      </Stack>
      <SettingsDialog
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          setSettingsAccordion(false);
        }}
        title="Configurações de notas"
        maxWidth="sm"
        onRestoreDefaults={handleRestoreNoteDefaults}
        sections={[
          {
            key: "display",
            title: "Exibição",
            content: (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.5,
                }}
              >
                {[
                  { key: "showLinks", label: "Mostrar links" },
                  { key: "showFiles", label: "Mostrar arquivos" },
                ].map(item => (
                  <CardSection
                    key={item.key}
                    size="flush"
                    sx={theme => ({
                      ...interactiveCardSx(theme),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 2,
                      cursor: "pointer",
                    })}
                    onClick={() =>
                      setFieldSettings(prev => ({
                        ...prev,
                        [item.key]:
                          !prev[item.key as keyof typeof fieldSettings],
                      }))
                    }
                  >
                    <Typography variant="subtitle2">{item.label}</Typography>
                    <ToggleCheckbox
                      checked={Boolean(
                        fieldSettings[item.key as keyof typeof fieldSettings]
                      )}
                      onChange={event =>
                        setFieldSettings(prev => ({
                          ...prev,
                          [item.key]: event.target.checked,
                        }))
                      }
                      onClick={event => event.stopPropagation()}
                    />
                  </CardSection>
                ))}
              </Box>
            ),
          },
        ]}
      />
      <ConfirmDialog
        open={Boolean(noteConfirm)}
        title={
          noteConfirm?.type === "delete"
            ? "Remover nota"
            : noteConfirm?.type === "archive"
              ? "Arquivar nota"
              : "Restaurar nota"
        }
        description={
          noteConfirm?.type === "delete"
            ? "Você confirma a remoção desta nota? Esta ação não poderá ser desfeita."
            : noteConfirm?.type === "archive"
              ? "Você confirma o envio desta nota para o arquivo?"
              : "Você confirma a restauração desta nota para a lista principal?"
        }
        onCancel={() => setNoteConfirm(null)}
        onConfirm={() => {
          if (!noteConfirm) {
            return;
          }
          applyNoteAction(noteConfirm.id, noteConfirm.type);
          setNoteConfirm(null);
        }}
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
              onClick={handleUndoRestoreNoteDefaults}
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

function ConfirmDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {description}
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="flex-end"
          >
            <Button variant="outlined" onClick={onCancel}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={onConfirm}>
              Confirmar
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function RichTextEditor({
  value,
  onChange,
  onNavigate,
  onCreateChildPage,
  noteEmoji,
  onOpenEmojiPicker,
  autoFocus,
}: {
  value: string;
  onChange: (nextValue: string) => void;
  onNavigate: (href: string) => void;
  onCreateChildPage: () => Note;
  noteEmoji: string;
  onOpenEmojiPicker: (
    anchor: HTMLElement | DOMRect,
    opts?: {
      mode?: "note" | "editor";
      onPick?: (emoji: string) => void;
    }
  ) => void;
  autoFocus?: boolean;
}) {
  type SlashItem = {
    id: string;
    label: string;
    keywords: string;
    run: (opts: { editor: any }) => void;
  };

  const [slashOpen, setSlashOpen] = useState(false);
  const [slashItems, setSlashItems] = useState<SlashItem[]>([]);
  const [slashIndex, setSlashIndex] = useState(0);
  const [slashAnchorRect, setSlashAnchorRect] = useState<DOMRect | null>(null);
  const slashCommandRef = useRef<((item: SlashItem) => void) | null>(null);
  const slashIndexRef = useRef(0);
  const slashItemsRef = useRef<SlashItem[]>([]);
  const slashAnchorRectRef = useRef<DOMRect | null>(null);

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkHref, setLinkHref] = useState("");
  const [linkText, setLinkText] = useState("");

  const [linkMenuOpen, setLinkMenuOpen] = useState(false);
  const [linkMenuAnchorRect, setLinkMenuAnchorRect] = useState<DOMRect | null>(
    null
  );
  const [linkMenuHref, setLinkMenuHref] = useState("");
  const linkMenuAnchorElRef = useRef<HTMLAnchorElement | null>(null);
  const skipNextLinkClickRef = useRef(false);

  useEffect(() => {
    slashIndexRef.current = slashIndex;
  }, [slashIndex]);

  useEffect(() => {
    slashItemsRef.current = slashItems;
  }, [slashItems]);

  useEffect(() => {
    slashAnchorRectRef.current = slashAnchorRect;
  }, [slashAnchorRect]);

  const editor = useEditor({
    autofocus: autoFocus ? "end" : false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Escreva sua nota...",
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Extension.create({
        name: "slashCommand",
        addProseMirrorPlugins() {
          const getItems = (query: string): SlashItem[] => {
            const q = query.trim().toLowerCase();
            const all: SlashItem[] = [
              {
                id: "note-emoji",
                label: "Emoji",
                keywords: "emoji emoticon icone",
                run: () => {
                  const anchor =
                    slashAnchorRectRef.current ||
                    editor?.view?.dom?.getBoundingClientRect?.() ||
                    new DOMRect(0, 0, 0, 0);
                  onOpenEmojiPicker(anchor, {
                    mode: "editor",
                    onPick: emoji => {
                      editor?.chain().focus().insertContent(emoji).run();
                    },
                  });
                },
              },
              {
                id: "bold",
                label: "Negrito",
                keywords: "negrito bold",
                run: ({ editor }) => editor.chain().focus().toggleBold().run(),
              },
              {
                id: "italic",
                label: "Itálico",
                keywords: "italico italic",
                run: ({ editor }) =>
                  editor.chain().focus().toggleItalic().run(),
              },
              {
                id: "underline",
                label: "Sublinhado",
                keywords: "sublinhado underline",
                run: ({ editor }) =>
                  editor.chain().focus().toggleUnderline().run(),
              },
              {
                id: "h1",
                label: "Título 1",
                keywords: "titulo heading h1",
                run: ({ editor }) =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run(),
              },
              {
                id: "h2",
                label: "Título 2",
                keywords: "titulo heading h2",
                run: ({ editor }) =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run(),
              },
              {
                id: "h3",
                label: "Título 3",
                keywords: "titulo heading h3",
                run: ({ editor }) =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run(),
              },
              {
                id: "bullet",
                label: "Lista",
                keywords: "lista bullet",
                run: ({ editor }) =>
                  editor.chain().focus().toggleBulletList().run(),
              },
              {
                id: "ordered",
                label: "Lista numerada",
                keywords: "lista numerada ordered",
                run: ({ editor }) =>
                  editor.chain().focus().toggleOrderedList().run(),
              },
              {
                id: "quote",
                label: "Citação",
                keywords: "citacao quote",
                run: ({ editor }) =>
                  editor.chain().focus().toggleBlockquote().run(),
              },
              {
                id: "clear",
                label: "Limpar formatação",
                keywords: "limpar clear",
                run: ({ editor }) =>
                  editor.chain().focus().unsetAllMarks().clearNodes().run(),
              },
              {
                id: "new-page",
                label: "Página",
                keywords: "nova pagina page subpage",
                run: ({ editor }) => {
                  const child = onCreateChildPage();
                  const href = `/notas/${child.id}`;
                  const label = `${child.emoji} ${child.title || "Página"}`.trim();
                  const safeLabel = label.replace(/[&<>]/g, char => {
                    if (char === "&") return "&amp;";
                    if (char === "<") return "&lt;";
                    if (char === ">") return "&gt;";
                    return char;
                  });
                  editor
                    .chain()
                    .focus()
                    .insertContent(`<a href="${href}">${safeLabel}</a>&nbsp;`)
                    .run();
                  onNavigate(href);
                },
              },
            ];

            if (!q) {
              return all;
            }
            return all.filter(item =>
              `${item.label} ${item.keywords}`.toLowerCase().includes(q)
            );
          };

          return [
            Suggestion({
              editor: this.editor,
              char: "/",
              startOfLine: false,
              allow: ({ state, range }) => {
                const from = Math.max(0, range.from - 1);
                if (from === range.from) {
                  return true;
                }
                const charBefore = state.doc.textBetween(
                  from,
                  range.from,
                  "\n",
                  "\n"
                );
                return !charBefore || /\s/.test(charBefore);
              },
              items: ({ query }) => getItems(query),
              command: ({ editor, range, props }) => {
                editor.chain().focus().deleteRange(range).run();
                (props as SlashItem).run({ editor });
              },
              render: () => {
                return {
                  onStart: props => {
                    setSlashItems(props.items as SlashItem[]);
                    setSlashIndex(0);
                    setSlashOpen(true);
                    setSlashAnchorRect(props.clientRect?.() || null);
                    slashCommandRef.current = (item: SlashItem) =>
                      props.command(item);
                  },
                  onUpdate: props => {
                    setSlashItems(props.items as SlashItem[]);
                    setSlashIndex(0);
                    setSlashOpen(true);
                    setSlashAnchorRect(props.clientRect?.() || null);
                    slashCommandRef.current = (item: SlashItem) =>
                      props.command(item);
                  },
                  onKeyDown: props => {
                    if (props.event.key === "Escape") {
                      setSlashOpen(false);
                      return true;
                    }
                    if (props.event.key === "ArrowDown") {
                      setSlashIndex(current =>
                        Math.min(
                          current + 1,
                          Math.max(0, slashItemsRef.current.length - 1)
                        )
                      );
                      return true;
                    }
                    if (props.event.key === "ArrowUp") {
                      setSlashIndex(current => Math.max(current - 1, 0));
                      return true;
                    }
                    if (props.event.key === "Enter") {
                      const item = slashItemsRef.current?.[slashIndexRef.current];
                      if (item) {
                        slashCommandRef.current?.(item);
                        return true;
                      }
                    }
                    return false;
                  },
                  onExit: () => {
                    setSlashOpen(false);
                    setSlashAnchorRect(null);
                    slashCommandRef.current = null;
                  },
                };
              },
            }),
          ];
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!autoFocus) {
      return;
    }
    if (!editor) {
      return;
    }
    const handle = window.setTimeout(() => {
      editor.commands.focus("end");
    }, 0);
    return () => window.clearTimeout(handle);
  }, [autoFocus, editor]);

  const openLinkDialogFromSelection = () => {
    if (!editor) {
      return;
    }
    editor.chain().focus().extendMarkRange("link").run();
    const href = String(editor.getAttributes("link")?.href || "");
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ", " ");
    setLinkHref(href);
    setLinkText(text);
    setLinkDialogOpen(true);
  };

  const openLinkDialogFromAnchor = (anchor: HTMLAnchorElement) => {
    if (!editor) {
      return;
    }
    try {
      const pos = editor.view.posAtDOM(anchor, 0);
      editor.commands.setTextSelection(pos);
      editor.commands.extendMarkRange("link");
      const href = String(editor.getAttributes("link")?.href || anchor.href || "");
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, " ", " ");
      setLinkHref(href);
      setLinkText(text);
      setLinkDialogOpen(true);
    } catch {
      openLinkDialogFromSelection();
    }
  };

  const openLinkMenuFromAnchor = (anchor: HTMLAnchorElement) => {
    const href = anchor.getAttribute("href") || "";
    if (!href) {
      return;
    }

    if (href.startsWith("/notas/")) {
      onNavigate(href);
      return;
    }
    setLinkMenuHref(href);
    setLinkMenuAnchorRect(anchor.getBoundingClientRect());
    linkMenuAnchorElRef.current = anchor;
    setLinkMenuOpen(true);
  };

  const closeLinkMenu = () => {
    setLinkMenuOpen(false);
    setLinkMenuAnchorRect(null);
    linkMenuAnchorElRef.current = null;
  };

  const closeLinkDialog = () => {
    setLinkDialogOpen(false);
  };

  const applyLinkDialog = () => {
    if (!editor) {
      closeLinkDialog();
      return;
    }
    const nextHref = linkHref.trim();
    const nextText = linkText;

    editor.chain().focus().extendMarkRange("link").run();
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (!nextHref) {
      if (hasSelection) {
        editor.commands.unsetLink();
      }
      closeLinkDialog();
      return;
    }

    if (!hasSelection) {
      const basePos = editor.state.selection.from;
      const textToInsert = (nextText || nextHref).trim();
      if (!textToInsert) {
        closeLinkDialog();
        return;
      }
      editor.commands.insertContent(textToInsert);
      editor.commands.setTextSelection({
        from: basePos,
        to: basePos + textToInsert.length,
      });
      editor.commands.setLink({ href: nextHref });
      closeLinkDialog();
      return;
    }

    const currentText = editor.state.doc.textBetween(from, to, " ", " ");
    const desiredText = nextText;
    if (desiredText && desiredText !== currentText) {
      editor.commands.insertContentAt({ from, to }, desiredText);
      editor.commands.setTextSelection({
        from,
        to: from + desiredText.length,
      });
    }

    editor.commands.setLink({ href: nextHref });
    closeLinkDialog();
  };

  const removeLinkInDialog = () => {
    if (!editor) {
      closeLinkDialog();
      return;
    }
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    closeLinkDialog();
  };

  useEffect(() => {
    if (!editor) {
      return;
    }
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  const iconButtonProps = {
    size: "small" as const,
    sx: {
      border: 1,
      borderColor: "divider",
      backgroundColor: "background.paper",
      width: 40,
      height: 40,
      borderRadius: 9999,
      p: 0,
      "&:hover": { backgroundColor: "action.hover" },
    },
  };

  return (
    <Stack spacing={1} sx={{ flex: 1, minHeight: 0 }}>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          onClick={event =>
            onOpenEmojiPicker(event.currentTarget, {
              mode: "editor",
              onPick: emoji => {
                editor?.chain().focus().insertContent(emoji).run();
              },
            })
          }
          aria-label="Emoji"
          sx={{
            minWidth: 40,
            width: 40,
            height: 40,
            minHeight: 40,
            fontSize: "1.25rem",
            lineHeight: 1,
            p: 0,
            borderColor: "divider",
            "&:hover": { borderColor: "primary.main" },
          }}
        >
          {noteEmoji}
        </Button>
        <IconButton
          {...iconButtonProps}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          color={editor?.isActive("bold") ? "primary" : "default"}
          aria-label="Negrito"
        >
          <FormatBoldRoundedIcon fontSize="small" />
        </IconButton>
        <IconButton
          {...iconButtonProps}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          color={editor?.isActive("italic") ? "primary" : "default"}
          aria-label="Italico"
        >
          <FormatItalicRoundedIcon fontSize="small" />
        </IconButton>
        <IconButton
          {...iconButtonProps}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          color={editor?.isActive("underline") ? "primary" : "default"}
          aria-label="Sublinhado"
        >
          <FormatUnderlinedRoundedIcon fontSize="small" />
        </IconButton>
        <IconButton
          {...iconButtonProps}
          onClick={() => {
            openLinkDialogFromSelection();
          }}
          color={editor?.isActive("link") ? "primary" : "default"}
          aria-label="Link"
        >
          <LinkRoundedIcon fontSize="small" />
        </IconButton>
        <IconButton
          {...iconButtonProps}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          color={editor?.isActive("heading", { level: 1 }) ? "primary" : "default"}
          aria-label="Titulo 1"
        >
          <LooksOneRoundedIcon fontSize="small" />
        </IconButton>
        <IconButton
          {...iconButtonProps}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          color={editor?.isActive("heading", { level: 2 }) ? "primary" : "default"}
          aria-label="Titulo 2"
        >
          <LooksTwoRoundedIcon fontSize="small" />
        </IconButton>
        <IconButton
          {...iconButtonProps}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          color={editor?.isActive("heading", { level: 3 }) ? "primary" : "default"}
          aria-label="Titulo 3"
        >
          <Looks3RoundedIcon fontSize="small" />
        </IconButton>
        <IconButton
          {...iconButtonProps}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          color={editor?.isActive("bulletList") ? "primary" : "default"}
          aria-label="Lista"
        >
          <FormatListBulletedRoundedIcon fontSize="small" />
        </IconButton>
        <IconButton
          {...iconButtonProps}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          color={editor?.isActive("orderedList") ? "primary" : "default"}
          aria-label="Lista numerada"
        >
          <FormatListNumberedRoundedIcon fontSize="small" />
        </IconButton>
        <IconButton
          {...iconButtonProps}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          color={editor?.isActive("blockquote") ? "primary" : "default"}
          aria-label="Citação"
        >
          <FormatQuoteRoundedIcon fontSize="small" />
        </IconButton>
        <IconButton
          {...iconButtonProps}
          onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
          aria-label="Limpar formatação"
        >
          <BackspaceRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Box
        sx={theme => ({
          borderRadius: APP_RADIUS,
          border: 1,
          borderColor: "divider",
          backgroundColor: "background.paper",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          cursor: "text",
          "& .tiptap": {
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            outline: "none",
            padding: "16px",
          },
          "& .tiptap h1": { fontSize: "1.25rem", fontWeight: 700 },
          "& .tiptap h2": { fontSize: "1.1rem", fontWeight: 700 },
          "& .tiptap h3": { fontSize: "1rem", fontWeight: 700 },
          "& .tiptap em, & .tiptap i": { fontStyle: "italic !important" },
          "& .tiptap strong, & .tiptap b": { fontWeight: "700 !important" },
          "& .tiptap u": { textDecoration: "underline !important" },
          "& .tiptap a": { 
            color: "#22c9a6",
            textDecoration: "underline",
            cursor: "pointer",
          },
          "& .tiptap ul": { 
            listStyleType: "disc", 
            paddingLeft: "1.5rem",
            marginTop: "0.5rem",
            marginBottom: "0.5rem",
          },
          "& .tiptap ol": { 
            listStyleType: "decimal", 
            paddingLeft: "1.5rem",
            marginTop: "0.5rem",
            marginBottom: "0.5rem",
          },
          "& .tiptap li": { 
            marginBottom: "0.25rem",
          },
          "& .tiptap blockquote": {
            borderLeft: "3px solid",
            borderColor: "primary.main",
            paddingLeft: "1rem",
            marginLeft: 0,
            marginRight: 0,
            fontStyle: "italic",
            color: "text.secondary",
          },
          "& .tiptap p.is-editor-empty:first-of-type::before": {
            content: "attr(data-placeholder)",
            color: "rgba(230, 237, 243, 0.5)",
            float: "left",
            height: 0,
            pointerEvents: "none",
          },
        })}
        onMouseDownCapture={event => {
          if (event.button !== 0) {
            return;
          }
          const target = event.target as HTMLElement | null;
          const anchor = target?.closest?.("a") as HTMLAnchorElement | null;
          if (!anchor) {
            const insideEditor = Boolean(target?.closest?.(".tiptap"));
            if (!insideEditor) {
              event.preventDefault();
              editor?.chain().focus("end").run();
            }
            return;
          }
          const href = anchor.getAttribute("href") || "";
          if (!href) {
            return;
          }

          skipNextLinkClickRef.current = true;
          event.preventDefault();
          event.stopPropagation();

          if (href.startsWith("/notas/")) {
            onNavigate(href);
            return;
          }

          if (event.ctrlKey || event.metaKey) {
            window.open(href, "_blank", "noopener,noreferrer");
            return;
          }

          openLinkMenuFromAnchor(anchor);
        }}
        onClick={event => {
          if (!skipNextLinkClickRef.current) {
            return;
          }
          skipNextLinkClickRef.current = false;
          const target = event.target as HTMLElement | null;
          const anchor = target?.closest?.("a") as HTMLAnchorElement | null;
          if (!anchor) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <EditorContent editor={editor} />
      </Box>

      <Popper
        open={linkMenuOpen && Boolean(linkMenuAnchorRect)}
        placement="bottom-start"
        anchorEl={
          linkMenuAnchorRect
            ? {
                getBoundingClientRect: () => linkMenuAnchorRect,
              }
            : null
        }
        sx={{ zIndex: theme => theme.zIndex.modal + 1 }}
      >
        <ClickAwayListener onClickAway={closeLinkMenu}>
          <AppCard
            sx={theme => ({
              borderRadius: APP_RADIUS,
              border: 1,
              borderColor: "divider",
              backgroundColor: "background.paper",
              minWidth: 200,
              overflow: "hidden",
              boxShadow: theme.shadows[4],
            })}
            onKeyDown={event => {
              if (event.key === "Escape") {
                closeLinkMenu();
              }
            }}
          >
            <List dense disablePadding>
              <ListItemButton
                onClick={() => {
                  closeLinkMenu();
                  const anchor = linkMenuAnchorElRef.current;
                  if (anchor) {
                    openLinkDialogFromAnchor(anchor);
                    return;
                  }
                  openLinkDialogFromSelection();
                }}
              >
                <ListItemText primary="Editar" />
              </ListItemButton>
              <ListItemButton
                onClick={() => {
                  const href = linkMenuHref;
                  closeLinkMenu();
                  if (href.startsWith("/notas/")) {
                    onNavigate(href);
                    return;
                  }
                  window.open(href, "_blank", "noopener,noreferrer");
                }}
              >
                <ListItemText primary="Abrir link" />
              </ListItemButton>
            </List>
          </AppCard>
        </ClickAwayListener>
      </Popper>

      <Dialog
        open={linkDialogOpen}
        onClose={closeLinkDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="h6">Link</Typography>
            <TextField
              label="Texto"
              value={linkText}
              onChange={e => setLinkText(e.target.value)}
              fullWidth
            />
            <TextField
              label="URL"
              value={linkHref}
              onChange={e => setLinkHref(e.target.value)}
              fullWidth
              autoFocus
            />
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="flex-end"
            >
              <Button variant="outlined" onClick={closeLinkDialog}>
                Cancelar
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={removeLinkInDialog}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Remover link
              </Button>
              <Button
                variant="contained"
                onClick={applyLinkDialog}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Salvar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Popper
        open={slashOpen && Boolean(slashAnchorRect) && slashItems.length > 0}
        placement="bottom-start"
        anchorEl={
          slashAnchorRect
            ? {
                getBoundingClientRect: () => slashAnchorRect,
              }
            : null
        }
        sx={{ zIndex: theme => theme.zIndex.modal + 1 }}
      >
        <AppCard
          sx={theme => ({
            borderRadius: APP_RADIUS,
            border: 1,
            borderColor: "divider",
            backgroundColor: "background.paper",
            minWidth: 220,
            maxWidth: 320,
            overflow: "hidden",
            boxShadow: theme.shadows[4],
          })}
        >
          <List dense disablePadding>
            {slashItems.map((item, index) => (
              <ListItemButton
                key={item.id}
                selected={index === slashIndex}
                onMouseEnter={() => setSlashIndex(index)}
                onMouseDown={event => {
                  event.preventDefault();
                  slashCommandRef.current?.(item);
                }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </AppCard>
      </Popper>
    </Stack>
  );
}
