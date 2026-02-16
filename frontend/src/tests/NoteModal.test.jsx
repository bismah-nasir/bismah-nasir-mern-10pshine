import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NoteModal from "../components/NoteModal";
import { vi } from "vitest";
import toast from "react-hot-toast";

// --- MOCKS ---

// 1. Mock Toast
vi.mock("react-hot-toast", () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// 2. Mock Tiptap Editor
// Mock the hooks so no need of actual editor engine running in JSDOM
const mockSetContent = vi.fn();
const mockGetHTML = vi.fn(() => "<p>Mock Content</p>");
const mockChain = {
    focus: () => mockChain,
    toggleBold: () => mockChain,
    toggleItalic: () => mockChain,
    toggleUnderline: () => mockChain,
    toggleStrike: () => mockChain,
    toggleHighlight: () => mockChain,
    toggleHeading: () => mockChain,
    toggleBulletList: () => mockChain,
    toggleOrderedList: () => mockChain,
    setTextAlign: () => mockChain,
    toggleBlockquote: () => mockChain,
    toggleCodeBlock: () => mockChain,
    unsetLink: () => mockChain,
    run: vi.fn(),
};

vi.mock("@tiptap/react", () => ({
    useEditor: () => ({
        chain: () => mockChain,
        can: () => ({ undo: () => true, redo: () => true }),
        getHTML: mockGetHTML,
        getText: () => "Mock Content",
        isEmpty: false,
        commands: {
            setContent: mockSetContent,
        },
    }),
    useEditorState: () => ({
        isBold: false,
        charCount: 12,
        wordCount: 2,
    }),
    EditorContent: () => <div data-testid="tiptap-editor">Editor Area</div>,
}));

describe.skip("NoteModal Component", () => {
    const mockOnClose = vi.fn();
    const mockRefreshNotes = vi.fn();
    const mockUserInfo = { token: "fake-token" };

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
        Storage.prototype.getItem = vi.fn(() => JSON.stringify(mockUserInfo));
        // Mock window history for the popstate logic
        window.history.pushState = vi.fn();
        window.history.back = vi.fn();
    });

    it("renders Create Note mode correctly", () => {
        render(
            <NoteModal
                isOpen={true}
                onClose={mockOnClose}
                note={null}
                refreshNotes={mockRefreshNotes}
            />,
        );

        expect(screen.getByText("Create Note")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Note Title")).toHaveValue("");
        expect(screen.getByTestId("tiptap-editor")).toBeInTheDocument();
    });

    it("renders Edit Note mode correctly (pre-fills data)", () => {
        const existingNote = {
            _id: "123",
            title: "Existing Title",
            content: "<p>Content</p>",
            tags: ["work", "important"],
        };

        render(
            <NoteModal
                isOpen={true}
                onClose={mockOnClose}
                note={existingNote}
                refreshNotes={mockRefreshNotes}
            />,
        );

        expect(screen.getByText("Edit Note")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Existing Title")).toBeInTheDocument();

        // Check if tags are rendered
        expect(screen.getByText("#work")).toBeInTheDocument();
        expect(screen.getByText("#important")).toBeInTheDocument();

        // Check if editor content was set
        expect(mockSetContent).toHaveBeenCalledWith("<p>Content</p>");
    });

    it("allows adding and removing tags", () => {
        render(
            <NoteModal
                isOpen={true}
                onClose={mockOnClose}
                note={null}
                refreshNotes={mockRefreshNotes}
            />,
        );

        const tagInput = screen.getByPlaceholderText("Add tag + Enter");

        // Add 'react' tag
        fireEvent.change(tagInput, { target: { value: "react" } });
        fireEvent.keyDown(tagInput, { key: "Enter", code: "Enter" });

        expect(screen.getByText("#react")).toBeInTheDocument();
        expect(tagInput.value).toBe(""); // Input should clear

        // Remove 'react' tag
        // The remove button is inside the tag span
        const removeBtn = screen.getByText("#react").querySelector("button");
        fireEvent.click(removeBtn);

        expect(screen.queryByText("#react")).not.toBeInTheDocument();
    });

    it("validates empty title before saving", () => {
        render(
            <NoteModal
                isOpen={true}
                onClose={mockOnClose}
                note={null}
                refreshNotes={mockRefreshNotes}
            />,
        );

        // Click save without typing title
        fireEvent.click(screen.getByRole("button", { name: "Save Note" }));

        expect(toast.error).toHaveBeenCalledWith(
            "Title and Content are required",
        );
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("handles saving a new note successfully (POST)", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: "Created" }),
        });

        render(
            <NoteModal
                isOpen={true}
                onClose={mockOnClose}
                note={null}
                refreshNotes={mockRefreshNotes}
            />,
        );

        // Type Title
        fireEvent.change(screen.getByPlaceholderText("Note Title"), {
            target: { value: "New Note" },
        });

        // Click Save
        fireEvent.click(screen.getByRole("button", { name: "Save Note" }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/notes",
                expect.objectContaining({
                    method: "POST",
                    body: expect.stringContaining("New Note"), // Checks if title is in body
                }),
            );

            expect(toast.success).toHaveBeenCalledWith("Note Created");
            expect(mockRefreshNotes).toHaveBeenCalled();
            // Note: handleClose calls window.history.back() in your code
            expect(window.history.back).toHaveBeenCalled();
        });
    });

    it("handles updating a note successfully (PUT)", async () => {
        const noteToEdit = {
            _id: "999",
            title: "Old",
            content: "Old",
            tags: [],
        };

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: "Updated" }),
        });

        render(
            <NoteModal
                isOpen={true}
                onClose={mockOnClose}
                note={noteToEdit}
                refreshNotes={mockRefreshNotes}
            />,
        );

        // Change Title
        fireEvent.change(screen.getByDisplayValue("Old"), {
            target: { value: "Updated Title" },
        });

        // Click Save
        fireEvent.click(screen.getByRole("button", { name: "Save Note" }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/notes/999",
                expect.objectContaining({
                    method: "PUT",
                    body: expect.stringContaining("Updated Title"),
                }),
            );

            expect(toast.success).toHaveBeenCalledWith("Note Updated");
        });
    });
});
