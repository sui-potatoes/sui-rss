// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import { useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { useParams } from "react-router-dom";

export default function Discover() {
    const { page } = useParams();
    const parentId = useNetworkVariable("tableId");
    const { data: fields } = useSuiClientQuery("getDynamicFields", {
        parentId: parentId,
        limit: 10,
        cursor: page || null,
    });

    return (
        <div>
            <p className="mb-10">discover</p>
            {fields?.data.map((field) => {
                let value = field.name.value as string;
                return (
                    <p key={value}>
                        -{" "}
                        <a
                            href={`/${value.replace(".sui", "")}.xml`}
                            className="text-blue-500"
                            target="_blank"
                        >
                            {value.replace(".sui", "")}
                        </a>{" "}
                        <a
                            onClick={(e) => {
                                navigator.clipboard.writeText(
                                    `${window.location.origin}/${value.replace(".sui", "")}.xml`,
                                );
                                (e.target as HTMLAnchorElement).innerHTML = "(copied)";
                                setTimeout(
                                    () => ((e.target as HTMLAnchorElement).innerHTML = "(copy)"),
                                    1000,
                                );
                            }}
                        >
                            (copy)
                        </a>
                    </p>
                );
            })}
            {fields?.hasNextPage && <a href={`/discover/${fields.nextCursor}`}>next</a>}
            {page && <a onClick={() => window.history.back()}>prev</a>}
        </div>
    );
}
