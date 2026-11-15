export const isAdminRole = (role) => {
  return role === 'admin' || role === 'super_admin';
};

export const isSuperAdmin = (role) => {
  return role === 'super_admin';
};

export const isPatientRole = (role) => {
  return role === 'patient';
};

export const isUserRole = (role) => {
  return role === 'user';
};

export const getHomePathForRole = (role) => {
  if (isAdminRole(role)) return '/admin/dashboard';
  if (isPatientRole(role)) return '/patient';
  if (isUserRole(role)) return '/app/dashboard';
  return '/unauthorized';
};
