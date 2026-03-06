import { Navigate } from "react-router-dom";
import { useUser } from "../contexts/useUser";

export default function RequireAuth({ children, allowedRoles = [] }) {
  const { user, isHydrating } = useUser();

  if (isHydrating) {
    return (
      <div className="page-shell">
        <section className="panel loading-panel">
          <p className="eyebrow">Session</p>
          <h2>Checking your authentication state...</h2>
        </section>
      </div>
    );
  }

  if (!user.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/books" replace />;
  }

  return children;
}
