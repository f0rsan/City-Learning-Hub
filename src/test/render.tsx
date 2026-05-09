import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";

export function renderRoute(ui: ReactElement, initialPath = "/") {
  window.history.pushState({}, "Test page", initialPath);
  return render(<MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>);
}
