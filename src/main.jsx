import React from "react";

import ReactDOM from "react-dom/client";

import App from "./App";

import "./styles/globals.css";

import { Toaster } from "react-hot-toast";

import {
  AuthProvider,
} from "./context/AuthContext";

ReactDOM.createRoot(
  document.getElementById("root")
).render(

  <React.StrictMode>

    <AuthProvider>

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

    </AuthProvider>

  </React.StrictMode>

);
