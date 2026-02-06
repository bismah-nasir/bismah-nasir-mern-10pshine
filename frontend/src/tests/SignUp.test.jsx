import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import SignUp from "../pages/SignUp";
import toast from "react-hot-toast";

// 1. Mock useNavigate
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// 2. Mock Toast
vi.mock("react-hot-toast", () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe("SignUp Page Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    const renderSignUp = () => {
        return render(
            <BrowserRouter>
                <SignUp />
            </BrowserRouter>,
        );
    };

    it("renders all registration fields correctly", () => {
        renderSignUp();

        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: /create account/i }),
        ).toBeInTheDocument();
    });

    it("allows user to type into inputs", () => {
        renderSignUp();

        const nameInput = screen.getByLabelText(/full name/i);
        const emailInput = screen.getByLabelText(/email address/i);

        fireEvent.change(nameInput, { target: { value: "John Doe" } });
        fireEvent.change(emailInput, { target: { value: "john@example.com" } });

        expect(nameInput.value).toBe("John Doe");
        expect(emailInput.value).toBe("john@example.com");
    });

    it("shows validation errors for empty fields", () => {
        renderSignUp();

        // Submit empty form
        fireEvent.click(
            screen.getByRole("button", { name: /create account/i }),
        );

        expect(screen.getByText("Name is required")).toBeInTheDocument();
        expect(screen.getByText("Email is required")).toBeInTheDocument();
        const passwordErrors = screen.getAllByText("Password is required");
        expect(passwordErrors).toHaveLength(2); // Expecting 2 error messages
    });

    it("shows error when passwords do not match", () => {
        renderSignUp();

        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmInput = screen.getByLabelText(/confirm password/i);

        // Type mismatched passwords
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.change(confirmInput, { target: { value: "password999" } });

        fireEvent.click(
            screen.getByRole("button", { name: /create account/i }),
        );

        expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("handles successful registration", async () => {
        // Mock successful response
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: "User registered" }),
        });

        renderSignUp();

        // Fill all fields correctly
        fireEvent.change(screen.getByLabelText(/full name/i), {
            target: { value: "John Doe" },
        });
        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: "john@example.com" },
        });
        fireEvent.change(screen.getByLabelText(/^password$/i), {
            target: { value: "password123" },
        });
        fireEvent.change(screen.getByLabelText(/confirm password/i), {
            target: { value: "password123" },
        });

        // Submit
        fireEvent.click(
            screen.getByRole("button", { name: /create account/i }),
        );

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/users/register",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({
                        username: "John Doe",
                        email: "john@example.com",
                        password: "password123",
                    }),
                }),
            );

            expect(toast.success).toHaveBeenCalledWith(
                "Account created! Redirecting...",
            );

            // Wait for setTimeout in component (using vitest timers is cleaner, but waitFor works for simple delays)
        });
    });

    it("handles registration failure (e.g. user already exists)", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: "User already exists" }),
        });

        renderSignUp();

        // Fill form
        fireEvent.change(screen.getByLabelText(/full name/i), {
            target: { value: "John Doe" },
        });
        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: "john@example.com" },
        });
        fireEvent.change(screen.getByLabelText(/^password$/i), {
            target: { value: "password123" },
        });
        fireEvent.change(screen.getByLabelText(/confirm password/i), {
            target: { value: "password123" },
        });

        fireEvent.click(
            screen.getByRole("button", { name: /create account/i }),
        );

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("User already exists");
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });
});
