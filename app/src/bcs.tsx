// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import { bcs } from "@mysten/sui/bcs";

/**
 * Type layout for the `sui_rss::rss::RSS` type.
 */
const RSS = bcs.struct("RSS", {
    id: bcs.Address,
    name: bcs.String,
    cap_id: bcs.Address,
    is_public: bcs.Bool,
    publishers: bcs.vector(bcs.Address),
    suins_id: bcs.Address,
    last_updated_ms: bcs.u64(),
    metadata: bcs.vector(
        bcs.struct("Entry", {
            key: bcs.String,
            value: bcs.String,
        }),
    ),
    items: bcs.struct("TableVec", {
        id: bcs.Address,
        size: bcs.u64(),
    }),
});

/**
 * Type layout for the `sui_rss::rss::RSSAdminCap` type.
 */
const RSSAdminCap = bcs.struct("RSSAdminCap", {
    id: bcs.Address,
    rss_id: bcs.Address,
});

/**
 * Type layout for the `sui_rss::rss::RSSRegistry` type.
 */
const RSSRegistry = bcs.struct("RSSRegistry", {
    id: bcs.Address,
    feeds_id: bcs.Address,
    num_feeds: bcs.u64(),
});

/**
 * Type layout for the `suins::suins_registration::SuinsRegistration` type.
 */
const SuinsRegistration = bcs.struct("SuinsRegistration", {
    id: bcs.Address,
    domain: bcs.vector(bcs.String),
    domain_name: bcs.String,
    expiration_timestamp_ms: bcs.u64(),
    image_url: bcs.String,
});

const bcsWrapper = { ...bcs, RSS, RSSRegistry, RSSAdminCap, SuinsRegistration };

export { bcsWrapper as bcs };
