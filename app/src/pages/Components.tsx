// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import { ReactNode } from "react";

type ModalProps = {
    children: ReactNode | ReactNode[];
    show: boolean;
    onClose: () => void;
};

export function Modal({ children, show, onClose }: ModalProps) {
    return (
        <div
            className="absolute top-0 left-0 h-screen w-full bg-black/90 overflow-auto"
            style={{ display: show ? "flex" : "none" }}
            onClick={onClose}
        >
            <div className="m-auto">{children}</div>
        </div>
    );
}
