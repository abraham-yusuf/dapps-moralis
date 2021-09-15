import { Moralis } from "moralis";
import isDeepEqual from "fast-deep-equal/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMoralis } from "src/hooks/useMoralis";
import { useImmer } from "use-immer";

export interface UseResolveCallOptions {
  autoFetch?: boolean;
}

export type ResolveCallParams = Record<string, unknown>;

export interface ResolveCallOptions<
  Result extends unknown,
  Params extends ResolveCallParams
> {
  onError?: (error: Error) => void;
  onSuccess?: (results: Result) => void;
  onComplete?: () => void;
  throwOnError?: boolean;
  params?: Params;
}

const defaultUseResolveCallOptions: UseResolveCallOptions = {
  autoFetch: true,
};

export const _useResolveCall = <
  Result extends unknown,
  Params extends ResolveCallParams = Record<string, unknown>
>(
  call: (params: Params) => Promise<Result>,
  initialData: Result,
  params?: Params,
  options?: UseResolveCallOptions,
) => {
  const { isInitialized } = useMoralis();
  const { autoFetch } = {
    ...defaultUseResolveCallOptions,
    ...(options ?? {}),
  };
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<null | Error>(null);
  const [data, setData] = useImmer<Result>(initialData);
  const paramsRef = useRef<ResolveCallParams | undefined>(params);

  if (!isDeepEqual(paramsRef.current, params)) {
    paramsRef.current = params;
  }

  /**
   * Run the function
   */
  const fetch = useCallback(
    async ({
      throwOnError,
      onComplete,
      onError,
      onSuccess,
      params: fetchParams,
    }: ResolveCallOptions<Result, Params> = {}) => {
      setIsFetching(true);
      setError(null);

      // @ts-ignore
      const combinedParams: Params = {
        ...params,
        ...fetchParams,
      };

      try {
        const results = await call(combinedParams);

        setData(results);
        if (onSuccess) {
          onSuccess(results);
        }
      } catch (error) {
        setData(initialData);
        setError(error);
        if (throwOnError) {
          throw error;
        }
        if (onError) {
          onError(error);
        }
      } finally {
        setIsFetching(false);
        if (onComplete) {
          onComplete();
        }
      }
    },
    [call, paramsRef.current],
  );

  const isLoading =
    isFetching &&
    data == null &&
    (Array.isArray(data) ? data.length === 0 : true);

  /**
   * Automatically fetch the call function
   */
  useEffect(() => {
    if (!isInitialized || !autoFetch) {
      return;
    }

    fetch();
  }, [fetch, isInitialized]);

  return {
    fetch,
    isFetching,
    isLoading,
    error,
    data,
    setData,
  };
};
