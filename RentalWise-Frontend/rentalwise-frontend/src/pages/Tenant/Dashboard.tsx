import { useEffect } from "react";
import { Link } from "react-router-dom";
import { TbHome, TbTool, TbFileText, TbChevronRight } from "react-icons/tb";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loadMyProperties, loadRequests } from "../../slices/maintenanceSlice";
import { loadMyApplications } from "../../slices/applicationsSlice";
import { MaintenanceStatus, type MaintenanceRequestSummary } from "../../types/Maintenance";
import {
  RentalApplicationStatus,
  type RentalApplication,
} from "../../types/RentalApplication";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Notice,
  SectionHeading,
  StatTile,
} from "../../components/UI/Primitives";
import { statusLabel, statusTone } from "../../components/Maintenance/tones";

/**
 * Tenant home: where they live, what they have reported, and what they have applied for.
 *
 * Everything here comes from endpoints that already exist, so the page is a view over the
 * tenant's state rather than new surface area.
 */
export default function TenantDashboard() {
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const { properties, propertiesLoading, requests, requestsLoading } = useAppSelector(
    (state) => state.maintenance,
  );
  const { mine: applications, mineLoading } = useAppSelector((state) => state.applications);

  useEffect(() => {
    dispatch(loadMyProperties());
    dispatch(loadRequests());
    dispatch(loadMyApplications());
  }, [dispatch]);

  const openRequests = requests.filter(
    (r) =>
      r.status === MaintenanceStatus.Submitted ||
      r.status === MaintenanceStatus.Acknowledged ||
      r.status === MaintenanceStatus.InProgress,
  );
  const urgent = openRequests.filter((r) => r.requiresUrgentEscalation);
  const pendingApplications = applications.filter(
    (a) => a.status === RentalApplicationStatus.Submitted,
  );
  const offered = applications.filter((a) => a.status === RentalApplicationStatus.Approved);

  const hasTenancy = properties.length > 0;

  return (
    <div className="min-h-screen bg-surface-page">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Your rentals</h1>
          <p className="mt-1 text-ink-subtle">
            {user?.firstName ? `Welcome back, ${user.firstName}` : (user?.email ?? "Signed in")}
          </p>
        </header>

        {urgent.length > 0 && (
          <Notice tone="critical" title="Urgent issue reported">
            {urgent.length === 1
              ? "One of your reports is flagged as urgent."
              : `${urgent.length} of your reports are flagged as urgent.`}{" "}
            If anyone is in danger, call 111.
          </Notice>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label="Tenancies" value={properties.length} />
          <StatTile label="Open requests" value={openRequests.length} />
          <StatTile label="Applications pending" value={pendingApplications.length} />
        </div>

        {/* --- tenancies --- */}
        <section>
          <SectionHeading title="Where you live" />

          {propertiesLoading && properties.length === 0 && <SkeletonCard />}

          {!propertiesLoading && !hasTenancy && (
            <EmptyState
              title="No current tenancy"
              description="Once a landlord offers you a tenancy, it will appear here and you can start reporting maintenance."
              action={
                <Link to="/rental">
                  <Button size="lg">Browse rentals</Button>
                </Link>
              }
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {properties.map((property) => (
              <Card key={property.propertyId} className="p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-lg bg-brand-50 p-2 text-brand-500">
                    <TbHome className="text-xl" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-ink">{property.name}</h3>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {property.address}
                      {property.suburb ? `, ${property.suburb}` : ""}
                    </p>
                    <p className="mt-2 text-xs text-ink-subtle">
                      Lease {new Date(property.leaseStartDate).toLocaleDateString()} -{" "}
                      {new Date(property.leaseEndDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Link to="/tenant/maintenance" className="mt-4 block">
                  <Button variant="secondary" className="w-full">
                    Report an issue
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </section>

        {/* --- maintenance --- */}
        <section>
          <SectionHeading
            title="Maintenance"
            action={
              hasTenancy ? (
                <Link
                  to="/tenant/maintenance"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-600"
                >
                  Report an issue <TbChevronRight />
                </Link>
              ) : undefined
            }
          />

          {requestsLoading && requests.length === 0 && <SkeletonCard />}

          {!requestsLoading && requests.length === 0 && (
            <EmptyState
              title="Nothing reported yet"
              description="Anything you report will show up here with its progress."
            />
          )}

          <div className="space-y-3">
            {requests.slice(0, 5).map((request) => (
              <RequestRow key={request.id} request={request} />
            ))}
          </div>

          {requests.length > 5 && (
            <Link
              to="/tenant/maintenance"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-600"
            >
              See all {requests.length} requests <TbChevronRight />
            </Link>
          )}
        </section>

        {/* --- applications --- */}
        <section>
          <SectionHeading title="Your applications" />

          {offered.length > 0 && (
            <div className="mb-3">
              <Notice tone="positive" title="You have been offered a tenancy">
                Your lease is set up, so you can report maintenance straight away.
              </Notice>
            </div>
          )}

          {mineLoading && applications.length === 0 && <SkeletonCard />}

          {!mineLoading && applications.length === 0 && (
            <EmptyState
              title="No applications yet"
              description="Apply for a rental and you can track the landlord's decision here."
              action={
                <Link to="/rental">
                  <Button size="lg">Browse rentals</Button>
                </Link>
              }
            />
          )}

          <div className="space-y-3">
            {applications.slice(0, 5).map((application) => (
              <ApplicationRow key={application.id} application={application} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card className="p-5">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-1/3 rounded bg-surface-sunken" />
        <div className="h-3 w-2/3 rounded bg-surface-sunken" />
      </div>
    </Card>
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
            #{request.id}
            {request.propertyName ? ` · ${request.propertyName}` : ""} · {request.categoryName}{" "}
            · reported {new Date(request.createdAtUtc).toLocaleDateString()}
          </p>
        </div>
      </div>
    </Card>
  );
}

function ApplicationRow({ application }: { application: RentalApplication }) {
  const tone =
    application.status === RentalApplicationStatus.Approved
      ? "positive"
      : application.status === RentalApplicationStatus.Submitted
        ? "info"
        : "neutral";

  const label =
    application.status === RentalApplicationStatus.Approved
      ? "Tenancy offered"
      : application.status === RentalApplicationStatus.Submitted
        ? "Awaiting decision"
        : application.statusName;

  return (
    <Card interactive className="p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-lg bg-surface-sunken p-2 text-ink-subtle">
          <TbFileText className="text-lg" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-ink">
              {application.propertyName ?? `Property #${application.propertyId}`}
            </h3>
            <Badge tone={tone}>{label}</Badge>
          </div>
          <p className="mt-1 text-xs text-ink-subtle">
            {application.propertyAddress}
            {application.propertySuburb ? `, ${application.propertySuburb}` : ""} · applied{" "}
            {new Date(application.createdAtUtc).toLocaleDateString()}
          </p>
          {application.decisionNote && (
            <p className="mt-2 rounded-lg bg-surface-sunken px-3 py-2 text-sm text-ink-muted">
              {application.decisionNote}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
