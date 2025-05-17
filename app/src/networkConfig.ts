// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import { getFullnodeUrl } from "@mysten/sui/client";
import {
    RSS_PACKAGE_ID_TESTNET,
    RSS_REGISTRY_ID_TESTNET,
    SUINS_PACKAGE_ID_TESTNET,
} from "./constants";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } = createNetworkConfig({
    testnet: {
        url: getFullnodeUrl("testnet"),
        variables: {
            packageId: RSS_PACKAGE_ID_TESTNET,
            registryId: RSS_REGISTRY_ID_TESTNET,
            suinsPackageId: SUINS_PACKAGE_ID_TESTNET,
        },
    },
});

export { useNetworkVariable, useNetworkVariables, networkConfig };
