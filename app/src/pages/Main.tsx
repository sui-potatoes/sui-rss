// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import { ConnectModal, useCurrentAccount } from "@mysten/dapp-kit";
import { useState } from "react";

export default function Main() {
    const currentAccount = useCurrentAccount();
    const [open, setOpen] = useState(false);
    const trigger = <a>{!currentAccount ? "connect wallet" : "connected"}</a>;

    return (
        <ul>
            <li>
                - <a href="/feeds">discover</a>
            </li>
            <li>
                -{" "}
                <ConnectModal
                    open={open}
                    onOpenChange={(isOpen) => setOpen(isOpen)}
                    trigger={trigger}
                />{" "}
            </li>
            <li>
                - <a href="/new">new feed</a>
            </li>
            <li>
                - <a href="/my-feeds">my feeds</a>
            </li>
            <li>
                - <a href="/about">about</a>
            </li>
        </ul>
    );
}
