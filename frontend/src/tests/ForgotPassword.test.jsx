import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import ForgotPassword from "../pages/ForgotPassword";
import toast from "react-hot-toast";

// Mock Toast
vi.mock("react-hot-toast", () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe("ForgotPassword Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    const renderComponent = () => {
        return render(
            <BrowserRouter>
                <ForgotPassword />
            </BrowserRouter>,
        );
    };

    it("renders the form elements correctly", () => {
        renderComponent();
        expect(
            screen.getByRole("heading", { name: /forgot password/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText(/enter your registered email/i),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /send reset link/i }),
        ).toBeInTheDocument();
        expect(screen.getByText("Back to Login")).toBeInTheDocument();
    });

    it("allows user to type email", () => {
        renderComponent();
        const input = screen.getByPlaceholderText(
            /enter your registered email/i,
        );
        fireEvent.change(input, { target: { value: "test@example.com" } });
        expect(input.value).toBe("test@example.com");
    });

    it("handles successful password reset request", async () => {
        // Mock success API
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: "Email sent" }),
        });

        renderComponent();

        // Type email
        fireEvent.change(
            screen.getByPlaceholderText(/enter your registered email/i),
            {
                target: { value: "valid@user.com" },
            },
        );

        // Submit
        fireEvent.click(
            screen.getByRole("button", { name: /send reset link/i }),
        );

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/users/forgot-password",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({ email: "valid@user.com" }),
                }),
            );
            expect(toast.success).toHaveBeenCalledWith(
                "Check your email for the reset link!",
            );
        });
    });

    it("handles API error (e.g. email not found)", async () => {
        // Mock error API
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: "User not found" }),
        });

        renderComponent();

        fireEvent.change(
            screen.getByPlaceholderText(/enter your registered email/i),
            {
                target: { value: "wrong@user.com" },
            },
        );
        fireEvent.click(
            screen.getByRole("button", { name: /send reset link/i }),
        );

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("User not found");
        });
    });
});
