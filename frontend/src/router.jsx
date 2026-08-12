import { createBrowserRouter } from "react-router-dom";
import { BaseLayout } from "./layouts/BaseLayout";
import { HomePage } from "./pages/HomePage";
import { SessionsPage } from "./pages/SessionsPage";
import { EventsPage } from "./pages/EventsPage";
import { TimelinePage } from "./pages/TimelinePage";
import { ThreatAnalysisPage } from "./pages/ThreatAnalysisPage";
import { AlertsPage } from "./pages/AlertsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <BaseLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "sessions",
        element: <SessionsPage />,
      },
      {
        path: "sessions/:sessionId",
        element: <SessionsPage />,
      },
      {
        path: "events",
        element: <EventsPage />,
      },
      {
        path: "timeline",
        element: <TimelinePage />,
      },
      {
        path: "analytics",
        element: <ThreatAnalysisPage />,
      },
      {
        path: "alerts",
        element: <AlertsPage />
      },
      {
        path: "reports",
        element: <ReportsPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },
]);

export default router;