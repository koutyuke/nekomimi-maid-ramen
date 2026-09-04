import { Data } from "effect";

export class PersistenceError extends Data.TaggedError("PersistenceError")<{
  readonly operation: string;
  readonly cause: unknown;
}> {
  // D1の例外は列挙可能な属性を持たない。`cause`をそのまま直列化すると空のオブジェクトになり、
  // 記録から原因が消える。
  override get message(): string {
    const detail = this.cause instanceof Error ? this.cause.message : String(this.cause);

    return `${this.operation}: ${detail}`;
  }
}
