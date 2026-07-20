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
        <ConnectKitProvider theme="retro" customTheme={{
          "--ck-font-family": "var(--font-sans)",
          "--ck-border-radius": "8px",
          "--ck-overlay-background": "rgba(0, 0, 0, 0.7)",
          "--ck-overlay-backdrop-filter": "blur(4px)",
          "--ck-body-background": "#18181b",
          "--ck-body-color": "#fafafa",
          "--ck-primary-button-background": "#fafafa",
          "--ck-primary-button-color": "#18181b",
          "--ck-secondary-button-background": "#27272a",
          "--ck-secondary-button-color": "#fafafa",
        }}>
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
