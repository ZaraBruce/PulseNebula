import { useEffect, useState } from "react";
import type { Eip6963ProviderInfo } from "./Eip6963Types";

declare global {
  interface WindowEventMap {
    "eip6963:announceProvider": CustomEvent<Eip6963ProviderInfo>;
  }
}

type Eip6963AnnounceProviderEvent = Eip6963ProviderInfo;

export function useEip6963() {
  const [providers, setProviders] = useState<Eip6963ProviderInfo[]>([]);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    const providerSet = new Map<string, Eip6963ProviderInfo>();

    function onProvider(event: CustomEvent<Eip6963ProviderInfo>) {
      try {
        const info = event.detail;
        providerSet.set(info.info.uuid, info);
        setProviders(Array.from(providerSet.values()));
      } catch (err) {
        setError(err as Error);
      }
    }

    window.addEventListener(
      "eip6963:announceProvider",
      onProvider as EventListener
    );
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      window.removeEventListener(
        "eip6963:announceProvider",
        onProvider as EventListener
      );
    };
  }, []);

  return {
    providers,
    error,
  };
}

