// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

/// Module: rss
///
/// TODOs:
/// - `is_public` cannot be changed.
module rss::rss;

use std::string::String;
use sui::{
    clock::Clock,
    package,
    table::{Self, Table},
    table_vec::{Self, TableVec},
    vec_map::{Self, VecMap},
    vec_set::{Self, VecSet}
};
use suins::suins_registration::SuinsRegistration;

/// Trying to register a new RSS feed with an expired name.
const ENameExpired: u64 = 0;
/// Trying to publish to a non-public feed.
const ENotPublic: u64 = 1;
/// Trying to publish to a public feed with the RSSAdminCap.
const ENotAdmin: u64 = 2;
/// Trying to register a new RSS feed with an existing name.
const ENameExists: u64 = 3;
/// Trying to use an invalid RSSAdminCap.
const EInvalidCap: u64 = 4;
/// Trying to take over the RSS feed from the previous owner with an expired name.
const ENameDoesNotExist: u64 = 5;
/// Trying to take over the RSS feed from the previous owner with an already owned RSS feed.
const EAlreadyOwned: u64 = 6;
/// Trying to publish to a feed without the proper cap.
const ENotPublisher: u64 = 7;

/// OTW for the RSS package.
public struct RSS has drop {}

/// RSS is a key object to register RSS feeds. Each feed is a separate RSS object
/// discoverable via the RSSRegistry.
public struct RSSRegistry has key {
    id: UID,
    /// Stores all the registered RSS feeds. Each is uniquely identified by its
    /// name. For example, there could be a feed of kind:
    /// https://suirss.com/move-book.xml
    feeds: Table<String, ID>,
}

/// A Capability to administer a single RSS registry.
public struct RSSAdminCap has key, store {
    id: UID,
    /// The ID of the RSS registry that the admin is associated with.
    rss_id: ID,
}

/// Capability to publish to a single RSS feed.
public struct RSSPublishCap has key, store {
    id: UID,
    /// The ID of the RSS feed that the publish cap is associated with.
    rss_id: ID,
}

/// Authorization potato, which can be destroyed by the admin or by the publisher
/// if they're publishing to the feed.
public struct Authorization(ID, ID, bool, VecSet<ID>)

/// A single RSS feed item.
public struct RSSItem(VecMap<String, String>) has drop, store;

/// A single RSS feed. A shared object, discoverable via the `RSSRegistry`.
public struct RSSFeed has key {
    id: UID,
    /// The name of the SuiNS registration that the RSS feed is associated with.
    name: String,
    /// The ID of the RSSAdminCap that is associated with this RSS feed. We keep
    /// track of it for the case when SuiNS name has expired, and a new owner is
    /// taking over the feed.
    cap_id: ID,
    /// Whether anyone can publish to this RSS feed.
    is_public: bool,
    /// The IDs of the publishers that are allowed to publish to this RSS feed.
    publishers: VecSet<ID>,
    /// The ID of the Suiins registration that the RSS feed is associated with.
    suins_id: ID,
    /// The last time the RSS feed was updated.
    last_updated_ms: u64,
    /// RSS feed metadata.
    metadata: VecMap<String, String>,
    /// The RSS feed items, we store them as `TableVec` to never hit the object
    /// size limit.
    items: TableVec<RSSItem>,
}

#[allow(lint(self_transfer))]
public fun new_rss(
    reg: &mut RSSRegistry,
    name: &SuinsRegistration,
    clock: &Clock,
    ctx: &mut TxContext,
): (RSSFeed, RSSAdminCap) {
    assert!(!name.has_expired(clock), ENameExpired);
    assert!(!reg.feeds.contains(name.domain_name()), ENameExists);

    let id = object::new(ctx);
    let cap = RSSAdminCap { id: object::new(ctx), rss_id: id.to_inner() };
    let domain_name = name.domain_name();
    reg.feeds.add(domain_name, id.to_inner());

    let rss = RSSFeed {
        id,
        name: domain_name,
        cap_id: cap.id.to_inner(),
        is_public: false,
        publishers: vec_set::empty(),
        suins_id: object::id(name),
        last_updated_ms: clock.timestamp_ms(),
        metadata: vec_map::from_keys_values(vector[b"title".to_string()], vector[domain_name]),
        items: table_vec::empty(ctx),
    };

    (rss, cap)
}

