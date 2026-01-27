import { useEffect, useState } from "react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import toast from "react-hot-toast";
import {
    RiArrowLeftLine,
    RiSaveLine,
    RiBold,
    RiItalic,
    RiUnderline,
    RiStrikethrough,
    RiMarkPenLine,
    RiListUnordered,
    RiListOrdered,
    RiDoubleQuotesL,
    RiCodeBoxLine,
    RiCloseLine,
    RiPriceTag3Line,
    RiH1,
    RiH2,
    RiH3,
    RiAlignLeft,
    RiAlignCenter,
    RiAlignRight,
    RiAlignJustify,
    RiLink,
    RiLinkUnlink,
    RiCheckLine,
    RiArrowGoBackLine,
    RiArrowGoForwardLine,
} from "react-icons/ri";

const MenuButton = ({ onClick, isActive, disabled, children, label }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={label}
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer duration-200 ${
            disabled
                ? "opacity-50 cursor-not-allowed text-slate-400"
                : isActive
                  ? "bg-slate-200 text-primary" // Active State
                  : "text-slate-600 hover:bg-slate-100" // Inactive State
        }`}>
        {children}
    </button>
);

const LinkInput = ({ editor, isOpen, onClose }) => {
    const [url, setUrl] = useState("");

    if (!isOpen) return null;

    const setLink = () => {
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
        } else {
            editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: url })
                .run();
        }
        setUrl("");
        onClose();
    };

    return (
        <div className="absolute top-full mt-2 left-0 z-50 bg-white border border-slate-200 shadow-xl rounded-lg p-2 flex items-center gap-2 w-64 animate-in fade-in zoom-in-95 duration-200">
            <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste link..."
                className="flex-1 text-sm border border-slate-200 rounded px-2 py-1 outline-none focus:border-slate-400"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && setLink()}
            />
            <button
                onClick={setLink}
                className="p-1 bg-slate-900 text-white rounded hover:bg-slate-700">
                <RiCheckLine />
            </button>
            <button
                onClick={onClose}
                className="p-1 text-slate-500 hover:bg-slate-100 rounded">
                <RiCloseLine />
            </button>
        </div>
    );
};

const NoteModal = ({ isOpen, onClose, note, refreshNotes }) => {
    const [title, setTitle] = useState("");
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showLinkInput, setShowLinkInput] = useState(false);

    // Initialize Editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            Highlight.configure({ multicolor: true }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-blue-500 hover:underline cursor-pointer",
                },
            }),
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Placeholder.configure({
                placeholder: "Start writing your note...",
            }),
        ],
        content: "",
        editorProps: {
            attributes: {
                class: "prose prose-sm sm:prose focus:outline-none min-h-[300px] text-slate-700 leading-relaxed max-w-none",
            },
        },
    });

    const editorState = useEditorState({
        editor,
        selector: (ctx) => {
            // Get current text
            const text = ctx.editor.getText();

            // Calculate stats
            const words =
                text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
            const chars = text.length;
            return {
                isBold: ctx.editor.isActive("bold") ?? false,
                isItalic: ctx.editor.isActive("italic") ?? false,
                isUnderline: ctx.editor.isActive("underline") ?? false,
                isStrike: ctx.editor.isActive("strike") ?? false,
                isHighlight: ctx.editor.isActive("highlight") ?? false,
                isH1: ctx.editor.isActive("heading", { level: 1 }) ?? false,
                isH2: ctx.editor.isActive("heading", { level: 2 }) ?? false,
                isH3: ctx.editor.isActive("heading", { level: 3 }) ?? false,
                isBulletList: ctx.editor.isActive("bulletList") ?? false,
                isOrderedList: ctx.editor.isActive("orderedList") ?? false,
                textAlign: ctx.editor.isActive({ textAlign: "center" })
                    ? "center"
                    : ctx.editor.isActive({ textAlign: "right" })
                      ? "right"
                      : ctx.editor.isActive({ textAlign: "justify" })
                        ? "justify"
                        : "left",
                isBlockquote: ctx.editor.isActive("blockquote") ?? false,
                isCodeBlock: ctx.editor.isActive("codeBlock") ?? false,
                isLink: ctx.editor.isActive("link") ?? false,
                canRedo: editor.can().redo(),
                canUndo: editor.can().undo(),

                wordCount: words,
                charCount: chars,
            };
        },
    });

    // Reset State when Modal Opens
    useEffect(() => {
        if (isOpen && editor) {
            if (note) {
                // Edit Mode
                setTitle(note.title);
                editor.commands.setContent(note.content);
                setTags(note.tags || []);
            } else {
                // Create Mode
                setTitle("");
                editor.commands.setContent("");
                setTags([]);
            }
            setTagInput("");
        }
    }, [isOpen, note, editor]);

    // Handle Tags
    const handleAddTag = (e) => {
        if (e.key === "Enter" && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    // Handle Save
    const handleSave = async () => {
        const contentHtml = editor.getHTML();

        // Simple validation (check if empty text)
        if (!title.trim() || editor.isEmpty) {
            toast.error("Title and Content are required");
            return;
        }

        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem("userInfo"));
            const token = user?.token;

            const method = note ? "PUT" : "POST";
            const url = note ? `/api/notes/${note._id}` : "/api/notes";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    content: contentHtml,
                    tags,
                    category: "General",
                }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(note ? "Note Updated" : "Note Created");
                refreshNotes();
                onClose();
            } else {
                toast.error(data.message || "Something went wrong");
            }
        } catch (error) {
            toast.error("Server Error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto">
            {/* Navbar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-600 hover:text-slate-850 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                                <RiArrowLeftLine className="text-xl" />
                            </button>
                            <h2 className="text-sm font-medium text-slate-850">
                                {note ? "Edit Note" : "Create Note"}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 whitespace-nowrap cursor-pointer">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap cursor-pointer">
                                <RiSaveLine />
                                {loading ? "Saving..." : "Save Note"}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[80vh] flex flex-col">
                    <div className="p-8 flex-1 flex flex-col">
                        <input
                            placeholder="Note Title"
                            className="w-full text-3xl font-bold text-slate-850 placeholder-slate-300 border-none outline-none mb-4 bg-transparent"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />

                        {/* Tag Input */}
                        <div className="flex items-center gap-2 mb-6 flex-wrap">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-1 text-sm text-slate-600">
                                <RiPriceTag3Line />
                                <input
                                    value={tagInput}
                                    onChange={(e) =>
                                        setTagInput(e.target.value)
                                    }
                                    onKeyDown={handleAddTag}
                                    placeholder="Add tag + Enter"
                                    className="bg-transparent border-none outline-none w-25 placeholder-slate-400"
                                />
                            </div>
                            {tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 border border-blue-100">
                                    #{tag}
                                    <button
                                        onClick={() => removeTag(tag)}
                                        className="hover:text-blue-800">
                                        <RiCloseLine />
                                    </button>
                                </span>
                            ))}
                        </div>

                        {/* --- TOOLBAR --- */}
                        {editor && (
                            <div className="sticky top-16 bg-slate-50 border-t border-b border-slate-200 -mx-8 px-8 py-3 mb-6 z-10 flex flex-wrap gap-2 items-center">
                                {/* ----- Formatting ----- */}
                                {/* Bold */}
                                <MenuButton
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleBold()
                                            .run()
                                    }
                                    isActive={editorState.isBold}
                                    label="Bold">
                                    <RiBold className="text-lg" />
                                </MenuButton>

                                {/* Italic */}
                                <MenuButton
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleItalic()
                                            .run()
                                    }
                                    isActive={editorState.isItalic}
                                    label="Italic">
                                    <RiItalic className="text-lg" />
                                </MenuButton>

                                {/* Underline */}
                                <MenuButton
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleUnderline()
                                            .run()
                                    }
                                    isActive={editorState.isUnderline}
                                    label="Underline">
                                    <RiUnderline className="text-lg" />
                                </MenuButton>

                                {/* Strikethrough */}
                                <MenuButton
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleStrike()
                                            .run()
                                    }
                                    isActive={editorState.isStrike}
                                    label="Strike">
                                    <RiStrikethrough className="text-lg" />
                                </MenuButton>

                                {/* Highlight */}
                                <MenuButton
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleHighlight({
                                                color: "#fdeb80",
                                            })
                                            .run()
                                    }
                                    isActive={editorState.isHighlight}
                                    label="Highlight">
                                    <RiMarkPenLine className="text-lg" />
                                </MenuButton>

                                <div className="w-px h-6 bg-slate-300 mx-1"></div>

                                {/* ----- Headings ----- */}
                                {/* Heading 1 */}
                                <MenuButton
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleHeading({ level: 1 })
                                            .run()
                                    }
                                    isActive={editorState.isH1}
                                    label="Heading 1">
                                    <RiH1 className="text-lg" />
                                </MenuButton>

                                {/* Heading 2 */}
                                <MenuButton
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleHeading({ level: 2 })
                                            .run()
                                    }
                                    isActive={editorState.isH2}
                                    label="Heading 2">
                                    <RiH2 className="text-lg" f />
                                </MenuButton>

                                {/* Heading 3 */}
                                <MenuButton
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleHeading({ level: 3 })
                                            .run()
                                    }
                                    isActive={editorState.isH3}
                                    label="Heading 3">
                                    <RiH3 className="text-lg" />
                                </MenuButton>

                                <div className="w-px h-6 bg-slate-300 mx-1"></div>

                                {/* Lists */}
                                {/* Unordered List */}
                                <MenuButton
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleBulletList()
                                            .run()
                                    }
                                    isActive={editorState.isBulletList}
                                    label="Bullet List">
                                    <RiListUnordered className="text-lg" />
                                </MenuButton>

                                {/* Ordered List */}
                                <MenuButton
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleOrderedList()
                                            .run()
                                    }
                                    isActive={editorState.isOrderedList}
                                    label="Ordered List">
                                    <RiListOrdered className="text-lg" />
                                </MenuButton>

                                <div className="w-px h-6 bg-slate-300 mx-1"></div>

                                {/* Alignment */}
                                {/* Left */}
                                <MenuButton
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .setTextAlign("left")
                                            .run()
                                    }
                                    isActive={editorState.textAlign === "left"}
                                    label="Left">
                                    <RiAlignLeft className="text-lg" />
                                </MenuButton>

                                {/* Center */}
                                <MenuButton
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .setTextAlign("center")
                                            .run()
                                    }
                                    isActive={
                                        editorState.textAlign === "center"
                                    }
                                    label="Center">
                                    <RiAlignCenter className="text-lg" />
                                </MenuButton>

                                {/* Right */}
                                <MenuButton
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .setTextAlign("right")
                                            .run()
                                    }
                                    isActive={editorState.textAlign === "right"}
                                    label="Right">
                                    <RiAlignRight className="text-lg" />
                                </MenuButton>

                                {/* Justify */}
                                <MenuButton
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .setTextAlign("justify")
                                            .run()
                                    }
                                    isActive={
                                        editorState.textAlign === "justify"
                                    }
                                    label="Justify">
                                    <RiAlignJustify className="text-lg" />
                                </MenuButton>

                                <div className="w-px h-6 bg-slate-300 mx-1"></div>

                                {/* Blockquote */}
                                <MenuButton
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleBlockquote()
                                            .run()
                                    }
                                    isActive={editorState.isBlockquote}
                                    label="Blockquote">
                                    <RiDoubleQuotesL className="text-lg" />
                                </MenuButton>

                                {/* CodeBox */}
                                <MenuButton
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleCodeBlock()
                                            .run()
                                    }
                                    isActive={editorState.isCodeBlock}
                                    label="Code">
                                    <RiCodeBoxLine className="text-lg" />
                                </MenuButton>

                                {/* Link */}
                                <div className="relative">
                                    <MenuButton
                                        onClick={() => {
                                            if (editorState.isLink) {
                                                editor
                                                    .chain()
                                                    .focus()
                                                    .unsetLink()
                                                    .run();
                                            } else {
                                                setShowLinkInput(
                                                    !showLinkInput,
                                                );
                                            }
                                        }}
                                        isActive={
                                            editorState.isLink || showLinkInput
                                        }
                                        label="Link">
                                        {editorState.isLink ? (
                                            <RiLinkUnlink className="text-lg" />
                                        ) : (
                                            <RiLink className="text-lg" />
                                        )}
                                    </MenuButton>

                                    {/* The Custom Popover */}
                                    <LinkInput
                                        editor={editor}
                                        isOpen={showLinkInput}
                                        onClose={() => setShowLinkInput(false)}
                                    />
                                </div>

                                <div className="w-px h-6 bg-slate-300 mx-1"></div>

                                {/* Undo */}
                                <MenuButton
                                    onClick={() =>
                                        editor.chain().focus().undo().run()
                                    }
                                    disabled={!editor.can().undo()} // Disable if nothing to undo
                                    label="Undo">
                                    <RiArrowGoBackLine className="text-lg" />
                                </MenuButton>

                                {/* Redo */}
                                <MenuButton
                                    onClick={() =>
                                        editor.chain().focus().redo().run()
                                    }
                                    disabled={!editor.can().redo()} // Disable if nothing to redo
                                    label="Redo">
                                    <RiArrowGoForwardLine className="text-lg" />
                                </MenuButton>
                            </div>
                        )}

                        {/* --- EDITOR AREA --- */}
                        <EditorContent editor={editor} className="flex-1" />
                    </div>

                    {/* Footer Stats */}
                    <div className="bg-slate-50 px-8 py-3 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
                        <div className="flex items-center gap-4">
                            <span>
                                {editorState?.charCount || 0} characters
                            </span>
                            <span>•</span>
                            <span>{editorState?.wordCount || 0} words</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span> {note ? "Edited mode" : "Draft"} </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default NoteModal;
