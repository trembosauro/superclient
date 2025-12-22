import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import FormatBoldRoundedIcon from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRoundedIcon from "@mui/icons-material/FormatItalicRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import LooksOneRoundedIcon from "@mui/icons-material/LooksOneRounded";
import LooksTwoRoundedIcon from "@mui/icons-material/LooksTwoRounded";
import Looks3RoundedIcon from "@mui/icons-material/Looks3Rounded";
import BackspaceRoundedIcon from "@mui/icons-material/BackspaceRounded";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { interactiveCardSx } from "../styles/interactiveCard";
import SettingsIconButton from "../components/SettingsIconButton";
import ToggleCheckbox from "../components/ToggleCheckbox";

type NoteCategory = {
  id: string;
  name: string;
  color: string;
};

type NoteSubcategory = {
  id: string;
  name: string;
  categoryId: string;
};

type NoteLink = {
  id: string;
  label: string;
  url: string;
};

type Note = {
  id: string;
  title: string;
  categoryIds: string[];
  subcategoryIds: string[];
  contentHtml: string;
  links: NoteLink[];
  updatedAt: string;
  isDraft?: boolean;
};

const STORAGE_NOTES = "notes_v1";
const STORAGE_NOTE_CATEGORIES = "note_categories_v1";
const STORAGE_NOTE_SUBCATEGORIES = "note_subcategories_v1";
const STORAGE_NOTE_FIELDS = "note_fields_v1";

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

const defaultCategories: NoteCategory[] = [
  { id: "note-cat-estrategia", name: "Estrategia", color: DEFAULT_COLORS[0] },
  { id: "note-cat-reunioes", name: "Reunioes", color: DEFAULT_COLORS[1] },
  { id: "note-cat-projeto", name: "Projeto", color: DEFAULT_COLORS[2] },
  { id: "note-cat-aprendizado", name: "Aprendizado", color: DEFAULT_COLORS[3] },
];

const defaultSubcategories: NoteSubcategory[] = [
  { id: "note-sub-plano", name: "Plano de acao", categoryId: "note-cat-estrategia" },
  { id: "note-sub-kpis", name: "KPIs", categoryId: "note-cat-estrategia" },
  { id: "note-sub-ata", name: "Ata", categoryId: "note-cat-reunioes" },
  { id: "note-sub-followup", name: "Follow-up", categoryId: "note-cat-reunioes" },
  { id: "note-sub-fluxos", name: "Fluxos", categoryId: "note-cat-projeto" },
  { id: "note-sub-research", name: "Pesquisa", categoryId: "note-cat-aprendizado" },
];

