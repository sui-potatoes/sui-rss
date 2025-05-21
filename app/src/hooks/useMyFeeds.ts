// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import { useCurrentAccount, useSuiClientQueries } from "@mysten/dapp-kit";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { fromBase64 } from "@mysten/bcs";
import { SuiObjectRef } from "@mysten/sui/client";
import { bcs } from "../bcs";

/** Type shorthand for the `sui_rss::rss::RSSAdminCap` type. */
export type RSSAdminCap = typeof bcs.RSSAdminCap.$inferType;

/**
 * Get the RSS feeds that the current account has admin access to.
 */
export function useMyFeeds() {
    const currentAccount = useCurrentAccount();
    const packageId = useNetworkVariable("packageId");
    const { data: myCaps } = useSuiClientQuery(
        "getOwnedObjects",
        {
            owner: currentAccount?.address || "",
            filter: {
                StructType: `${packageId}::rss::RSSAdminCap`,
            },
            options: { showBcs: true },
        },
        {
            select(data) {
                return data.data?.map((obj) => {
                    if (!obj.data) throw new Error("No data");
                    if (!obj.data.bcs) throw new Error("No bcs");
                    if (obj.data.bcs.dataType !== "moveObject")
                        throw new Error("Not a move object");

                    return {
                        cap: bcs.RSSAdminCap.parse(fromBase64(obj.data.bcs.bcsBytes)),
                        objectId: obj.data.objectId,
                        digest: obj.data.digest,
                        version: obj.data.version,
                    } as SuiObjectRef & { cap: RSSAdminCap };
                });
            },
        },
    );

    return useSuiClientQueries({
        queries: (myCaps || []).map((cap) => {
            return {
                method: "getObject",
                params: { id: cap.cap.rss_id, options: { showBcs: true, showOwner: true } },
                options: {
                    enabled: !!myCaps,
                    select(data) {
                        if (!data.data) throw new Error("No data");
                        if (!data.data.bcs) throw new Error("No bcs");
                        if (data.data.bcs.dataType !== "moveObject")
                            throw new Error("Not a move object");
                        if (!data.data.owner) throw new Error("No owner");
                        let owner = data.data.owner;

                        // @ts-ignore
                        if (!("Shared" in owner)) throw new Error("Not shared");

                        return {
                            cap,
                            rss: {
                                rss: bcs.RSS.parse(fromBase64(data.data.bcs.bcsBytes)),
                                objectId: data.data.objectId,
                                initialSharedVersion: owner.Shared.initial_shared_version,
                            },
                        };
                    },
                },
            };
        }),
        combine: (results) => results,
    });
}
