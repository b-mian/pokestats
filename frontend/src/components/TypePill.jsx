import React from "react";
import { typeColor, prettyName } from "../utils/format";

/**
 * Colored type badge used across the app.
 * size: "sm" (lists/cards) | "md" (detail pages)
 */
export default function TypePill({ type, size = "sm" }) {
  if (!type) return null;
  const style = {
    display: "inline-block",
    padding: size === "md" ? "4px 12px" : "2px 8px",
    borderRadius: 8,
    background: typeColor(type),
    color: "#fff",
    fontWeight: 700,
    fontSize: size === "md" ? 14 : 12,
    marginRight: 6,
    textShadow: "0 1px 2px rgba(0,0,0,0.35)",
  };
  return <span style={style}>{prettyName(type)}</span>;
}
