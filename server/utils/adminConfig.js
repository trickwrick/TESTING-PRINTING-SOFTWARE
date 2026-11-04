export const DEFAULT_ADMIN_EMAIL = 'admin@test.com';
export const DEFAULT_ADMIN_PASSWORD = 'Admin@123';
export const LEGACY_ADMIN_EMAIL = 'admin@gmail.com';

export const isAdminEmail = (email) =>
  String(email || '').trim().toLowerCase() === DEFAULT_ADMIN_EMAIL;
