import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="page-shell">
      <section className="panel">
        <h2 className="page-title">Library Management System</h2>
        <p className="section-copy">
          Manage books, borrowers, and account access from one operational CRUD workspace.
        </p>
        <div className="inline-actions">
          <Link className="button" to="/books">
            Open Books
          </Link>
          <Link className="button secondary-button" to="/borrow">
            Open Borrowers
          </Link>
        </div>
      </section>
    </div>
  );
}
