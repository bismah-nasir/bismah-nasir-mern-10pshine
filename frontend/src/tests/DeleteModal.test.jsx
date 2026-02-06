import { render, screen, fireEvent } from "@testing-library/react";
import DeleteModal from "../components/DeleteModal";
import { vi } from "vitest";

describe("DeleteModal Component", () => {
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("should not render when isOpen is false", () => {
        render(
            <DeleteModal 
                isOpen={false} 
                onClose={mockOnClose} 
                onConfirm={mockOnConfirm} 
                loading={false} 
            />
        );
        // The modal returns null, so nothing should be in the document
        expect(screen.queryByText("Delete Note?")).not.toBeInTheDocument();
    });

    it("should render correctly when isOpen is true", () => {
        render(
            <DeleteModal 
                isOpen={true} 
                onClose={mockOnClose} 
                onConfirm={mockOnConfirm} 
                loading={false} 
            />
        );
        expect(screen.getByText("Delete Note?")).toBeInTheDocument();
        expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("triggers onConfirm when Delete button is clicked", () => {
        render(
            <DeleteModal 
                isOpen={true} 
                onClose={mockOnClose} 
                onConfirm={mockOnConfirm} 
                loading={false} 
            />
        );
        fireEvent.click(screen.getByRole("button", { name: "Delete" }));
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it("triggers onClose when Cancel button is clicked", () => {
        render(
            <DeleteModal 
                isOpen={true} 
                onClose={mockOnClose} 
                onConfirm={mockOnConfirm} 
                loading={false} 
            />
        );
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("shows loading state correctly", () => {
        render(
            <DeleteModal 
                isOpen={true} 
                onClose={mockOnClose} 
                onConfirm={mockOnConfirm} 
                loading={true} 
            />
        );
        
        const deleteBtn = screen.getByRole("button", { name: "Deleting..." });
        expect(deleteBtn).toBeInTheDocument();
        expect(deleteBtn).toBeDisabled();
        
        const cancelBtn = screen.getByRole("button", { name: "Cancel" });
        expect(cancelBtn).toBeDisabled();
    });
});