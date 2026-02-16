import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import NoteCard from "../components/NoteCard";

describe("NoteCard Component", () => {
    const mockNote = {
        _id: "1",
        title: "Test Note",
        content: "<p>This is <b>bold</b> content</p>",
        tags: ["work", "urgent"],
        isPinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const mockOnDelete = vi.fn();
    const mockOnEdit = vi.fn();
    const mockOnPin = vi.fn();

    const renderCard = (noteProp = mockNote) => {
        render(
            <NoteCard
                note={noteProp}
                onDelete={mockOnDelete}
                onEdit={mockOnEdit}
                onPin={mockOnPin}
            />,
        );
    };

    it("renders title, tags and strips HTML content", () => {
        renderCard();
        expect(screen.getByText("Test Note")).toBeInTheDocument();
        expect(screen.getByText("work")).toBeInTheDocument();
        expect(screen.getByText("urgent")).toBeInTheDocument();

        // IMPORTANT: Check that HTML tags <b> are gone
        expect(screen.getByText("This is bold content")).toBeInTheDocument();
    });

    it("handles Pin action", () => {
        renderCard();
        // Find pin button by title or icon mock
        const pinBtn = screen.getByTitle("Pin Note");
        fireEvent.click(pinBtn);
        expect(mockOnPin).toHaveBeenCalledWith(mockNote);
    });

    it("opens menu and handles Edit action", () => {
        renderCard();

        // Menu is hidden
        expect(screen.queryByText("Edit Note")).not.toBeInTheDocument();

        // Hover/Click to show menu (Logic uses local state for click)
        // Find the "More" button (using the mock-icon fallback or structure)
        // Since we mock icons globally, we look for the button containing the More icon
        const moreBtn = screen.getAllByRole("button")[1]; // 0 is Pin, 1 is Menu
        fireEvent.click(moreBtn);

        // Click Edit
        const editBtn = screen.getByText("Edit Note");
        fireEvent.click(editBtn);

        expect(mockOnEdit).toHaveBeenCalledWith(mockNote);
    });

    it("opens menu and handles Delete action", () => {
        renderCard();
        const moreBtn = screen.getAllByRole("button")[1];
        fireEvent.click(moreBtn);

        const deleteBtn = screen.getByText("Delete Note");
        fireEvent.click(deleteBtn);

        expect(mockOnDelete).toHaveBeenCalledWith(mockNote._id);
    });

    it("displays 'Updated' label if modified recently", () => {
        const oldDate = new Date("2023-01-01").toISOString();
        const newDate = new Date("2025-01-01").toISOString();

        const updatedNote = {
            ...mockNote,
            createdAt: oldDate,
            updatedAt: newDate,
        };

        renderCard(updatedNote);
        expect(screen.getByText(/Updated/)).toBeInTheDocument();
    });
});
