export const userRoles = ['USER', 'ADMIN', 'SUPER_ADMIN', 'PARTNER'] as const;
export type UserRole = (typeof userRoles)[number];

export const userStatuses = ['ACTIVE', 'SUSPENDED', 'DELETED'] as const;
export type UserStatus = (typeof userStatuses)[number];

export const adminRoles = ['ADMIN', 'SUPER_ADMIN'] as const;
export type AdminRole = (typeof adminRoles)[number];

export type CurrentAdmin = {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  status: Extract<UserStatus, 'ACTIVE'>;
};
