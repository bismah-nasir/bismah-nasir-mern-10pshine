import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import Home from "../pages/Home";
import toast from "react-hot-toast";

// --- MOCKS ---

// 1. Mock Toast
vi.mock("react-hot-toast", () => ({
    default: { success: vi.fn(), error: vi.fn() },
}));

// 2. Mock Navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return { ...actual, useNavigate: () => mockNavigate };
});

// 3. Mock Child Components (Crucial for clean testing)
vi.mock("../components/Navbar", () => ({
    default: ({ onSearch }) => (
        <div data-testid="navbar">
            <input
                data-testid="search-input"
                onChange={(e) => onSearch(e.target.value)}
            />
        </div>
    ),
}));

vi.mock("../components/NoteCard", () => ({
    default: ({ note, onDelete, onPin }) => (
        <div data-testid="note-card">
            <span>{note.title}</span>
            <button onClick={() => onPin(note)}>Pin</button>
            <button onClick={() => onDelete(note._id)}>Delete</button>
        </div>
    ),
}));

// Mock Modals to simple divs that trigger actions immediately
vi.mock("../components/DeleteModal", () => ({
    default: ({ isOpen, onConfirm }) =>
        isOpen ? (
            <button data-testid="confirm-delete" onClick={onConfirm}>
                Confirm
            </button>
        ) : null,
}));

vi.mock("../components/NoteModal", () => ({
    default: ({ isOpen }) =>
        isOpen ? <div data-testid="note-modal">Modal Open</div> : null,
}));

describe("Home Page", () => {
    const mockNotes = [
        {
            _id: "1",
            title: "Apple",
            content: "Fruit",
            isPinned: false,
            createdAt: "2023-01-01",
        },
        {
            _id: "2",
            title: "Banana",
            content: "Yellow",
            isPinned: true,
            createdAt: "2023-01-02",
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
        Storage.prototype.getItem = vi.fn(() =>
            JSON.stringify({ token: "fake-token" }),
        );
    });

    it("redirects to login if no user info found", () => {
        Storage.prototype.getItem = vi.fn(() => null); // No user
        render(<Home />);
        expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("fetches and displays notes on load", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockNotes,
        });

        render(<Home />);

        // Wait for loading to finish and notes to appear
        await waitFor(() => {
            expect(screen.getByText("Apple")).toBeInTheDocument();
            expect(screen.getByText("Banana")).toBeInTheDocument();
        });

        // Check "Banana" is first because it is Pinned (Logic check)
        const cards = screen.getAllByTestId("note-card");
        expect(cards[0]).toHaveTextContent("Banana");
    });

    it("handles search filtering", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockNotes,
        });

        render(<Home />);
        await waitFor(() => screen.getByText("Apple"));

        // Simulate typing in Navbar search mock
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "Apple" } });

        // Banana should disappear
        expect(screen.getByText("Apple")).toBeInTheDocument();
        expect(screen.queryByText("Banana")).not.toBeInTheDocument();
    });

    it("handles sorting (Created vs Updated)", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockNotes,
        });
        render(<Home />);
        await waitFor(() => screen.getByText("Apple"));

        // Find sort dropdown
        const select = screen.getByRole("combobox");
        fireEvent.change(select, { target: { value: "created" } });

        // Logic runs (no visual change since mock data is simple, but we check if state didn't crash)
        expect(screen.getByText("Apple")).toBeInTheDocument();
    });

    it("handles deleting a note", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockNotes,
        });

        render(<Home />);
        await waitFor(() => screen.getByText("Apple"));

        // 1. Click Delete on the card
        const deleteBtns = screen.getAllByText("Delete");
        fireEvent.click(deleteBtns[0]); // Delete first note

        // 2. Confirm Delete Modal appears
        const confirmBtn = screen.getByTestId("confirm-delete");

        // Mock the DELETE API response
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({}),
        });

        // 3. Click Confirm
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Note deleted");
            // Note should be removed from UI
            expect(screen.queryByText("Banana")).not.toBeInTheDocument();
        });
    });

    it("handles pinning a note", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockNotes,
        });
        render(<Home />);
        await waitFor(() => screen.getByText("Apple"));

        // Mock PUT API response
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ isPinned: true }),
        });

        // Re-fetch API Response
        global.fetch.mockResolvedValueOnce({ 
            ok: true, 
            json: async () => mockNotes 
        });

        // Click Pin on "Apple" (index 1 because Banana is pinned and index 0)
        const pinBtns = screen.getAllByText("Pin");
        fireEvent.click(pinBtns[1]);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Note Pinned");
            // It triggers fetchNotes again in your code
            expect(global.fetch).toHaveBeenCalledTimes(3);
        });
    });

    it("opens create note modal", async () => {
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
        render(<Home />);

        // Click New Note button
        fireEvent.click(screen.getByText("New Note"));

        expect(screen.getByTestId("note-modal")).toBeInTheDocument();
    });
});
