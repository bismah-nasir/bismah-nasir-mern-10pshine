import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import ResetPassword from "../pages/ResetPassword";
import toast from "react-hot-toast";

const mockNavigate = vi.fn();

// Mock Router hooks (useParams is critical here to simulate the token in URL)
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ token: "fake-test-token-123" }), // Simulate /reset-password/fake-test-token-123
    };
});

vi.mock("react-hot-toast", () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe("ResetPassword Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    const renderComponent = () => {
        return render(
            <BrowserRouter>
                <ResetPassword />
            </BrowserRouter>,
        );
    };

    it("renders password inputs", () => {
        renderComponent();
        expect(
            screen.getByRole("heading", { name: /reset password/i }),
        ).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/^password$/i)).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText(/^confirm password$/i),
        ).toBeInTheDocument();
    });

    it("validates password length", () => {
        renderComponent();

        // Type short password
        fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
            target: { value: "123" },
        });
        fireEvent.change(screen.getByPlaceholderText(/^confirm password$/i), {
            target: { value: "123" },
        });

        fireEvent.click(
            screen.getByRole("button", { name: /reset password/i }),
        );

        expect(toast.error).toHaveBeenCalledWith(
            "Password must be at least 6 characters",
        );
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("validates password mismatch", () => {
        renderComponent();

        fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
            target: { value: "password123" },
        });
        fireEvent.change(screen.getByPlaceholderText(/^confirm password$/i), {
            target: { value: "password999" },
        });
        fireEvent.click(
            screen.getByRole("button", { name: /reset password/i }),
        );

        expect(toast.error).toHaveBeenCalledWith("Passwords do not match");
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("handles successful password reset", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: "Success" }),
        });

        renderComponent();

        // Valid inputs
        fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
            target: { value: "newpass123" },
        });
        fireEvent.change(screen.getByPlaceholderText(/^confirm password$/i), {
            target: { value: "newpass123" },
        });

        fireEvent.click(
            screen.getByRole("button", { name: /reset password/i }),
        );

        await waitFor(() => {
            // Check if token was included in URL
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/users/reset-password/fake-test-token-123",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({ password: "newpass123" }),
                }),
            );

            expect(toast.success).toHaveBeenCalledWith(
                "Password reset successful! You can now login.",
            );
            expect(mockNavigate).toHaveBeenCalledWith("/login");
        });
    });

    it("handles invalid or expired token error", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: "Invalid or expired token" }),
        });

        renderComponent();

        fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
            target: { value: "newpass123" },
        });
        fireEvent.change(screen.getByPlaceholderText(/^confirm password$/i), {
            target: { value: "newpass123" },
        });

        fireEvent.click(
            screen.getByRole("button", { name: /reset password/i }),
        );

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                "Invalid or expired token",
            );
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });
});