const defaultNotes: Note[] = [
  {
    id: "note-1",
    title: "Proximos passos do projeto",
    categoryIds: ["note-cat-projeto"],
    subcategoryIds: ["note-sub-fluxos"],
    contentHtml:
      "<p>Mapear entregas por etapa e alinhar milestones com o time.</p><ul><li>Kickoff</li><li>Design sprint</li><li>Entrega beta</li></ul>",
    links: [
      { id: "note-link-1", label: "Board do projeto", url: "https://trello.com" },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "note-2",
    title: "Resumo da reuniao de status",
    categoryIds: ["note-cat-reunioes"],
    subcategoryIds: ["note-sub-ata"],
    contentHtml:
      "<p>Principais alinhamentos:</p><ol><li>Priorizar backlog A</li><li>Revisar riscos da entrega</li></ol>",
    links: [{ id: "note-link-2", label: "Gravacao", url: "https://meet.google.com" }],
    updatedAt: new Date().toISOString(),
  },
];

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

const emptyNote = (categoryId: string): Note => ({
  id: `note-${Date.now()}`,
  title: "Nova nota",
  categoryIds: [categoryId],
  subcategoryIds: [],
  contentHtml: "",
  links: [],
  updatedAt: new Date().toISOString(),
  isDraft: true,
});

export default function Notes() {
  const [categories, setCategories] = useState<NoteCategory[]>(defaultCategories);
  const [subcategories, setSubcategories] = useState<NoteSubcategory[]>(defaultSubcategories);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(defaultCategories[0]?.id || "");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [subcategoryDraft, setSubcategoryDraft] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fieldSettings, setFieldSettings] = useState({
    showCategories: true,
    showSubcategories: true,
    showLinks: true,
    showUpdatedAt: true,
  });
  const [confirmRemove, setConfirmRemove] = useState<{
    type: "category" | "subcategory";
    id: string;
  } | null>(null);

  useEffect(() => {
    const storedNotes = window.localStorage.getItem(STORAGE_NOTES);
    if (storedNotes) {
      try {
        const parsed = JSON.parse(storedNotes) as Array<Note & { categoryId?: string; subcategoryId?: string }>;
        if (Array.isArray(parsed) && parsed.length) {
          const normalized = parsed.map((note) => ({
            ...note,
            categoryIds: note.categoryIds?.length
              ? note.categoryIds
              : note.categoryId
                ? [note.categoryId]
                : [],
            subcategoryIds: note.subcategoryIds?.length
              ? note.subcategoryIds
              : note.subcategoryId
                ? [note.subcategoryId]
                : [],
            isDraft: Boolean(note.isDraft),
          }));
          setNotes(normalized);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_NOTES);
      }
    } else {
      setNotes(defaultNotes);
    }

    const storedCategories = window.localStorage.getItem(STORAGE_NOTE_CATEGORIES);
    if (storedCategories) {
      try {
        const parsed = JSON.parse(storedCategories) as NoteCategory[];
        if (Array.isArray(parsed) && parsed.length) {
          setCategories(parsed);
          setActiveCategory(parsed[0].id);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_NOTE_CATEGORIES);
      }
    }

    const storedSubcategories = window.localStorage.getItem(STORAGE_NOTE_SUBCATEGORIES);
    if (storedSubcategories) {
      try {
        const parsed = JSON.parse(storedSubcategories) as NoteSubcategory[];
        if (Array.isArray(parsed)) {
          setSubcategories(parsed);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_NOTE_SUBCATEGORIES);
      }
    }
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_NOTE_FIELDS);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as Partial<typeof fieldSettings>;
      setFieldSettings((prev) => ({ ...prev, ...parsed }));
    } catch {
      window.localStorage.removeItem(STORAGE_NOTE_FIELDS);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_NOTE_FIELDS, JSON.stringify(fieldSettings));
  }, [fieldSettings]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_NOTE_CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_NOTE_SUBCATEGORIES, JSON.stringify(subcategories));
  }, [subcategories]);

  const activeSubcategories = useMemo(
    () => subcategories.filter((item) => item.categoryId === activeCategory),
    [subcategories, activeCategory]
  );

  const filteredNotes = useMemo(
    () => notes.filter((note) => note.categoryIds.includes(activeCategory)),
    [notes, activeCategory]
  );

  const selectedNote = notes.find((note) => note.id === selectedNoteId) || null;

  const isPristineDraft = (note: Note) =>
    note.isDraft &&
    note.title.trim() === "Nova nota" &&
    !note.contentHtml.trim() &&
    !note.links.length &&
    !note.subcategoryIds.length;

  useEffect(() => {
    const nextNotes = notes.filter((note) => !isPristineDraft(note));
    if (nextNotes.length !== notes.length) {
      window.localStorage.setItem(STORAGE_NOTES, JSON.stringify(nextNotes));
    }
  }, [notes]);

  const discardIfPristine = (noteId: string | null) => {
    if (!noteId) {
      return;
    }
    const note = notes.find((item) => item.id === noteId);
    if (note && isPristineDraft(note)) {
      setNotes((prev) => prev.filter((item) => item.id !== noteId));
    }
  };

  useEffect(() => {
    if (!filteredNotes.length) {
      setSelectedNoteId(null);
      return;
    }
    if (!selectedNoteId || !filteredNotes.some((note) => note.id === selectedNoteId)) {
      setSelectedNoteId(filteredNotes[0].id);
    }
  }, [filteredNotes, selectedNoteId]);

  const selectNote = (note: Note) => {
    discardIfPristine(selectedNoteId);
    setSelectedNoteId(note.id);
  };

  const updateNote = (next: Note) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === next.id ? { ...next, isDraft: false } : note
      )
    );
  };

  const addNote = () => {
    if (!activeCategory) {
      return;
    }
    discardIfPristine(selectedNoteId);
    const next = emptyNote(activeCategory);
    setNotes((prev) => [next, ...prev]);
    setSelectedNoteId(next.id);
  };

  const addCategory = () => {
    const name = categoryDraft.trim();
    if (!name) {
      return;
    }
    const next = {
      id: `note-cat-${Date.now()}`,
      name,
      color: DEFAULT_COLORS[categories.length % DEFAULT_COLORS.length],
    };
    setCategories((prev) => [...prev, next]);
    setCategoryDraft("");
    setActiveCategory(next.id);
  };

  const removeCategory = (categoryId: string) => {
    const remaining = categories.filter((category) => category.id !== categoryId);
    if (!remaining.length) {
      return;
    }
    const nextActive = remaining[0].id;
    setCategories(remaining);
    setSubcategories((prev) => prev.filter((item) => item.categoryId !== categoryId));
    setNotes((prev) =>
      prev.map((note) =>
        note.categoryIds.includes(categoryId)
          ? {
              ...note,
              categoryIds: note.categoryIds.filter((id) => id !== categoryId).length
                ? note.categoryIds.filter((id) => id !== categoryId)
                : [nextActive],
              subcategoryIds: note.subcategoryIds.filter(
                (subId) =>
                  !subcategories.some((item) => item.id === subId && item.categoryId === categoryId)
              ),
            }
          : note
      )
    );
    setActiveCategory(nextActive);
  };

  const addSubcategory = () => {
    const name = subcategoryDraft.trim();
    if (!name || !activeCategory) {
      return;
    }
    const next = {
      id: `note-sub-${Date.now()}`,
      name,
      categoryId: activeCategory,
    };
    setSubcategories((prev) => [...prev, next]);
    setSubcategoryDraft("");
  };

  const removeSubcategory = (subcategoryId: string) => {
    setSubcategories((prev) => prev.filter((item) => item.id !== subcategoryId));
    setNotes((prev) =>
      prev.map((note) =>
        note.subcategoryIds.includes(subcategoryId)
          ? { ...note, subcategoryIds: note.subcategoryIds.filter((id) => id !== subcategoryId) }
          : note
      )
    );
  };

  const removeLink = (note: Note, linkId: string) => {
    updateNote({
      ...note,
      links: note.links.filter((link) => link.id !== linkId),
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

  const updateLink = (note: Note, linkId: string, key: "label" | "url", value: string) => {
    updateNote({
      ...note,
      links: note.links.map((link) =>
        link.id === linkId ? { ...link, [key]: value } : link
      ),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Notas
            </Typography>
            <SettingsIconButton onClick={() => setSettingsOpen(true)} />
          </Stack>
          <Button
            variant="outlined"
            startIcon={<AddRoundedIcon />}
            onClick={addNote}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Nova nota
          </Button>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "280px 1fr" },
            gap: 2.5,
          }}
        >
          <Stack spacing={2}>
            <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Categorias
                </Typography>
                <Stack spacing={1}>
                  {categories.map((category) => (
                    <Box
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      sx={(theme) => ({
                        p: 1,
                        borderRadius: "var(--radius-card)",
                        border: 1,
                        borderColor:
                          activeCategory === category.id ? "primary.main" : "divider",
                        backgroundColor: "background.paper",
                        cursor: "pointer",
                        ...interactiveCardSx(theme),
                      })}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              backgroundColor: category.color,
                            }}
                          />
                          <Typography variant="body2">{category.name}</Typography>
                        </Stack>
                        <Tooltip title="Remover categoria" placement="top">
                          <IconButton
                            size="small"
                            onClick={(event) => {
                              event.stopPropagation();
                              setConfirmRemove({ type: "category", id: category.id });
                            }}
                            aria-label="Remover categoria"
                          >
                            <CloseRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Nova categoria"
                    size="small"
                    fullWidth
                    value={categoryDraft}
                    onChange={(event) => setCategoryDraft(event.target.value)}
                  />
                  <IconButton onClick={addCategory} aria-label="Adicionar categoria">
                    <AddRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>

            <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Subcategorias
                </Typography>
                {activeSubcategories.length ? (
                  <Stack spacing={1}>
                    {activeSubcategories.map((subcategory) => (
                      <Stack
                        key={subcategory.id}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <Chip label={subcategory.name} size="small" />
                        <Tooltip title="Remover subcategoria" placement="top">
                          <IconButton
                            size="small"
                            onClick={() =>
                              setConfirmRemove({ type: "subcategory", id: subcategory.id })
                            }
                            aria-label="Remover subcategoria"
                          >
                            <CloseRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Sem subcategorias.
                  </Typography>
                )}
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Nova subcategoria"
                    size="small"
                    fullWidth
                    value={subcategoryDraft}
                    onChange={(event) => setSubcategoryDraft(event.target.value)}
                  />
                  <IconButton onClick={addSubcategory} aria-label="Adicionar subcategoria">
                    <AddRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          </Stack>

          <Stack spacing={2.5}>
            <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Notas
                </Typography>
                {filteredNotes.length ? (
                  <Stack spacing={1.5}>
                    {filteredNotes.map((note) => {
                      const noteCategories = categories.filter((cat) =>
                        note.categoryIds.includes(cat.id)
                      );
                      const noteSubcategories = subcategories.filter((sub) =>
                        note.subcategoryIds.includes(sub.id)
                      );
                      return (
                        <Paper
                          key={note.id}
                          elevation={0}
                          onClick={() => selectNote(note)}
                          sx={(theme) => ({
                            p: 1.5,
                            borderRadius: "var(--radius-card)",
                            border: 1,
                            borderColor:
                              selectedNoteId === note.id ? "primary.main" : "divider",
                            backgroundColor: "background.paper",
                            cursor: "pointer",
                            ...interactiveCardSx(theme),
                          })}
                        >
                          <Stack spacing={0.5}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {note.title}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              {fieldSettings.showCategories
                                ? noteCategories.map((category) => (
                                    <Chip
                                      key={category.id}
                                      label={category.name}
                                      size="small"
                                      sx={{
                                        color: "#e6edf3",
                                        backgroundColor: darkenColor(category.color, 0.5),
                                      }}
                                    />
                                  ))
                                : null}
                              {fieldSettings.showSubcategories
                                ? noteSubcategories.map((subcategory) => (
                                    <Chip
                                      key={subcategory.id}
                                      label={subcategory.name}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ))
                                : null}
                              {fieldSettings.showUpdatedAt ? (
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                  {new Date(note.updatedAt).toLocaleDateString("pt-BR")}
                                </Typography>
                              ) : null}
                            </Stack>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Sem notas nesta categoria.
                  </Typography>
                )}
              </Stack>
            </Paper>

            {selectedNote ? (
              <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      label="Titulo"
                      value={selectedNote.title}
                      onChange={(event) =>
                        updateNote({
                          ...selectedNote,
                          title: event.target.value,
                          updatedAt: new Date().toISOString(),
                        })
                      }
                      fullWidth
                      sx={{
                        "& .MuiInputBase-input": {
                          fontSize: "1.25rem",
                          fontWeight: 600,
                        },
                      }}
                    />
                    {fieldSettings.showCategories ? (
                      <Autocomplete
                        multiple
                        options={categories}
                        value={categories.filter((item) =>
                          selectedNote.categoryIds.includes(item.id)
                        )}
                        onChange={(_, value) => {
                          const nextIds = value.map((item) => item.id);
                          updateNote({
                            ...selectedNote,
                            categoryIds: nextIds,
                            updatedAt: new Date().toISOString(),
                          });
                          if (nextIds.length) {
                            setActiveCategory(nextIds[0]);
                          }
                        }}
                        getOptionLabel={(option) => option.name}
                        renderOption={(props, option, { selected }) => (
                          <li {...props}>
                            <Checkbox checked={selected} size="small" sx={{ mr: 1 }} />
                            {option.name}
                          </li>
                        )}
                        renderInput={(params) => (
                          <TextField {...params} label="Categorias" fullWidth />
                        )}
                        sx={{ minWidth: 240 }}
                      />
                    ) : null}
                    {fieldSettings.showSubcategories ? (
                      <Autocomplete
                        multiple
                        options={subcategories.filter((item) =>
                          selectedNote.categoryIds.includes(item.categoryId)
                        )}
                        value={subcategories.filter((item) =>
                          selectedNote.subcategoryIds.includes(item.id)
                        )}
                        onChange={(_, value) =>
                          updateNote({
                            ...selectedNote,
                            subcategoryIds: value.map((item) => item.id),
                            updatedAt: new Date().toISOString(),
                          })
                        }
                        getOptionLabel={(option) => option.name}
                        renderOption={(props, option, { selected }) => (
                          <li {...props}>
                            <Checkbox checked={selected} size="small" sx={{ mr: 1 }} />
                            {option.name}
                          </li>
                        )}
                        renderInput={(params) => (
                          <TextField {...params} label="Subcategorias" fullWidth />
                        )}
                        sx={{ minWidth: 240 }}
                      />
                    ) : null}
                  </Stack>

                  {fieldSettings.showLinks ? (
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Links
                      </Typography>
                      {selectedNote.links.map((link) => (
                        <Stack key={link.id} direction="row" spacing={1} alignItems="center">
                          <TextField
                            label="Titulo"
                            size="small"
                            value={link.label}
                            onChange={(event) =>
                              updateLink(selectedNote, link.id, "label", event.target.value)
                            }
                            fullWidth
                          />
                          <TextField
                            label="URL"
                            size="small"
                            value={link.url}
                            onChange={(event) =>
                              updateLink(selectedNote, link.id, "url", event.target.value)
                            }
                            fullWidth
                          />
                          <Tooltip title="Remover link" placement="top">
                            <IconButton onClick={() => removeLink(selectedNote, link.id)}>
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
                        sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 600 }}
                      >
                        Adicionar link
                      </Button>
                    </Stack>
                  ) : null}

                  <RichTextEditor
                    value={selectedNote.contentHtml}
                    onChange={(value) =>
                      updateNote({
                        ...selectedNote,
                        contentHtml: value,
                        updatedAt: new Date().toISOString(),
                      })
                    }
                  />
                </Stack>
              </Paper>
            ) : (
              <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Selecione uma nota para editar.
                </Typography>
              </Paper>
            )}
          </Stack>
        </Box>
      </Stack>
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="xs" fullWidth>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="h6">Configuracoes de notas</Typography>
            {[
              { key: "showCategories", label: "Mostrar categorias" },
              { key: "showSubcategories", label: "Mostrar subcategorias" },
              { key: "showLinks", label: "Mostrar links" },
              { key: "showUpdatedAt", label: "Mostrar ultima atualizacao" },
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
                  setFieldSettings((prev) => ({
                    ...prev,
                    [item.key]: !prev[item.key as keyof typeof fieldSettings],
                  }))
                }
              >
                <Typography variant="subtitle2">{item.label}</Typography>
                <ToggleCheckbox
                  checked={Boolean(fieldSettings[item.key as keyof typeof fieldSettings])}
                  onChange={(event) =>
                    setFieldSettings((prev) => ({
                      ...prev,
                      [item.key]: event.target.checked,
                    }))
                  }
                  onClick={(event) => event.stopPropagation()}
                />
              </Box>
            ))}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => setSettingsOpen(false)}>
                Fechar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={Boolean(confirmRemove)}
        title={
          confirmRemove?.type === "category"
            ? "Remover categoria"
            : "Remover subcategoria"
        }
        description={
          confirmRemove?.type === "category"
            ? "Voce confirma a remocao desta categoria? As notas serao movidas."
            : "Voce confirma a remocao desta subcategoria? Ela sera removida das notas."
        }
        onCancel={() => setConfirmRemove(null)}
        onConfirm={() => {
          if (!confirmRemove) {
            return;
          }
          if (confirmRemove.type === "category") {
            removeCategory(confirmRemove.id);
          } else {
            removeSubcategory(confirmRemove.id);
          }
          setConfirmRemove(null);
        }}
      />
    </Box>
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
          <Stack direction="row" spacing={2} justifyContent="flex-end">
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
}: {
  value: string;
  onChange: (nextValue: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Escreva sua nota...",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
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
        <Tooltip title="Citacao" placement="top">
          <IconButton
            {...iconButtonProps}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            color={editor?.isActive("blockquote") ? "primary" : "default"}
            aria-label="Citacao"
          >
            <FormatQuoteRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Limpar formatacao" placement="top">
          <IconButton
            {...iconButtonProps}
            onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
            aria-label="Limpar formatacao"
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
            minHeight: 200,
            outline: "none",
            padding: "16px",
          },
          "& .tiptap h1": { fontSize: "1.25rem", fontWeight: 700 },
          "& .tiptap h2": { fontSize: "1.1rem", fontWeight: 700 },
          "& .tiptap h3": { fontSize: "1rem", fontWeight: 700 },
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
