// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import { useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { fromBase64 } from "@mysten/bcs";
import { bcs } from "../bcs";

export default function useRSSRegistry() {
    const registryId = useNetworkVariable("registryId");
    return useSuiClientQuery(
        "getObject",
        {
            id: registryId,
            options: {
                showBcs: true,
                showOwner: true,
            },
        },
        {
            select: (data) => {
                if (!data.data) throw new Error("No data");
                if (!data.data.bcs) throw new Error("No bcs");
                if (!data.data.owner) throw new Error("No owner");
                if (data.data.bcs.dataType !== "moveObject") throw new Error("Not a move object");
                // @ts-ignore
                if (!("Shared" in data.data.owner)) throw new Error("Not shared");

                const registry = bcs.RSSRegistry.parse(fromBase64(data.data.bcs.bcsBytes));

                return {
                    registry,
                    objectId: data.data.objectId,
                    initialSharedVersion: data.data.owner.Shared.initial_shared_version,
                    isMutable: true,
                };
            },
        },
    );
}
