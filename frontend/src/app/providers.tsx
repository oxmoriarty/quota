'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
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

import { UIProvider } from '@/components/UIProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <ConnectKitProvider 
            mode="dark" 
            customTheme={{
              "--ck-font-family": "var(--font-sans)",
              "--ck-border-radius": "16px",
              "--ck-overlay-background": "rgba(2, 6, 23, 0.85)",
              "--ck-overlay-backdrop-filter": "blur(8px)",
              "--ck-body-background": "var(--color-surface)",
              "--ck-body-background-secondary": "var(--color-surface-container-highest)",
              "--ck-body-color": "var(--color-on-surface)",
              "--ck-body-color-muted": "var(--color-on-surface-variant)",
              "--ck-primary-button-background": "var(--color-primary)",
              "--ck-primary-button-hover-background": "var(--color-primary-hover)",
              "--ck-primary-button-color": "var(--color-on-primary)",
              "--ck-primary-button-border-radius": "12px",
              "--ck-secondary-button-background": "var(--color-surface-container-high)",
              "--ck-secondary-button-hover-background": "var(--color-surface-variant)",
              "--ck-secondary-button-color": "var(--color-on-surface)",
              "--ck-secondary-button-border-radius": "12px",
              "--ck-accent-color": "var(--color-primary)",
              "--ck-accent-text-color": "var(--color-on-primary)",
            }}
          >
            <UIProvider>
              {children}
            </UIProvider>
          </ConnectKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
