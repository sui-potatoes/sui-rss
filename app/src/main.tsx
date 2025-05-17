// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import React from "react";
import ReactDOM from "react-dom/client";
import "@mysten/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";
import "./index.css";

import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { networkConfig } from "./networkConfig.ts";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App.tsx";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
                <WalletProvider autoConnect theme={null} storageKey="sui-rss-wallet">
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    </React.StrictMode>,
);
