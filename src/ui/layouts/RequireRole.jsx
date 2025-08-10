import { Navigate } from 'react-router';
import { useUserRole } from '../../helper/useUserRole';
import { Loader } from '../components/Loader';

export function RequireRole({
  role: requiredRole,
  children,
  redirectTo = '/unauthorized', // 🔁 updated default
}) {
  const { role, loading } = useUserRole();

  if (loading) {
    return <Loader size="large" />;
  }

  if (role !== requiredRole) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
