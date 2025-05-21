// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { fromBase64 } from "@mysten/bcs";
import { SuiObjectRef } from "@mysten/sui/client";
import { bcs } from "../bcs";

/** Type shorthand for the BCS definition */
export type SuinsRegistration = typeof bcs.SuinsRegistration.$inferType;

export function useSuinsNames() {
    const currentAccount = useCurrentAccount();
    const suinsPackageId = useNetworkVariable("suinsPackageId");
    return useSuiClientQuery(
        "getOwnedObjects",
        {
            owner: currentAccount?.address || "",
            filter: {
                StructType: `${suinsPackageId}::suins_registration::SuinsRegistration`,
            },
            options: { showBcs: true },
        },
        {
            enabled: !!currentAccount?.address,
            select(data) {
                return data.data?.map((obj) => {
                    const bytes = obj.data?.bcs;

                    // hello typescript
                    if (!obj.data) throw new Error("No data");
                    if (!bytes) throw new Error("No bcs");
                    if (bytes.dataType !== "moveObject") throw new Error("Not a move object");

                    return {
                        suins: bcs.SuinsRegistration.parse(fromBase64(bytes.bcsBytes)),
                        objectId: obj.data.objectId,
                        digest: obj.data.digest,
                        version: obj.data.version,
                    } as SuiObjectRef & { suins: SuinsRegistration };
                });
            },
        },
    );
}
