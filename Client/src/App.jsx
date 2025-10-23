import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Import your pages/components
import Home from "./Pages/Home";
import MapCard from "./Pages/MapCard";

// Create the router
const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/map",
    element: <MapCard />,
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}
