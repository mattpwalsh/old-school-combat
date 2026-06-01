import { useState, useEffect, useCallback } from "react";
import OBR from "@owlbear-rodeo/sdk";
import { DEFAULT_STATE, METADATA_KEY, BANNER_POPOVER_ID } from "./combat";
import type { CombatState } from "./types";
import GMPanel from "./components/GMPanel";
import PlayerView from "./components/PlayerView";
import BannerView from "./components/BannerView";
import "./App.css";

interface AppProps {
  isBanner?: boolean;
}

export default function App({ isBanner = false }: AppProps) {
  const [role, setRole] = useState<"GM" | "PLAYER" | null>(null);
  const [state, setState] = useState<CombatState>(DEFAULT_STATE);
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    const applyTheme = (theme: {
      mode: string;
      primary: { main: string; light: string; contrastText: string };
      background: { default: string; paper: string };
      text: { primary: string; secondary: string; disabled: string };
    }) => {
      const root = document.documentElement;
      root.style.setProperty("--bg", theme.background.default);
      root.style.setProperty("--surface-raised", theme.background.paper);
      root.style.setProperty("--text", theme.text.primary);
      root.style.setProperty("--text-dim", theme.text.secondary);
      root.style.setProperty("--text-muted", theme.text.disabled);
      root.style.setProperty("--accent", theme.primary.main);
      root.style.setProperty("--accent-light", theme.primary.light);
      root.style.setProperty("--accent-on", theme.primary.contrastText);
      const isDark = theme.mode === "DARK";
      root.style.setProperty(
        "--border",
        isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
      );
      root.style.setProperty(
        "--border-strong",
        isDark ? "rgba(255,255,255,0.24)" : "rgba(0,0,0,0.24)",
      );
    };
    OBR.theme.getTheme().then(applyTheme);
    const unsubTheme = OBR.theme.onChange(applyTheme);

    OBR.player.getRole().then((r) => setRole(r as "GM" | "PLAYER"));

    const loadScene = async () => {
      const ready = await OBR.scene.isReady();
      if (ready) {
        setSceneReady(true);
        const metadata = await OBR.scene.getMetadata();
        const stored = metadata[METADATA_KEY] as CombatState | undefined;
        if (stored)
          setState({
            ...DEFAULT_STATE,
            ...stored,
            config: { ...DEFAULT_STATE.config, ...stored.config },
          });
      }
    };
    loadScene();

    const unsubReady = OBR.scene.onReadyChange(async (ready) => {
      setSceneReady(ready);
      if (ready) {
        const metadata = await OBR.scene.getMetadata();
        const stored = metadata[METADATA_KEY] as CombatState | undefined;
        if (stored)
          setState({
            ...DEFAULT_STATE,
            ...stored,
            config: { ...DEFAULT_STATE.config, ...stored.config },
          });
      } else {
        setState(DEFAULT_STATE);
      }
    });

    const unsubMeta = OBR.scene.onMetadataChange((metadata) => {
      const stored = metadata[METADATA_KEY] as CombatState | undefined;
      if (stored)
        setState({
          ...DEFAULT_STATE,
          ...stored,
          config: { ...DEFAULT_STATE.config, ...stored.config },
        });

      if (!isBanner) {
        if (stored?.active) {
          const isDeclarations = stored.currentPhase === "declarations";
          const isInitiativeResolved =
            stored.currentPhase === "initiative" &&
            (stored.orderedPartyIds?.length ?? 0) > 0;
          const itemCount = isDeclarations
            ? (stored.config?.declarations?.length ?? 0)
            : isInitiativeResolved
              ? (stored.orderedPartyIds?.length ?? 0)
              : 0;
          const bannerHeight = isInitiativeResolved
            ? 110 + itemCount * 44
            : isDeclarations
              ? 85 + itemCount * 28
              : 85;
          OBR.popover.open({
            id: BANNER_POPOVER_ID,
            url: `${window.location.origin}/?view=banner`,
            height: bannerHeight,
            width: 480,
            disableClickAway: true,
            anchorReference: "POSITION",
            anchorPosition: { left: window.screen.width / 2, top: window.screen.height },
            anchorOrigin: { horizontal: "CENTER", vertical: "BOTTOM" },
            transformOrigin: { horizontal: "CENTER", vertical: "BOTTOM" },
          });
        } else {
          OBR.popover.close(BANNER_POPOVER_ID);
        }
      }
    });

    return () => {
      unsubTheme();
      unsubReady();
      unsubMeta();
    };
  }, [isBanner]);

  const updateState = useCallback(async (newState: CombatState) => {
    await OBR.scene.setMetadata({ [METADATA_KEY]: newState });
  }, []);

  if (isBanner) {
    return <BannerView state={state} />;
  }

  if (!sceneReady) {
    return (
      <div className="no-scene">
        <div className="no-scene-icon">⚔</div>
        <p>No scene loaded.</p>
        <p className="no-scene-sub">Open a scene to use Old School Combat.</p>
      </div>
    );
  }

  if (role === "GM") {
    return <GMPanel state={state} onUpdate={updateState} />;
  }

  return <PlayerView state={state} />;
}
