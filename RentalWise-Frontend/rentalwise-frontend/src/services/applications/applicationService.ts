import api from "../api";
import type { ApproveApplicationInput, RentalApplication } from "../../types/RentalApplication";

export async function applyForProperty(
  propertyId: number,
  message?: string,
): Promise<RentalApplication> {
  const response = await api.post<RentalApplication>("/applications", { propertyId, message });
  return response.data;
}

/** The signed-in tenant's own applications. */
export async function fetchMyApplications(): Promise<RentalApplication[]> {
  const response = await api.get<RentalApplication[]>("/applications/mine");
  return response.data;
}

/** Applications across all of the signed-in landlord's listings. */
export async function fetchLandlordApplications(): Promise<RentalApplication[]> {
  const response = await api.get<RentalApplication[]>("/applications");
  return response.data;
}

/**
 * Offers the tenancy, which creates the lease. An empty body takes the listing's rent,
 * a start date of today and a twelve-month term.
 */
export async function approveApplication(
  id: number,
  input: ApproveApplicationInput = {},
): Promise<RentalApplication> {
  const response = await api.post<RentalApplication>(`/applications/${id}/approve`, input);
  return response.data;
}

export async function declineApplication(id: number, note?: string): Promise<RentalApplication> {
  const response = await api.post<RentalApplication>(`/applications/${id}/decline`, { note });
  return response.data;
}

export async function withdrawApplication(id: number): Promise<RentalApplication> {
  const response = await api.post<RentalApplication>(`/applications/${id}/withdraw`);
  return response.data;
}

export { describeApiError } from "../apiError";
