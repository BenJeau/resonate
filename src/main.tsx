import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import App from "./App.tsx";
import SelectPage from "./pages/Select.tsx";
import GamePage from "./pages/Game.tsx";
import LoginPage from "./pages/Login.tsx";
import HistoryPage from "./pages/History.tsx";
import "./styles.css";

const rootRoute = createRootRoute();
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
});
const gameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/game",
  validateSearch: (search: Record<string, unknown>) => {
    const modeRaw = typeof search.mode === "string" ? search.mode : undefined;
    const mode =
      modeRaw === "playlist"
        ? "playlist"
        : modeRaw === "top"
        ? "top"
        : undefined;
    const playlistId =
      typeof search.playlistId === "string" ? search.playlistId : undefined;
    return { mode, playlistId } as {
      mode?: "top" | "playlist";
      playlistId?: string;
      numTracks?: 3 | 10 | 20;
    };
  },
  component: GamePage,
});
const selectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/select",
  component: SelectPage,
});
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});
const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: HistoryPage,
});
const routeTree = rootRoute.addChildren([
  indexRoute,
  selectRoute,
  gameRoute,
  loginRoute,
  historyRoute,
]);
const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
