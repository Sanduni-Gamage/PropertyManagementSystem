import { useEffect } from "react";
import { Link } from "react-router-dom";
import { TbHome, TbTool } from "react-icons/tb";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loadMyProperties, loadRequests, selectProperty } from "../../slices/maintenanceSlice";
import MaintenanceAgentChat from "../../components/Maintenance/MaintenanceAgentChat";
import type { MaintenanceRequestSummary } from "../../types/Maintenance";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  SectionHeading,
} from "../../components/UI/Primitives";
import { statusLabel, statusTone } from "../../components/Maintenance/tones";

/**
 * Tenant maintenance page: pick a tenancy, describe the issue to the assistant, approve the
 * draft, and see what has already been reported.
 */
export default function MaintenanceRequests() {
  const dispatch = useAppDispatch();
  const {
    properties,
    propertiesLoading,
    selectedPropertyId,
    requests,
    requestsLoading,
  } = useAppSelector((state) => state.maintenance);

  useEffect(() => {
    dispatch(loadMyProperties());
    dispatch(loadRequests());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-surface-page">
      <div className="mx-auto max-w-3xl space-y-7 px-4 py-8 sm:px-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Report maintenance</h1>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Describe the problem in your own words. The assistant checks your property
            record and recent requests, then drafts a request for your landlord - you
            approve it before anything is sent.
          </p>
        </header>

        {propertiesLoading && properties.length === 0 && (
          <Card className="p-5">
            <div className="h-4 w-1/3 animate-pulse rounded bg-surface-sunken" />
          </Card>
        )}

        {!propertiesLoading && properties.length === 0 && (
          <EmptyState
            title="No current tenancy"
            description="Maintenance can only be reported against a property you currently lease, and there is no active lease on your account."
            action={
              <Link to="/rental">
                <Button size="lg">Browse rentals</Button>
              </Link>
            }
          />
        )}

        {properties.length > 1 && (
          <Card className="p-5">
            <label className="block">
              <span className="text-sm font-semibold text-ink">Which property?</span>
              <select
                value={selectedPropertyId ?? ""}
                onChange={(event) =>
                  dispatch(selectProperty(event.target.value ? Number(event.target.value) : null))
                }
                className="mt-2 w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink focus:border-brand-500 focus:outline-none"
              >
                <option value="">Select a property…</option>
                {properties.map((property) => (
                  <option key={property.propertyId} value={property.propertyId}>
                    {property.name} - {property.address}
                  </option>
                ))}
              </select>
            </label>
          </Card>
        )}

        {properties.length === 1 && (
          <Card className="flex items-center gap-3 p-4">
            <span className="rounded-lg bg-brand-50 p-2 text-brand-500">
              <TbHome className="text-xl" />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-ink-subtle">Reporting for</p>
              <p className="truncate font-semibold text-ink">{properties[0].name}</p>
              <p className="truncate text-sm text-ink-muted">{properties[0].address}</p>
            </div>
          </Card>
        )}

        {selectedPropertyId !== null && <MaintenanceAgentChat propertyId={selectedPropertyId} />}

        <section>
          <SectionHeading title="Your requests" />

          {requestsLoading && requests.length === 0 && (
            <Card className="p-5">
              <div className="h-4 w-1/3 animate-pulse rounded bg-surface-sunken" />
            </Card>
          )}

          {!requestsLoading && requests.length === 0 && (
            <EmptyState
              title="Nothing reported yet"
              description="Anything you report will appear here with its progress."
            />
          )}

          <div className="space-y-3">
            {requests.map((request) => (
              <RequestRow key={request.id} request={request} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function RequestRow({ request }: { request: MaintenanceRequestSummary }) {
  return (
    <Card interactive className="p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-lg bg-surface-sunken p-2 text-ink-subtle">
          <TbTool className="text-lg" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-ink">{request.title}</h3>
            <div className="flex items-center gap-2">
              {request.requiresUrgentEscalation && <Badge tone="critical">Urgent</Badge>}
              <Badge tone={statusTone(request.statusName)}>
                {statusLabel(request.statusName)}
              </Badge>
            </div>
          </div>
          <p className="mt-1 text-xs text-ink-subtle">
            #{request.id} · {request.categoryName} · {request.urgencyName} · reported{" "}
            {new Date(request.createdAtUtc).toLocaleDateString()}
          </p>
        </div>
      </div>
    </Card>
  );
}
