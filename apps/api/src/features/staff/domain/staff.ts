import { Data, Schema } from "effect";

export const StaffRole = Schema.Literal("Owner", "Admin", "Staff", "None");
export type StaffRole = typeof StaffRole.Type;

export const Staff = Schema.Struct({
  id: Schema.String.annotations({ description: "利用者ID" }),
  email: Schema.String.annotations({ description: "学校アカウントのメールアドレス" }),
  name: Schema.String.annotations({ description: "Googleアカウントの表示名" }),
  role: StaffRole.annotations({ description: "DBに保存された現在のロール。Noneは業務権限なしを表す。" }),
});
export type Staff = typeof Staff.Type;

export const resolveRole = (storedRole: string): StaffRole =>
  storedRole === "Owner" || storedRole === "Admin" || storedRole === "Staff" ? storedRole : "None";

export const canOperate = (role: StaffRole, required: "Staff" | "Admin") =>
  role === "Owner" || role === "Admin" || (role === "Staff" && required === "Staff");

export const EditableStaffRole = Schema.Literal("Admin", "Staff", "None");
export type EditableStaffRole = typeof EditableStaffRole.Type;

export class StaffForbidden extends Data.TaggedError("StaffForbidden") {}
export class StaffNotFound extends Data.TaggedError("StaffNotFound") {}

export const canChangeRole = (actor: Staff, target: Staff, role: EditableStaffRole) =>
  canOperate(actor.role, "Admin") &&
  actor.id !== target.id &&
  target.role !== "Owner" &&
  (actor.role === "Owner" || (target.role !== "Admin" && role !== "Admin"));