/// Overrides metadata in place.
/// Two fields cannot be passed: `name` and `timestamp`.
public fun set_metadata(
    rss: &mut RSSFeed,
    cap: &RSSAdminCap,
    fields: vector<String>,
    values: vector<String>,
    clock: &Clock,
    _ctx: &mut TxContext,
) {
    assert!(rss.id.to_inner() == cap.rss_id, ENotAdmin);
    assert!(rss.cap_id == cap.id.to_inner(), EInvalidCap);

    let mut metadata = vec_map::from_keys_values(fields, values);

    // Strip out the fields that are not allowed to be set.
    vector[b"name", b"timestamp", b"pubDate"].destroy!(|v| {
        let v = v.to_string();
        if (metadata.contains(&v)) { metadata.remove(&v); }
    });

    rss.last_updated_ms = clock.timestamp_ms();
    rss.metadata = metadata;
}

/// Create a new publisher cap for the RSS feed.
/// It can then be transferred or used in an application.
public fun new_publisher(rss: &mut RSSFeed, cap: &RSSAdminCap, ctx: &mut TxContext): RSSPublishCap {
    assert!(rss.id.to_inner() == cap.rss_id, ENotAdmin);
    assert!(rss.cap_id == cap.id.to_inner(), EInvalidCap);

    let id = object::new(ctx);
    rss.publishers.insert(id.to_inner());
    RSSPublishCap { id, rss_id: rss.id.to_inner() }
}

/// Revoke a publisher from the RSS feed, can only be done by the admin.
public fun revoke_publisher(
    rss: &mut RSSFeed,
    cap: &RSSAdminCap,
    publisher_id: ID,
    _ctx: &mut TxContext,
) {
    assert!(rss.id.to_inner() == cap.rss_id, ENotAdmin);
    assert!(rss.cap_id == cap.id.to_inner(), EInvalidCap);

    if (rss.publishers.contains(&publisher_id)) {
        rss.publishers.remove(&publisher_id);
    };
}

/// Return the capability and remove the publisher from the RSS feed.
public fun give_up_publisher(rss: &mut RSSFeed, cap: RSSPublishCap) {
    let RSSPublishCap { id, rss_id } = cap;

    assert!(rss.id.to_inner() == rss_id, ENotPublisher);

    if (rss.publishers.contains(id.as_inner())) {
        rss.publishers.remove(id.as_inner());
    };

    id.delete();
}

/// Add an item to the RSS feed. Creates a Potato Authorization request. If
/// public - can be destroyed right away. If not - need to show the RSSAdminCap.
public fun add_item(
    rss: &mut RSSFeed,
    fields: vector<String>,
    values: vector<String>,
    clock: &Clock,
    _ctx: &mut TxContext,
): Authorization {
    let mut metadata = vec_map::from_keys_values(fields, values);

    vector[b"title", b"name", b"guid", b"pubDate"].destroy!(|v| {
        let v = v.to_string();
        if (metadata.contains(&v)) { metadata.remove(&v); }
    });

    metadata.insert(b"pubDate".to_string(), utc_date_time(clock.timestamp_ms()));
    // prettier-ignore
    metadata.insert(b"guid".to_string(), {
        let mut guid_value = rss.name;
        guid_value.append_utf8(b"/");
        guid_value.append(rss.items.length().to_string());
        guid_value
    });

    rss.last_updated_ms = clock.timestamp_ms();
    rss.items.push_back(RSSItem(metadata));

    Authorization(rss.id.to_inner(), rss.cap_id, rss.is_public, rss.publishers)
}

/// Confirm that the item was published to a public feed.
public fun confirm_public(auth: Authorization) {
    let Authorization(_, _, is_public, _) = auth;
    assert!(is_public, ENotPublic);
}

/// Confirm action with the RSSAdminCap.
public fun confirm_admin(auth: Authorization, cap: &RSSAdminCap) {
    let Authorization(id, cap_id, _, _) = auth;
    assert!(id == cap.rss_id, ENotAdmin);
    assert!(cap_id == cap.id.to_inner(), EInvalidCap);
}

/// Confirm action with the RSSPublishCap.
public fun confirm_publisher(auth: Authorization, cap: &RSSPublishCap) {
    let Authorization(id, _, _, publishers) = auth;
    assert!(id == cap.rss_id, ENotPublisher);
    assert!(publishers.contains(&cap.id.to_inner()), ENotPublisher);
}

