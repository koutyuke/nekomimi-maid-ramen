import { Schema } from "effect";

export const CookingState = Schema.Literal("unstarted", "cooking", "completed");
export type CookingState = Schema.Schema.Type<typeof CookingState>;

export const cookingStateOf = (lines: ReadonlyArray<{ readonly cookingState: CookingState }>): CookingState => {
  if (lines.every((line) => line.cookingState === "unstarted")) {
    return "unstarted";
  }
  if (lines.every((line) => line.cookingState === "completed")) {
    return "completed";
  }
  return "cooking";
};
