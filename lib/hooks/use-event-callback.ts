/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useEffect, useLayoutEffect, useCallback } from 'react';

const useEnhancedEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * For accurately referencing state value on an memorised event handler.
 * @see https://reactjs.org/docs/hooks-faq.html#how-to-read-an-often-changing-value-from-usecallback
 * @see https://github.com/facebook/react/issues/14099#issuecomment-440013892
 */
export default function useEventCallback<T extends (...args: any[]) => unknown>(
  eventCallback: T,
): T {
  const ref = useRef<T>(eventCallback);

  useEnhancedEffect(() => {
    ref.current = eventCallback;
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return useCallback<any>(
    // eslint-disable-next-line no-void
    (...args: any[]) => (void 0, ref.current)(...args),
    [ref],
  );
}
