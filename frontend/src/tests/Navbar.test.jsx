import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";

// --- MOCKS ---
vi.mock("react-hot-toast", () => ({
    default: { success: vi.fn() },
}));

// Mock ProfileModal to avoid loading it
vi.mock("../components/ProfileModal", () => ({
    default: ({ isOpen }) =>
        isOpen ? <div data-testid="profile-modal">Modal Open</div> : null,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return { ...actual, useNavigate: () => mockNavigate };
});

describe("Navbar Component", () => {
    const mockUserInfo = { username: "John Doe", email: "john@example.com" };
    const mockOnSearch = vi.fn();

    const renderNavbar = () => {
        return render(
            <BrowserRouter>
                <Navbar userInfo={mockUserInfo} onSearch={mockOnSearch} />
            </BrowserRouter>,
        );
    };

    it("renders logo and user info correctly", () => {
        renderNavbar();
        expect(screen.getByText("Notes Manager")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        // Check Initial (J)
        expect(screen.getByText("J")).toBeInTheDocument();
    });

    it("handles search input", () => {
        renderNavbar();
        const searchInput = screen.getByPlaceholderText("Search notes...");
        fireEvent.change(searchInput, { target: { value: "meeting" } });
        expect(mockOnSearch).toHaveBeenCalledWith("meeting");
    });

    it("toggles profile menu on click", () => {
        renderNavbar();

        // Menu should be hidden initially
        expect(screen.queryByText("Logout")).not.toBeInTheDocument();

        // Click profile to open
        const profileBtn = screen.getByText("J").closest("button");
        fireEvent.click(profileBtn);

        // Menu should appear
        expect(screen.getByText("Logout")).toBeInTheDocument();
        expect(screen.getByText("Profile Settings")).toBeInTheDocument();

        // Click again to close (or click outside, handled by component logic)
        fireEvent.click(profileBtn);
        expect(screen.queryByText("Logout")).not.toBeInTheDocument();
    });

    it("handles logout correctly", () => {
        renderNavbar();

        // Open menu
        fireEvent.click(screen.getByText("J").closest("button"));

        // Click Logout
        fireEvent.click(screen.getByText("Logout"));

        expect(toast.success).toHaveBeenCalledWith("Logged out successfully");
        expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("opens profile modal when settings clicked", () => {
        renderNavbar();
        fireEvent.click(screen.getByText("J").closest("button"));
        fireEvent.click(screen.getByText("Profile Settings"));

        expect(screen.getByTestId("profile-modal")).toBeInTheDocument();
    });
});
