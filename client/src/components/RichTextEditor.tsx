import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  ClickAwayListener,
  Dialog,
  DialogContent,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  EditorContent,
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type NodeViewProps,
  useEditor,
} from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Suggestion from "@tiptap/suggestion";

import BackspaceRoundedIcon from "@mui/icons-material/BackspaceRounded";
import FormatBoldRoundedIcon from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRoundedIcon from "@mui/icons-material/FormatItalicRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import FormatUnderlinedRoundedIcon from "@mui/icons-material/FormatUnderlinedRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import Looks3RoundedIcon from "@mui/icons-material/Looks3Rounded";
import LooksOneRoundedIcon from "@mui/icons-material/LooksOneRounded";
import LooksTwoRoundedIcon from "@mui/icons-material/LooksTwoRounded";

import { APP_RADIUS } from "../designTokens";
import AppCard from "./layout/AppCard";

function ResizableImageNodeView({ node, selected, updateAttributes }: NodeViewProps) {
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<
    | {
        startX: number;
        startWidth: number;
        containerWidth: number;
        dir: "e" | "w";
        pointerId: number;
      }
    | null
  >(null);

  const startResize = (event: React.PointerEvent, dir: "e" | "w") => {
    event.preventDefault();
    event.stopPropagation();

    const img = imgRef.current;
    const wrapper = wrapperRef.current;
    if (!img || !wrapper) {
      return;
    }

    const rect = img.getBoundingClientRect();
    const parentRect = wrapper.parentElement?.getBoundingClientRect();

    dragRef.current = {
      startX: event.clientX,
      startWidth: rect.width,
      containerWidth: parentRect?.width || rect.width,
      dir,
      pointerId: event.pointerId,
    };

    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const onResizeMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const delta = event.clientX - drag.startX;
    const signedDelta = drag.dir === "e" ? delta : -delta;
    const minWidth = 96;
    const maxWidth = Math.max(minWidth, drag.containerWidth);
    const nextWidth = Math.max(
      minWidth,
      Math.min(maxWidth, drag.startWidth + signedDelta)
    );

    updateAttributes({ width: String(Math.round(nextWidth)) });
  };

  const endResize = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    dragRef.current = null;
  };

  const handleSx = {
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    width: 14,
    cursor: "ew-resize",
    zIndex: 2,
    borderRadius: APP_RADIUS,
    backgroundColor: "transparent",
    touchAction: "none" as const,
  };

  return (
    <NodeViewWrapper
      as="span"
      ref={wrapperRef}
      style={{
        display: "inline-block",
        position: "relative",
        maxWidth: "100%",
        borderRadius: APP_RADIUS,
        overflow: "hidden",
      }}
    >
      <img
        ref={imgRef}
        src={String((node.attrs as any).src || "")}
        alt={String((node.attrs as any).alt || "")}
        title={String((node.attrs as any).title || "")}
        className={selected ? "ProseMirror-selectednode" : undefined}
        width={
          typeof (node.attrs as any).width === "string" && (node.attrs as any).width
            ? (node.attrs as any).width
            : undefined
        }
        style={{
          display: "block",
          maxWidth: "100%",
          height: "auto",
          borderRadius: APP_RADIUS,
          touchAction: "none",
        }}
        draggable={false}
      />

      {selected ? (
        <>
          <Box
            onPointerDown={event => startResize(event, "w")}
            onPointerMove={onResizeMove}
            onPointerUp={endResize}
            onPointerCancel={endResize}
            sx={{
              ...handleSx,
              left: 0,
            }}
          />
          <Box
            onPointerDown={event => startResize(event, "e")}
            onPointerMove={onResizeMove}
            onPointerUp={endResize}
            onPointerCancel={endResize}
            sx={{
              ...handleSx,
              right: 0,
            }}
          />
        </>
      ) : null}
    </NodeViewWrapper>
  );
}

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...(this.parent?.() || {}),
      width: {
        default: null,
        parseHTML: element => {
          const raw =
            element.getAttribute("width") ||
            (element as HTMLElement).style?.width ||
            null;
          if (!raw) {
            return null;
          }
          const numeric = String(raw).replace("px", "").trim();
          const value = Number(numeric);
          if (!Number.isFinite(value) || value <= 0) {
            return null;
          }
          return String(Math.round(value));
        },
        renderHTML: attributes => {
          if (!attributes.width) {
            return {};
          }
          return { width: attributes.width };
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNodeView);
  },
});

type EmojiPickerOpts = {
  mode?: "note" | "editor";
  onPick?: (emoji: string) => void;
};

type ChildPage = {
  id: string;
  title?: string;
  emoji?: string;
};

type SlashItem = {
  id: string;
  label: string;
  keywords: string;
  run: (opts: { editor: any }) => void;
};

