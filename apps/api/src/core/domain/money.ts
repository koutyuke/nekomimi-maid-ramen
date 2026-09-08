import { Schema } from "effect";

export const Price = Schema.Int.pipe(Schema.positive(), Schema.brand("Price"));
export type Price = Schema.Schema.Type<typeof Price>;

export const Amount = Schema.Int.pipe(Schema.nonNegative(), Schema.brand("Amount"));
export type Amount = Schema.Schema.Type<typeof Amount>;
