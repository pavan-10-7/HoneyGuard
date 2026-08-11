import { createBrowserRouter } from "react-router-dom";
import { BaseLayout } from "./layouts/BaseLayout";
import { HomePage } from "./pages/HomePage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <BaseLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },
]);

export default router;