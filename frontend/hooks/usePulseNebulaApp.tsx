"use client";

import { useMemo } from "react";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useFhevm } from "@/fhevm/useFhevm";
import { usePulseNebula } from "@/hooks/usePulseNebula";

export function usePulseNebulaApp() {
  const {
    provider,
    chainId,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const { storage } = useInMemoryStorage();

  const fhe = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: Boolean(provider),
  });

  const pulseNebula = usePulseNebula({
    instance: fhe.instance,
    fhevmDecryptionSignatureStorage: storage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const statusBadge = useMemo(() => {
    if (!provider) {
      return "Waiting for wallet connection";
    }
    if (fhe.status === "loading") {
      return "FHEVM engine loading";
    }
    if (fhe.status === "error") {
      return `FHEVM initialization failed: ${fhe.error?.message ?? ""}`;
    }
    if (fhe.status === "ready") {
      return "FHEVM engine ready for encryption";
    }
    return "FHEVM pending";
  }, [provider, fhe.status, fhe.error]);

  return {
    connect,
    isConnected,
    chainId,
    statusBadge,
    pulseNebula,
    fhe,
  };
}

