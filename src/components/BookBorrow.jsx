import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useUser } from "../contexts/useUser";
import { apiRequest } from "../lib/api";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return dateFormatter.format(new Date(value));
}

function getDefaultTargetDate() {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 1);
  return nextDate.toISOString().slice(0, 10);
}

function getBorrowerLabel(borrow) {
  const firstname = borrow.user?.firstname?.trim();
  const lastname = borrow.user?.lastname?.trim();
  const fullName = [firstname, lastname].filter(Boolean).join(" ");

  return fullName || borrow.user?.username || borrow.user?.email || "-";
}

async function requestBorrows() {
  return apiRequest("/api/borrow");
}

async function requestBook(bookId) {
  return apiRequest(`/api/books/${bookId}`);
}

export default function BookBorrow() {
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [borrows, setBorrows] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [targetDate, setTargetDate] = useState(getDefaultTargetDate);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAction, setActiveAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectionError, setSelectionError] = useState("");

  const bookId = searchParams.get("bookId") ?? "";

  async function loadBorrows() {
    setIsLoading(true);
    setError("");

    const result = await requestBorrows();

    if (!result.ok) {
      setBorrows([]);
      setError(result.data?.message ?? "Unable to load borrow records");
      setIsLoading(false);
      return;
    }

    setBorrows(result.data?.borrows ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      const result = await requestBorrows();

      if (!isMounted) {
        return;
      }

      if (!result.ok) {
        setBorrows([]);
        setError(result.data?.message ?? "Unable to load borrow records");
        setIsLoading(false);
        return;
      }

      setBorrows(result.data?.borrows ?? []);
      setIsLoading(false);
    }

    void initialLoad();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function refreshSelectedBook() {
      if (!bookId) {
        if (isMounted) {
          setSelectedBook(null);
          setSelectionError("");
        }
        return;
      }

      const result = await requestBook(bookId);

      if (!isMounted) {
        return;
      }

      if (!result.ok) {
        setSelectedBook(null);
        setSelectionError(result.data?.message ?? "Unable to load selected book");
        return;
      }

      setSelectionError("");
      setSelectedBook(result.data.book);
      setTargetDate(getDefaultTargetDate());
    }

    void refreshSelectedBook();

    return () => {
      isMounted = false;
    };
  }, [bookId]);

  async function createBorrowRequest() {
    if (!bookId) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setNotice("");

    const result = await apiRequest("/api/borrow", {
      method: "POST",
      body: JSON.stringify({ bookId, targetDate }),
    });

    if (!result.ok) {
      setError(result.data?.message ?? "Unable to create borrow request");
      setIsSubmitting(false);
      return;
    }

    setNotice("Borrow request created successfully.");
    setSearchParams({});
    setIsSubmitting(false);
    await loadBorrows();
  }

  async function updateRequestStatus(borrowId, status) {
    const actionKey = `${borrowId}:${status}`;
    setActiveAction(actionKey);
    setError("");
    setNotice("");

    const result = await apiRequest("/api/borrow", {
      method: "PATCH",
      body: JSON.stringify({ borrowId, status }),
    });

    if (!result.ok) {
      setError(result.data?.message ?? "Unable to update request");
      setActiveAction("");
      return;
    }

    setNotice(`Request updated to ${result.data?.borrow?.status ?? status}.`);
    setActiveAction("");
    await loadBorrows();
  }

  return (
    <div className="page-shell">
      <section className="panel hero-panel">
        <p className="eyebrow">Borrow requests</p>
        <h2>{user.role === "ADMIN" ? "Manage all book requests" : "Create and track your requests"}</h2>
        <p className="lede">
          {user.role === "ADMIN"
            ? "Review pending requests, accept them when stock is available, or cancel them when needed."
            : "Choose a target pickup date, submit a request, and monitor every request status from one page."}
        </p>
      </section>

      {user.role === "USER" && (selectedBook || selectionError) ? (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Selected book</p>
              <h3>Create borrow request</h3>
            </div>
          </div>

          {selectionError ? (
            <p className="form-error">{selectionError}</p>
          ) : selectedBook ? (
            <>
              <p className="lede">
                {selectedBook.title} by {selectedBook.author}
              </p>
              <p className="support-copy">
                Location: {selectedBook.location || "-"} | Available copies: {selectedBook.availableCopies} of{" "}
                {selectedBook.totalCopies}
              </p>
              <label className="field compact-field">
                <span>Target Date</span>
                <input
                  type="date"
                  value={targetDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => setTargetDate(event.target.value)}
                />
              </label>
              <div className="inline-actions">
                <button type="button" onClick={createBorrowRequest} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Create Request"}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setSearchParams({})}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}
      {notice ? <p className="form-success">{notice}</p> : null}

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">History</p>
            <h3>{user.role === "ADMIN" ? "Request list" : "Your request list"}</h3>
          </div>
          <Link className="button secondary-button" to="/books">
            Back to books
          </Link>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <h3>Loading requests...</h3>
          </div>
        ) : borrows.length === 0 ? (
          <div className="empty-state">
            <h3>No requests yet</h3>
            <p>Select a book from the catalog to create the first request.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Book</th>
                  {user.role === "ADMIN" ? <th>Borrower</th> : null}
                  <th>Created</th>
                  <th>Target Date</th>
                  <th>Status</th>
                  <th className="action-column">Action</th>
                </tr>
              </thead>
              <tbody>
                {borrows.map((borrow) => {
                  const canAdminAccept =
                    user.role === "ADMIN" &&
                    ["INIT", "CLOSE-NO-AVAILABLE-BOOK"].includes(borrow.status);
                  const canAdminCancel =
                    user.role === "ADMIN" &&
                    ["INIT", "CLOSE-NO-AVAILABLE-BOOK", "ACCEPTED", "BORROWED"].includes(borrow.status);
                  const canUserCancel = user.role === "USER" && borrow.status === "INIT";

                  return (
                    <tr key={borrow.id}>
                      <td>
                        <div className="table-primary">
                          <strong>{borrow.book?.title ?? "Unknown book"}</strong>
                          <span>{borrow.book?.author ?? "-"}</span>
                        </div>
                      </td>
                      {user.role === "ADMIN" ? <td>{getBorrowerLabel(borrow)}</td> : null}
                      <td>{formatDate(borrow.createdAt)}</td>
                      <td>{formatDate(borrow.targetDate)}</td>
                      <td>
                        <span className={`status-chip status-${borrow.status.toLowerCase()}`}>
                          {borrow.status}
                        </span>
                      </td>
                      <td className="action-column">
                        <div className="table-actions">
                          {canAdminAccept ? (
                            <button
                              type="button"
                              className="icon-button action-button"
                              disabled={activeAction === `${borrow.id}:ACCEPTED`}
                              onClick={() => updateRequestStatus(borrow.id, "ACCEPTED")}
                            >
                              {activeAction === `${borrow.id}:ACCEPTED` ? "..." : "Accept"}
                            </button>
                          ) : null}
                          {canAdminCancel ? (
                            <button
                              type="button"
                              className="icon-button delete-button"
                              disabled={activeAction === `${borrow.id}:CANCEL-ADMIN`}
                              onClick={() => updateRequestStatus(borrow.id, "CANCEL-ADMIN")}
                            >
                              {activeAction === `${borrow.id}:CANCEL-ADMIN` ? "..." : "Cancel"}
                            </button>
                          ) : null}
                          {canUserCancel ? (
                            <button
                              type="button"
                              className="icon-button delete-button"
                              disabled={activeAction === `${borrow.id}:CANCEL-USER`}
                              onClick={() => updateRequestStatus(borrow.id, "CANCEL-USER")}
                            >
                              {activeAction === `${borrow.id}:CANCEL-USER` ? "..." : "Cancel"}
                            </button>
                          ) : null}
                          {!canAdminAccept && !canAdminCancel && !canUserCancel ? (
                            <span className="support-copy">No action</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
