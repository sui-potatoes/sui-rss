// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

import About from "./pages/About";
import Discover from "./pages/Discover";
import Main from "./pages/Main";
import MyFeeds from "./pages/MyFeeds";
import NewFeed from "./pages/NewFeed";
import { Route, Routes } from "react-router-dom";

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
                        <Route path="/discover" element={<Discover />} />
                        <Route path="/discover/:page" element={<Discover />} />
                        <Route path="/my-feeds" element={<MyFeeds />} />
                        <Route path="/my-feeds/:name" element={<MyFeeds />} />
                        <Route path="/new" element={<NewFeed />} />
                        <Route index path="/about" element={<About />} />
                    </Routes>
                </div>
                <div className="mt-10">
                    <a href="..">back</a>
                </div>
            </div>
        </div>
    );
}
