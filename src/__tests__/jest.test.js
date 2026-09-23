import { render, screen } from "@testing-library/react";

function TestComponent() {
  return <h1>Jest is working</h1>;
}

describe("Jest setup", () => {
  test("renders a React component", () => {
    render(<TestComponent />);

    expect(
      screen.getByRole("heading", { name: "Jest is working" })
    ).toBeInTheDocument();
  });
});
