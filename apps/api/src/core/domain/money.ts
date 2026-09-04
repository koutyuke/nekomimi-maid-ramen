import { Schema } from "effect";

export const Price = Schema.Int.pipe(Schema.positive(), Schema.brand("Price"));
export type Price = Schema.Schema.Type<typeof Price>;
