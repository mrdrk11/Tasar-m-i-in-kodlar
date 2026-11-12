# 21st MCP (formerly Magic MCP) — source and license

- Source: https://github.com/21st-dev/magic-mcp
- Commit: `6b5299e8a83ceffa73d4fc4e148905bb3eeeeb55` (2026-09-09)

Two things come from it:

- `21st-ui/` in this directory is an unmodified copy of `skills/21st-ui/`.
- `.mcp.json` at the repository root registers the hosted 21st MCP server
  (`https://21st.dev/api/mcp`), the setup the source repository recommends in
  place of the old `@21st-dev/magic` package. The file adds `"type": "http"`
  and a placeholder default for the key; otherwise it matches the source.

The server needs a 21st.dev API key (https://21st.dev/mcp). The key is never
stored in this repository: it is read from the `API_KEY_21ST` environment
variable, or supplied by the cloud environment's saved credential for
`21st.dev`.

## License (ISC)

Copyright (c) 2026 21st.dev

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
