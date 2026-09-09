import { Schema } from "effect";

export const StaffRole = Schema.Literal("Owner", "Admin", "Staff", "None");
export type StaffRole = typeof StaffRole.Type;

export const Staff = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  name: Schema.String,
  role: StaffRole,
});
export type Staff = typeof Staff.Type;

export const resolveRole = (storedRole: string, email: string, ownerEmail: string): StaffRole => {
  if (email === ownerEmail) {
    return "Owner";
  }
  return storedRole === "Admin" || storedRole === "Staff" ? storedRole : "None";
};

export const canOperate = (role: StaffRole, required: "Staff" | "Admin") =>
  role === "Owner" || role === "Admin" || (role === "Staff" && required === "Staff");
