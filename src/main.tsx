import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import OBR from "@owlbear-rodeo/sdk";
import App from "./App.tsx";

const root = createRoot(document.getElementById("root")!);
const isBanner =
  new URLSearchParams(window.location.search).get("view") === "banner";

OBR.onReady(() => {
  root.render(
    <StrictMode>
      <App isBanner={isBanner} />
    </StrictMode>,
  );
});
