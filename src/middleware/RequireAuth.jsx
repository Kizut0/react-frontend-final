import { useUser } from '../contexts/UserProvider';
import { Navigate } from 'react-router-dom';

export default function RequireAuth({ children }) {
  //TODO: Check Logged In status here based on exam requirements.
  return children;
}