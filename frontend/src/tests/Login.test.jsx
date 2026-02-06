import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import Login from "../pages/Login";
import toast from "react-hot-toast";

// 1. Mock `useNavigate` so we can test redirection
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// 2. Mock `react-hot-toast` so we don't actually show popups
vi.mock("react-hot-toast", () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe("Login Page Component", () => {
    // Reset mocks before every single test
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock global fetch (the browser API)
        global.fetch = vi.fn();
    });

    // Helper to render Login wrapped in Router (needed for <Link>)
    const renderLogin = () => {
        return render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>,
        );
    };

    it("renders the login form elements correctly", () => {
        renderLogin();
        // Check for Inputs
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument(); // regex ^$ for exact match
        // Check for Button
        expect(
            screen.getByRole("button", { name: /sign in/i }),
        ).toBeInTheDocument();
    });

    it("allows user to type into inputs", () => {
        renderLogin();

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);

        // Simulate typing
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "123456" } });

        // Assert values changed
        expect(emailInput.value).toBe("test@example.com");
        expect(passwordInput.value).toBe("123456");
    });

    it("shows validation error if submitting empty form", () => {
        renderLogin();

        // Click Submit without typing
        const submitBtn = screen.getByRole("button", { name: /sign in/i });
        fireEvent.click(submitBtn);

        // Expect validation messages
        expect(screen.getByText("Email is required")).toBeInTheDocument();
        expect(screen.getByText("Password is required")).toBeInTheDocument();

        // Ensure API was NOT called
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("handles successful login", async () => {
        // Mock a successful API response
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: "fake-jwt-token", name: "Test User" }),
        });

        renderLogin();

        // Fill form
        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: "valid@user.com" },
        });
        fireEvent.change(screen.getByLabelText(/^password$/i), {
            target: { value: "password123" },
        });

        // Submit
        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

        // Wait for async actions
        await waitFor(() => {
            // Check if fetch was called with correct data
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/users/login",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({
                        email: "valid@user.com",
                        password: "password123",
                    }),
                }),
            );

            // Check success toast
            expect(toast.success).toHaveBeenCalledWith(
                "Successfully logged in!",
            );

            // Check redirect
            expect(mockNavigate).toHaveBeenCalledWith("/");
        });
    });

    it("handles login failure (invalid credentials)", async () => {
        // Mock a failed API response (401)
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: "Invalid credentials" }),
        });

        renderLogin();

        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: "wrong@user.com" },
        });
        fireEvent.change(screen.getByLabelText(/^password$/i), {
            target: { value: "wrongpass" },
        });

        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

        await waitFor(() => {
            // Check error toast
            expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
            // Ensure we did NOT redirect
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });
});
