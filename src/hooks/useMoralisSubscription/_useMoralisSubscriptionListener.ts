import { Moralis } from "moralis";
import { useEffect } from "react";
import { useMoralis } from "../useMoralis";

export type MoralisListenerHandler = (
  entity: Moralis.Object<Moralis.Attributes>,
) => void;

export const _useSubscriptionListener = ({
  name,
  handler,
  enable,
  subscription,
}: {
  name: "open" | "create" | "update" | "enter" | "leave" | "delete" | "close";
  handler?: MoralisListenerHandler;
  enable: boolean;
  subscription?: Moralis.LiveQuerySubscription;
}) => {
  const { isInitialized } = useMoralis();

  /**
   * Assign listeners subscription
   */
  useEffect(() => {
    if (!enable || !isInitialized || !subscription || !handler) {
      return;
    }

    subscription.on(name, handler);

    return () => {
      if (subscription) {
        subscription.off(name, handler);
      }
    };
  }, [isInitialized, handler, enable, name]);
};
