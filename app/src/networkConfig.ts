// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import { getFullnodeUrl } from "@mysten/sui/client";
import {
    RSS_ID_TABLE_TESTNET,
    RSS_PACKAGE_ID_TESTNET,
    RSS_REGISTRY_ID_TESTNET,
    SUINS_PACKAGE_ID_TESTNET,
    RSS_ID_TABLE_MAINNET,
    RSS_PACKAGE_ID_MAINNET,
    RSS_REGISTRY_ID_MAINNET,
    SUINS_PACKAGE_ID_MAINNET,
} from "./constants";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } = createNetworkConfig({
    testnet: {
        url: getFullnodeUrl("testnet"),
        variables: {
            tableId: RSS_ID_TABLE_TESTNET,
            packageId: RSS_PACKAGE_ID_TESTNET,
            registryId: RSS_REGISTRY_ID_TESTNET,
            suinsPackageId: SUINS_PACKAGE_ID_TESTNET,
        },
    },
    mainnet: {
        url: getFullnodeUrl("mainnet"),
        variables: {
            tableId: RSS_ID_TABLE_MAINNET,
            packageId: RSS_PACKAGE_ID_MAINNET,
            registryId: RSS_REGISTRY_ID_MAINNET,
            suinsPackageId: SUINS_PACKAGE_ID_MAINNET,
        },
    },
});

export { useNetworkVariable, useNetworkVariables, networkConfig };
