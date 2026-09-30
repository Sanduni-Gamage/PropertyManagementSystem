import { useEffect, useRef, useState } from "react";
import { TbSparkles, TbSend } from "react-icons/tb";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { appendTenantMessage, clearConversation, runTriage } from "../../slices/maintenanceSlice";
import TriageResultCard from "./TriageResultCard";
import { Card, Notice } from "../UI/Primitives";

/**
 * The reporting conversation.
 *
 * The tenant describes the problem in their own words; the assistant may come back with a
 * clarifying question, in which case the tenant answers and the whole transcript is
 * re-sent. Once it has an assessment, the draft appears below for approval.
 */
export default function MaintenanceAgentChat({ propertyId }: { propertyId: number }) {
  const dispatch = useAppDispatch();
  const { transcript, triage, triageLoading, triageError, lastCreated } = useAppSelector(
    (state) => state.maintenance,
  );

  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript.length, triageLoading]);

  function send(event: React.FormEvent) {
    event.preventDefault();

    const message = draft.trim();
    if (!message || triageLoading) return;

    // Render the tenant's message straight away; the thunk re-sends the transcript plus
    // this message, so the two stay consistent.
    dispatch(appendTenantMessage(message));
    dispatch(runTriage({ propertyId, message }));
    setDraft("");
  }

  // The first description doubles as the stored Description on the saved request.
  const firstTenantMessage = transcript.find((turn) => turn.role === "tenant")?.content ?? "";

  const awaitingAnswer = Boolean(triage?.needsMoreInfo);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-brand-50 p-1.5 text-brand-500">
              <TbSparkles className="text-lg" />
            </span>
            <h2 className="font-bold text-ink">Describe the problem</h2>
          </div>
          {transcript.length > 0 && (
            <button
              type="button"
              onClick={() => dispatch(clearConversation())}
              className="text-sm font-semibold text-ink-subtle hover:text-ink"
            >
              Start over
            </button>
          )}
        </div>

        <div ref={scrollRef} className="max-h-80 space-y-4 overflow-y-auto px-5 py-5">
          {transcript.length === 0 && (
            <div className="rounded-xl bg-surface-sunken px-4 py-3.5 text-sm text-ink-muted">
              Tell us what is wrong - for example, &ldquo;the bathroom ceiling is
              leaking&rdquo;. The assistant will look up your property details and recent
              requests before assessing it.
            </div>
          )}

          {transcript.map((turn, index) => (
            <div
              key={`${turn.role}-${index}`}
              className={turn.role === "tenant" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  turn.role === "tenant"
                    ? "max-w-[85%] rounded-2xl rounded-br-sm bg-brand-500 px-4 py-2.5 text-sm text-white"
                    : "max-w-[85%] rounded-2xl rounded-bl-sm bg-surface-sunken px-4 py-2.5 text-sm text-ink"
                }
              >
                {turn.content}
              </div>
            </div>
          ))}

          {triageLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-surface-sunken px-4 py-2.5 text-sm text-ink-subtle">
                <span className="flex gap-1">
                  <Dot delay="0ms" />
                  <Dot delay="150ms" />
                  <Dot delay="300ms" />
                </span>
                Checking your property record and recent requests
              </div>
            </div>
          )}
        </div>

        <form onSubmit={send} className="flex gap-2 border-t border-line px-4 py-3">
          <input
            type="text"
            value={draft}
            maxLength={2000}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              awaitingAnswer ? "Answer the assistant's question…" : "Describe the problem…"
            }
            disabled={Boolean(lastCreated)}
            className="flex-1 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:border-brand-500 focus:outline-none disabled:bg-surface-sunken"
          />
          <button
            type="submit"
            disabled={triageLoading || !draft.trim() || Boolean(lastCreated)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <TbSend className="text-base" />
            {triageLoading ? "Assessing…" : "Send"}
          </button>
        </form>
      </Card>

      {triageError && (
        <div role="alert">
          <Notice tone="critical">{triageError}</Notice>
        </div>
      )}

      {triage && triage.needsMoreInfo && (
        <Notice tone="info" title="The assistant needs a bit more">
          <ul className="list-disc space-y-1 pl-5">
            {triage.followUpQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs">
            Answer above and it will reassess. Its working assessment so far is{" "}
            {triage.categoryName} / {triage.urgencyName}.
          </p>
        </Notice>
      )}

      {triage && !triage.needsMoreInfo && (
        <TriageResultCard
          triage={triage}
          propertyId={propertyId}
          description={firstTenantMessage || triage.summary}
        />
      )}
    </div>
  );
}

/** One bouncing dot of the typing indicator. */
function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-ink-subtle"
      style={{ animationDelay: delay }}
    />
  );
}
