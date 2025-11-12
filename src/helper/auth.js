export const isAdminRole = (role) => {
  return role === 'admin' || role === 'super_admin';
};

export const isSuperAdmin = (role) => {
  return role === 'super_admin';
};
