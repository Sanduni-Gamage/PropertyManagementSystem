import { useEffect, useState } from "react";
import { TbAlertTriangle, TbCheck, TbShieldCheck } from "react-icons/tb";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { dismissDuplicateBlock, submitRequest } from "../../slices/maintenanceSlice";
import {
  CATEGORY_OPTIONS,
  URGENCY_OPTIONS,
  type MaintenanceCategoryValue,
  type MaintenanceUrgencyValue,
  type TriageResult,
} from "../../types/Maintenance";
import AgentTraceList from "./AgentTraceList";
import { Badge, Button, Card, Notice } from "../UI/Primitives";

/**
 * The approval gate.
 *
 * The assistant's assessment is shown as an editable draft: the tenant can correct the
 * category, urgency, title and message to the landlord before anything is written. Nothing
 * has been saved at the point this renders.
 */
export default function TriageResultCard({
  triage,
  propertyId,
  description,
}: {
  triage: TriageResult;
  propertyId: number;
  description: string;
}) {
  const dispatch = useAppDispatch();
  const { submitting, submitError, duplicateBlock, lastCreated } = useAppSelector(
    (state) => state.maintenance,
  );

  const [title, setTitle] = useState(triage.proposedTitle);
  const [category, setCategory] = useState<MaintenanceCategoryValue>(triage.category);
  const [urgency, setUrgency] = useState<MaintenanceUrgencyValue>(triage.urgency);
  const [landlordMessage, setLandlordMessage] = useState(triage.proposedLandlordMessage);

  // A fresh assessment replaces whatever was being edited. Keyed on the idempotency key,
  // which is new for every triage call.
  useEffect(() => {
    setTitle(triage.proposedTitle);
    setCategory(triage.category);
    setUrgency(triage.urgency);
    setLandlordMessage(triage.proposedLandlordMessage);
  }, [
    triage.idempotencyKey,
    triage.proposedTitle,
    triage.category,
    triage.urgency,
    triage.proposedLandlordMessage,
  ]);

  const edited = category !== triage.category || urgency !== triage.urgency;

  function submit(allowDuplicate: boolean) {
    dispatch(
      submitRequest({
        propertyId,
        title: title.trim(),
        description,
        category,
        urgency,
        aiCategory: triage.category,
        aiUrgency: triage.urgency,
        aiSummary: triage.summary,
        aiReasoning: triage.reasoning,
        aiConfidence: triage.confidence,
        aiModel: triage.model,
        proposedLandlordMessage: landlordMessage.trim(),
        agentToolTrace: JSON.stringify(triage.toolCalls),
        idempotencyKey: triage.idempotencyKey,
        allowDuplicate,
      }),
    );
  }

  if (lastCreated) {
    return (
      <Card className="p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-positive-50 text-positive-600">
          <TbCheck className="text-2xl" />
        </span>
        <h3 className="mt-3 text-lg font-bold text-ink">
          {lastCreated.wasExisting ? "Already submitted" : "Request sent to your landlord"}
        </h3>
        <p className="mt-1 text-sm text-ink-muted">
          {lastCreated.wasExisting
            ? `This draft had already been submitted as request #${lastCreated.id}. Nothing was duplicated.`
            : `Saved as request #${lastCreated.id}.`}
        </p>
        {lastCreated.verified && (
          <p className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1 text-xs text-ink-subtle">
            <TbShieldCheck className="text-sm" />
            Verified - read back from the database after saving
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {triage.requiresUrgentEscalation && (
        <div className="border-b border-critical-600/20 bg-critical-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <TbAlertTriangle className="mt-0.5 shrink-0 text-xl text-critical-600" />
            <div>
              <h3 className="font-bold text-critical-700">Treat this as urgent</h3>
              {triage.escalationReason && (
                <p className="mt-0.5 text-xs text-critical-600">{triage.escalationReason}</p>
              )}
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-critical-700">
                {triage.safetyAdvice.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-ink">Draft request</h3>
            <p className="mt-0.5 text-sm text-ink-muted">{triage.summary}</p>
          </div>
          <Badge tone="neutral">Not saved yet</Badge>
        </div>

        <Field label="Title">
          <input
            type="text"
            value={title}
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select
              value={category}
              onChange={(event) =>
                setCategory(Number(event.target.value) as MaintenanceCategoryValue)
              }
              className={inputClass}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Urgency">
            <select
              value={urgency}
              onChange={(event) =>
                setUrgency(Number(event.target.value) as MaintenanceUrgencyValue)
              }
              className={inputClass}
            >
              {URGENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.hint}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {edited && (
          <Notice tone="info">
            You have changed the assistant's assessment from{" "}
            <strong>
              {triage.categoryName} / {triage.urgencyName}
            </strong>
            . Both versions are recorded, and the urgency rules are re-applied to your
            version when you submit.
          </Notice>
        )}

        <details className="rounded-xl border border-line bg-surface-page p-4">
          <summary className="cursor-pointer text-sm font-semibold text-ink">
            Why the assistant said this
          </summary>
          <p className="mt-2 whitespace-pre-line text-sm text-ink-muted">{triage.reasoning}</p>
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-subtle">Confidence</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${Math.round(triage.confidence * 100)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-ink">
                {Math.round(triage.confidence * 100)}%
              </span>
            </div>
            <p className="mt-1.5 text-xs text-ink-subtle">
              Self-reported by the model. Treat it as a hint, not a guarantee.
            </p>
          </div>
        </details>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-ink">
            What the assistant looked up
            <span className="ml-2 font-normal text-ink-subtle">{triage.model}</span>
          </h4>
          <AgentTraceList toolCalls={triage.toolCalls} />
        </div>

        <Field
          label="Message to your landlord"
          hint="Edit this freely - it is sent as written."
        >
          <textarea
            value={landlordMessage}
            maxLength={2000}
            rows={4}
            onChange={(event) => setLandlordMessage(event.target.value)}
            className={inputClass}
          />
        </Field>

        {triage.possibleDuplicates.length > 0 && (
          <Notice tone="caution" title="You may have reported this already">
            <ul className="space-y-1">
              {triage.possibleDuplicates.map((duplicate) => (
                <li key={duplicate.id}>
                  #{duplicate.id} - {duplicate.title} ({duplicate.statusName}, reported{" "}
                  {new Date(duplicate.createdAtUtc).toLocaleDateString()})
                </li>
              ))}
            </ul>
          </Notice>
        )}

        {duplicateBlock && (
          <Notice tone="caution" title="Already reported">
            <p>{duplicateBlock.message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" onClick={() => submit(true)} disabled={submitting}>
                Report it anyway
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dispatch(dismissDuplicateBlock())}
              >
                Cancel
              </Button>
            </div>
          </Notice>
        )}

        {submitError && (
          <div role="alert">
            <Notice tone="critical">{submitError}</Notice>
          </div>
        )}

        {!duplicateBlock && (
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <Button
              size="lg"
              onClick={() => submit(false)}
              disabled={submitting || !title.trim()}
            >
              {submitting ? "Submitting…" : "Approve and send to landlord"}
            </Button>
            <span className="text-sm text-ink-subtle">
              Nothing is saved until you press this.
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink " +
  "placeholder:text-ink-subtle focus:border-brand-500 focus:outline-none";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-subtle">{hint}</span>}
    </label>
  );
}
