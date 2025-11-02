import { useAuth as useAuthContext } from '../context/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const auth = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!auth.isLoading && !auth.isAuthenticated) {
      navigate('/login');
    }
  }, [auth.isAuthenticated, auth.isLoading, navigate]);

  return auth;
};

export default useAuth;