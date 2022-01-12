import { RecordingId } from "@recordreplay/protocol";
import { Action } from "redux";
import { getShowCommandPalette } from "ui/reducers/layout";
import { dismissLocalNag, isLocalNagDismissed, LocalNag } from "ui/setup/prefs";
import { PrimaryPanelName, ViewMode } from "ui/state/layout";
import { asyncStore } from "ui/utils/prefs";
import { trackEvent } from "ui/utils/telemetry";
import { UIThunkAction } from ".";

type SetSelectedPrimaryPanelAction = Action<"set_selected_primary_panel"> & {
  panel: PrimaryPanelName;
};
type SetShowCommandPalette = Action<"set_show_command_palette"> & { value: boolean };
export type SetShowEditorAction = Action<"set_show_editor"> & {
  showEditor: boolean;
};
export type SetShowVideoPanelAction = Action<"set_show_video_panel"> & {
  showVideoPanel: boolean;
};
type SetViewMode = Action<"set_view_mode"> & { viewMode: ViewMode };

export type LayoutAction =
  | SetSelectedPrimaryPanelAction
  | SetShowCommandPalette
  | SetShowEditorAction
  | SetShowVideoPanelAction
  | SetViewMode;

export function setShowCommandPalette(value: boolean): SetShowCommandPalette {
  return { type: "set_show_command_palette", value };
}
export function hideCommandPalette(): SetShowCommandPalette {
  return setShowCommandPalette(false);
}
export function toggleCommandPalette(): UIThunkAction {
  return ({ dispatch, getState }) => {
    const showCommandPalette = getShowCommandPalette(getState());
    dispatch(setShowCommandPalette(!showCommandPalette));
  };
}
export function setViewMode(viewMode: ViewMode): UIThunkAction {
  return async ({ dispatch }) => {
    // There's a possible race condition here so it's important to handle the nag logic first.
    // Otherwise, it's possible for the nag to not be properly dismissed.
    if (viewMode === "dev" && !(await isLocalNagDismissed(LocalNag.YANK_TO_SOURCE))) {
      await dismissLocalNag(LocalNag.YANK_TO_SOURCE);
      dispatch(setSelectedPrimaryPanel("explorer"));
    }

    dispatch({ type: "set_view_mode", viewMode });
    trackEvent(viewMode == "dev" ? "visit devtools" : "visit viewer");
  };
}
export function setShowVideoPanel(showVideoPanel: boolean): SetShowVideoPanelAction {
  return { type: "set_show_video_panel", showVideoPanel };
}

export function setShowEditor(showEditor: boolean): SetShowEditorAction {
  return { type: "set_show_editor", showEditor };
}

export function setSelectedPrimaryPanel(panel: PrimaryPanelName): SetSelectedPrimaryPanelAction {
  return { type: "set_selected_primary_panel", panel };
}

export function loadReplayPrefs(recordingId: RecordingId): UIThunkAction {
  return async ({ dispatch }) => {
    const replaySessions = await asyncStore.replaySessions;
    const session = replaySessions[recordingId];

    if (recordingId && session) {
      const { viewMode, showVideoPanel, showEditor, selectedPrimaryPanel } = session;

      dispatch(setViewMode(viewMode));
      dispatch(setShowEditor(showEditor));
      dispatch(setShowVideoPanel(showVideoPanel));
      dispatch(setSelectedPrimaryPanel(selectedPrimaryPanel));
    }
  };
}