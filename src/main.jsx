import React from "react";

import ReactDOM from "react-dom/client";

import App from "./App";

import "./styles/globals.css";

import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>

    <App />

    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#111827",
          color: "#f8fafc",
          border: "1px solid #1e293b",
        },
      }}
    />

  </React.StrictMode>
);
