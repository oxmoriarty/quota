'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia, sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';

export const genlayerBradbury = defineChain({
  id: 4221,
  name: 'GenLayer Testnet Bradbury',
  nativeCurrency: { name: 'GenLayer Token', symbol: 'GEN', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-bradbury.genlayer.com'] },
  },
});
import { useState } from 'react';

const config = createConfig(
  getDefaultConfig({
    appName: 'Quota',
    chains: [baseSepolia, sepolia, genlayerBradbury],
    transports: {
      [baseSepolia.id]: http(),
      [sepolia.id]: http(),
      [genlayerBradbury.id]: http(),
    },
    walletConnectProjectId: 'YOUR_PROJECT_ID',
  })
);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider 
          theme="midnight" 
          customTheme={{
            "--ck-font-family": "var(--font-sans)",
            "--ck-border-radius": "16px",
            "--ck-overlay-background": "rgba(2, 6, 23, 0.85)", // deep slate overlay
            "--ck-overlay-backdrop-filter": "blur(8px)",
            "--ck-body-background": "#0f172a", // surface-container-low
            "--ck-body-background-secondary": "#1e293b",
            "--ck-body-color": "#f8fafc",
            "--ck-body-color-muted": "#94a3b8",
            "--ck-primary-button-background": "#1e293b",
            "--ck-primary-button-hover-background": "#334155",
            "--ck-primary-button-color": "#f8fafc",
            "--ck-primary-button-border-radius": "12px",
            "--ck-secondary-button-background": "#020617",
            "--ck-secondary-button-hover-background": "#1e293b",
            "--ck-secondary-button-color": "#f8fafc",
            "--ck-secondary-button-border-radius": "12px",
            "--ck-accent-color": "#6366f1", // primary indigo
            "--ck-accent-text-color": "#ffffff",
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
