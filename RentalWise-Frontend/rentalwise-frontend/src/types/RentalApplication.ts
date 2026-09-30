// Mirrors RentalWise.Application.DTOs.Applications.
// Enums arrive as numbers plus a readable *Name string, as elsewhere in this API.

export const RentalApplicationStatus = {
  Submitted: 1,
  Approved: 2,
  Declined: 3,
  Withdrawn: 4,
} as const;

export type RentalApplicationStatusValue =
  (typeof RentalApplicationStatus)[keyof typeof RentalApplicationStatus];

export interface RentalApplication {
  id: number;
  propertyId: number;
  propertyName?: string | null;
  propertyAddress?: string | null;
  propertySuburb?: string | null;
  propertyRentAmount?: number | null;
  tenantId: string;
  applicantName?: string | null;
  applicantEmail?: string | null;
  applicantPhone?: string | null;
  message?: string | null;
  status: RentalApplicationStatusValue;
  statusName: string;
  createdAtUtc: string;
  decidedAtUtc?: string | null;
  decisionNote?: string | null;
  leaseId?: number | null;
  leaseStartDate?: string | null;
  leaseEndDate?: string | null;
  /** True when the lease covers today - the condition for reporting maintenance. */
  leaseIsCurrent: boolean;
}

export interface ApproveApplicationInput {
  startDate?: string;
  endDate?: string;
  rentAmount?: number;
  note?: string;
}
