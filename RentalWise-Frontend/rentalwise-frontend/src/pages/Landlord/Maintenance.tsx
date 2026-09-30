import { useEffect, useMemo, useState } from "react";
import { TbAlertTriangle, TbTool, TbX } from "react-icons/tb";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  changeRequestStatus,
  closeRequestDetail,
  loadRequestDetail,
  loadRequests,
} from "../../slices/maintenanceSlice";
import {
  MaintenanceStatus,
  type AgentToolCall,
  type MaintenanceRequestDetail,
  type MaintenanceRequestSummary,
} from "../../types/Maintenance";
import AgentTraceList from "../../components/Maintenance/AgentTraceList";
import { statusLabel, statusTone, urgencyTone } from "../../components/Maintenance/tones";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Notice,
  SectionHeading,
} from "../../components/UI/Primitives";

/**
 * The landlord's maintenance queue.
 *
 * The API already returns these urgent-first, which is the order they need working through.
 * Opening one shows what the assistant concluded *and* what it actually looked up, so the
 * landlord can judge the assessment rather than take it on trust.
 */
export default function LandlordMaintenance() {
  const dispatch = useAppDispatch();
  const { requests, requestsLoading, selectedRequest, selectedLoading } = useAppSelector(
    (state) => state.maintenance,
  );

  const [statusFilter, setStatusFilter] = useState<number | "all" | "open">("open");
  const [urgentOnly, setUrgentOnly] = useState(false);

  useEffect(() => {
    dispatch(loadRequests());
  }, [dispatch]);

  const visible = useMemo(() => {
    return requests.filter((r) => {
      if (urgentOnly && !r.requiresUrgentEscalation) return false;
      if (statusFilter === "all") return true;
      if (statusFilter === "open") {
        return (
          r.status === MaintenanceStatus.Submitted ||
          r.status === MaintenanceStatus.Acknowledged ||
          r.status === MaintenanceStatus.InProgress
        );
      }
      return r.status === statusFilter;
    });
  }, [requests, statusFilter, urgentOnly]);

  const urgentCount = requests.filter(
    (r) => r.requiresUrgentEscalation && r.status !== MaintenanceStatus.Resolved,
  ).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Maintenance</h1>
        <p className="mt-1 text-ink-muted">
          Issues reported by your tenants, most urgent first.
        </p>
      </header>

      {urgentCount > 0 && (
        <Notice tone="critical" title={`${urgentCount} urgent ${urgentCount === 1 ? "issue" : "issues"}`}>
          {urgentCount === 1 ? "One issue needs" : "These need"} attention before anything
          else in the queue.
        </Notice>
      )}

      <Card className="flex flex-wrap items-center gap-4 px-4 py-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-ink">Show</span>
          <select
            value={String(statusFilter)}
            onChange={(event) => {
              const value = event.target.value;
              setStatusFilter(value === "all" || value === "open" ? value : Number(value));
            }}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink focus:border-brand-500 focus:outline-none"
          >
            <option value="open">Open</option>
            <option value="all">All</option>
            <option value={MaintenanceStatus.Submitted}>Submitted</option>
            <option value={MaintenanceStatus.Acknowledged}>Acknowledged</option>
            <option value={MaintenanceStatus.InProgress}>In progress</option>
            <option value={MaintenanceStatus.Resolved}>Resolved</option>
            <option value={MaintenanceStatus.Cancelled}>Cancelled</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-ink-muted">
          <input
            type="checkbox"
            checked={urgentOnly}
            onChange={(event) => setUrgentOnly(event.target.checked)}
            className="h-4 w-4 rounded border-line text-brand-500 focus:ring-brand-200"
          />
          Urgent only
        </label>

        <span className="ml-auto text-sm text-ink-subtle">
          {visible.length} of {requests.length}
        </span>
      </Card>

      {requestsLoading && requests.length === 0 && (
        <Card className="p-5">
          <div className="h-4 w-1/3 animate-pulse rounded bg-surface-sunken" />
        </Card>
      )}

      {!requestsLoading && requests.length === 0 && (
        <EmptyState
          title="No maintenance reported"
          description="When a tenant reports an issue, it will appear here with the assistant's assessment."
        />
      )}

      {!requestsLoading && requests.length > 0 && visible.length === 0 && (
        <EmptyState title="Nothing matches that filter" />
      )}

      <ul className="space-y-3">
        {visible.map((request) => (
          <li key={request.id}>
            <button
              type="button"
              onClick={() => dispatch(loadRequestDetail(request.id))}
              className="block w-full text-left"
            >
              <Card interactive className="p-4">
                <RequestRow request={request} />
              </Card>
            </button>
          </li>
        ))}
      </ul>

      {(selectedRequest || selectedLoading) && (
        <DetailDrawer
          request={selectedRequest}
          loading={selectedLoading}
          onClose={() => dispatch(closeRequestDetail())}
        />
      )}
    </div>
  );
}

