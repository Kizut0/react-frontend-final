//You can modify this component.

import { useRef, useState } from "react";
import { useUser } from "../contexts/UserProvider";
import { Navigate } from "react-router-dom";

export default function Login() {

  const [controlState, setControlState] = useState({
    isLoggingIn: false,
    isLoginError: false,
    isLoginOk: false
  });

  const emailRef = useRef();
  const passRef = useRef();
  const {user, login} = useUser();

  async function onLogin () {

    setControlState((prev)=>{
      return {
        ...prev,
        isLoggingIn: true
      }
    });

    const email = emailRef.current.value;
    const pass = passRef.current.value;

    const result = await login(email, pass);

    setControlState((prev) => {
      return {
        isLoggingIn: false,
        isLoginError: !result,
        isLoginOk: result
      }
    });
  }

  if (!user.isLoggedIn)
    return (
      <div>
        <table>
          <tbody>
            <tr>
              <th>Email</th>
              <td><input type="text" name="email" id="email" ref={emailRef}/> </td>
            </tr>
            <tr>
              <th>Password</th>
              <td><input type="password" name="password" id="password" ref={passRef}/> </td>
            </tr>
          </tbody>
        </table>
        <button onClick={onLogin} disabled={controlState.isLoggingIn}>Login</button>
        {controlState.isLoginError && <div>Login incorrect</div>}
        {user.isLoggedIn && <div>Login Success</div>}
      </div>
    );
  else
    return (
      <Navigate to="/profile" replace />
    );
}