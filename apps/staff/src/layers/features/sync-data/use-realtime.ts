import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useEffectEvent, useState } from "react";
import type { QueryKey } from "@tanstack/react-query";

import { staffQueries } from "../../entities/staff";
import { isAccessDenied } from "../../shared/api";
import { subscribeUpdates } from "../../shared/realtime";
import type { Snapshot, ResourceScope } from "@nekomimi/api";

type RealtimeOptions = {
  scope: ResourceScope;
  queryKey: QueryKey;
  checkRevision: (signal: AbortSignal) => Promise<number>;
  enabled: boolean;
  onCheck?: () => void;
};

export const useRealtime = (options: RealtimeOptions) => {
  const client = useQueryClient();
  const [attempt, setAttempt] = useState(0);

  const { enabled, scope, checkRevision } = options;

  const key = JSON.stringify(options.queryKey);
  const generation = JSON.stringify([enabled, scope, key, attempt]);

  const [state, setState] = useState({ generation, connected: false, failed: false, denied: false });

  const onCheck = useEffectEvent(() => options.onCheck?.());

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const queryKey: unknown = JSON.parse(key);
    if (!Array.isArray(queryKey)) {
      throw new Error("Invalid query key");
    }

    const change = (patch: Partial<Omit<typeof state, "generation">>) =>
      setState((current) => ({
        ...(current.generation === generation ? current : { connected: false, failed: false, denied: false }),
        generation,
        ...patch,
      }));

    const filter = { queryKey, exact: true };

    let stopped = false;
    let stop: (() => void) | undefined;

    const deny = () => {
      if (stopped) {
        return;
      }
      stopped = true;
      stop?.();
      change({ connected: false, denied: true });
      void client.cancelQueries(filter);
      client.removeQueries(filter);
      void client.invalidateQueries({ queryKey: staffQueries.current().queryKey });
    };

    const unsubscribe = client.getQueryCache().subscribe((event) => {
      if (JSON.stringify(event.query.queryKey) === key && isAccessDenied(event.query.state.error)) {
        deny();
      }
    });

    stop = subscribeUpdates({
      scope,
      checkRevision,
      getRevision: () => client.getQueryData<Snapshot<unknown>>(queryKey)?.revision,
      needsRefresh: () => client.getQueryState(queryKey)?.status === "error",
      refresh: async (force) => {
        const alreadyFetching = client.isFetching(filter) > 0;
        await client.refetchQueries(filter, { cancelRefetch: false, throwOnError: true });
        // 接続前に始まった取得だけでは、接続直前の通知漏れを回収したとは限らない。
        if (force && alreadyFetching && !stopped) {
          await client.refetchQueries(filter, { cancelRefetch: false, throwOnError: true });
        }
        const snapshot = client.getQueryData<Snapshot<unknown>>(queryKey);
        if (!snapshot) {
          throw new Error("Snapshot unavailable");
        }
        return snapshot.revision;
      },
      onConnection: (connected) => change({ connected }),
      onUnavailable: (failed) => change({ failed }),
      onDenied: deny,
      onCheck: () => onCheck(),
    });

    return () => {
      stopped = true;
      stop?.();
      unsubscribe();
    };
  }, [client, enabled, scope, key, generation, checkRevision]);

  return {
    connected: enabled && state.generation === generation && state.connected,
    failed: state.generation === generation && state.failed,
    denied: state.generation === generation && state.denied,
    retry: () => setAttempt((current) => current + 1),
  };
};
