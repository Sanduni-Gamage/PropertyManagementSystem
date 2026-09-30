// Mirrors the maintenance DTOs in RentalWise.Application.
//
// The API serialises enums as numbers (there is no global string-enum converter), so each
// enum field arrives as a number alongside a readable *Name string. The numeric values must
// stay in step with RentalWise.Domain.Enum.

export const MaintenanceCategory = {
  Unknown: 0,
  Plumbing: 1,
  Flooding: 2,
  Electrical: 3,
  GasOrFumes: 4,
  HeatingCooling: 5,
  Appliance: 6,
  StructuralOrRoof: 7,
  PestControl: 8,
  LocksAndSecurity: 9,
  SmokeAlarm: 10,
  Grounds: 11,
  Other: 99,
} as const;

export type MaintenanceCategoryValue =
  (typeof MaintenanceCategory)[keyof typeof MaintenanceCategory];

export const MaintenanceUrgency = {
  Unknown: 0,
  Low: 1,
  Medium: 2,
  High: 3,
  Emergency: 4,
} as const;

export type MaintenanceUrgencyValue =
  (typeof MaintenanceUrgency)[keyof typeof MaintenanceUrgency];

export const MaintenanceStatus = {
  Submitted: 1,
  Acknowledged: 2,
  InProgress: 3,
  Resolved: 4,
  Cancelled: 5,
} as const;

export type MaintenanceStatusValue =
  (typeof MaintenanceStatus)[keyof typeof MaintenanceStatus];

/** Order matters: used to render the urgency selector and to compare severity. */
export const URGENCY_OPTIONS: { value: MaintenanceUrgencyValue; label: string; hint: string }[] = [
  { value: MaintenanceUrgency.Low, label: "Low", hint: "Cosmetic or minor; can wait" },
  { value: MaintenanceUrgency.Medium, label: "Medium", hint: "Inconvenient but liveable" },
  { value: MaintenanceUrgency.High, label: "High", hint: "Affects living here, or worsening" },
  { value: MaintenanceUrgency.Emergency, label: "Emergency", hint: "Immediate risk right now" },
];

export const CATEGORY_OPTIONS: { value: MaintenanceCategoryValue; label: string }[] = [
  { value: MaintenanceCategory.Plumbing, label: "Plumbing" },
  { value: MaintenanceCategory.Flooding, label: "Flooding" },
  { value: MaintenanceCategory.Electrical, label: "Electrical" },
  { value: MaintenanceCategory.GasOrFumes, label: "Gas or fumes" },
  { value: MaintenanceCategory.HeatingCooling, label: "Heating / cooling" },
  { value: MaintenanceCategory.Appliance, label: "Appliance" },
  { value: MaintenanceCategory.StructuralOrRoof, label: "Structural or roof" },
  { value: MaintenanceCategory.PestControl, label: "Pests" },
  { value: MaintenanceCategory.LocksAndSecurity, label: "Locks and security" },
  { value: MaintenanceCategory.SmokeAlarm, label: "Smoke alarm" },
  { value: MaintenanceCategory.Grounds, label: "Grounds" },
  { value: MaintenanceCategory.Other, label: "Something else" },
];

export interface TenantProperty {
  propertyId: number;
  name: string;
  address: string;
  suburb?: string | null;
  leaseStartDate: string;
  leaseEndDate: string;
}

export interface TriageMessage {
  role: "tenant" | "agent";
  content: string;
}

/** One tool the agent called, shown in the trace panel. */
export interface AgentToolCall {
  name: string;
  arguments: string;
  result: string;
  durationMs: number;
  succeeded: boolean;
  error?: string | null;
}

export interface MaintenanceRequestSummary {
  id: number;
  propertyId: number;
  propertyName?: string | null;
  tenantName?: string | null;
  title: string;
  category: MaintenanceCategoryValue;
  categoryName: string;
  urgency: MaintenanceUrgencyValue;
  urgencyName: string;
  status: MaintenanceStatusValue;
  statusName: string;
  requiresUrgentEscalation: boolean;
  createdAtUtc: string;
}

/** The agent's proposal. Nothing has been saved at this point. */
export interface TriageResult {
  needsMoreInfo: boolean;
  followUpQuestions: string[];
  proposedTitle: string;
  category: MaintenanceCategoryValue;
  categoryName: string;
  urgency: MaintenanceUrgencyValue;
  urgencyName: string;
  summary: string;
  reasoning: string;
  confidence: number;
  requiresUrgentEscalation: boolean;
  escalationReason?: string | null;
  safetyAdvice: string[];
  proposedLandlordMessage: string;
  possibleDuplicates: MaintenanceRequestSummary[];
  idempotencyKey: string;
  model: string;
  toolCalls: AgentToolCall[];
}

export interface MaintenanceRequestEvent {
  id: number;
  eventType: number;
  eventTypeName: string;
  detail?: string | null;
  createdAtUtc: string;
}

export interface MaintenanceRequestDetail extends MaintenanceRequestSummary {
  propertyAddress?: string | null;
  tenantId: string;
  tenantEmail?: string | null;
  tenantPhone?: string | null;
  description: string;
  /** JSON array of AgentToolCall, as stored at approval time. */
  agentToolTrace?: string | null;
  escalationReason?: string | null;
  aiCategory: MaintenanceCategoryValue;
  aiUrgency: MaintenanceUrgencyValue;
  tenantOverrodeAgent: boolean;
  aiSummary?: string | null;
  aiReasoning?: string | null;
  aiConfidence?: number | null;
  aiModel?: string | null;
  proposedLandlordMessage?: string | null;
  updatedAtUtc?: string | null;
  events: MaintenanceRequestEvent[];
}

export interface CreateMaintenanceRequest {
  propertyId: number;
  title: string;
  description: string;
  category: MaintenanceCategoryValue;
  urgency: MaintenanceUrgencyValue;
  aiCategory: MaintenanceCategoryValue;
  aiUrgency: MaintenanceUrgencyValue;
  aiSummary?: string;
  aiReasoning?: string;
  aiConfidence?: number;
  aiModel?: string;
  proposedLandlordMessage?: string;
  agentToolTrace?: string;
  idempotencyKey: string;
  allowDuplicate: boolean;
}

export interface MaintenanceCreateResult {
  request: MaintenanceRequestDetail;
  /** True when the idempotency key had already been used, so nothing new was written. */
  wasExistingRequest: boolean;
  /** True when the server read the row back after writing it. */
  verifiedInDatabase: boolean;
}
