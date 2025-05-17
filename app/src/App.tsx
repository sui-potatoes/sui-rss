// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import About from "./pages/About";
import Main from "./pages/Main";
import MyFeeds from "./pages/MyFeeds";
import NewFeed from "./pages/NewFeed";
import { Route, Routes } from "react-router-dom";
import RSSFeed from "./pages/RSSFeed";

export function App() {
    return (
        <div className="md:flex flex-wrap gap-5 items-start">
            <div className="p-10">
                <h1 className="text-2xl">
                    {"<"}rss.sui {"/>"}
                </h1>
                <div className="mt-10">
                    <Routes>
                        <Route path="/" element={<Main />} />
                        <Route path="/my-feeds" element={<MyFeeds />} />
                        <Route path="/my-feeds/:name" element={<MyFeeds />} />
                        <Route path="/rss/:name" element={<RSSFeed />} />
                        <Route path="/new" element={<NewFeed />} />
                        <Route index path="/about" element={<About />} />
                    </Routes>
                </div>
                <div className="mt-10">
                    <a href=".." className="text-blue-500">
                        back
                    </a>
                </div>
            </div>
        </div>
    );
}
