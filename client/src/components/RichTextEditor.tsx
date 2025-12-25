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

import { Plugin, PluginKey, NodeSelection } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { Node as ProseMirrorNode } from "prosemirror-model";

function extractDroppedImageSrc(dataTransfer: DataTransfer | null | undefined) {
  if (!dataTransfer) {
    return null;
  }

  const uri = dataTransfer.getData("text/uri-list") || dataTransfer.getData("text/plain");
  const candidate = (uri || "").trim();
  const looksLikeImageUrl = (value: string) =>
    /^data:image\//i.test(value) || /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(value);

  if (candidate && looksLikeImageUrl(candidate)) {
    return candidate;
  }

  const html = dataTransfer.getData("text/html");
  if (!html) {
    return null;
  }

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const img = doc.querySelector("img");
    const src = img?.getAttribute("src")?.trim() || "";
    if (src && looksLikeImageUrl(src)) {
      return src;
    }
  } catch {
    // ignore
  }

  return null;
}

const ImageWithWidth = Image.extend({
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
});

const imageResizePluginKey = new PluginKey("imageResizeOverlay");

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function createResizeHandle(side: "w" | "e") {
  const el = document.createElement("div");
  el.className = "pm-image-resize-handle";
  el.dataset.side = side;
  el.style.position = "absolute";
  el.style.top = "0";
  el.style.bottom = "0";
  el.style.width = "18px";
  el.style.cursor = "ew-resize";
  el.style.pointerEvents = "auto";
  el.style.borderRadius = `${APP_RADIUS}px`;
  el.style.border = "1px solid currentColor";
  el.style.background = "transparent";
  el.style.opacity = "0.65";
  el.style.touchAction = "none";
  if (side === "w") {
    el.style.left = "0";
  } else {
    el.style.right = "0";
  }
  return el;
}

