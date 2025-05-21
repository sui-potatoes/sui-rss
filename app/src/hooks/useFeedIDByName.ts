// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import { useSuiClientQuery } from "@mysten/dapp-kit";
import useRSSRegistry from "./useRSSRegistry";

/**
 * Get the ID of the RSS feed by its name.
 */
export default function useFeedIDByName({ name }: { name?: string }) {
    const { data: registry } = useRSSRegistry();
    return useSuiClientQuery(
        "getDynamicFieldObject",
        {
            parentId: registry?.registry.feeds_id || "",
            name: {
                // Because we know the type of the Key in the Table, we can
                // construct names directly.
                type: `0x1::string::String`,
                value: `${name}.sui`,
            },
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
