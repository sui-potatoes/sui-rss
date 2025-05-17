// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import { bcs } from "@mysten/sui/bcs";
import { SuiClient } from "@mysten/sui/client";
import { RSS_ID_TABLE_MAINNET, RSS_PACKAGE_ID_MAINNET } from "../src/constants";
import { Transaction } from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import xmlFormat from "xml-formatter";

const client = new SuiClient({
    url: "https://fullnode.mainnet.sui.io:443",
});

export default async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const name = url.pathname.slice(1);
    const limit = url.searchParams.get("limit");
    const offset = url.searchParams.get("offset");

    const result = await rssFeedByName(
        name.replace(".xml", ""),
        limit ? +limit : 10,
        offset ? +offset : 0,
    );

    // if not success, return the error and JSON response
    if (!result.success) {
        return new Response(JSON.stringify(result), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    // on success, return the RSS feed
    return new Response(result.output, {
        status: 200,
        headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
        },
    });
}

export const config = {
    runtime: "edge",
};

async function rssFeedByName(name: string, limit: number = 10, offset: number = 0) {
    const feed = await client.getDynamicFieldObject({
        parentId: RSS_ID_TABLE_MAINNET,
        name: { type: "0x1::string::String", value: `${name}.sui` },
    });

    if (!feed || !feed.data || !feed.data.content) {
        return {
            success: false,
            message: "feed not found",
            name,
            feed,
        };
    }

    // @ts-ignore
    const objectId = feed.data.content.fields.value;
    const tx = new Transaction();
    tx.setGasBudget(100000000n);
    tx.moveCall({
        target: `${RSS_PACKAGE_ID_MAINNET}::rss::print_rss`,
        arguments: [
            tx.object(objectId),
            tx.pure.u64(limit),
            tx.pure.u64(offset),
            tx.object.clock(),
        ],
    });

    const devInspect = await client.devInspectTransactionBlock({
        sender: normalizeSuiAddress("0x0"),
        transactionBlock: tx,
    });

    if (!devInspect.results) {
        return {
            success: false,
            devInspect,
        };
    }

    const output = bcs
        .string() // @ts-ignore
        .parse(new Uint8Array(devInspect.results[0].returnValues[0][0] as number[]));

    return {
        success: true,
        output: xmlFormat(output),
    };
}