const ImageResizeOverlay = Extension.create({
  name: "imageResizeOverlay",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: imageResizePluginKey,
        props: {
          handleClickOn: (
            view: EditorView,
            _pos: number,
            node: ProseMirrorNode,
            nodePos: number
          ) => {
            if (node.type.name !== "image") {
              return false;
            }
            view.dispatch(
              view.state.tr.setSelection(
                NodeSelection.create(view.state.doc, nodePos)
              )
            );
            return true;
          },
          handleDOMEvents: {
            mousedown: (view: EditorView, event: Event) => {
              const mouseEvent = event as MouseEvent;
              if (mouseEvent.button !== 0) {
                return false;
              }
              const target = mouseEvent.target as HTMLElement | null;
              const img = target?.closest?.("img") as HTMLImageElement | null;
              if (!img) {
                return false;
              }

              const { state } = view;
              let imagePos: number | null = null;
              try {
                imagePos = view.posAtDOM(img, 0);
              } catch {
                imagePos = null;
              }

              if (imagePos == null) {
                const coords = view.posAtCoords({
                  left: mouseEvent.clientX,
                  top: mouseEvent.clientY,
                });
                if (!coords) {
                  return false;
                }
                imagePos = coords.pos;
              }

              // Normalize to the actual image node position.
              // Depending on DOM mapping, posAtDOM/posAtCoords may land next to the node.
              const nodeAt = state.doc.nodeAt(imagePos);
              if (nodeAt?.type.name !== "image") {
                const before = state.doc.nodeAt(Math.max(0, imagePos - 1));
                const after = state.doc.nodeAt(imagePos + 1);
                if (before?.type.name === "image") {
                  imagePos = imagePos - 1;
                } else if (after?.type.name === "image") {
                  imagePos = imagePos + 1;
                }
              }

              if (state.doc.nodeAt(imagePos)?.type.name !== "image") {
                return false;
              }

              view.focus();
              view.dispatch(
                state.tr.setSelection(NodeSelection.create(state.doc, imagePos))
              );

              mouseEvent.preventDefault();
              mouseEvent.stopPropagation();
              return true;
            },
            dragstart: (_view: EditorView, event: Event) => {
              const dragEvent = event as DragEvent;
              const target = dragEvent.target as HTMLElement | null;
              const img = target?.closest?.("img") as HTMLImageElement | null;
              if (!img) {
                return false;
              }
              // Prevent native image dragging from breaking selection/resize UX.
              dragEvent.preventDefault();
              return true;
            },
          },
        },
        view: (view: EditorView) => {
          const viewDom = view.dom as unknown as HTMLElement;
          const container =
            (viewDom.closest?.(".tiptap") as HTMLElement | null) || viewDom;
          if (!container) {
            return { update: () => {}, destroy: () => {} };
          }

          // Ensure our overlay is positioned relative to the same element
          // that scrolls and defines the editor coordinate space.
          if (getComputedStyle(container).position === "static") {
            container.style.position = "relative";
          }

          const overlay = document.createElement("div");
          overlay.className = "pm-image-resize-overlay";
          overlay.style.position = "absolute";
          overlay.style.pointerEvents = "none";
          overlay.style.zIndex = "10";
          overlay.style.display = "none";
          overlay.style.color = "inherit";

          const leftHandle = createResizeHandle("w");
          const rightHandle = createResizeHandle("e");
          overlay.appendChild(leftHandle);
          overlay.appendChild(rightHandle);

          container.appendChild(overlay);

          let active:
            | {
                pointerId: number;
                side: "w" | "e";
                startX: number;
                startWidth: number;
                maxWidth: number;
                minWidth: number;
                pos: number;
                img: HTMLImageElement;
              }
            | null = null;

          const updateOverlay = () => {
            const sel = view.state.selection;
            if (!(sel instanceof NodeSelection) || sel.node.type.name !== "image") {
              overlay.style.display = "none";
              return;
            }

            const pos = sel.from;
            const dom = view.nodeDOM(pos);
            const img =
              dom instanceof HTMLImageElement
                ? dom
                : (dom && (dom as HTMLElement).querySelector?.("img")) || null;
            if (!(img instanceof HTMLImageElement)) {
              overlay.style.display = "none";
              return;
            }

            const imgRect = img.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const left = imgRect.left - containerRect.left + container.scrollLeft;
            const top = imgRect.top - containerRect.top + container.scrollTop;

            overlay.style.display = "block";
            overlay.style.left = `${Math.round(left)}px`;
            overlay.style.top = `${Math.round(top)}px`;
            overlay.style.width = `${Math.round(imgRect.width)}px`;
            overlay.style.height = `${Math.round(imgRect.height)}px`;
          };

          const stop = () => {
            active = null;
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
          };

          const onMove = (event: PointerEvent) => {
            if (!active || event.pointerId !== active.pointerId) {
              return;
            }
            const delta = event.clientX - active.startX;
            const signedDelta = active.side === "e" ? delta : -delta;
            const nextWidth = clampNumber(
              active.startWidth + signedDelta,
              active.minWidth,
              active.maxWidth
            );
            active.img.style.width = `${Math.round(nextWidth)}px`;
            updateOverlay();
          };

          const onUp = (event: PointerEvent) => {
            if (!active || event.pointerId !== active.pointerId) {
              return;
            }
            const widthPx = Number.parseInt(active.img.style.width || "", 10);
            const finalWidth =
              Number.isFinite(widthPx) && widthPx > 0
                ? widthPx
                : Math.round(active.startWidth);

            const { state, dispatch } = view;
            const nodeAt = state.doc.nodeAt(active.pos);
            if (nodeAt && nodeAt.type.name === "image") {
              dispatch(
                state.tr.setNodeMarkup(active.pos, undefined, {
                  ...nodeAt.attrs,
                  width: String(finalWidth),
                })
              );
            }
            stop();
            updateOverlay();
          };

          const start = (event: PointerEvent, side: "w" | "e") => {
            const sel = view.state.selection;
            if (!(sel instanceof NodeSelection) || sel.node.type.name !== "image") {
              return;
            }

            const pos = sel.from;
            const dom = view.nodeDOM(pos);
            const img =
              dom instanceof HTMLImageElement
                ? dom
                : (dom && (dom as HTMLElement).querySelector?.("img")) || null;
            if (!(img instanceof HTMLImageElement)) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();
            view.focus();

            const rect = img.getBoundingClientRect();
            const minWidth = 96;
            const maxWidth = Math.max(minWidth, container.clientWidth);
            img.style.width = `${Math.round(rect.width)}px`;

            active = {
              pointerId: event.pointerId,
              side,
              startX: event.clientX,
              startWidth: rect.width,
              maxWidth,
              minWidth,
              pos,
              img,
            };

            try {
              (event.target as HTMLElement | null)?.setPointerCapture?.(
                event.pointerId
              );
            } catch {
              // ignore
            }

            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
            window.addEventListener("pointercancel", onUp);
          };

          leftHandle.addEventListener("pointerdown", event => start(event, "w"));
          rightHandle.addEventListener("pointerdown", event => start(event, "e"));

          const onScroll = () => updateOverlay();
          const onResize = () => updateOverlay();
          container.addEventListener("scroll", onScroll);
          window.addEventListener("resize", onResize);

          updateOverlay();

          return {
            update: () => updateOverlay(),
            destroy: () => {
              stop();
              container.removeEventListener("scroll", onScroll);
              window.removeEventListener("resize", onResize);
              overlay.remove();
            },
          };
        },
      }),
    ];
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
      ImageWithWidth,
      ImageResizeOverlay,
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
      handleDrop: (view, event, _slice, moved) => {
        if (moved) {
          return false;
        }
        const files = Array.from(event.dataTransfer?.files || []);

        const coords = {
          left: event.clientX,
          top: event.clientY,
        };
        const posAt = view.posAtCoords(coords)?.pos;
        if (typeof posAt === "number") {
          editor?.commands.setTextSelection(posAt);
        }

        if (files.length) {
          event.preventDefault();

          void (async () => {
            for (const file of files) {
              try {
                const dataUrl = await fileToDataUrl(file);
                if (file.type.startsWith("image/")) {
                  editor?.chain().focus().setImage({ src: dataUrl }).run();
                  continue;
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
              } catch {
                // ignore
              }
            }
          })();

          return true;
        }

        const droppedImageSrc = extractDroppedImageSrc(event.dataTransfer);
        if (droppedImageSrc) {
          event.preventDefault();
          editor?.chain().focus().setImage({ src: droppedImageSrc }).run();
          return true;
        }

        return false;
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
            position: "relative",
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
          "& .tiptap .pm-image-resize-overlay": {
            borderRadius: APP_RADIUS,
          },
          "& .tiptap .pm-image-resize-handle": {
            backgroundColor: theme.palette.action.hover,
            borderColor: theme.palette.divider,
          },
          "& .tiptap .pm-image-resize-handle[data-side='w']": {
            borderRightWidth: 1,
            borderRightStyle: "solid",
          },
          "& .tiptap .pm-image-resize-handle[data-side='e']": {
            borderLeftWidth: 1,
            borderLeftStyle: "solid",
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
        <EditorContent editor={editor} className="tiptap" />
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
