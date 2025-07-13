import { createRoot } from "react-dom/client";
import "./index.css";
import { ClerkAuthProvider } from "./ClerkAuth";
import Router from "./Router";

createRoot(document.getElementById("root")!).render(
  <ClerkAuthProvider>
    <Router />
  </ClerkAuthProvider>,
);
