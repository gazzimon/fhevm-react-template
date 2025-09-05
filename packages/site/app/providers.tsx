"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { SessionProvider } from "next-auth/react";

import { MetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";
import { MetaMaskEthersSignerProvider } from "@/hooks/metamask/useMetaMaskEthersSigner";

type Props = { children: ReactNode };

export default function Providers({ children }: Props) {
  // ✅ useMemo para no recrear el objeto en cada render
  const mockChains = useMemo<Record<number, string>>(() => {
    const m: Record<number, string> = { 31337: "http://localhost:8545" };
    // Si definiste NEXT_PUBLIC_RPC_URL, habilita Sepolia:
    if (process.env.NEXT_PUBLIC_RPC_URL) {
      m[11155111] = process.env.NEXT_PUBLIC_RPC_URL as string; // Sepolia
    }
    return m;
  }, []);

  return (
    <SessionProvider /* refetchOnWindowFocus={false} */>
      <MetaMaskProvider>
        <MetaMaskEthersSignerProvider initialMockChains={mockChains}>
          <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
        </MetaMaskEthersSignerProvider>
      </MetaMaskProvider>
    </SessionProvider>
  );
}
