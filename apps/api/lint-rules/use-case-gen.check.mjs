import { RuleTester } from "oxlint/plugins-dev";

import plugin from "./use-case-gen.mjs";

new RuleTester().run("use-case-gen", plugin.rules["use-case-gen"], {
  valid: [
    "export const list = () => Effect.gen(function* () { return yield* service.read().pipe(handleError); });",
    "const decode = (input) => decoder(input).pipe(handleError);",
  ],
  invalid: [
    { code: "export const list = () => Service.pipe(read);", errors: [{ messageId: "useGen" }] },
    { code: "export const list = () => service.read();", errors: [{ messageId: "useGen" }] },
    { code: "export const list = async () => Effect.gen(function* () {});", errors: [{ messageId: "useGen" }] },
    { code: "export function list() { return Service.pipe(read); }", errors: [{ messageId: "useGen" }] },
  ],
});
