import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfileModal from "../components/ProfileModal";
import { vi } from "vitest";
import toast from "react-hot-toast";

// Mock Toast
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

    it("renders user details correctly", () => {
        render(
            <ProfileModal
                isOpen={true}
                onClose={mockOnClose}
                userInfo={mockUserInfo}
            />,
        );

        expect(screen.getByText("Test User")).toBeInTheDocument();
        expect(screen.getByText("test@example.com")).toBeInTheDocument();
        // Check initials avatar
        expect(screen.getByText("TU")).toBeInTheDocument();
    });

    it("toggles password change fields", () => {
        render(
            <ProfileModal
                isOpen={true}
                onClose={mockOnClose}
                userInfo={mockUserInfo}
            />,
        );

        // Initially, masked password view
        expect(
            screen.queryByPlaceholderText("Enter password"),
        ).not.toBeInTheDocument();

        // Click 'Change Password'
        fireEvent.click(screen.getByText("Change Password"));

        // Now inputs should be visible
        expect(
            screen.getByPlaceholderText("Enter password"),
        ).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText("Re-enter password"),
        ).toBeInTheDocument();
    });

    it("validates password mismatch during update", () => {
        render(
            <ProfileModal
                isOpen={true}
                onClose={mockOnClose}
                userInfo={mockUserInfo}
            />,
        );

        fireEvent.click(screen.getByText("Change Password"));

        fireEvent.change(screen.getByPlaceholderText("Enter password"), {
            target: { value: "123456" },
        });
        fireEvent.change(screen.getByPlaceholderText("Re-enter password"), {
            target: { value: "1234567" },
        });

        fireEvent.click(
            screen.getByRole("button", { name: "Update Password" }),
        );

        expect(toast.error).toHaveBeenCalledWith("Passwords do not match");
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("handles successful password update", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: "Success" }),
        });

        render(
            <ProfileModal
                isOpen={true}
                onClose={mockOnClose}
                userInfo={mockUserInfo}
            />,
        );

        fireEvent.click(screen.getByText("Change Password"));

        fireEvent.change(screen.getByPlaceholderText("Enter password"), {
            target: { value: "newpass123" },
        });
        fireEvent.change(screen.getByPlaceholderText("Re-enter password"), {
            target: { value: "newpass123" },
        });

        fireEvent.click(
            screen.getByRole("button", { name: "Update Password" }),
        );

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/users/profile",
                expect.objectContaining({
                    method: "PUT",
                    headers: expect.objectContaining({
                        Authorization: "Bearer fake-token",
                    }),
                }),
            );
            expect(toast.success).toHaveBeenCalledWith(
                "Password updated successfully",
            );
        });
    });
});
