// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import { Transaction } from "@mysten/sui/transactions";
import { useMyFeeds } from "../hooks/useMyFeeds";
import { useSuinsNames } from "../hooks/useSuinsNames";
import { useNetworkVariable } from "../networkConfig";
import { SuiObjectRef } from "@mysten/sui/client";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { SuinsRegistration } from "../hooks/useSuinsNames";
import { Modal } from "./Components";
import { bcs } from "@mysten/sui/bcs";
import { useState } from "react";

export default function NewFeed() {
    const { data: mySuinsNames, isFetching } = useSuinsNames();
    const registryId = useNetworkVariable("registryId");
    const packageId = useNetworkVariable("packageId");
    const [modalOpen, setModalOpen] = useState(false);
    const [suinsName, setSuinsName] = useState<
        (SuiObjectRef & { suins: SuinsRegistration }) | null
    >(null);
    const [title, setTitle] = useState("");
    const [link, setLink] = useState("");
    const [description, setDescription] = useState("");
    const currentAccount = useCurrentAccount();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const myFeeds = useMyFeeds();

    return (
        <div>
            <p>new feed</p>
            <div className="mt-10">
                {isFetching && <p>loading...</p>}
                {!isFetching && (
                    <div>
                        {mySuinsNames?.map((name) => {
                            const isRegistered = myFeeds.find((feed) => {
                                return feed.data?.rss.rss.name == name.suins.domain_name;
                            });

                            const href = isRegistered
                                ? `/my-feeds/${name.suins.domain_name.replace(".sui", "")}`
                                : undefined;

                            return (
                                <div key={name.suins.domain_name}>
                                    <p>
                                        -{" "}
                                        <a
                                            href={href}
                                            onClick={() => {
                                                if (isRegistered) return;
                                                setModalOpen(true);
                                                setSuinsName(name);
                                                setTitle(name.suins.domain_name);
                                            }}
                                        >
                                            {name.suins.domain_name.replace(".sui", "")}
                                        </a>
                                        {isRegistered ? " (registered)" : ""}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <Modal show={modalOpen} onClose={() => setModalOpen(false)}>
                <div className="gap-2 flex flex-col" onClick={(e) => e.stopPropagation()}>
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
                            newFeed({ title, link, description, suinsName: suinsName! }).then(
                                () => {
                                    setModalOpen(false);
                                    setSuinsName(null);
                                    setTitle("");
                                    setLink("");
                                    setDescription("");
                                },
                            );
                        }}
                    >
                        publish
                    </button>
                </div>
            </Modal>
        </div>
    );

    async function newFeed({
        title,
        link,
        description,
        suinsName,
    }: {
        title: string;
        link: string;
        description: string;
        suinsName: SuiObjectRef & { suins: SuinsRegistration };
    }) {
        if (!currentAccount) throw new Error("No account");

        const tx = new Transaction();
        let [rss, cap] = tx.moveCall({
            target: `${packageId}::rss::new_rss`,
            arguments: [tx.object(registryId), tx.objectRef(suinsName), tx.object.clock()],
        });

        const keys = bcs.vector(bcs.string()).serialize(["title", "link", "description"]);
        const values = bcs
            .vector(bcs.string())
            .serialize([title, link, description].map((s) => s.trim()));

        tx.moveCall({
            target: `${packageId}::rss::set_metadata`,
            arguments: [rss, cap, tx.pure(keys), tx.pure(values), tx.object.clock()],
        });

        tx.moveCall({
            target: `${packageId}::rss::share_rss`,
            arguments: [rss],
        });

        tx.transferObjects([cap], currentAccount.address);

        // @ts-ignore
        const res = await signAndExecuteTransaction({ transaction: tx });

        window.location.href = `/my-feeds/${suinsName.suins.domain_name.replace(".sui", "")}`;
    }
}
