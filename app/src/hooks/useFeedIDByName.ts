// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import { useSuiClientQuery } from "@mysten/dapp-kit";
import useRSSRegistry from "./useRSSRegistry";

export default function useFeedIDByName({ name }: { name?: string }) {
    const { data: registry } = useRSSRegistry();
    return useSuiClientQuery(
        "getDynamicFieldObject",
        {
            parentId: registry?.registry.feeds_id || "",
            name: { type: `0x1::string::String`, value: `${name}.sui` },
        },
        {
            enabled: !!registry,
            select(data) {
                if (!data.data) throw new Error("No data");
                if (!data.data.content) throw new Error("No content");
                if (data.data.content.dataType !== "moveObject")
                    throw new Error("Not a move object");

                // @ts-ignore
                return data.data.content.fields.value;
            },
        },
    );
}
