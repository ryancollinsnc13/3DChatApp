import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { resetMockData } from "../../api/mockAdapter";
import { useNeighborhoodStore } from "../../state/useNeighborhoodStore";
import { useSessionStore } from "../../state/useSessionStore";
import { DevLogin } from "./DevLogin";

beforeEach(() => {
  resetMockData();
  useSessionStore.getState().reset();
  useNeighborhoodStore.getState().reset();
});

describe("DevLogin", () => {
  it("logs in through the mock auth boundary", async () => {
    const user = userEvent.setup();
    render(<DevLogin />);

    await user.clear(screen.getByTestId("login-name"));
    await user.type(screen.getByTestId("login-name"), "Casey");
    await user.click(screen.getByTestId("login-submit"));

    await waitFor(() => {
      expect(useSessionStore.getState().player?.displayName).toBe("Casey");
    });
    expect(useSessionStore.getState().house?.name).toBe("Ryan's Porch");
  });
});