function RequestRow({ request }: { request: MaintenanceRequestSummary }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-0.5 rounded-lg p-2 ${
          request.requiresUrgentEscalation
            ? "bg-critical-50 text-critical-600"
            : "bg-surface-sunken text-ink-subtle"
        }`}
      >
        {request.requiresUrgentEscalation ? (
          <TbAlertTriangle className="text-lg" />
        ) : (
          <TbTool className="text-lg" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-ink">{request.title}</h3>
          <div className="flex items-center gap-2">
            {request.requiresUrgentEscalation && <Badge tone="critical">Urgent</Badge>}
            <Badge tone={urgencyTone(request.urgencyName)}>{request.urgencyName}</Badge>
            <Badge tone={statusTone(request.statusName)}>
              {statusLabel(request.statusName)}
            </Badge>
          </div>
        </div>
        <p className="mt-1 text-xs text-ink-subtle">
          #{request.id} · {request.propertyName ?? `Property #${request.propertyId}`}
          {request.tenantName ? ` · ${request.tenantName}` : ""} · {request.categoryName} ·{" "}
          {new Date(request.createdAtUtc).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

function DetailDrawer({
  request,
  loading,
  onClose,
}: {
  request: MaintenanceRequestDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const statusUpdatingId = useAppSelector((state) => state.maintenance.statusUpdatingId);

  const toolCalls = useMemo<AgentToolCall[]>(() => {
    if (!request?.agentToolTrace) return [];
    try {
      const parsed = JSON.parse(request.agentToolTrace);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [request?.agentToolTrace]);

  const busy = request != null && statusUpdatingId === request.id;

  return (
    <div className="fixed inset-0 z-[150] flex justify-end bg-ink/40 backdrop-blur-[2px]" onClick={onClose}>
      <aside
        onClick={(event) => event.stopPropagation()}
        className="h-full w-full max-w-xl overflow-y-auto bg-surface-page shadow-pop"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-white px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
              Maintenance request
            </p>
            <h2 className="text-lg font-bold text-ink">
              {loading || !request ? "Loading…" : `#${request.id} ${request.title}`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-ink-subtle hover:bg-surface-sunken hover:text-ink"
          >
            <TbX className="text-lg" />
          </button>
        </div>

        {request && (
          <div className="space-y-4 p-5">
            {request.requiresUrgentEscalation && (
              <Notice tone="critical" title="Flagged urgent">
                {request.escalationReason ?? "Safety policy flagged this as urgent."}
              </Notice>
            )}

            <Card className="p-4">
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <Row label="Property" value={request.propertyName ?? `#${request.propertyId}`} />
                <Row label="Address" value={request.propertyAddress ?? "-"} />
                <Row label="Reported by" value={request.tenantName ?? "Not provided"} />
                <Row label="Email" value={request.tenantEmail ?? "-"} />
                <Row label="Phone" value={request.tenantPhone ?? "-"} />
                <Row label="Reported" value={new Date(request.createdAtUtc).toLocaleString()} />
                <Row label="Category" value={request.categoryName} />
                <Row label="Urgency" value={request.urgencyName} />
              </dl>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-bold text-ink">What the tenant said</h3>
              <p className="mt-2 whitespace-pre-line rounded-lg bg-surface-page p-3 text-sm text-ink-muted">
                {request.description}
              </p>

              {request.proposedLandlordMessage && (
                <>
                  <h3 className="mt-4 text-sm font-bold text-ink">Their message to you</h3>
                  <p className="mt-2 whitespace-pre-line rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
                    {request.proposedLandlordMessage}
                  </p>
                </>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-ink">Assistant's assessment</h3>
                {request.aiModel && <Badge tone="neutral">{request.aiModel}</Badge>}
              </div>

              {request.tenantOverrodeAgent && (
                <div className="mt-2">
                  <Notice tone="caution">
                    The tenant changed this before submitting. What you see above is what they
                    approved, not what the assistant proposed.
                  </Notice>
                </div>
              )}

              {request.aiSummary && (
                <p className="mt-2 text-sm text-ink-muted">{request.aiSummary}</p>
              )}

              {request.aiReasoning && (
                <details className="mt-3 rounded-xl border border-line bg-surface-page p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-ink">
                    Reasoning
                  </summary>
                  <p className="mt-2 whitespace-pre-line text-sm text-ink-muted">
                    {request.aiReasoning}
                  </p>
                  {request.aiConfidence != null && (
                    <p className="mt-2 text-xs text-ink-subtle">
                      Self-reported confidence {Math.round(request.aiConfidence * 100)}%. Treat
                      it as a hint, not a guarantee.
                    </p>
                  )}
                </details>
              )}

              <h4 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                What it looked up at the time
              </h4>
              <AgentTraceList toolCalls={toolCalls} />
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-bold text-ink">History</h3>
              <ol className="mt-3 space-y-3 border-l-2 border-line pl-4">
                {request.events.map((event) => (
                  <li key={event.id} className="relative text-sm">
                    <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-brand-500" />
                    <span className="font-semibold text-ink">{event.eventTypeName}</span>
                    <span className="ml-2 text-xs text-ink-subtle">
                      {new Date(event.createdAtUtc).toLocaleString()}
                    </span>
                    {event.detail && <p className="text-ink-muted">{event.detail}</p>}
                  </li>
                ))}
              </ol>
            </Card>

            <Card className="p-4">
              <SectionHeading title="Update status" />
              <div className="flex flex-wrap gap-2">
                {[
                  { value: MaintenanceStatus.Acknowledged, label: "Acknowledge" },
                  { value: MaintenanceStatus.InProgress, label: "In progress" },
                  { value: MaintenanceStatus.Resolved, label: "Resolved" },
                  { value: MaintenanceStatus.Cancelled, label: "Cancel" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={request.status === option.value ? "primary" : "ghost"}
                    size="sm"
                    disabled={busy || request.status === option.value}
                    onClick={() =>
                      dispatch(changeRequestStatus({ id: request.id, status: option.value }))
                    }
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              {busy && <p className="mt-2 text-xs text-ink-subtle">Updating…</p>}
            </Card>
          </div>
        )}
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-subtle">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
