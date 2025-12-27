import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Alert,
  Box,
  Button,
  Divider,
  ClickAwayListener,
  Dialog,
  DialogContent,
  IconButton,
  Menu,
  MenuItem,
  InputAdornment,
  ListItemButton,
  ListItemText,
  Popper,
  Snackbar,
  Stack,
  TextField as MuiTextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import UnarchiveRoundedIcon from "@mui/icons-material/UnarchiveRounded";
import ShuffleRoundedIcon from "@mui/icons-material/ShuffleRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { interactiveItemSx, interactiveCardSx } from "../styles/interactiveCard";
import SettingsIconButton from "../components/SettingsIconButton";
import ActionIconButton from "../components/ActionIconButton";
import ToggleCheckbox from "../components/ToggleCheckbox";
import CardSection from "../components/layout/CardSection";
import AppCard from "../components/layout/AppCard";
import AppAccordion from "../components/layout/AppAccordion";
import { PageContainer } from "../ui/PageContainer/PageContainer";
import SettingsDialog from "../components/SettingsDialog";
import RichTextEditor from "../components/RichTextEditor";
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
  favorite?: boolean;
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

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const STORAGE_NOTES = "notes_v2";
const STORAGE_NOTE_FIELDS = "note_fields_v2";

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


const emptyNote = (): Note => ({
  id: `note-${Date.now()}`,
  title: "Nova nota",
  emoji: getRandomEmoji(),
  favorite: false,
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
  showEditorToolbar: false,
};

const formatDateTimePtBr = (value: string) => {
  try {
    return new Date(value).toLocaleString("pt-BR");
  } catch {
    return value;
  }
};

const safeFilename = (value: string) =>
  (value || "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 80) || "nota";

const htmlToPlainText = (html: string) => {
  try {
    const doc = new DOMParser().parseFromString(html || "", "text/html");
    const text = doc.body?.innerText || "";
    return text.replace(/\n{3,}/g, "\n\n").trim();
  } catch {
    return (html || "").replace(/<[^>]*>/g, "").trim();
  }
};

const downloadTextFile = (opts: { filename: string; content: string; mime: string }) => {
  const blob = new Blob([opts.content], { type: opts.mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = opts.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

function SidebarTreeDraggableItem(props: {
  note: Note;
  depth: number;
  isActive: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
  onSelect: (note: Note) => void;
  onToggleExpanded: (noteId: string) => void;
  onOpenMenu: (note: Note, anchor: HTMLElement) => void;
}) {
  const {
    note,
    depth,
    isActive,
    hasChildren,
    isExpanded,
    onSelect,
    onToggleExpanded,
    onOpenMenu,
  } = props;
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id: note.id });
  const { setNodeRef: setDraggableRef, attributes, listeners, transform, isDragging } =
    useDraggable({ id: note.id });

  const setRefs = (node: HTMLElement | null) => {
    setDroppableRef(node);
    setDraggableRef(node);
  };

  return (
    <ListItemButton
      ref={setRefs}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(note)}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.6 : 1,
      }}
      sx={theme => ({
        ...interactiveItemSx(theme),
        py: 1,
        pr: 1,
        pl: 1 + depth * 3,
        border: 1,
        borderColor: "transparent",
        backgroundColor: isOver ? "action.selected" : isActive ? "action.hover" : undefined,
        minWidth: 0,
        touchAction: "none",
        "@media (hover: hover)": {
          "& .notes-item-menu": {
            opacity: 0,
            pointerEvents: "none",
          },
          "&:hover .notes-item-menu": {
            opacity: 1,
            pointerEvents: "auto",
          },
          "& .notes-tree-caret": {
            opacity: 0,
            pointerEvents: "none",
          },
          "& .notes-emoji": {
            opacity: 1,
          },
          "&:hover .notes-tree-caret": {
            opacity: 1,
            pointerEvents: "auto",
          },
          "&:hover .notes-emoji": {
            opacity: 0,
          },
        },
        "@media (hover: none)": {
          "& .notes-tree-caret": {
            opacity: 1,
            pointerEvents: "auto",
          },
          "& .notes-emoji": {
            opacity: hasChildren ? 0 : 1,
          },
        },
      })}
    >
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
        <Box
          sx={{
            width: 22,
            height: 22,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "0 0 auto",
            position: "relative",
          }}
        >
          <Box
            className="notes-emoji"
            sx={{
              position: "absolute",
              inset: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              transition: "opacity 120ms ease",
            }}
          >
            <Typography component="span" variant="body2" sx={{ lineHeight: 1 }}>
              {note.emoji}
            </Typography>
          </Box>

          {hasChildren ? (
            <IconButton
              className="notes-tree-caret"
              size="small"
              onPointerDown={event => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={event => {
                event.preventDefault();
                event.stopPropagation();
                onToggleExpanded(note.id);
              }}
              sx={{
                position: "absolute",
                inset: 0,
                color: "text.secondary",
                p: 0.25,
                transition: "opacity 120ms ease",
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
            fontWeight: depth > 0 ? 400 : 500,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "text.secondary",
            flex: 1,
          }}
        >
          {note.title || "Sem título"}
        </Typography>

        <IconButton
          className="notes-item-menu"
          size="small"
          onPointerDown={event => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();
            onOpenMenu(note, event.currentTarget);
          }}
          sx={{ color: "text.secondary" }}
          aria-label="Mais opções"
        >
          <MoreHorizRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>
    </ListItemButton>
  );
}

export default function Notes() {
  const [location, setLocation] = useLocation();
  const isArchiveView = location.startsWith("/notas/arquivo");
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [editorAutoFocusNoteId, setEditorAutoFocusNoteId] = useState<
    string | null
  >(null);
  const [mobileNotesExpanded, setMobileNotesExpanded] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [noteQuery, setNoteQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsAccordion, setSettingsAccordion] = useState<
    "display" | false
  >(false);

  const [noteMenuAnchorEl, setNoteMenuAnchorEl] = useState<HTMLElement | null>(
    null
  );
  const noteMenuOpen = Boolean(noteMenuAnchorEl);

  const [sidebarItemMenuAnchorEl, setSidebarItemMenuAnchorEl] = useState<
    HTMLElement | null
  >(null);
  const [sidebarItemMenuNoteId, setSidebarItemMenuNoteId] = useState<string | null>(
    null
  );
  const sidebarItemMenuOpen = Boolean(sidebarItemMenuAnchorEl);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameDialogValue, setRenameDialogValue] = useState("");
  const [renameTargetNoteId, setRenameTargetNoteId] = useState<string | null>(
    null
  );

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
      favorite: Boolean((raw as any).favorite),
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
    const timeoutId = setTimeout(() => {
      void saveUserStorage(STORAGE_NOTE_FIELDS, fieldSettings);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [fieldSettings]);

  useEffect(() => {
    if (!isLoadedRef.current) {
      return;
    }
    window.localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
    
    // Debounce: save to backend after 500ms of no changes
    const timeoutId = setTimeout(() => {
      void saveUserStorage(STORAGE_NOTES, notes);
    }, 500);
    
    return () => clearTimeout(timeoutId);
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

  // Se entrar no Arquivo e não existir nenhuma nota arquivada, volta pra Notas e abre busca
  useEffect(() => {
    if (!isLoadedRef.current) {
      return;
    }
    if (!isArchiveView) {
      return;
    }
    const hasArchived = notes.some(note => Boolean(note.archived));
    if (hasArchived) {
      return;
    }
    setShowSearch(true);
    setLocation("/notas");
  }, [isArchiveView, notes, setLocation]);

  const sortedFilteredNotes = useMemo(() => {
    const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });
    const titleKey = (note: Note) =>
      (note.title || "Sem título").trim() || "Sem título";

    const list = [...filteredNotes];
    list.sort((a, b) => {
      const af = Boolean(a.favorite);
      const bf = Boolean(b.favorite);
      if (af !== bf) {
        return af ? -1 : 1;
      }
      if (af && bf) {
        return collator.compare(titleKey(a), titleKey(b));
      }
      return (b.updatedAt || "").localeCompare(a.updatedAt || "");
    });
    return list;
  }, [filteredNotes]);

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
    setNotes(prev => {
      const updated = prev.map(note =>
        note.id === next.id ? { ...next, isDraft: false } : note
      );
      
      // If emoji or title changed, update parent's HTML to reflect the new link text
      if (next.parentId) {
        const oldNote = prev.find(n => n.id === next.id);
        if (oldNote && (oldNote.emoji !== next.emoji || oldNote.title !== next.title)) {
          return updated.map(note => {
            if (note.id === next.parentId) {
              const newLabel = `${next.emoji || ""} ${next.title || "Página"}`.trim();
              const href = `/notas/${next.id}`;
              
              // Replace old link text with new one in HTML
              let newHtml = note.contentHtml;
              const linkPattern = new RegExp(
                `(<a[^>]*href="${href.replace(/\//g, '\\/')}"[^>]*>)([^<]*)(</a>)`,
                'gi'
              );
              newHtml = newHtml.replace(linkPattern, `$1${newLabel}$3`);
              
              if (newHtml !== note.contentHtml) {
                return {
                  ...note,
                  contentHtml: newHtml,
                  updatedAt: new Date().toISOString(),
                };
              }
            }
            return note;
          });
        }
      }
      
      return updated;
    });
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

  const toggleFavorite = (noteId: string) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === noteId ? { ...note, favorite: !note.favorite } : note
      )
    );
  };

  const getNoteHref = useCallback(
    (note: Note) => (note.archived ? `/notas/arquivo/${note.id}` : `/notas/${note.id}`),
    []
  );

  const openSidebarItemMenu = useCallback((note: Note, anchor: HTMLElement) => {
    setSidebarItemMenuNoteId(note.id);
    setSidebarItemMenuAnchorEl(anchor);
  }, []);

  const closeSidebarItemMenu = useCallback(() => {
    setSidebarItemMenuAnchorEl(null);
    setSidebarItemMenuNoteId(null);
  }, []);

  const sidebarItemMenuNote = useMemo(() => {
    if (!sidebarItemMenuNoteId) {
      return null;
    }
    return notes.find(note => note.id === sidebarItemMenuNoteId) || null;
  }, [notes, sidebarItemMenuNoteId]);

  const formatCreatedAt = useCallback((value: string) => {
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      return date.toLocaleString("pt-BR");
    } catch {
      return value;
    }
  }, []);

  const showSidebar = true;
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

  const sidebarDndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const isAncestorOf = useCallback(
    (possibleAncestorId: string, noteId: string) => {
      if (!possibleAncestorId || !noteId) {
        return false;
      }
      const byId = new Map(notes.map(note => [note.id, note] as const));
      let current = byId.get(noteId);
      let guard = 0;
      while (current?.parentId && guard < 50) {
        if (current.parentId === possibleAncestorId) {
          return true;
        }
        current = byId.get(current.parentId);
        guard += 1;
      }
      return false;
    },
    [notes]
  );

  const ensureSubpageLinkInParent = useCallback(
    (parent: Note, child: Note) => {
      const href = `/notas/${child.id}`;
      const existing = parent.contentHtml || "";
      const hasLink =
        existing.includes(`href=\"${href}\"`) || existing.includes(`href='${href}'`);
      if (hasLink) {
        return parent;
      }

      const label = `${child.emoji || ""} ${child.title || "Página"}`.trim();
      const safeLabel = escapeHtml(label);
      const linkHtml = `<a href=\"${href}\">${safeLabel}</a>`;

      const nextHtml = existing.trim()
        ? `${existing.trim()}<p>${linkHtml}</p>`
        : `<p>${linkHtml}</p>`;

      return {
        ...parent,
        contentHtml: nextHtml,
        updatedAt: new Date().toISOString(),
      };
    },
    []
  );

  const handleSidebarDragEnd = useCallback(
    (event: DragEndEvent) => {
      const activeId = String(event.active.id || "");
      const overId = event.over ? String(event.over.id || "") : "";
      if (!activeId || !overId) {
        return;
      }
      if (activeId === overId) {
        return;
      }

      setNotes(prev => {
        const byId = new Map(prev.map(note => [note.id, note] as const));
        const active = byId.get(activeId);
        const over = byId.get(overId);
        if (!active || !over) {
          return prev;
        }
        if (active.archived !== over.archived) {
          return prev;
        }
        // Evita ciclos: não dá pra colocar uma nota dentro de um descendente dela
        if (isAncestorOf(activeId, overId)) {
          return prev;
        }
        if (active.parentId === overId) {
          return prev;
        }

        const now = new Date().toISOString();
        const nextActive: Note = { ...active, parentId: overId, updatedAt: now, isDraft: false };
        const nextOver = ensureSubpageLinkInParent(over, nextActive);

        return prev.map(note => {
          if (note.id === nextActive.id) {
            return nextActive;
          }
          if (note.id === nextOver.id) {
            return nextOver;
          }
          return note;
        });
      });

      setExpandedSidebarIds(prev => {
        const next = new Set(prev);
        next.add(overId);
        return next;
      });
    },
    [ensureSubpageLinkInParent, isAncestorOf]
  );

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

    const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });
    const titleKey = (note: Note) =>
      (note.title || "Sem título").trim() || "Sem título";

    const sortNotes = (items: Note[]) =>
      items.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));

    const favorites = candidates
      .filter(note => Boolean(note.favorite))
      .sort((a, b) => collator.compare(titleKey(a), titleKey(b)));

    sortNotes(roots);
    Array.from(childrenByParentId.values()).forEach(list => sortNotes(list));

    return { roots, childrenByParentId, byId, favorites };
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

    if (sidebarTree.favorites.length) {
      rows.push(
        <Box key="__favorites-header" sx={{ px: 0.5, pt: 0.5, pb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Favoritos
          </Typography>
        </Box>
      );

      for (const note of sidebarTree.favorites) {
        const isActive = note.id === selectedNoteId;
        const hasChildren = (sidebarTree.childrenByParentId.get(note.id) ?? []).length > 0;
        const isExpanded = expandedSidebarIds.has(note.id);
        rows.push(
          <ListItemButton
            key={`fav-${note.id}`}
            onClick={() => {
              opts.onSelect(note);
              opts.onAfterSelect?.();
            }}
            sx={theme => ({
              ...interactiveItemSx(theme),
              py: 1,
              pr: 1,
              pl: 1,
              border: 1,
              borderColor: "transparent",
              backgroundColor: isActive ? "action.hover" : undefined,
              minWidth: 0,
              "@media (hover: hover)": {
                "& .notes-item-menu": {
                  opacity: 0,
                  pointerEvents: "none",
                },
                "&:hover .notes-item-menu": {
                  opacity: 1,
                  pointerEvents: "auto",
                },
                "& .notes-tree-caret": {
                  opacity: 0,
                  pointerEvents: "none",
                },
                "& .notes-emoji": {
                  opacity: 1,
                },
                "&:hover .notes-tree-caret": {
                  opacity: 1,
                  pointerEvents: "auto",
                },
                "&:hover .notes-emoji": {
                  opacity: 0,
                },
              },
              "@media (hover: none)": {
                "& .notes-tree-caret": {
                  opacity: 1,
                  pointerEvents: "auto",
                },
                "& .notes-emoji": {
                  opacity: hasChildren ? 0 : 1,
                },
              },
            })}
          >
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "0 0 auto",
                  position: "relative",
                }}
              >
                <Box
                  className="notes-emoji"
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                    transition: "opacity 120ms ease",
                  }}
                >
                  <Typography component="span" variant="body2" sx={{ lineHeight: 1 }}>
                    {note.emoji}
                  </Typography>
                </Box>

                {hasChildren ? (
                  <IconButton
                    className="notes-tree-caret"
                    size="small"
                    onPointerDown={event => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={event => {
                      event.preventDefault();
                      event.stopPropagation();
                      setExpandedSidebarIds(prev => {
                        const next = new Set(prev);
                        if (next.has(note.id)) {
                          next.delete(note.id);
                        } else {
                          next.add(note.id);
                        }
                        return next;
                      });
                    }}
                    sx={{
                      position: "absolute",
                      inset: 0,
                      color: "text.secondary",
                      p: 0.25,
                      transition: "opacity 120ms ease",
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
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{ minWidth: 0, flex: 1 }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: "text.primary",
                    flex: 1,
                  }}
                >
                  {note.title || "Sem título"}
                </Typography>
              </Stack>

              <IconButton
                className="notes-item-menu"
                size="small"
                onPointerDown={event => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={event => {
                  event.preventDefault();
                  event.stopPropagation();
                  openSidebarItemMenu(note, event.currentTarget);
                }}
                sx={{ color: "text.secondary" }}
                aria-label="Mais opções"
              >
                <MoreHorizRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </ListItemButton>
        );
      }

      rows.push(
        <Divider
          key="__favorites-divider"
          sx={{ my: 1, opacity: 0.5, borderColor: "divider" }}
        />
      );
    }

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
        <SidebarTreeDraggableItem
          key={note.id}
          note={note}
          depth={depth}
          isActive={isActive}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          onToggleExpanded={toggleSidebarExpanded}
          onOpenMenu={openSidebarItemMenu}
          onSelect={nextNote => {
            opts.onSelect(nextNote);
            opts.onAfterSelect?.();
          }}
        />
      );

      if (hasChildren && isExpanded && depth < 6) {
        for (let i = children.length - 1; i >= 0; i -= 1) {
          stack.push({ note: children[i]!, depth: depth + 1 });
        }
      }
    }

    return (
      <DndContext sensors={sidebarDndSensors} onDragEnd={handleSidebarDragEnd}>
        <Stack spacing={0}>{rows}</Stack>
      </DndContext>
    );
  };

  const pageActions = useMemo(
    () => (
      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip title="Buscar notas" placement="bottom">
          <span>
            <ActionIconButton
              onClick={event => {
                (event.currentTarget as HTMLElement).blur();
                const next = !showSearch;
                setShowSearch(next);
                if (!next) {
                  setNoteQuery("");
                  return;
                }
                if (selectedNoteId) {
                  setLocation(isArchiveView ? "/notas/arquivo" : "/notas");
                }
              }}
              icon={<SearchRoundedIcon fontSize="small" />}
              aria-label="Buscar notas"
            />
          </span>
        </Tooltip>
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
    [
      addNote,
      archiveLink.label,
      showSearch,
      selectedNoteId,
      isArchiveView,
      setLocation,
    ]
  );

  return (
    <PageContainer actionsSlot={pageActions}>
      <Stack spacing={3} sx={{ flex: 1, minHeight: 0 }}>
        {showSidebar ? (
          <Box sx={{ display: { xs: "block", md: "none" } }}>
            <AppAccordion
              expanded={mobileNotesExpanded}
              onChange={(_, expanded) => setMobileNotesExpanded(expanded)}
              title="Notas"
            >
              {renderSidebarItems({
                onSelect: note => selectNote(note),
                onAfterSelect: () => setMobileNotesExpanded(false),
              })}
              {!sidebarTree.roots.length ? (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {isArchiveView ? "Sem notas arquivadas." : "Sem notas."}
                  </Typography>
                ) : null}
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
              </CardSection>
            </Stack>
          ) : null}

          <Stack spacing={2.5} sx={{ flex: 1, minHeight: 0 }}>
            {!selectedNote ? (
              <CardSection size="xs">
                <Stack spacing={1.5}>
                  {showSearch && (
                    <MuiTextField
                      placeholder="Buscar nota"
                      label="Buscar nota"
                      variant="outlined"
                      size="medium"
                      fullWidth
                      autoFocus
                      value={noteQuery}
                      onChange={event => setNoteQuery(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === "Escape") {
                          setNoteQuery("");
                          setShowSearch(false);
                        }
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            {noteQuery ? (
                              <IconButton
                                size="small"
                                onClick={() => setNoteQuery("")}
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
                  )}
                  {filteredNotes.length ? (
                    <Box
                      sx={{
                        display: "grid",
                        gap: 2,
                        width: "100%",
                        minWidth: 0,
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(auto-fit, minmax(220px, 1fr))",
                        },
                      }}
                    >
                      {(expandedNoteId
                        ? sortedFilteredNotes.filter(
                            note => note.id === expandedNoteId
                          )
                        : sortedFilteredNotes
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
                              backgroundColor: "background.paper",
                              cursor: "pointer",
                              minHeight: isExpanded ? "auto" : 96,
                            })}
                          >
                            <Stack spacing={isExpanded ? 1.5 : 1}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 1,
                                  width: "100%",
                                }}
                              >
                                <Typography
                                  variant={
                                    isExpanded ? "subtitle1" : "subtitle2"
                                  }
                                  sx={{
                                    fontWeight: 600,
                                    minWidth: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                  }}
                                >
                                  {note.emoji} {note.title}
                                </Typography>
                                {note.favorite ? (
                                  <Box
                                    sx={{
                                      flex: "0 0 auto",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      color: "text.primary",
                                    }}
                                    aria-label="Nota favorita"
                                  >
                                    <StarRoundedIcon fontSize="small" />
                                  </Box>
                                ) : null}
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
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  minHeight: 0,
                }}
              >
                <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconButton
                        aria-label="Trocar emoji"
                        onClick={e => openEmojiPicker(e.currentTarget, { mode: "note" })}
                        sx={{ width: 56, height: 56, fontSize: "1.5rem" }}
                      >
                        {selectedNote.emoji}
                      </IconButton>
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
                              <MuiTextField
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
                      <MuiTextField
                        label="Titulo"
                        variant="standard"
                        value={selectedNote.title}
                        onChange={event =>
                          updateNote({
                            ...selectedNote,
                            title: event.target.value,
                            updatedAt: new Date().toISOString(),
                          })
                        }
                        fullWidth
                        InputProps={{ disableUnderline: true }}
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
                          "& .MuiInputBase-root:before, & .MuiInputBase-root:after": {
                            display: "none",
                          },
                        }}
                      />
                      <Tooltip title="Opções" placement="top">
                        <IconButton
                          size="small"
                          aria-label="Opções da nota"
                          onClick={event => setNoteMenuAnchorEl(event.currentTarget)}
                          sx={{ color: "text.secondary" }}
                        >
                          <MoreVertRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>

                    <Menu
                      anchorEl={noteMenuAnchorEl}
                      open={noteMenuOpen}
                      onClose={() => setNoteMenuAnchorEl(null)}
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      transformOrigin={{ vertical: "top", horizontal: "right" }}
                    >
                      <MenuItem disabled>
                        <ListItemText
                          primary={`Criada: ${formatDateTimePtBr(selectedNote.createdAt)}`}
                          secondary={`Atualizada: ${formatDateTimePtBr(selectedNote.updatedAt)}`}
                        />
                      </MenuItem>
                      <Divider />
                      <MenuItem
                        onClick={() => {
                          toggleFavorite(selectedNote.id);
                          setNoteMenuAnchorEl(null);
                        }}
                      >
                        <ListItemText
                          primary={
                            selectedNote.favorite
                              ? "Remover dos favoritos"
                              : "Marcar como favorito"
                          }
                        />
                      </MenuItem>
                      <Divider />
                      <MenuItem
                        onClick={() => {
                          setNoteMenuAnchorEl(null);
                          requestNoteAction(
                            selectedNote,
                            selectedNote.archived ? "restore" : "archive"
                          );
                        }}
                      >
                        <ListItemText
                          primary={
                            selectedNote.archived
                              ? "Restaurar nota"
                              : "Arquivar nota"
                          }
                        />
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setNoteMenuAnchorEl(null);
                          requestNoteAction(selectedNote, "delete");
                        }}
                      >
                        <ListItemText primary="Remover nota" />
                      </MenuItem>
                      <Divider />
                      <MenuItem
                        disabled
                        sx={{ opacity: 1, cursor: "default" }}
                        onClick={event => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 0.3 }}
                        >
                          Exportar
                        </Typography>
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setNoteMenuAnchorEl(null);
                          const title = `${selectedNote.emoji || ""} ${selectedNote.title || ""}`.trim();
                          const html = `<!doctype html><html><head><meta charset=\"utf-8\"/><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:24px;}h1{font-size:20px;margin:0 0 12px;} .meta{color:#666;font-size:12px;margin-bottom:16px;} img{max-width:100%;}</style></head><body><h1>${title}</h1><div class=\"meta\">Criada: ${formatDateTimePtBr(selectedNote.createdAt)} | Atualizada: ${formatDateTimePtBr(selectedNote.updatedAt)}</div>${selectedNote.contentHtml || ""}</body></html>`;
                          const w = window.open("", "_blank", "noopener,noreferrer");
                          if (!w) return;
                          w.document.open();
                          w.document.write(html);
                          w.document.close();
                          w.focus();
                          w.print();
                        }}
                      >
                        <ListItemText
                          primary="PDF"
                          secondary="(usar Imprimir / Salvar como PDF)"
                        />
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setNoteMenuAnchorEl(null);
                          const base = safeFilename(selectedNote.title || "nota");
                          const content = htmlToPlainText(selectedNote.contentHtml || "");
                          downloadTextFile({
                            filename: `${base}.txt`,
                            content,
                            mime: "text/plain;charset=utf-8",
                          });
                        }}
                      >
                        <ListItemText primary="TXT" />
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setNoteMenuAnchorEl(null);
                          const base = safeFilename(selectedNote.title || "nota");
                          const titleLine = `# ${(selectedNote.emoji || "").trim()} ${(selectedNote.title || "Nota").trim()}`
                            .replace(/\s+/g, " ")
                            .trim();
                          const body = htmlToPlainText(selectedNote.contentHtml || "");
                          const md = `${titleLine}\n\n${body}\n`;
                          downloadTextFile({
                            filename: `${base}.md`,
                            content: md,
                            mime: "text/markdown;charset=utf-8",
                          });
                        }}
                      >
                        <ListItemText primary="Markdown" />
                      </MenuItem>
                    </Menu>
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
                          <MuiTextField
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
                          <MuiTextField
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
                          <MuiTextField
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
                    placeholder=""
                    showToolbar={Boolean(fieldSettings.showEditorToolbar)}
                    showBorder={false}
                    onNavigate={href => setLocation(href)}
                    onCreateChildPage={() => createChildNote(selectedNote)}
                    noteEmoji={"😊"}
                    onOpenEmojiPicker={(anchor, opts) => openEmojiPicker(anchor, opts)}
                    autoFocus={editorAutoFocusNoteId === selectedNote.id}
                  />

                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip
                      title={
                        selectedNote.favorite
                          ? "Remover dos favoritos"
                          : "Marcar como favorito"
                      }
                      placement="top"
                    >
                      <Button
                        variant="outlined"
                        aria-label={
                          selectedNote.favorite
                            ? "Remover dos favoritos"
                            : "Marcar como favorito"
                        }
                        onClick={() => toggleFavorite(selectedNote.id)}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          minWidth: 0,
                          px: 1.25,
                        }}
                      >
                        {selectedNote.favorite ? (
                          <StarRoundedIcon fontSize="small" />
                        ) : (
                          <StarBorderRoundedIcon fontSize="small" />
                        )}
                      </Button>
                    </Tooltip>
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
                  { key: "showEditorToolbar", label: "Barra de formatação" },
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
        intent={noteConfirm?.type === "delete" ? "danger" : "default"}
        title={
          noteConfirm
            ? noteConfirm.type === "delete"
              ? "Remover nota"
              : noteConfirm.type === "archive"
                ? "Arquivar nota"
                : "Restaurar nota"
            : ""
        }
        description={
          noteConfirm
            ? noteConfirm.type === "delete"
              ? "Você confirma a remoção desta nota? Esta ação não poderá ser desfeita."
              : noteConfirm.type === "archive"
                ? "Você confirma o envio desta nota para o arquivo?"
                : "Você confirma a restauração desta nota para a lista principal?"
            : ""
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

      <Menu
        anchorEl={sidebarItemMenuAnchorEl}
        open={sidebarItemMenuOpen}
        onClose={closeSidebarItemMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {sidebarItemMenuNote?.favorite ? (
          <MenuItem
            onClick={() => {
              toggleFavorite(sidebarItemMenuNote.id);
              closeSidebarItemMenu();
            }}
          >
            Remover dos favoritos
          </MenuItem>
        ) : null}

        <MenuItem
          onClick={async () => {
            if (!sidebarItemMenuNote) {
              closeSidebarItemMenu();
              return;
            }
            const href = getNoteHref(sidebarItemMenuNote);
            const url = `${window.location.origin}${href}`;
            try {
              await navigator.clipboard.writeText(url);
            } catch {
              const input = document.createElement("input");
              input.value = url;
              document.body.appendChild(input);
              input.select();
              document.execCommand("copy");
              input.remove();
            }
            closeSidebarItemMenu();
          }}
        >
          Copiar link da nota
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (!sidebarItemMenuNote) {
              closeSidebarItemMenu();
              return;
            }
            const href = getNoteHref(sidebarItemMenuNote);
            const url = `${window.location.origin}${href}`;
            window.open(url, "_blank", "noopener,noreferrer");
            closeSidebarItemMenu();
          }}
        >
          Abrir em nova aba
        </MenuItem>

        <MenuItem disabled>
          Criada em: {sidebarItemMenuNote ? formatCreatedAt(sidebarItemMenuNote.createdAt) : ""}
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (!sidebarItemMenuNote) {
              closeSidebarItemMenu();
              return;
            }
            setRenameDialogValue(sidebarItemMenuNote.title || "");
            setRenameTargetNoteId(sidebarItemMenuNote.id);
            setRenameDialogOpen(true);
            closeSidebarItemMenu();
          }}
        >
          Renomear
        </MenuItem>
      </Menu>

      <Dialog
        open={renameDialogOpen}
        onClose={() => {
          setRenameDialogOpen(false);
          setRenameTargetNoteId(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Renomear nota
            </Typography>
            <MuiTextField
              label="Nome"
              value={renameDialogValue}
              autoFocus
              fullWidth
              onChange={event => setRenameDialogValue(event.target.value)}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => {
                  setRenameDialogOpen(false);
                  setRenameTargetNoteId(null);
                }}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  if (!renameTargetNoteId) {
                    setRenameDialogOpen(false);
                    return;
                  }
                  const nextTitle = renameDialogValue.trim();
                  setNotes(prev =>
                    prev.map(note =>
                      note.id === renameTargetNoteId
                        ? { ...note, title: nextTitle, updatedAt: new Date().toISOString() }
                        : note
                    )
                  );
                  setRenameDialogOpen(false);
                  setRenameTargetNoteId(null);
                }}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Salvar
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
  intent = "default",
  title,
  description,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  intent?: "default" | "danger";
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isDanger = intent === "danger";
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
            {isDanger ? (
              <>
                <Button variant="contained" color="error" onClick={onConfirm}>
                  Remover
                </Button>
                <Button variant="outlined" onClick={onCancel}>
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <Button variant="outlined" onClick={onCancel}>
                  Cancelar
                </Button>
                <Button variant="contained" onClick={onConfirm}>
                  Confirmar
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
