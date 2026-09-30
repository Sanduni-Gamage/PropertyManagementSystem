import type { AgentToolCall } from "../../types/Maintenance";

/**
 * Turns a raw tool call into something a landlord or tenant can read.
 *
 * The trace is the most convincing part of the assistant - it shows it looked things up
 * rather than guessing - but a JSON dump only convinces engineers. This renders the same
 * evidence as a sentence and a few facts, with the raw payload still one click away.
 *
 * Unknown tools fall back to a humanised name and no summary, so adding a tool server-side
 * degrades to "shows the raw data" rather than breaking the panel.
 */
export interface ToolSummary {
  /** What the assistant did, in plain words. */
  title: string;
  /** One-line answer it got back. */
  headline?: string;
  /** Supporting line, such as an address. */
  detail?: string;
  /** Short chips of individual facts. */
  facts: string[];
  /** List entries, such as previous requests. */
  items?: string[];
  /** Set when the tool refused or failed, replacing the summary. */
  problem?: string;
}

const TITLES: Record<string, string> = {
  get_property_details: "Looked up the property",
  get_maintenance_history: "Checked past requests",
};

export function summariseToolCall(call: AgentToolCall): ToolSummary {
  const title = TITLES[call.name] ?? humanise(call.name);
  const data = parse(call.result);

  if (!data) {
    return { title, facts: [], problem: "The result could not be read." };
  }

  if (typeof data.error === "string") {
    return { title, facts: [], problem: explainError(data) };
  }

  if (call.name === "get_property_details") return { title, ...describeProperty(data) };
  if (call.name === "get_maintenance_history") return { title, ...describeHistory(data) };

  return { title, facts: [] };
}

function describeProperty(data: Record<string, unknown>): Omit<ToolSummary, "title"> {
  const facts: string[] = [];

  const bedrooms = num(data.bedrooms);
  const bathrooms = num(data.bathrooms);
  if (bedrooms !== null) facts.push(plural(bedrooms, "bedroom"));
  if (bathrooms !== null) facts.push(plural(bathrooms, "bathroom"));
  if (str(data.propertyType)) facts.push(str(data.propertyType)!);

  if (data.smokeAlarmInstalled === true) facts.push("Smoke alarm fitted");
  if (data.smokeAlarmInstalled === false) facts.push("No smoke alarm recorded");

  const features = str(data.features);
  if (features && features !== "None") facts.push(features.split(",").join(", "));

  const place = [str(data.suburb), str(data.region)].filter(Boolean).join(", ");

  return {
    headline: str(data.name) ?? (place || undefined),
    detail: str(data.address),
    facts,
    items: leaseLine(data),
  };
}

function leaseLine(data: Record<string, unknown>): string[] | undefined {
  const lease = data.yourLease as Record<string, unknown> | undefined;
  if (!lease) return undefined;

  const from = date(str(lease.startDate));
  const to = date(str(lease.endDate));
  if (!from || !to) return undefined;

  return [`Tenancy runs ${from} to ${to}`];
}

function describeHistory(data: Record<string, unknown>): Omit<ToolSummary, "title"> {
  const days = num(data.lookbackDays) ?? 30;
  const requests = Array.isArray(data.requests) ? data.requests : [];
  const count = num(data.count) ?? requests.length;

  if (count === 0) {
    return {
      headline: `Nothing reported for this property in the last ${days} days`,
      facts: [],
    };
  }

  const items = requests.slice(0, 5).map((entry) => {
    const r = entry as Record<string, unknown>;
    const parts = [
      `#${num(r.id) ?? "?"} ${str(r.title) ?? "Untitled"}`,
      str(r.category),
      str(r.status),
      date(str(r.reportedOn)),
    ].filter(Boolean);
    return parts.join(" - ");
  });

  return {
    headline: `${plural(count, "earlier request")} in the last ${days} days`,
    facts: [],
    items,
  };
}

/** Tool errors are machine codes; say what they mean for the person reading. */
function explainError(data: Record<string, unknown>): string {
  switch (data.error) {
    case "not_authorised":
      return "Refused - this tenant does not hold a current lease on that property.";
    case "not_found":
      return "That property no longer exists.";
    case "budget_exhausted":
      return "Stopped - the assistant had used up its lookups for this assessment.";
    case "invalid_arguments":
      return "The assistant asked for this the wrong way, so it was rejected.";
    default:
      return str(data.message) ?? "This lookup could not be completed.";
  }
}

function parse(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** "get_property_details" -> "Get property details" */
function humanise(name: string): string {
  const words = name.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function date(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}
