import { setBreakpointPrefixBadge } from "devtools/client/debugger/src/actions/breakpoints";
import { PrefixBadge } from "devtools/client/debugger/src/reducers/types";
import { Breakpoint } from "devtools/client/debugger/src/selectors";
import React from "react";
import { useAppDispatch } from "ui/setup/hooks";
import { useFeature } from "ui/hooks/settings";
import { PrefixBadgePicker } from "../../../packages/components";

import styles from "./PrefixBadge.module.css";

// Rendered in log point PanelEditor, when a log point is being edited.
// Clicking this item will show the PrefixBadgePicker.
export default function PrefixBadgeButton({ breakpoint }: { breakpoint: Breakpoint }) {
  const { value: enableUnicornConsole } = useFeature("unicornConsole");
  const dispatch = useAppDispatch();

  if (!enableUnicornConsole) {
    return null;
  }

  return (
    <PrefixBadgePicker
      key={breakpoint.options.prefixBadge}
      initialValue={breakpoint.options.prefixBadge}
      onSelect={newPrefixBadge => dispatch(setBreakpointPrefixBadge(breakpoint, newPrefixBadge))}
    />
  );
}

// Rendered in the Console, to the left of message text.
export function MessagePrefixBadge({ prefixBadge }: { prefixBadge: PrefixBadge }) {
  const { value: enableUnicornConsole } = useFeature("unicornConsole");
  if (!enableUnicornConsole) {
    return null;
  }

  if (!prefixBadge) {
    return null;
  }

  const className =
    prefixBadge === "unicorn"
      ? `${styles.MessagePrefixBadgeUnicorn} ${styles.UnicornBadge}`
      : prefixBadge != null
      ? `${styles.MessagePrefixBadgeSolidColor} ${styles[prefixBadge]}`
      : styles.MessagePrefixBadgeSolidColor;

  return <div className={className} />;
}

// Helper method used by the log point PanelEditor, when a log point is being viewed.
// This ensures the point count has a background color that matches the selected badge.
export function getPrefixBadgeBackgroundColorClassName(prefixBadge?: PrefixBadge) {
  return prefixBadge === "unicorn"
    ? styles.unicorn
    : prefixBadge == null
    ? ""
    : styles[prefixBadge];
}
