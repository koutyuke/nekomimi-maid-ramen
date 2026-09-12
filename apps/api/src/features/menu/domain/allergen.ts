import { Schema } from "effect";

export const AllergenId = Schema.String.pipe(Schema.nonEmptyString(), Schema.brand("AllergenId"));
export type AllergenId = Schema.Schema.Type<typeof AllergenId>;

export const AllergenName = Schema.String.pipe(
  Schema.nonEmptyString(),
  Schema.maxLength(20),
  Schema.brand("AllergenName"),
);
export type AllergenName = Schema.Schema.Type<typeof AllergenName>;

export class Allergen extends Schema.Class<Allergen>("Allergen")({
  id: AllergenId,
  name: AllergenName,
}) {}