/// Take over the RSS feed from the previous owner by showing the new valid SuinsRegistration.
public fun take_over(
    reg: &mut RSSRegistry,
    rss: &mut RSSFeed,
    suins: &SuinsRegistration,
    clock: &Clock,
    ctx: &mut TxContext,
): RSSAdminCap {
    assert!(!suins.has_expired(clock), ENameExpired);
    assert!(reg.feeds.contains(suins.domain_name()), ENameDoesNotExist);
    assert!(suins.domain_name() == rss.metadata[&b"name".to_string()], EAlreadyOwned);
    assert!(rss.suins_id != object::id(suins), EAlreadyOwned);

    let id = object::new(ctx);
    rss.cap_id = id.to_inner();
    rss.suins_id = object::id(suins);

    RSSAdminCap { id, rss_id: rss.id.to_inner() }
}

/// Share the RSS object after making changes.
public fun share_rss(rss: RSSFeed) { transfer::share_object(rss) }

#[allow(unused_function)]
/// To be called in a dry run.
/// Prints the RSS feed items in an XML format, in DESC order, limited by the `limit`.
/// Records are stored as a vector, we take the last `limit` items, offsetting them
/// by `offset`. So offset=0 means the last `limit` items, offset=1 means the last
/// `limit` items excluding the first one, etc.
fun print_rss(rss: &RSSFeed, limit: u64, offset: u64, clock: &Clock): String {
    let length = rss.items.length();
    let start_idx = if (length >= limit + offset) length - limit - offset else 0;

    let mut output = b"<?xml version=\"1.0\" encoding=\"UTF-8\"?>".to_string();
    output.append_utf8(b"<rss version=\"2.0\">");
    output.append_utf8(b"\n<channel>");

    rss.metadata.size().do!(|i| {
        let (key, value) = rss.metadata.get_entry_by_idx(i);
        output.append(print_xml(*key, *value));
    });

    output.append(print_xml(b"pubDate".to_string(), utc_date_time(rss.last_updated_ms)));
    output.append(print_xml(b"lastBuildDate".to_string(), utc_date_time(clock.timestamp_ms())));

    (length - offset - start_idx).do!(|i| {
        let idx = i + start_idx;
        let item = &rss.items[idx].0;

        output.append_utf8(b"\n<item>");
        item.size().do!(|j| {
            let (key, value) = item.get_entry_by_idx(j);
            output.append(print_xml(*key, *value));
        });
        output.append_utf8(b"</item>");
    });

    output.append_utf8(b"</channel>");
    output.append_utf8(b"</rss>");
    output
}

fun print_xml(name: String, value: String): String {
    let mut tag = b"<".to_string();
    tag.append(name);
    tag.append(b">".to_string());
    tag.append(value);
    tag.append(b"</".to_string());
    tag.append(name);
    tag.append(b">".to_string());
    tag
}

/// Initialize the RSS registry once.
fun init(otw: RSS, ctx: &mut TxContext) {
    package::claim_and_keep(otw, ctx);
    transfer::share_object(RSSRegistry {
        id: object::new(ctx),
        feeds: table::new(ctx),
    });
}

// === Date and time ===

