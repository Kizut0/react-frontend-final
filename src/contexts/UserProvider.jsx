import { useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import { apiRequest } from "../lib/api";

const emptyUser = {
  isLoggedIn: false,
  id: "",
  username: "",
  email: "",
  firstname: "",
  lastname: "",
  role: "",
  status: "",
};

function normalizeUser(user) {
  if (!user) {
    return emptyUser;
  }

  return {
    isLoggedIn: true,
    id: user.id ?? "",
    username: user.username ?? "",
    email: user.email ?? "",
    firstname: user.firstname ?? "",
    lastname: user.lastname ?? "",
    role: user.role ?? "",
    status: user.status ?? "",
  };
}

function persistSession(user) {
  if (typeof window === "undefined") {
    return;
  }

  if (user.isLoggedIn) {
    window.localStorage.setItem("session", JSON.stringify(user));
  } else {
    window.localStorage.removeItem("session");
  }
}

function readStoredSession() {
  if (typeof window === "undefined") {
    return emptyUser;
  }

  try {
    const rawSession = window.localStorage.getItem("session");

    if (!rawSession) {
      return emptyUser;
    }

    const parsedSession = JSON.parse(rawSession);

    return parsedSession?.isLoggedIn ? normalizeUser(parsedSession) : emptyUser;
  } catch {
    return emptyUser;
  }
}

export function UserProvider({ children }) {
  const [initialSession] = useState(() => readStoredSession());
  const [user, setUser] = useState(initialSession);
  const [isHydrating, setIsHydrating] = useState(initialSession.isLoggedIn);

  function applyUser(nextUser) {
    const normalizedUser = normalizeUser(nextUser);
    setUser(normalizedUser);
    persistSession(normalizedUser);
    return normalizedUser;
  }

  useEffect(() => {
    let isMounted = true;

    if (!initialSession.isLoggedIn) {
      return () => {
        isMounted = false;
      };
    }

    async function hydrateSession() {
      const result = await apiRequest("/api/user/profile");

      if (!isMounted) {
        return;
      }

      if (result.ok && result.data?.user) {
        const profile = normalizeUser(result.data.user);
        setUser(profile);
        persistSession(profile);
      } else {
        setUser(emptyUser);
        persistSession(emptyUser);
      }

      setIsHydrating(false);
    }

    void hydrateSession();

    return () => {
      isMounted = false;
    };
  }, [initialSession.isLoggedIn]);

  async function refreshProfile() {
    const result = await apiRequest("/api/user/profile");

    if (!result.ok || !result.data?.user) {
      applyUser(null);
      return {
        ok: false,
        message: result.data?.message ?? "Session expired",
      };
    }

    return {
      ok: true,
      user: applyUser(result.data.user),
    };
  }

  async function login(email, password) {
    const result = await apiRequest("/api/user/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!result.ok || !result.data?.user) {
      return {
        ok: false,
        message: result.data?.message ?? "Login failed",
      };
    }

    return {
      ok: true,
      user: applyUser(result.data.user),
    };
  }

  async function register(payload) {
    const result = await apiRequest("/api/user", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!result.ok) {
      return {
        ok: false,
        message: result.data?.message ?? "Registration failed",
      };
    }

    return login(payload.email, payload.password);
  }

  async function logout() {
    await apiRequest("/api/user/logout", {
      method: "POST",
    });

    applyUser(null);
  }

  return (
    <UserContext.Provider value={{ user, isHydrating, login, register, logout, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
}
