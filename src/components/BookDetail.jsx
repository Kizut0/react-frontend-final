import { useEffect, useEffectEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUser } from "../contexts/useUser";
import { apiRequest } from "../lib/api";

function toBookForm(book) {
  return {
    title: book.title ?? "",
    author: book.author ?? "",
    isbn: book.isbn ?? "",
    category: book.category ?? "",
    publishedYear: book.publishedYear ?? "",
    totalCopies: String(book.totalCopies ?? 0),
    status: book.status ?? "AVAILABLE",
  };
}

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [book, setBook] = useState(null);
  const [form, setForm] = useState(toBookForm({}));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadBook = useEffectEvent(async () => {
    setIsLoading(true);
    setError("");
    setNotice("");

    const result = await apiRequest(`/api/book/${id}`);

    if (!result.ok) {
      setBook(null);
      setError(result.data?.message ?? "Unable to load book");
      setIsLoading(false);
      return;
    }

    setBook(result.data.book);
    setForm(toBookForm(result.data.book));
    setIsLoading(false);
  });

  useEffect(() => {
    void loadBook();
  }, [id]);

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function saveBook(event) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setNotice("");

    const result = await apiRequest(`/api/book/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        ...form,
        publishedYear: form.publishedYear === "" ? null : form.publishedYear,
        totalCopies: form.totalCopies,
      }),
    });

    if (!result.ok) {
      setError(result.data?.message ?? "Unable to update book");
      setIsSaving(false);
      return;
    }

    setBook(result.data.book);
    setForm(toBookForm(result.data.book));
    setNotice("Book updated successfully.");
    setIsSaving(false);
  }

  async function deleteBook() {
    const confirmed = window.confirm("Delete this book? Active borrows will block the action.");

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError("");

    const result = await apiRequest(`/api/book/${id}`, {
      method: "DELETE",
    });

    if (!result.ok) {
      setError(result.data?.message ?? "Unable to delete book");
      setIsDeleting(false);
      return;
    }

    navigate("/books");
  }

  if (isLoading) {
    return (
      <div className="page-shell">
        <section className="panel loading-panel">
          <p className="eyebrow">Catalog</p>
          <h2>Loading book details...</h2>
        </section>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="page-shell">
        <section className="panel empty-state">
          <h2>Book unavailable</h2>
          <p>{error || "The requested book could not be found."}</p>
          <Link className="button" to="/books">
            Back to catalog
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="panel hero-panel detail-panel">
        <div className="book-card-top">
          <div>
            <p className="eyebrow">Book detail</p>
            <h2>{book.title}</h2>
          </div>
          <span className={`status-chip status-${book.status.toLowerCase()}`}>{book.status}</span>
        </div>

        <p className="lede">
          {book.author}
          {book.category ? ` • ${book.category}` : ""}
          {book.publishedYear ? ` • ${book.publishedYear}` : ""}
        </p>

        <div className="stats-row compact-stats">
          <article className="metric-card">
            <strong>{book.availableCopies}</strong>
            <span>Available copies</span>
          </article>
          <article className="metric-card">
            <strong>{book.totalCopies}</strong>
            <span>Total copies</span>
          </article>
          <article className="metric-card">
            <strong>{book.totalCopies - book.availableCopies}</strong>
            <span>Currently borrowed</span>
          </article>
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      {notice ? <p className="form-success">{notice}</p> : null}

      {user.role === "ADMIN" ? (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Admin controls</p>
              <h3>Update this book</h3>
            </div>
          </div>

          <form className="form-grid two-column-grid" onSubmit={saveBook}>
            <label className="field">
              <span>Title</span>
              <input type="text" name="title" value={form.title} onChange={updateForm} required />
            </label>
            <label className="field">
              <span>Author</span>
              <input
                type="text"
                name="author"
                value={form.author}
                onChange={updateForm}
                required
              />
            </label>
            <label className="field">
              <span>ISBN</span>
              <input type="text" name="isbn" value={form.isbn} onChange={updateForm} required />
            </label>
            <label className="field">
              <span>Category</span>
              <input type="text" name="category" value={form.category} onChange={updateForm} />
            </label>
            <label className="field">
              <span>Published Year</span>
              <input
                type="number"
                name="publishedYear"
                value={form.publishedYear}
                onChange={updateForm}
              />
            </label>
            <label className="field">
              <span>Total Copies</span>
              <input
                type="number"
                min="0"
                name="totalCopies"
                value={form.totalCopies}
                onChange={updateForm}
                required
              />
            </label>
            <label className="field">
              <span>Status</span>
              <select name="status" value={form.status} onChange={updateForm}>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="UNAVAILABLE">UNAVAILABLE</option>
              </select>
            </label>

            <div className="inline-actions form-actions">
              <button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="danger-button"
                disabled={isDeleting}
                onClick={deleteBook}
              >
                {isDeleting ? "Deleting..." : "Delete Book"}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Borrow</p>
              <h3>Ready to borrow this book?</h3>
            </div>
          </div>

          <div className="inline-actions">
            <Link className="button secondary-button" to="/books">
              Back to catalog
            </Link>
            {user.role !== "ADMIN" && book.availableCopies > 0 ? (
              <Link className="button" to={`/borrow?bookId=${book.id}`}>
                Continue to borrow
              </Link>
            ) : (
              <span className="support-copy">
                {book.availableCopies > 0
                  ? "Only USER accounts can create borrow requests."
                  : "This book has no copies available right now."}
              </span>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
