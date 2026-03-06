import { useEffect, useEffectEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../contexts/useUser";

export default function Logout() {
  const [isDone, setIsDone] = useState(false);
  const { logout } = useUser();

  const runLogout = useEffectEvent(async () => {
    await logout();
    setIsDone(true);
  });

  useEffect(() => {
    void runLogout();
  }, []);

  if (!isDone) {
    return (
      <div className="page-shell">
        <section className="panel loading-panel">
          <p className="eyebrow">Session</p>
          <h2>Logging out...</h2>
        </section>
      </div>
    );
  }

  return <Navigate to="/login" replace />;
}
