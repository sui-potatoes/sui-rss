# Sui RSS

Implements a simple RSS publishing platform, where new feeds are created with
top-level [SuiNS names](https://suins.io/). You can try the application by
visiting [suirss.com](https://suirss.com).

## Installing

### [Move Registry CLI](https://docs.suins.io/move-registry)

```bash
mvr add @rss/rss
```

### Manual

To add this library to your project, add this to your `Move.toml` file under
`[dependencies]` section:

```toml
# goes into [dependencies] section
rss = { git = "https://github.com/sui-potatoes/sui-rss.git", subdir = "packages/rss", rev = "rss@v1" }
```

Exported address of this package is:

```toml
rss = "0x0"
rss_registry = "0x..."
```

## License

This package is licensed under MIT.
