"use client";

import { ReactNode } from "react";
import { MetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { MetaMaskEthersSignerProvider } from "@/hooks/metamask/useMetaMaskEthersSigner";

const MOCK_CHAIN_MAP: Readonly<Record<number, string>> = {
  31337: "http://127.0.0.1:8545",
};

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MetaMaskProvider>
      <MetaMaskEthersSignerProvider initialMockChains={MOCK_CHAIN_MAP}>
        {children}
      </MetaMaskEthersSignerProvider>
    </MetaMaskProvider>
  );
}

