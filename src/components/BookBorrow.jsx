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
  return apiRequest(`/api/book/${bookId}`);
}

export default function BookBorrow() {
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [borrows, setBorrows] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBorrowing, setIsBorrowing] = useState(false);
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
      setIsLoading(true);
      setError("");

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
    }

    void refreshSelectedBook();

    return () => {
      isMounted = false;
    };
  }, [bookId]);

  async function borrowSelectedBook() {
    if (!bookId) {
      return;
    }

    setIsBorrowing(true);
    setError("");
    setNotice("");

    const result = await apiRequest("/api/borrow", {
      method: "POST",
      body: JSON.stringify({ bookId }),
    });

    if (!result.ok) {
      setError(result.data?.message ?? "Unable to borrow this book");
      setIsBorrowing(false);
      return;
    }

    setNotice("Borrow request created successfully.");
    setSearchParams({});
    setIsBorrowing(false);
    await loadBorrows();
  }

  return (
    <div className="page-shell">
      <section className="panel hero-panel">
        <p className="eyebrow">Borrow records</p>
        <h2>{user.role === "ADMIN" ? "All borrow activity" : "Your borrow history"}</h2>
        <p className="lede">
          {user.role === "ADMIN"
            ? "Inspect every borrow in the system and track availability pressure across the catalog."
            : "Review your active and completed borrow records. You can also confirm a selected book borrow here."}
        </p>
      </section>

      {user.role === "MEMBER" && (selectedBook || selectionError) ? (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Selected book</p>
              <h3>Borrow confirmation</h3>
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
                Available copies: {selectedBook.availableCopies} of {selectedBook.totalCopies}
              </p>
              <div className="inline-actions">
                <button
                  type="button"
                  onClick={borrowSelectedBook}
                  disabled={isBorrowing || selectedBook.availableCopies <= 0}
                >
                  {isBorrowing ? "Borrowing..." : "Confirm Borrow"}
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
            <h3>Borrow list</h3>
          </div>
          <Link className="button secondary-button" to="/books">
            Back to books
          </Link>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <h3>Loading borrow records...</h3>
          </div>
        ) : borrows.length === 0 ? (
          <div className="empty-state">
            <h3>No borrow records yet</h3>
            <p>Select a book from the catalog to create the first borrow request.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Book</th>
                  {user.role === "ADMIN" ? <th>Borrower</th> : null}
                  <th>Borrowed</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {borrows.map((borrow) => (
                  <tr key={borrow.id}>
                    <td>
                      <div className="table-primary">
                        <strong>{borrow.book?.title ?? "Unknown book"}</strong>
                        <span>{borrow.book?.author ?? "-"}</span>
                      </div>
                    </td>
                    {user.role === "ADMIN" ? <td>{getBorrowerLabel(borrow)}</td> : null}
                    <td>{formatDate(borrow.borrowDate)}</td>
                    <td>{formatDate(borrow.dueDate)}</td>
                    <td>
                      <span className={`status-chip status-${borrow.status.toLowerCase()}`}>
                        {borrow.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
