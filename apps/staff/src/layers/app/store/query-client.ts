import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    // 在庫は営業中に動くため、画面へ戻るたびに取り直す。
    queries: { staleTime: 0, retry: 1 },
  },
});
