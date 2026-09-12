export default {
  meta: { name: "nekomimi" },
  rules: {
    "use-case-gen": {
      meta: {
        type: "suggestion",
        schema: [],
        messages: { useGen: "公開ユースケースはEffect.genで記述する。" },
      },
      create(context) {
        return {
          "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression"(node) {
            const body = node.body;
            if (
              node.async ||
              body.type !== "CallExpression" ||
              body.callee.type !== "MemberExpression" ||
              body.callee.object.name !== "Effect" ||
              body.callee.property.name !== "gen"
            ) {
              context.report({ node, messageId: "useGen" });
            }
          },
          "ExportNamedDeclaration > FunctionDeclaration"(node) {
            context.report({ node, messageId: "useGen" });
          },
        };
      },
    },
  },
};
