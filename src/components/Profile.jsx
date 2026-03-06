import { Link } from "react-router-dom";
import { useUser } from "../contexts/useUser";

export default function Profile() {
  const { user } = useUser();
  const displayName = `${user.firstname} ${user.lastname}`.trim() || user.username;

  return (
    <div className="page-shell">
      <section className="panel hero-panel">
        <p className="eyebrow">Profile</p>
        <h2>{displayName}</h2>
        <p className="lede">Signed in as {user.email}</p>

        <div className="stats-row">
          <article className="metric-card">
            <strong>{user.role}</strong>
            <span>Access role</span>
          </article>
          <article className="metric-card">
            <strong>{user.status}</strong>
            <span>Account status</span>
          </article>
          <article className="metric-card">
            <strong>{user.username}</strong>
            <span>Username</span>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Actions</p>
            <h3>Quick navigation</h3>
          </div>
        </div>

        <div className="inline-actions">
          <Link className="button" to="/books">
            Browse books
          </Link>
          <Link className="button secondary-button" to="/borrow">
            View borrows
          </Link>
        </div>
      </section>
    </div>
  );
}
