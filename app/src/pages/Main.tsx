// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import { ConnectModal, useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import { useState } from "react";

export default function Main() {
    const { mutate: disconnect } = useDisconnectWallet();
    const currentAccount = useCurrentAccount();
    const [open, setOpen] = useState(false);
    const trigger = <a>{!currentAccount ? "connect wallet" : "connected"}</a>;
    const disabledClass = "text-gray-500 disabled hover:cursor-not-allowed";

    return (
        <ul>
            <li>
                - <a href="/discover">discover</a>
            </li>
            <li>
                -{" "}
                <a href="/new" className={!currentAccount ? disabledClass : ""}>
                    new feed
                </a>
            </li>
            <li>
                -{" "}
                <a href="/my-feeds" className={!currentAccount ? disabledClass : ""}>
                    my feeds
                </a>
            </li>
            <li>
                - <a href="/about">about</a>
            </li>
            {!currentAccount && (
                <li>
                    -{" "}
                    <ConnectModal
                        open={open}
                        onOpenChange={(isOpen) => setOpen(isOpen)}
                        trigger={trigger}
                    />{" "}
                </li>
            )}
            {currentAccount && (
                <li>
                    - <a onClick={() => disconnect()}>disconnect</a>
                </li>
            )}
        </ul>
    );
}
