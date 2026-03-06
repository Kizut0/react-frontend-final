import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../contexts/useUser";
import { apiRequest } from "../lib/api";

const emptyBookForm = {
  title: "",
  author: "",
  isbn: "",
  category: "",
  publishedYear: "",
  totalCopies: "1",
};

async function requestBooks(searchValue = "", categoryValue = "") {
  const params = new URLSearchParams();

  if (searchValue.trim()) {
    params.set("q", searchValue.trim());
  }

  if (categoryValue.trim()) {
    params.set("category", categoryValue.trim());
  }

  const query = params.toString();
  return apiRequest(`/api/book${query ? `?${query}` : ""}`);
}

export default function Books() {
  const { user } = useUser();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [form, setForm] = useState(emptyBookForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function getBookCode(book, index) {
    return `#BK_${book.id.slice(-4).toUpperCase() || index + 1}`;
  }

  async function loadBooks(nextSearch = "", nextCategory = "") {
    setIsLoading(true);
    setError("");
    const result = await requestBooks(nextSearch, nextCategory);

    if (!result.ok) {
      setBooks([]);
      setError(result.data?.message ?? "Unable to load books");
      setIsLoading(false);
      return;
    }

    setBooks(result.data?.books ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      setIsLoading(true);
      setError("");
      const result = await requestBooks();

      if (!isMounted) {
        return;
      }

      if (!result.ok) {
        setBooks([]);
        setError(result.data?.message ?? "Unable to load books");
        setIsLoading(false);
        return;
      }

      setBooks(result.data?.books ?? []);
      setIsLoading(false);
    }

    void initialLoad();

    return () => {
      isMounted = false;
    };
  }, []);

  async function onSearch(event) {
    event.preventDefault();
    await loadBooks(search, category);
  }

  async function clearFilters() {
    setSearch("");
    setCategory("");
    setNotice("");
    await loadBooks("", "");
  }

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function createBook(event) {
    event.preventDefault();
    setIsCreating(true);
    setError("");
    setNotice("");

    const result = await apiRequest("/api/book", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        publishedYear: form.publishedYear === "" ? null : form.publishedYear,
        totalCopies: form.totalCopies,
      }),
    });

    if (!result.ok) {
      setError(result.data?.message ?? "Unable to create book");
      setIsCreating(false);
      return;
    }

    setForm(emptyBookForm);
    setIsFormOpen(false);
    setNotice("Book created successfully.");
    setIsCreating(false);
    await loadBooks(search, category);
  }

  async function deleteBook(bookId) {
    const confirmed = window.confirm("Delete this book?");

    if (!confirmed) {
      return;
    }

    setDeleteId(bookId);
    setError("");
    setNotice("");

    const result = await apiRequest(`/api/book/${bookId}`, {
      method: "DELETE",
    });

    if (!result.ok) {
      setError(result.data?.message ?? "Unable to delete book");
      setDeleteId("");
      return;
    }

    setNotice("Book deleted successfully.");
    setDeleteId("");
    await loadBooks(search, category);
  }

  const categories = [...new Set(books.map((book) => book.category).filter(Boolean))].sort();

  return (
    <div className="page-shell books-page">
      <section className="panel books-panel">
        <div className="books-heading-row">
          <h2 className="page-title">Library Book List</h2>
          {user.role === "ADMIN" ? (
            <button
              type="button"
              className="expand-button"
              onClick={() => setIsFormOpen((currentValue) => !currentValue)}
            >
              {isFormOpen ? "Hide Collection Form" : "Expand Collection"}
            </button>
          ) : null}
        </div>

        <form className="toolbar books-toolbar" onSubmit={onSearch}>
          <label className="field compact-field">
            <span>Search</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, author, or category"
            />
          </label>

          <label className="field compact-field">
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <div className="inline-actions">
            <button type="submit">Apply Filters</button>
            <button type="button" className="secondary-button" onClick={clearFilters}>
              Reset
            </button>
          </div>
        </form>

        {error ? <p className="form-error">{error}</p> : null}
        {notice ? <p className="form-success">{notice}</p> : null}

        {user.role === "ADMIN" && isFormOpen ? (
          <section className="collection-form">
            <form className="form-grid two-column-grid" onSubmit={createBook}>
              <label className="field">
                <span>Title</span>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={updateForm}
                  required
                />
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
                <input
                  type="text"
                  name="isbn"
                  value={form.isbn}
                  onChange={updateForm}
                  required
                />
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
              <div className="inline-actions form-actions">
                <button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Book"}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {isLoading ? (
          <div className="empty-state">
            <h3>Loading books...</h3>
          </div>
        ) : books.length === 0 ? (
          <div className="empty-state">
            <h3>No books found</h3>
            <p>Try removing filters or create the first catalog entry as an ADMIN.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table books-table">
              <thead>
                <tr>
                  <th>Book ID</th>
                  <th>ISBN</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th className="quantity-column">Quantity</th>
                  <th className="action-column">Action</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book, index) => (
                  <tr key={book.id}>
                    <td>{getBookCode(book, index)}</td>
                    <td>{book.isbn}</td>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.category || "-"}</td>
                    <td className="quantity-column">{book.availableCopies}</td>
                    <td className="action-column">
                      <div className="table-actions">
                        {user.role === "ADMIN" ? (
                          <>
                            <button
                              type="button"
                              className="icon-button delete-button"
                              disabled={deleteId === book.id}
                              onClick={() => deleteBook(book.id)}
                            >
                              {deleteId === book.id ? "..." : "Del"}
                            </button>
                            <Link className="icon-button edit-button" to={`/books/${book.id}`}>
                              Edit
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link className="icon-button edit-button" to={`/books/${book.id}`}>
                              View
                            </Link>
                            {book.availableCopies > 0 ? (
                              <Link className="icon-button action-button" to={`/borrow?bookId=${book.id}`}>
                                Borrow
                              </Link>
                            ) : null}
                          </>
                        )}
                      </div>
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
