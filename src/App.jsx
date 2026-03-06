import "./App.css";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import About from "./components/About";
import BookBorrow from "./components/BookBorrow";
import BookDetail from "./components/BookDetail";
import Books from "./components/Books";
import Faqs from "./components/Faqs";
import Home from "./components/Home";
import Login from "./components/Login";
import Logout from "./components/Logout";
import Profile from "./components/Profile";
import { useUser } from "./contexts/useUser";
import RequireAuth from "./middleware/RequireAuth";

function AppShell({ children }) {
  const { user } = useUser();

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true" />
        </div>

        <nav className="site-nav">
          <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/">
            Home
          </NavLink>
          <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/books">
            Books
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            to="/borrow"
          >
            Borrowers
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            to="/faqs"
          >
            FAQs
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            to="/about"
          >
            About
          </NavLink>
        </nav>

        <div className="header-actions">
          {user.isLoggedIn ? (
            <>
              <NavLink
                className={({ isActive }) => `header-button header-button-light${isActive ? " active" : ""}`}
                to="/profile"
              >
                Profile
              </NavLink>
              <NavLink className="header-button" to="/logout">
                Logout
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                className={({ isActive }) => `header-button header-button-light${isActive ? " active" : ""}`}
                to="/login?mode=login"
              >
                Login
              </NavLink>
              <NavLink className="header-button" to="/login?mode=register">
                Sign-up
              </NavLink>
            </>
          )}
        </div>
      </header>

      <main className="main-content">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/faqs" element={<Faqs />} />
        <Route path="/about" element={<About />} />
        <Route
          path="/logout"
          element={
            <RequireAuth>
              <Logout />
            </RequireAuth>
          }
        />
        <Route
          path="/books"
          element={
            <RequireAuth>
              <Books />
            </RequireAuth>
          }
        />
        <Route
          path="/books/:id"
          element={
            <RequireAuth>
              <BookDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/borrow"
          element={
            <RequireAuth>
              <BookBorrow />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
