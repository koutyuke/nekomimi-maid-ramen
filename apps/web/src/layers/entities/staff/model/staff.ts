export const STAFF_ROLE_PRIORITY = { Owner: 0, Admin: 1, Staff: 2, None: 3 } as const;

export type StaffRole = keyof typeof STAFF_ROLE_PRIORITY;

export type Staff = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
};
