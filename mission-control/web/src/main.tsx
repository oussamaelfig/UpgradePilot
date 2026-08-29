import React from "react";
import ReactDOM from "react-dom/client";
// Build-time static assets only (woff2 + @font-face CSS inlined by Vite);
// no code from this package ships or executes at runtime, so it lives in
// devDependencies alongside the rest of the build toolchain.
import "@fontsource-variable/inter";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
