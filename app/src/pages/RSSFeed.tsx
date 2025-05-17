// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import { useParams } from "react-router-dom";
import useFeedIDByName from "../hooks/useFeedIDByName";
import { useEffect, useState } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "../networkConfig";
import xmlFormat from "xml-formatter";
import { bcs } from "@mysten/sui/bcs";

export default function RSSFeed() {
    const { name } = useParams();
    const client = useSuiClient();
    const currentAccount = useCurrentAccount();
    const packageId = useNetworkVariable("packageId");
    const [rss, setRSS] = useState<string | null>(null);
    const { data: feedId } = useFeedIDByName({ name });

    console.log(feedId);

    useEffect(() => {
        if (!feedId) return;

        printRSS({ limit: 10, offset: 0 }).then((result) => setRSS(result));
    }, [feedId]);

    return <pre>{rss?.replace("<", "\n<")}</pre>;

    async function printRSS({ limit, offset }: { limit?: number; offset?: number }) {
        const tx = new Transaction();

        tx.setGasBudget(10000000000000n);
        tx.moveCall({
            target: `${packageId}::sui_rss::print_rss`,
            arguments: [
                tx.object(feedId),
                tx.pure.u64(limit || 10),
                tx.pure.u64(offset || 0),
                tx.object.clock(),
            ],
        });

        const result = await client.devInspectTransactionBlock({
            // @ts-ignore
            transactionBlock: tx,
            sender: currentAccount?.address || "",
        });

        if (!result.results) throw new Error("No results");

        return xmlFormat(
            // @ts-ignore
            bcs.string().parse(new Uint8Array(result.results[0].returnValues[0][0] as number[])),
        );
    }
}
