import { render, screen } from "@testing-library/react";
import AuthLayout from "../components/AuthLayout";

describe("AuthLayout Component", () => {
    it("renders title and subtitle correctly", () => {
        const testTitle = "Welcome Back";
        const testSubtitle = "Please log in to continue";

        render(
            <AuthLayout title={testTitle} subtitle={testSubtitle}>
                <p>Child Content</p>
            </AuthLayout>,
        );

        // Check for H1 tag with specific text
        const titleElement = screen.getByRole("heading", { level: 1 });
        expect(titleElement).toHaveTextContent(testTitle);

        expect(screen.getByText(testSubtitle)).toBeInTheDocument();
    });

    it("renders children content inside the layout", () => {
        render(
            <AuthLayout title="Test" subtitle="Test">
                <div data-testid="test-child">I am the login form</div>
            </AuthLayout>,
        );

        const childElement = screen.getByTestId("test-child");
        expect(childElement).toBeInTheDocument();
        expect(childElement).toHaveTextContent("I am the login form");
    });

    it("renders the logo and security footer", () => {
        render(
            <AuthLayout title="Test" subtitle="Test">
                <p>Child</p>
            </AuthLayout>,
        );

        const logo = screen.getByAltText("Note App Logo");
        expect(logo).toBeInTheDocument();

        expect(
            screen.getByText(/secure authentication powered by/i),
        ).toBeInTheDocument();
    });
});