const DAYS: vector<vector<u8>> = vector[b"Sun", b"Mon", b"Tue", b"Wed", b"Thu", b"Fri", b"Sat"];
const DAYS_IN_MONTH: vector<u64> = vector[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// prettier-ignore
const MONTHS: vector<vector<u8>> = vector[
    b"Jan", b"Feb", b"Mar",
    b"Apr", b"May", b"Jun",
    b"Jul", b"Aug", b"Sep",
    b"Oct", b"Nov", b"Dec",
];

#[allow(implicit_const_copy)]
fun utc_date_time(timestamp_ms: u64): String {
    let seconds = timestamp_ms / 1000;
    let mut remaining = seconds;

    // == Time of day ==
    let s = remaining % 60;
    remaining = remaining / 60;
    let m = remaining % 60;
    remaining = remaining / 60;
    let h = remaining % 24;

    // == Days since epoch ==
    let mut days = seconds / 86400;
    let mut year = 1970u16;

    // == Leap year ==
    loop {
        let is_leap = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
        let days_in_year = if (is_leap) 366 else 365;

        if (days < days_in_year) break
        else {
            year = year + 1;
            days = days - days_in_year;
        };
    };

    // == Month and day ==
    let mut month = 0;
    let days_in_month = DAYS_IN_MONTH;

    loop {
        let is_leap = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
        let days_in_month = if (is_leap && month == 1) 29 else days_in_month[month];

        if (days < days_in_month) break
        else {
            month = month + 1;
            days = days - days_in_month;
        };
    };

    // == Day of Month ==
    let day = days + 1;
    let day_of_week = (seconds / 86400 + 4) % 7;

    let mut date_time = b"".to_string();
    date_time.append_utf8(DAYS[day_of_week]);
    date_time.append_utf8(b", ");
    date_time.append(day.pad_zero());
    date_time.append_utf8(b" ");
    date_time.append_utf8(MONTHS[month]);
    date_time.append_utf8(b" ");
    date_time.append(year.to_string());
    date_time.append_utf8(b" ");
    date_time.append(h.pad_zero());
    date_time.append_utf8(b":");
    date_time.append(m.pad_zero());
    date_time.append_utf8(b":");
    date_time.append(s.pad_zero());
    date_time.append_utf8(b" GMT");
    date_time
}

use fun pad_zero as u64.pad_zero;

fun pad_zero(num: u64): String {
    if (num < 10) {
        let mut str = b"0".to_string();
        str.append(num.to_string());
        str
    } else num.to_string()
}

#[test]
fun test_utc_date_time() {
    use std::unit_test::assert_eq;

    assert_eq!(utc_date_time(0), b"Thu, 01 Jan 1970 00:00:00 GMT".to_string());
    assert_eq!(utc_date_time(86400000), b"Fri, 02 Jan 1970 00:00:00 GMT".to_string());
    assert_eq!(utc_date_time(1747409967000), b"Fri, 16 May 2025 15:39:27 GMT".to_string());
    assert_eq!(utc_date_time(1609459200000), b"Fri, 01 Jan 2021 00:00:00 GMT".to_string());
    assert_eq!(utc_date_time(1715853600000), b"Thu, 16 May 2024 10:00:00 GMT".to_string());
    assert_eq!(utc_date_time(1893456000000), b"Tue, 01 Jan 2030 00:00:00 GMT".to_string());
    assert_eq!(utc_date_time(2145916800000), b"Fri, 01 Jan 2038 00:00:00 GMT".to_string());
}

#[test]
fun test_full_rss_flow() {
    use suins::suins_registration;
    use sui::test_utils::destroy;

    let ctx = &mut tx_context::dummy();
    let mut clock = sui::clock::create_for_testing(ctx);
    clock.increment_for_testing(1747409967000); // let this day be remembered
    let domain = suins::domain::new(b"move-book".to_string());
    let suins = suins_registration::new_for_testing(domain, 10, &clock, ctx);

    let mut reg = RSSRegistry { id: object::new(ctx), feeds: table::new(ctx) };
    let (mut rss, cap) = reg.new_rss(&suins, &clock, ctx);

    rss.set_metadata(
        &cap,
        vector[b"title", b"description", b"language", b"link"].map!(|s| s.to_string()),
        vector[
            b"The Move Book",
            b"The best Move book in the world",
            b"en-us",
            b"https://move-book.com/",
        ].map!(|s| s.to_string()),
        &clock,
        ctx,
    );

    rss
        .add_item(
            vector[b"title".to_string(), b"description".to_string(), b"link".to_string()],
            vector[
                b"Now Enums".to_string(),
                b"We missed this topic in the book for longest time".to_string(),
                b"https://move-book.com/move-basics/enum-and-match".to_string(),
            ],
            &clock,
            ctx,
        )
        .confirm_admin(&cap);

    rss
        .add_item(
            vector[b"title".to_string(), b"description".to_string(), b"link".to_string()],
            vector[
                b"Move Reference is merged".to_string(),
                b"We finally merged the Move Reference into the book".to_string(),
                b"https://move-book.com/reference".to_string(),
            ],
            &clock,
            ctx,
        )
        .confirm_admin(&cap);

    rss
        .add_item(
            vector[b"title".to_string(), b"description".to_string(), b"link".to_string()],
            vector[
                b"Coin and Balance Page is in!".to_string(),
                b"We finally added the Coin&Balance page to the book".to_string(),
                b"https://move-book.com/programmability/coin-and-balance".to_string(),
            ],
            &clock,
            ctx,
        )
        .confirm_admin(&cap);

    std::debug::print(&print_rss(&rss, 10, 0, &clock));

    destroy(rss);
    destroy(cap);
    destroy(clock);
    destroy(suins);
    destroy(reg);
}
