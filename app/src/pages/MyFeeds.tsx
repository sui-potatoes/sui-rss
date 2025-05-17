// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import { useParams } from "react-router-dom";
import { useMyFeeds } from "../hooks/useMyFeeds";
import { useState } from "react";
import { Modal } from "./Components";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "../networkConfig";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { bcs } from "@mysten/sui/bcs";

export default function MyFeeds() {
    const { name } = useParams();
    const feeds = useMyFeeds();
    const packageId = useNetworkVariable("packageId");
    const [title, setTitle] = useState("");
    const [link, setLink] = useState("");
    const [description, setDescription] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const feed = (name && feeds.find((feed) => feed.data?.rss.rss.name === `${name}.sui`)) || null;

    return (
        <div>
            <p>
                <a href="/my-feeds">my feeds</a>
                {name && (
                    <>
                        {" / "}
                        <span className="underline">{name}</span>
                    </>
                )}
            </p>
            {!feed && (
                <div className="mt-10">
                    {feeds.length > 0 &&
                        feeds.map((feed) => {
                            if (!feed.data) return null;

                            const name = feed.data?.rss.rss.name.replace(".sui", "");
                            return (
                                <div key={feed.data?.cap.objectId}>
                                    <p>
                                        -{" "}
                                        <a href={`/my-feeds/${name}`} className="text-blue-500">
                                            {name}
                                        </a>
                                    </p>
                                </div>
                            );
                        })}

                    {feeds.length === 0 && (
                        <p>
                            No feeds found, <a href="/new">create one</a>
                        </p>
                    )}
                </div>
            )}
            {feed && (
                <>
                    <div className="mt-10">
                        {feed.data?.rss.rss.metadata
                            .concat([
                                {
                                    key: "is public",
                                    value: feed.data!.rss.rss.is_public ? "yes" : "no",
                                },
                                { key: "items", value: feed.data!.rss.rss.items.size },
                                {
                                    key: "last updated",
                                    value: new Date(
                                        +feed.data!.rss.rss.last_updated_ms,
                                    ).toUTCString(),
                                },
                            ])
                            .map(({ key, value }) => {
                                if (key === "link") {
                                    return (
                                        <p key={key}>
                                            - {key}:{" "}
                                            <a href={value} className="text-blue-500">
                                                {value}
                                            </a>
                                        </p>
                                    );
                                }

                                return (
                                    <p key={key}>
                                        - {key}: {value}
                                    </p>
                                );
                            })}
                        <p className="mt-10">
                            - feed URL:{" "}
                            <a href={`/${name}.xml`} className="text-blue-500">
                                {`/${name}.xml`}
                            </a>{" "}
                            <a
                                onClick={(e) => {
                                    navigator.clipboard.writeText(
                                        `${window.location.origin}/${name}.xml`,
                                    );
                                    (e.target as HTMLAnchorElement).innerHTML = "(copied)";
                                    setTimeout(
                                        () =>
                                            ((e.target as HTMLAnchorElement).innerHTML = "(copy)"),
                                        1000,
                                    );
                                }}
                            >
                                (copy)
                            </a>
                        </p>
                        <p className="mt-1">
                            -{" "}
                            <button onClick={() => setModalOpen(true)} className="text-blue-500">
                                post new item
                            </button>
                        </p>
                        <Modal show={modalOpen} onClose={() => setModalOpen(false)}>
                            <div
                                className="gap-2 flex flex-col"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between">
                                    <input
                                        id="title"
                                        type="text"
                                        placeholder="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                    <label className="mr-2" htmlFor="title">
                                        title
                                    </label>
                                </div>
                                <div className="flex justify-between">
                                    <input
                                        id="link"
                                        type="text"
                                        placeholder="link"
                                        value={link}
                                        onChange={(e) => setLink(e.target.value)}
                                    />
                                    <label className="mr-2" htmlFor="link">
                                        link
                                    </label>
                                </div>
                                <div className="flex justify-between">
                                    <input
                                        id="description"
                                        type="text"
                                        placeholder="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                    <label className="mr-2" htmlFor="description">
                                        description
                                    </label>
                                </div>
                                <button
                                    className="mt-10"
                                    onClick={() => {
                                        addItem({ title, link, description }).then(() =>
                                            setModalOpen(false),
                                        );
                                    }}
                                >
                                    publish
                                </button>
                            </div>
                        </Modal>
                    </div>
                </>
            )}
        </div>
    );

    async function addItem({
        title,
        link,
        description,
    }: {
        title: string;
        link: string;
        description: string;
    }) {
        if (!feed || !feed.data) return;

        const tx = new Transaction();
        const keys = bcs.vector(bcs.string()).serialize(["title", "link", "description"]);
        const values = bcs
            .vector(bcs.string())
            .serialize([title, link, description].map((s) => s.trim()));

        const auth = tx.moveCall({
            target: `${packageId}::rss::add_item`,
            arguments: [
                tx.sharedObjectRef({
                    objectId: feed.data.rss.objectId,
                    initialSharedVersion: feed.data.rss.initialSharedVersion,
                    mutable: true,
                }),
                tx.pure(keys),
                tx.pure(values),
                tx.object.clock(),
            ],
        });

        tx.moveCall({
            target: `${packageId}::rss::confirm_admin`,
            arguments: [auth, tx.objectRef(feed.data.cap)],
        });

        // @ts-ignore
        const result = await signAndExecuteTransaction({ transaction: tx });

        console.log(result);

        return result;
    }
}
