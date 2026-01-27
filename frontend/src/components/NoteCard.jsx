import { useState } from "react";
import { format } from "date-fns";
import {
    RiMore2Fill,
    RiEditLine,
    RiDeleteBinLine,
    RiTimeLine,
    RiPushpinLine,
    RiPushpin2Fill,
} from "react-icons/ri";

const NoteCard = ({ note, onDelete, onEdit, onPin }) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer group relative">
            {/* Header: Title & Menu */}
            <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-850 group-hover:text-primary transition-colors line-clamp-1 flex-1 pr-2">
                    {note.title}
                </h3>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onPin(note);
                        }}
                        className={`p-1 rounded transition-colors cursor-pointer ${
                            note.isPinned
                                ? "text-slate-600 hover:bg-slate-100"
                                : "text-slate-300 hover:text-slate-600 hover:bg-slate-100"
                        }`}
                        title={note.isPinned ? "Unpin Note" : "Pin Note"}>
                        {note.isPinned ? (
                            <RiPushpin2Fill className="text-xl" />
                        ) : (
                            <RiPushpinLine className="text-xl" />
                        )}
                    </button>

                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer">
                            <RiMore2Fill className="text-lg" />
                        </button>

                        {/* Dropdown Menu */}
                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowMenu(false)}></div>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-20">
                                    <button
                                        onClick={() => onEdit(note)}
                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 cursor-pointer">
                                        <RiEditLine /> Edit Note
                                    </button>
                                    <button
                                        onClick={() => onDelete(note._id)}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 cursor-pointer">
                                        <RiDeleteBinLine /> Delete Note
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Preview */}
            <p className="text-sm text-slate-600 line-clamp-3 mb-4 min-h-15 wrap-break-word">
                {
                    note.content
                        ?.replace(/<[^>]+>/g, " ") // Replace HTML tags with a space (prevents words merging)
                        .replace(/&nbsp;/g, " ") // Replace &nbsp; with a normal space
                        .replace(/\s+/g, " ") // Collapse multiple spaces into one
                        .trim() // Remove leading/trailing space
                }
            </p>

            {/* Footer: Date & Status */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <RiTimeLine className="text-[13px]" />
                    <span>
                        Updated{" "}
                        {format(new Date(note.updatedAt), "MMM d, yyyy")}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {note.tags?.slice(0, 2).map((tag, index) => (
                        <span
                            key={index}
                            className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-md font-medium">
                            {tag}
                        </span>
                    ))}
                    {/* Counter if there are more than 2 tags */}
                    {note.tags?.length > 2 && (
                        <span className="text-xs text-slate-400 font-medium">
                            +{note.tags.length - 2}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NoteCard;
