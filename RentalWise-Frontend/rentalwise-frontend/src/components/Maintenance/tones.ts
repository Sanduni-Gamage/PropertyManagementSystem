import type { BadgeTone } from "../UI/Primitives";

/**
 * Colour mapping for maintenance urgency and status.
 *
 * Shared so the tenant and landlord screens never disagree about what "High" looks like.
 * Keyed on the readable *Name the API sends rather than the numeric enum, so adding a value
 * server-side degrades to neutral instead of throwing.
 */

export function urgencyTone(urgencyName: string): BadgeTone {
  switch (urgencyName) {
    case "Emergency":
      return "critical";
    case "High":
      return "caution";
    case "Medium":
      return "info";
    default:
      return "neutral";
  }
}

export function statusTone(statusName: string): BadgeTone {
  switch (statusName) {
    case "Submitted":
      return "info";
    case "Acknowledged":
    case "InProgress":
      return "caution";
    case "Resolved":
      return "positive";
    default:
      return "neutral";
  }
}

/** "InProgress" reads badly in a pill; everything else is already a single word. */
export function statusLabel(statusName: string): string {
  return statusName === "InProgress" ? "In progress" : statusName;
}
