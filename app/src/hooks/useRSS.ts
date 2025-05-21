// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import { useSuiClientQuery } from "@mysten/dapp-kit";
import { fromBase64 } from "@mysten/bcs";
import { bcs } from "../bcs";

export default function useRSS({ id }: { id: string }) {
    return useSuiClientQuery(
        "getObject",
        { id, options: { showBcs: true, showOwner: true } },
        {
            enabled: !!id,
            select(data) {
                if (!data.data) throw new Error("No data");
                if (!data.data.bcs) throw new Error("No bcs");
                if (data.data.bcs.dataType !== "moveObject") throw new Error("Not a move object");
                if (!data.data.owner) throw new Error("No owner");
                let owner = data.data.owner;

                // @ts-ignore
                if (!("Shared" in owner)) throw new Error("Not shared");

                return {
                    rss: bcs.RSS.parse(fromBase64(data.data.bcs.bcsBytes)),
                    objectId: data.data.objectId,
                    initialSharedVersion: owner.Shared.initial_shared_version,
                };
            },
        },
    );
}
