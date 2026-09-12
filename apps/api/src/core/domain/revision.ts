import { Schema } from "effect";

export const ResourceScope = Schema.Literal("menu", "orders");
export type ResourceScope = Schema.Schema.Type<typeof ResourceScope>;

export const Revision = Schema.Int.pipe(Schema.nonNegative());
export type ResourceRevisions = Partial<Record<ResourceScope, number>>;

export type Snapshot<A> = { readonly data: A; readonly revision: number };