export type RichTextEditorProps = {
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  autoFocus?: boolean;

  onNavigate?: (href: string) => void;
  onCreateChildPage?: () => ChildPage;
  noteEmoji?: string;
  onOpenEmojiPicker?: (anchor: HTMLElement | DOMRect, opts?: EmojiPickerOpts) => void;
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  autoFocus,
  onNavigate,
  onCreateChildPage,
  noteEmoji,
  onOpenEmojiPicker,
}: RichTextEditorProps) {
  const supportsSlashCommands =
    Boolean(onNavigate) && Boolean(onCreateChildPage) && Boolean(onOpenEmojiPicker);

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

  const [, setToolbarRenderTick] = useState(0);

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
      ResizableImage,
      Placeholder.configure({
        placeholder: placeholder || "Escreva...",
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      ...(supportsSlashCommands
        ? [
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
                        onOpenEmojiPicker?.(anchor, {
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
                      run: ({ editor }) => editor.chain().focus().toggleItalic().run(),
                    },
                    {
                      id: "underline",
                      label: "Sublinhado",
                      keywords: "sublinhado underline",
                      run: ({ editor }) => editor.chain().focus().toggleUnderline().run(),
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
                        const child = onCreateChildPage?.();
                        if (!child?.id) {
                          return;
                        }
                        const href = `/notas/${child.id}`;
                        const label = `${child.emoji || ""} ${child.title || "Página"}`.trim();
                        const safeLabel = escapeHtml(label);
                        editor
                          .chain()
                          .focus()
                          .insertContent(`<a href="${href}">${safeLabel}</a>&nbsp;`)
                          .run();
                        onNavigate?.(href);
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
                            const item =
                              slashItemsRef.current?.[slashIndexRef.current];
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
          ]
        : []),
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
        const files = Array.from(event.dataTransfer?.files || []);
        if (!files.length) {
          return false;
        }

        files.forEach(file => {
          void fileToDataUrl(file)
            .then(dataUrl => {
              if (file.type.startsWith("image/")) {
                editor?.chain().focus().setImage({ src: dataUrl }).run();
                return;
              }
              const safeHref = escapeHtml(dataUrl);
              const safeName = escapeHtml(file.name || "arquivo");
              const safeDownload = escapeHtml(file.name || "arquivo");
              editor
                ?.chain()
                .focus()
                .insertContent(
                  `<a href="${safeHref}" download="${safeDownload}">${safeName}</a>&nbsp;`
                )
                .run();
            })
            .catch(() => {
              // ignore
            });
        });

        return true;
      },
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const fileItems = items.filter(item => item.kind === "file");
        if (!fileItems.length) {
          return false;
        }

        fileItems.forEach(item => {
          const file = item.getAsFile();
          if (!file) {
            return;
          }
          void fileToDataUrl(file)
            .then(dataUrl => {
              if (file.type.startsWith("image/")) {
                editor?.chain().focus().setImage({ src: dataUrl }).run();
                return;
              }
              const safeHref = escapeHtml(dataUrl);
              const safeName = escapeHtml(file.name || "arquivo");
              const safeDownload = escapeHtml(file.name || "arquivo");
              editor
                ?.chain()
                .focus()
                .insertContent(
                  `<a href="${safeHref}" download="${safeDownload}">${safeName}</a>&nbsp;`
                )
                .run();
            })
            .catch(() => {
              // ignore
            });
        });

        return true;
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const rerenderToolbar = () => {
      setToolbarRenderTick(tick => (tick + 1) % 1_000_000);
    };

    editor.on("selectionUpdate", rerenderToolbar);
    editor.on("transaction", rerenderToolbar);
    editor.on("focus", rerenderToolbar);
    editor.on("blur", rerenderToolbar);

    return () => {
      editor.off("selectionUpdate", rerenderToolbar);
      editor.off("transaction", rerenderToolbar);
      editor.off("focus", rerenderToolbar);
      editor.off("blur", rerenderToolbar);
    };
  }, [editor]);

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

  useEffect(() => {
    if (!editor) {
      return;
    }
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

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

    if (href.startsWith("/notas/") && onNavigate) {
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

  const shouldInterceptLinks = Boolean(onNavigate);

  return (
    <Stack spacing={1} sx={{ flex: 1, minHeight: 0 }}>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        {noteEmoji && onOpenEmojiPicker ? (
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
        ) : null}

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
          onClick={openLinkDialogFromSelection}
          color={editor?.isActive("link") ? "primary" : "default"}
          aria-label="Link"
        >
          <LinkRoundedIcon fontSize="small" />
        </IconButton>
        <IconButton
          {...iconButtonProps}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          color={
            editor?.isActive("heading", { level: 1 }) ? "primary" : "default"
          }
          aria-label="Titulo 1"
        >
          <LooksOneRoundedIcon fontSize="small" />
        </IconButton>
        <IconButton
          {...iconButtonProps}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          color={
            editor?.isActive("heading", { level: 2 }) ? "primary" : "default"
          }
          aria-label="Titulo 2"
        >
          <LooksTwoRoundedIcon fontSize="small" />
        </IconButton>
        <IconButton
          {...iconButtonProps}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          color={
            editor?.isActive("heading", { level: 3 }) ? "primary" : "default"
          }
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
          "& .tiptap strong, & .tiptap b": {
            fontWeight: "700 !important",
          },
          "& .tiptap u": { textDecoration: "underline !important" },
          "& .tiptap a": {
            color: theme.palette.primary.main,
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
          "& .tiptap img": {
            maxWidth: "100%",
            borderRadius: APP_RADIUS,
          },
          "& .tiptap img.ProseMirror-selectednode": {
            outline: "2px solid",
            outlineColor: "primary.main",
            boxShadow: `0 0 0 4px ${theme.palette.primary.main}33`,
          },
          "& .tiptap p.is-editor-empty:first-of-type::before": {
            content: "attr(data-placeholder)",
            color: theme.palette.text.disabled,
            float: "left",
            height: 0,
            pointerEvents: "none",
          },
        })}
        onMouseDownCapture={event => {
          if (!shouldInterceptLinks) {
            return;
          }
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

          if (href.startsWith("/notas/") && onNavigate) {
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
          if (!shouldInterceptLinks) {
            return;
          }
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
                  if (href.startsWith("/notas/") && onNavigate) {
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

      <Dialog open={linkDialogOpen} onClose={closeLinkDialog} maxWidth="sm" fullWidth>
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
