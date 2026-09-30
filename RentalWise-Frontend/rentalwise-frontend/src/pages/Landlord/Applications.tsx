import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  approveApplication,
  declineApplication,
  loadLandlordApplications,
} from "../../slices/applicationsSlice";
import {
  RentalApplicationStatus,
  type RentalApplication,
} from "../../types/RentalApplication";

/**
 * The landlord's application queue. Offering a tenancy here creates the lease, which is
 * what lets the tenant start reporting maintenance.
 */
export default function Applications() {
  const dispatch = useAppDispatch();
  const { landlord, landlordLoading, error } = useAppSelector((state) => state.applications);

  useEffect(() => {
    dispatch(loadLandlordApplications());
  }, [dispatch]);

  const pending = landlord.filter((a) => a.status === RentalApplicationStatus.Submitted);
  const decided = landlord.filter((a) => a.status !== RentalApplicationStatus.Submitted);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Applications</h1>
        <p className="mt-1 text-sm text-gray-600">
          Offering a tenancy creates the lease straight away, so the tenant can then report
          maintenance.
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {landlordLoading && <p className="text-sm text-gray-500">Loading…</p>}

      {!landlordLoading && landlord.length === 0 && (
        <p className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
          No one has applied for your listings yet.
        </p>
      )}

      {pending.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            Awaiting your decision ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        </section>
      )}

      {decided.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Decided</h2>
          <div className="space-y-3">
            {decided.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ApplicationCard({ application }: { application: RentalApplication }) {
  const dispatch = useAppDispatch();
  const decidingId = useAppSelector((state) => state.applications.decidingId);

  const [showTerms, setShowTerms] = useState(false);
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(inTwelveMonths());
  const [rentAmount, setRentAmount] = useState<string>(
    application.propertyRentAmount != null ? String(application.propertyRentAmount) : "",
  );
  const [note, setNote] = useState("");

  const busy = decidingId === application.id;
  const isPending = application.status === RentalApplicationStatus.Submitted;
  const futureStart = startDate > today();

  function offer() {
    dispatch(
      approveApplication({
        id: application.id,
        input: {
          startDate,
          endDate,
          rentAmount: rentAmount.trim() === "" ? undefined : Number(rentAmount),
          note: note.trim() || undefined,
        },
      }),
    );
  }

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">
            {application.propertyName ?? `Property #${application.propertyId}`}
          </h3>
          <p className="text-sm text-gray-600">
            {application.propertyAddress}
            {application.propertySuburb ? `, ${application.propertySuburb}` : ""}
          </p>
        </div>
        <StatusChip application={application} />
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="text-gray-500">Applicant</dt>
          <dd className="text-gray-900">{application.applicantName ?? "Name not provided"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-gray-500">Email</dt>
          <dd className="text-gray-900">{application.applicantEmail ?? "-"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-gray-500">Phone</dt>
          <dd className="text-gray-900">{application.applicantPhone ?? "-"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-gray-500">Applied</dt>
          <dd className="text-gray-900">
            {new Date(application.createdAtUtc).toLocaleDateString()}
          </dd>
        </div>
      </dl>

      {application.message && (
        <blockquote className="mt-3 border-l-2 border-gray-300 pl-3 text-sm italic text-gray-700">
          {application.message}
        </blockquote>
      )}

      {application.leaseId && (
        <div className="mt-3 rounded bg-green-50 p-3 text-sm text-green-900">
          Lease #{application.leaseId} runs{" "}
          {application.leaseStartDate &&
            new Date(application.leaseStartDate).toLocaleDateString()}{" "}
          to{" "}
          {application.leaseEndDate && new Date(application.leaseEndDate).toLocaleDateString()}.
          {application.leaseIsCurrent ? (
            <>
              {" "}
              It is current, so this tenant can now{" "}
              <Link to="/tenant/maintenance" className="underline">
                report maintenance
              </Link>
              .
            </>
          ) : (
            " It is not current yet, so maintenance cannot be reported against it until it starts."
          )}
        </div>
      )}

      {application.decisionNote && (
        <p className="mt-2 text-sm text-gray-600">Your note: {application.decisionNote}</p>
      )}

      {isPending && (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-3">
          {showTerms && (
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-700">Lease starts</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-700">Lease ends</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-700">Weekly rent</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={rentAmount}
                  onChange={(event) => setRentAmount(event.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
                />
              </label>
            </div>
          )}

          {showTerms && futureStart && (
            <p className="rounded bg-amber-50 p-2 text-xs text-amber-900">
              A start date in the future means the tenant cannot report maintenance until
              then.
            </p>
          )}

          {showTerms && (
            <label className="block">
              <span className="text-xs font-medium text-gray-700">
                Note to the tenant <span className="text-gray-400">(optional)</span>
              </span>
              <input
                type="text"
                value={note}
                maxLength={500}
                onChange={(event) => setNote(event.target.value)}
                className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
              />
            </label>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={offer}
              disabled={busy}
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {busy ? "Working…" : "Offer tenancy"}
            </button>

            <button
              type="button"
              onClick={() =>
                dispatch(declineApplication({ id: application.id, note: note.trim() || undefined }))
              }
              disabled={busy}
              className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Decline
            </button>

            <button
              type="button"
              onClick={() => setShowTerms((value) => !value)}
              className="text-sm text-gray-500 underline hover:text-gray-700"
            >
              {showTerms ? "Use defaults" : "Edit lease terms"}
            </button>

            {!showTerms && (
              <span className="text-xs text-gray-500">
                Starts today, runs 12 months, at the listed rent.
              </span>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function StatusChip({ application }: { application: RentalApplication }) {
  const styles: Record<number, string> = {
    [RentalApplicationStatus.Submitted]: "bg-blue-100 text-blue-800",
    [RentalApplicationStatus.Approved]: "bg-green-100 text-green-800",
    [RentalApplicationStatus.Declined]: "bg-gray-200 text-gray-700",
    [RentalApplicationStatus.Withdrawn]: "bg-gray-200 text-gray-700",
  };

  const labels: Record<number, string> = {
    [RentalApplicationStatus.Submitted]: "Awaiting decision",
    [RentalApplicationStatus.Approved]: "Tenancy offered",
    [RentalApplicationStatus.Declined]: "Declined",
    [RentalApplicationStatus.Withdrawn]: "Withdrawn by tenant",
  };

  return (
    <span
      className={`rounded px-2.5 py-1 text-xs font-medium ${
        styles[application.status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {labels[application.status] ?? application.statusName}
    </span>
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function inTwelveMonths(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 12);
  return date.toISOString().slice(0, 10);
}
