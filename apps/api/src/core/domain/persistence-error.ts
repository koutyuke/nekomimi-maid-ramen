import { Data } from "effect";

export class PersistenceError extends Data.TaggedError("PersistenceError")<{
  readonly operation: string;
  readonly cause: unknown;
}> {
  // DEC-SYS-005
  override get message(): string {
    const detail = this.cause instanceof Error ? this.cause.message : String(this.cause);

    return `${this.operation}: ${detail}`;
  }
}
