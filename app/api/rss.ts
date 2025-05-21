// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import { bcs } from "@mysten/sui/bcs";
import { SuiClient } from "@mysten/sui/client";
import { RSS_ID_TABLE_MAINNET, RSS_PACKAGE_ID_MAINNET } from "../src/constants";
import { Transaction } from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import xmlFormat from "xml-formatter";

/**
 * Sui client for the RSS feed.
 */
const client = new SuiClient({
    url: "https://fullnode.mainnet.sui.io:443",
});

/**
 * Vercel `Function` handler for the RSS feed.
 * Fetches the RSS feed from the Sui blockchain and returns a valid RSS feed.
 *
 * TODO:
 * - consider using etag to cache the RSS feed.
 * - consider optimal caching duration / strategy.
 */
export default async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const name = url.pathname.slice(1);
    const limit = url.searchParams.get("limit");
    const offset = url.searchParams.get("offset");

    // Fetch the RSS feed from Sui.
    const result = await rssFeedByName(
        name.replace(".xml", ""),
        limit ? +limit : 10,
        offset ? +offset : 0,
    );

    // If not success, return the error and JSON response.
    if (!result.success) {
        return new Response(JSON.stringify(result), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    // On success, return the RSS feed.
    // Do not apply cache headers as the RSS feed is dynamic.
    return new Response(result.output, {
        status: 200,
        headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
        },
    });
}

/** Required by Vercel to run on edge runtime. */
export const config = { runtime: "edge" };

/**
 * Fetches the RSS feed from the Sui blockchain.
 *
 * @param name - The name of the RSS feed.
 * @param limit - The limit of the RSS feed.
 * @param offset - The offset of the RSS feed.
 * @returns Response object with RSS feed and success status.
 */
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

    // Use the devInspect to get the RSS feed.
    const devInspect = await client.devInspectTransactionBlock({
        sender: normalizeSuiAddress("0x0"),
        transactionBlock: tx,
    });

    // If the transaction failed, return the error and result of the devInspect.
    if (!devInspect.results) {
        return {
            success: false,
            devInspect,
        };
    }

    // On success, we know the format of the return values and parse them as BCS
    // to get the underlying RSS feed.
    const output = bcs
        .string() // @ts-ignore
        .parse(new Uint8Array(devInspect.results[0].returnValues[0][0] as number[]));

    return {
        success: true,
        output: xmlFormat(output),
    };
}
