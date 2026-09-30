import api from "../api";
import type {
  CreateMaintenanceRequest,
  MaintenanceCreateResult,
  MaintenanceRequestDetail,
  MaintenanceRequestSummary,
  TenantProperty,
  TriageMessage,
  TriageResult,
} from "../../types/Maintenance";

/**
 * Raised when the server rejects a create because a similar request is already open.
 *
 * Declared with an explicit field rather than a constructor parameter property, because
 * this project builds with `erasableSyntaxOnly`, which disallows that shorthand.
 */
export class DuplicateRequestError extends Error {
  readonly existingRequestId: number;

  constructor(message: string, existingRequestId: number) {
    super(message);
    this.name = "DuplicateRequestError";
    this.existingRequestId = existingRequestId;
  }
}

export async function fetchMyProperties(): Promise<TenantProperty[]> {
  const response = await api.get<TenantProperty[]>("/maintenance/my-properties");
  return response.data;
}

/**
 * Asks the agent to assess the issue. Read-only - the server writes nothing in response to
 * this, so it is safe to call repeatedly while the tenant refines their description.
 */
export async function triageIssue(
  propertyId: number,
  messages: TriageMessage[],
): Promise<TriageResult> {
  const response = await api.post<TriageResult>("/maintenance/triage", {
    propertyId,
    messages,
  });
  return response.data;
}

/**
 * Submits the draft the tenant approved. Safe to retry with the same payload: the
 * idempotency key means a replay returns the original request rather than creating a
 * second one.
 */
export async function createRequest(
  payload: CreateMaintenanceRequest,
): Promise<MaintenanceCreateResult> {
  try {
    const response = await api.post<MaintenanceCreateResult>("/maintenance/requests", payload);
    return response.data;
  } catch (error: unknown) {
    const conflict = asConflict(error);
    if (conflict) {
      throw new DuplicateRequestError(conflict.message, conflict.existingRequestId);
    }
    throw error;
  }
}

export async function fetchRequests(): Promise<MaintenanceRequestSummary[]> {
  const response = await api.get<MaintenanceRequestSummary[]>("/maintenance/requests");
  return response.data;
}

export async function fetchRequest(id: number): Promise<MaintenanceRequestDetail> {
  const response = await api.get<MaintenanceRequestDetail>(`/maintenance/requests/${id}`);
  return response.data;
}

export async function updateRequestStatus(
  id: number,
  status: number,
): Promise<MaintenanceRequestDetail> {
  const response = await api.patch<MaintenanceRequestDetail>(
    `/maintenance/requests/${id}/status`,
    { status },
  );
  return response.data;
}

/**
 * Development helper: gives the signed-in tenant a lease on a property so the flow can be
 * demonstrated. Returns 404 when the API is not running in Development.
 */
export async function seedDemoLease(propertyId: number): Promise<void> {
  await api.post(`/maintenance/dev/demo-lease?propertyId=${propertyId}`);
}

/** Narrows an Axios error to the 409 duplicate payload the API returns. */
function asConflict(
  error: unknown,
): { message: string; existingRequestId: number } | null {
  const response = (error as { response?: { status?: number; data?: unknown } })?.response;
  if (response?.status !== 409) return null;

  const data = response.data as { message?: string; existingRequestId?: number } | undefined;
  if (typeof data?.existingRequestId !== "number") return null;

  return {
    message: data.message ?? "A similar request is already open.",
    existingRequestId: data.existingRequestId,
  };
}

// Shared across features; re-exported so existing callers keep working.
export { describeApiError } from "../apiError";
