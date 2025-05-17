// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { bcs } from "@mysten/sui/bcs";
import { fromBase64 } from "@mysten/bcs";
import { SuiObjectRef } from "@mysten/sui/client";

const SuinsRegistration = bcs.struct("SuinsRegistration", {
    id: bcs.Address,
    domain: bcs.vector(bcs.String),
    domain_name: bcs.String,
    expiration_timestamp_ms: bcs.u64(),
    image_url: bcs.String,
});

export type SuinsRegistration = typeof SuinsRegistration.$inferType;

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
                    const bcs = obj.data?.bcs;

                    // hello typescript
                    if (!obj.data) throw new Error("No data");
                    if (!bcs) throw new Error("No bcs");
                    if (bcs.dataType !== "moveObject") throw new Error("Not a move object");

                    return {
                        suins: SuinsRegistration.parse(fromBase64(bcs.bcsBytes)),
                        objectId: obj.data.objectId,
                        digest: obj.data.digest,
                        version: obj.data.version,
                    } as SuiObjectRef & { suins: typeof SuinsRegistration.$inferType };
                });
            },
        },
    );
}
