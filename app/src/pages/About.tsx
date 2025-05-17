// Copyright (c) Sui Potatoes
// SPDX-License-Identifier: MIT

export default function About() {
    return (
        <div className="max-w-2xl mx-auto">
            <p>
                Sui RSS is a decentralized RSS publishing platform built on the{" "}
                <a href="https://sui.io/" className="text-blue-500" target="_blank">
                    Sui blockchain
                </a>
                . You can create your own RSS feed and share it with others, as well as subscribe to
                other people's feeds using good old RSS readers.
            </p>
            <br />
            <p>
                To create a new feed, you need a{" "}
                <a href="https://suins.io/" target="_blank" className="text-blue-500">
                    SuiNS top-level name
                </a>
                . Once you have a name, you can create a new feed by sending a transaction to the
                network. Lastly, once the feed is created, you can post to it and share with others.
            </p>
            <br />
            <p>
                Feeds implement{" "}
                <a
                    href="https://en.wikipedia.org/wiki/RSS"
                    target="_blank"
                    className="text-blue-500"
                >
                    RSS 2.0
                </a>{" "}
                standard, and can be read by any RSS reader. Copy a link to the `xml` feed and paste
                it into your RSS reader to subscribe. If you're using iOS, we recommend using this{" "}
                <a
                    href="https://apps.apple.com/us/app/netnewswire-rss-reader/id1480640210"
                    target="_blank"
                    className="text-blue-500"
                >
                    RSS reader
                </a>{" "}
                (free, no registration, tested on iOS).
            </p>
            <p className="mt-10">
                Created with ❤️ by{" "}
                <a href="https://github.com/sui-potatoes" target="_blank" className="text-blue-500">
                    Sui Potatoes
                </a>
            </p>
        </div>
    );
}
