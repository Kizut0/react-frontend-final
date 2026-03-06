//UserProvider.jsx

import { useContext, useState } from "react";
import { UserContext } from "./UserContext";

export function UserProvider ({children}) {

  const initialUser = {
    isLoggedIn: false,
    name: '',
    email: ''
  };

  const API_URL = import.meta.env.VITE_API_URL;

  const [user, setUser] = useState(initialUser);

  const login = async (email, password) => {
    //TODO: Implement your login mechanism here.
  }

  const logout = async () => {
    const result = await fetch(`${API_URL}/api/user/logout`, {
      method: "POST",
      credentials: "include"
    });
    const newUser = { isLoggedIn: false, name: '', email: '' };
    setUser(newUser);
    localStorage.setItem("session", JSON.stringify(newUser));
  }

  return (
    <UserContext.Provider value={{user, login, logout}}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser () {
  return useContext(UserContext);
}