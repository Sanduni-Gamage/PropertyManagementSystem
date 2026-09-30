import { TbHome, TbHistory, TbTool, TbAlertTriangle } from "react-icons/tb";
import type { AgentToolCall } from "../../types/Maintenance";
import { Badge } from "../UI/Primitives";
import { summariseToolCall } from "./traceSummary";

/**
 * Shows what the assistant looked up before deciding, in plain language.
 *
 * This is what makes the assistant reviewable rather than a black box - you can see it read
 * the property record and checked past requests, what came back, and what it did when a
 * lookup was refused. The raw payload stays one click away for anyone who wants it.
 */
export default function AgentTraceList({ toolCalls }: { toolCalls: AgentToolCall[] }) {
  if (toolCalls.length === 0) {
    return (
      <p className="rounded-lg bg-surface-sunken px-3.5 py-2.5 text-sm text-ink-subtle">
        The assistant answered without looking anything up.
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {toolCalls.map((call, index) => (
        <li key={`${call.name}-${index}`}>
          <TraceItem call={call} />
        </li>
      ))}
    </ol>
  );
}

function TraceItem({ call }: { call: AgentToolCall }) {
  const summary = summariseToolCall(call);
  const failed = !call.succeeded || Boolean(summary.problem);

  return (
    <div className="rounded-xl border border-line bg-white p-3.5">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 rounded-lg p-1.5 ${
            failed ? "bg-caution-50 text-caution-600" : "bg-brand-50 text-brand-500"
          }`}
        >
          <ToolIcon name={call.name} failed={failed} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h5 className="font-semibold text-ink">{summary.title}</h5>
            <span className="flex items-center gap-2 text-xs text-ink-subtle">
              <span>{call.durationMs} ms</span>
              {failed ? <Badge tone="caution">refused</Badge> : <Badge tone="positive">ok</Badge>}
            </span>
          </div>

          {summary.problem ? (
            <p className="mt-1 text-sm text-caution-600">{summary.problem}</p>
          ) : (
            <>
              {summary.headline && (
                <p className="mt-1 text-sm text-ink">{summary.headline}</p>
              )}
              {summary.detail && (
                <p className="text-sm text-ink-muted">{summary.detail}</p>
              )}

              {summary.facts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {summary.facts.map((fact) => (
                    <span
                      key={fact}
                      className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-xs text-ink-muted"
                    >
                      {fact}
                    </span>
                  ))}
                </div>
              )}

              {summary.items && summary.items.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-sm text-ink-muted">
                  {summary.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </>
          )}

          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-ink-subtle hover:text-ink">
              View raw data
            </summary>
            <dl className="mt-2 space-y-2">
              <div>
                <dt className="text-xs font-medium text-ink-subtle">Asked for</dt>
                <dd>
                  <pre className="mt-1 overflow-x-auto rounded-lg bg-surface-page p-2.5 text-xs leading-relaxed text-ink-muted">
                    {prettyJson(call.arguments)}
                  </pre>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-subtle">Came back</dt>
                <dd>
                  <pre className="mt-1 max-h-56 overflow-auto rounded-lg bg-surface-page p-2.5 text-xs leading-relaxed text-ink-muted">
                    {prettyJson(call.result)}
                  </pre>
                </dd>
              </div>
              {call.error && (
                <div>
                  <dt className="text-xs font-medium text-ink-subtle">Error</dt>
                  <dd className="mt-1 text-xs text-caution-600">{call.error}</dd>
                </div>
              )}
            </dl>
          </details>
        </div>
      </div>
    </div>
  );
}

function ToolIcon({ name, failed }: { name: string; failed: boolean }) {
  if (failed) return <TbAlertTriangle className="text-base" />;
  if (name === "get_property_details") return <TbHome className="text-base" />;
  if (name === "get_maintenance_history") return <TbHistory className="text-base" />;
  return <TbTool className="text-base" />;
}

/** Formats tool JSON for display, falling back to the raw string if it will not parse. */
function prettyJson(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}
