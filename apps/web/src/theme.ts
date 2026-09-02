import { createTheme } from "@mantine/core";

// 見た目は後から詰める。ここでは業務上必要な既定だけを置く。
export const theme = createTheme({
  // 会計、調理、受け渡しは立ったまま片手で操作する。押し間違いを減らすため既定を大きくする。
  components: {
    Button: {
      defaultProps: { size: "md" },
    },
    NumberInput: {
      defaultProps: { size: "md" },
    },
  },
});
