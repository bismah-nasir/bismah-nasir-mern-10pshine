import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfileModal from "../components/ProfileModal";
import { vi } from "vitest";
import toast from "react-hot-toast";

// --- MOCKS ---
vi.mock("react-hot-toast", () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe("ProfileModal Component", () => {
    const mockOnClose = vi.fn();
    const mockUserInfo = {
        username: "Test User",
        email: "test@example.com",
        token: "fake-token",
    };

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
        
        // Mock LocalStorage
        Storage.prototype.getItem = vi.fn(() => JSON.stringify(mockUserInfo));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // 1. Render & Initials Logic
    it("renders user details and handles initials correctly", () => {
        // Test Case A: Full Name (T U)
        const { rerender } = render(
            <ProfileModal isOpen={true} onClose={mockOnClose} userInfo={mockUserInfo} />
        );
        expect(screen.getByText("Test User")).toBeInTheDocument();
        expect(screen.getByText("TU")).toBeInTheDocument();

        // Test Case B: Single Name (S)
        rerender(
            <ProfileModal isOpen={true} onClose={mockOnClose} userInfo={{ ...mockUserInfo, username: "Single" }} />
        );
        expect(screen.getByText("S")).toBeInTheDocument();

        // Test Case C: No Name (U)
        rerender(
            <ProfileModal isOpen={true} onClose={mockOnClose} userInfo={{ ...mockUserInfo, username: null }} />
        );
        expect(screen.getByText("U")).toBeInTheDocument();
    });

    it("does not render when isOpen is false", () => {
        render(<ProfileModal isOpen={false} onClose={mockOnClose} userInfo={mockUserInfo} />);
        expect(screen.queryByText("Test User")).not.toBeInTheDocument();
    });

    // 2. Interaction: Close & Toggle
    it("calls onClose when close button is clicked", () => {
        render(<ProfileModal isOpen={true} onClose={mockOnClose} userInfo={mockUserInfo} />);
        
        // Find the close button (SVG icon wrapper)
        const closeButtons = screen.getAllByRole("button");
        fireEvent.click(closeButtons[0]); // Usually the first button in DOM order
        expect(mockOnClose).toHaveBeenCalled();
    });

    it("toggles password change fields and cancel button", () => {
        render(<ProfileModal isOpen={true} onClose={mockOnClose} userInfo={mockUserInfo} />);

        // Click 'Change Password'
        fireEvent.click(screen.getByText("Change Password"));
        expect(screen.getByPlaceholderText("Enter password")).toBeInTheDocument();

        // Click 'Cancel' inside the edit view
        fireEvent.click(screen.getByText("Cancel"));
        expect(screen.queryByPlaceholderText("Enter password")).not.toBeInTheDocument();
    });

    // 3. Validation Logic
    it("validates empty fields", () => {
        render(<ProfileModal isOpen={true} onClose={mockOnClose} userInfo={mockUserInfo} />);
        fireEvent.click(screen.getByText("Change Password"));

        // Click Update without typing anything
        fireEvent.click(screen.getByRole("button", { name: "Update Password" }));

        expect(toast.error).toHaveBeenCalledWith("Please fill all password fields");
    });

    it("validates password mismatch", () => {
        render(<ProfileModal isOpen={true} onClose={mockOnClose} userInfo={mockUserInfo} />);
        fireEvent.click(screen.getByText("Change Password"));

        fireEvent.change(screen.getByPlaceholderText("Enter password"), { target: { value: "123456" } });
        fireEvent.change(screen.getByPlaceholderText("Re-enter password"), { target: { value: "1234567" } });

        fireEvent.click(screen.getByRole("button", { name: "Update Password" }));
        expect(toast.error).toHaveBeenCalledWith("Passwords do not match");
    });

    it("validates short passwords (< 6 chars)", () => {
        render(<ProfileModal isOpen={true} onClose={mockOnClose} userInfo={mockUserInfo} />);
        fireEvent.click(screen.getByText("Change Password"));

        fireEvent.change(screen.getByPlaceholderText("Enter password"), { target: { value: "123" } });
        fireEvent.change(screen.getByPlaceholderText("Re-enter password"), { target: { value: "123" } });

        fireEvent.click(screen.getByRole("button", { name: "Update Password" }));
        expect(toast.error).toHaveBeenCalledWith("Password must be at least 6 characters");
    });

    // 4. API Logic
    it("handles successful password update", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: "Success" }),
        });

        render(<ProfileModal isOpen={true} onClose={mockOnClose} userInfo={mockUserInfo} />);
        fireEvent.click(screen.getByText("Change Password"));

        fireEvent.change(screen.getByPlaceholderText("Enter password"), { target: { value: "newpass123" } });
        fireEvent.change(screen.getByPlaceholderText("Re-enter password"), { target: { value: "newpass123" } });

        fireEvent.click(screen.getByRole("button", { name: "Update Password" }));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Password updated successfully");
            // Should reset to masked view
            expect(screen.queryByPlaceholderText("Enter password")).not.toBeInTheDocument();
        });
    });

    it("handles API failure (e.g. 400 Bad Request)", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: "Old password incorrect" }),
        });

        render(<ProfileModal isOpen={true} onClose={mockOnClose} userInfo={mockUserInfo} />);
        fireEvent.click(screen.getByText("Change Password"));

        fireEvent.change(screen.getByPlaceholderText("Enter password"), { target: { value: "newpass123" } });
        fireEvent.change(screen.getByPlaceholderText("Re-enter password"), { target: { value: "newpass123" } });

        fireEvent.click(screen.getByRole("button", { name: "Update Password" }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Old password incorrect");
        });
    });

    // FIX: Explicitly spy on console.error inside this test
    it("handles Network/Server Error (Catch Block)", async () => {
        // 1. Setup Spy
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        
        // 2. Mock Fetch Failure
        global.fetch.mockRejectedValueOnce(new Error("Network Down"));

        render(<ProfileModal isOpen={true} onClose={mockOnClose} userInfo={mockUserInfo} />);
        fireEvent.click(screen.getByText("Change Password"));

        fireEvent.change(screen.getByPlaceholderText("Enter password"), { target: { value: "newpass123" } });
        fireEvent.change(screen.getByPlaceholderText("Re-enter password"), { target: { value: "newpass123" } });

        fireEvent.click(screen.getByRole("button", { name: "Update Password" }));

        await waitFor(() => {
            // 3. Assert on the spy variable directly
            expect(consoleSpy).toHaveBeenCalled();
            expect(toast.error).toHaveBeenCalledWith("Server Error");
        });
        
        consoleSpy.mockRestore();
    });

    // 5. useEffect Logic (State Reset)
    it("resets state when modal closes", () => {
        const { rerender } = render(<ProfileModal isOpen={true} onClose={mockOnClose} userInfo={mockUserInfo} />);

        // 1. Open edit mode and type something
        fireEvent.click(screen.getByText("Change Password"));
        const input = screen.getByPlaceholderText("Enter password");
        fireEvent.change(input, { target: { value: "partial-password" } });

        // 2. Close Modal (rerender with isOpen=false)
        rerender(<ProfileModal isOpen={false} onClose={mockOnClose} userInfo={mockUserInfo} />);

        // 3. Re-open Modal
        rerender(<ProfileModal isOpen={true} onClose={mockOnClose} userInfo={mockUserInfo} />);

        // 4. Should be back to initial state (Masked view, not edit view)
        expect(screen.queryByPlaceholderText("Enter password")).not.toBeInTheDocument();
        expect(screen.getByText("Change Password")).toBeInTheDocument();
    });
});