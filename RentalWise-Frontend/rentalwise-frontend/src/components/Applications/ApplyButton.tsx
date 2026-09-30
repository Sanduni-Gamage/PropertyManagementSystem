import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  applyForProperty,
  loadMyApplications,
  withdrawApplication,
} from "../../slices/applicationsSlice";
import { RentalApplicationStatus } from "../../types/RentalApplication";

/**
 * Apply for a rental.
 *
 * Designed to be dropped anywhere a listing is shown - a card in the results grid or the
 * details page - so it looks after everything itself: loading the tenant's existing
 * applications once, hiding itself for landlords, and sending signed-out visitors to log in.
 *
 * `compact` is for use inside a clickable card, where there is no room for the withdraw
 * action and clicks must not reach the card underneath.
 */
export default function ApplyButton({
  propertyId,
  compact = false,
}: {
  propertyId: number;
  compact?: boolean;
}) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const user = useAppSelector((state) => state.auth.user);
  const { mine, mineLoaded, mineLoading, applyingPropertyId, decidingId, error } =
    useAppSelector((state) => state.applications);

  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");

  const isTenant = user?.role?.toLowerCase() === "tenant";

  // Load once per session; the slice marks itself loaded even on failure so this does not
  // retry on every render.
  useEffect(() => {
    if (isTenant && !mineLoaded && !mineLoading) {
      dispatch(loadMyApplications());
    }
  }, [isTenant, mineLoaded, mineLoading, dispatch]);

  // Landlords have no use for this control.
  if (user && !isTenant) return null;

  const existing = mine.find(
    (application) =>
      application.propertyId === propertyId &&
      (application.status === RentalApplicationStatus.Submitted ||
        application.status === RentalApplicationStatus.Approved),
  );

  const submitting = applyingPropertyId === propertyId;

  /** Stops a click inside a clickable card from also navigating. */
  const contain = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
  };

  if (!user) {
    return (
      <button
        type="button"
        onClick={(event) => {
          contain(event);
          navigate("/login");
        }}
        className={buttonClass(compact)}
      >
        Apply
      </button>
    );
  }

  if (existing?.status === RentalApplicationStatus.Approved) {
    return (
      <span
        onClick={contain}
        className="inline-flex items-center rounded bg-green-100 px-2.5 py-1 text-sm font-medium text-green-800"
      >
        Tenancy offered
      </span>
    );
  }

  if (existing?.status === RentalApplicationStatus.Submitted) {
    return (
      <span onClick={contain} className="inline-flex items-center gap-2">
        <span className="rounded bg-blue-100 px-2.5 py-1 text-sm font-medium text-blue-800">
          Applied
        </span>
        {!compact && (
          <button
            type="button"
            onClick={(event) => {
              contain(event);
              dispatch(withdrawApplication(existing.id));
            }}
            disabled={decidingId === existing.id}
            className="text-sm text-gray-500 underline hover:text-gray-700 disabled:opacity-50"
          >
            {decidingId === existing.id ? "Withdrawing…" : "Withdraw"}
          </button>
        )}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          contain(event);
          setModalOpen(true);
        }}
        className={buttonClass(compact)}
      >
        Apply
      </button>

      {modalOpen && (
        <div
          onClick={contain}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Apply for this rental</h3>
            <p className="mt-1 text-sm text-gray-600">
              Your application goes to the landlord, who can offer you the tenancy or turn
              it down.
            </p>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-gray-700">
                Note to the landlord <span className="text-gray-400">(optional)</span>
              </span>
              <textarea
                value={message}
                maxLength={1000}
                rows={4}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Anything they should know - move-in date, who is applying, pets…"
                className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
              />
            </label>

            {error && (
              <p role="alert" className="mt-2 rounded bg-red-50 p-2 text-sm text-red-800">
                {error}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setMessage("");
                }}
                className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  const result = await dispatch(
                    applyForProperty({ propertyId, message: message.trim() || undefined }),
                  );

                  // Keep the dialog open on failure so the message is not lost.
                  if (applyForProperty.fulfilled.match(result)) {
                    setModalOpen(false);
                    setMessage("");
                  }
                }}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Submit application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function buttonClass(compact: boolean): string {
  return compact
    ? "rounded bg-blue-600 px-2.5 py-1 text-sm font-medium text-white hover:bg-blue-700"
    : "rounded bg-blue-600 px-4 py-2 text-base font-medium text-white hover:bg-blue-700";
}
