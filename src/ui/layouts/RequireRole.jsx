import { Navigate } from 'react-router';
import { useUserRole } from '../../helper/useUserRole';
import { Loader } from '../components/Loader';
import { isAdminRole, isSuperAdmin } from '../../helper/auth';

export function RequireRole({
  role: requiredRole,
  children,
  redirectTo = '/unauthorized',
}) {
  const { role, loading } = useUserRole();

  if (loading) {
    return <Loader size="large" />;
  }

  // Check if user has required role
  let hasAccess = false;

  if (requiredRole === 'admin') {
    // Allow both admin and super_admin
    hasAccess = isAdminRole(role);
  } else if (requiredRole === 'super_admin') {
    // Only allow super_admin
    hasAccess = isSuperAdmin(role);
  } else {
    // For other roles, exact match
    hasAccess = role === requiredRole;
  }

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
