import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { RiAddLine, RiSortDesc } from "react-icons/ri";

import Navbar from "../components/Navbar";
import NoteCard from "../components/NoteCard";
import DeleteModal from "../components/DeleteModal";
import NoteModal from "../components/NoteModal";

const Home = () => {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState(null);
    const [notes, setNotes] = useState([]);
    const [filteredNotes, setFilteredNotes] = useState([]);
    const [sortType, setSortType] = useState("updated"); // 'updated' or 'created'
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        noteId: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const [openEditor, setOpenEditor] = useState({
        isOpen: false,
        note: null, // null = create, object = edit
    });

    // 1. Check Auth & Load User
    useEffect(() => {
        const user = localStorage.getItem("userInfo");
        if (!user) {
            navigate("/login");
        } else {
            setUserInfo(JSON.parse(user));
            fetchNotes(); // Load notes once user is confirmed
        }
    }, [navigate]);

    // 2. Sort Notes
    const sortNotes = (notesList, type) => {
        return [...notesList].sort((a, b) => {
            // Priority 1: Pinned notes always on top
            if (a.isPinned !== b.isPinned) {
                return a.isPinned ? -1 : 1;
            }

            // Priority 2: Sort based on selected type
            const dateA =
                type === "created"
                    ? new Date(a.createdAt)
                    : new Date(a.updatedAt);
            const dateB =
                type === "created"
                    ? new Date(b.createdAt)
                    : new Date(b.updatedAt);

            // Descending order (Newest first)
            return dateB - dateA;
        });
    };

    // 3. Fetch Notes from API
    const fetchNotes = async () => {
        try {
            // Get token directly from local storage to ensure it's available immediately
            const user = JSON.parse(localStorage.getItem("userInfo"));
            const token = user ? user.token : null;

            if (!token) return; // Stop if no token

            const res = await fetch("/api/notes", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (res.ok) {
                // Success! Even if data is [] (empty array), res.ok is true
                const sortedData = sortNotes(data, sortType);
                setNotes(sortedData);
                setFilteredNotes(sortedData);
            } else {
                toast.error(data.message || "Failed to fetch notes");
            }
        } catch (error) {
            console.error(error);
            toast.error("Server error");
        } finally {
            setLoading(false);
        }
    };

    // 4. Search Logic
    const handleSearch = (query) => {
        if (!query) {
            setFilteredNotes(sortNotes(notes, sortType));
        } else {
            const filtered = notes.filter(
                (note) =>
                    note.title.toLowerCase().includes(query.toLowerCase()) ||
                    note.content.toLowerCase().includes(query.toLowerCase()),
            );
            setFilteredNotes(sortNotes(filtered, sortType));
        }
    };

    // Handle Sort Change
    const handleSort = (e) => {
        const type = e.target.value;
        setSortType(type);

        // Re-sort current view
        setNotes(sortNotes(notes, type));
        setFilteredNotes(sortNotes(filteredNotes, type));
    };

    // 5. Delete Logic
    const openDeleteModal = (noteId) => {
        setDeleteModal({ isOpen: true, noteId });
    };

    const confirmDelete = async () => {
        const noteId = deleteModal.noteId;
        if (!noteId) return;

        setIsDeleting(true);
        try {
            const user = JSON.parse(localStorage.getItem("userInfo")); // Get token

            const res = await fetch(`/api/notes/${noteId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });

            if (res.ok) {
                toast.success("Note deleted");
                setNotes((prev) => prev.filter((n) => n._id !== noteId));
                setFilteredNotes((prev) =>
                    prev.filter((n) => n._id !== noteId),
                );
                setDeleteModal({ isOpen: false, noteId: null }); // Close modal
            } else {
                toast.error("Failed to delete");
            }
        } catch (error) {
            toast.error("Delete failed");
        } finally {
            setIsDeleting(false);
        }
    };

    // 6. Create/Edit Logic
    // Click "New Note" button
    const handleCreateNote = () => {
        setOpenEditor({ isOpen: true, note: null });
    };

    // Click "Edit" in dropdown
    const handleEdit = (note) => {
        setOpenEditor({ isOpen: true, note: note });
    };

    // 7. Pin/Unpin Logic
    const updateIsPinned = async (note) => {
        try {
            const user = JSON.parse(localStorage.getItem("userInfo"));

            const res = await fetch(`/api/notes/${note._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
                body: JSON.stringify({ isPinned: !note.isPinned }), // Toggle Status
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.isPinned ? "Note Pinned" : "Note Unpinned");
                fetchNotes();
            } else {
                toast.error("Failed to update");
            }
        } catch (error) {
            toast.error("Server error");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navigation */}
            <Navbar userInfo={userInfo} onSearch={handleSearch} />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-850 mb-2">
                            My Notes
                        </h1>
                        <p className="text-slate-600 text-sm">
                            {filteredNotes.length}{" "}
                            {filteredNotes.length === 1 ? "note" : "notes"}{" "}
                            found
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                            <RiSortDesc className="text-slate-400" />
                            <select
                                onChange={handleSort}
                                value={sortType}
                                className="text-sm text-slate-700 bg-transparent border-none outline-none cursor-pointer">
                                <option value="updated">Last Updated</option>
                                <option value="created">Date Created</option>
                            </select>
                        </div>
                        <button
                            onClick={handleCreateNote}
                            className="bg-primary hover:bg-primary-dark text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap cursor-pointer">
                            <RiAddLine className="text-xl" />
                            New Note
                        </button>
                    </div>
                </div>

                {/* Notes Grid */}
                {loading ? (
                    <div className="text-center py-20 text-slate-500">
                        Loading notes...
                    </div>
                ) : filteredNotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNotes.map((note) => (
                            <NoteCard
                                key={note._id}
                                note={note}
                                onDelete={openDeleteModal}
                                onEdit={handleEdit}
                                onPin={updateIsPinned}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <img
                            src="/images/emptybox.png"
                            className="w-24 h-24 mb-4 opacity-50"
                            alt="No notes"
                        />
                        <p className="text-lg">No notes found</p>
                        <p className="text-sm">
                            Create your first note to get started!
                        </p>
                    </div>
                )}
            </main>

            {/* Rendering Delete Modal */}
            <DeleteModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, noteId: null })}
                onConfirm={confirmDelete}
                loading={isDeleting}
            />

            {/* Rendering Note Modal */}
            <NoteModal
                isOpen={openEditor.isOpen}
                onClose={() => setOpenEditor({ isOpen: false, note: null })}
                note={openEditor.note}
                refreshNotes={fetchNotes}
            />
        </div>
    );
};

export default Home;
