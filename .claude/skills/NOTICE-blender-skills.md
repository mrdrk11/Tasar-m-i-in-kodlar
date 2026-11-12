# Blender Skills — source and license

The Blender skill folders in this directory (`blender-director`,
`blender-modeler`, `hard-surface`, `lighting`, `rigging`, the `*-style`,
`*-mood`, `*-worlds` and `genre-*` folders and the rest, 94 skills in all)
and the shared `references/` folder are unmodified copies from Blender Skills
(version 1.3.0).

- Source: https://github.com/arjun988/blender-skills (`.claude/skills/` folder)
- Commit: `904f095d8f36a6e72adaebb08d07f884a074743d` (2026-11-06)

How they are loaded here: `.claude/settings.json` lists 93 of them under
`skillOverrides` as `name-only`, so only their names go into the session's
skill list and the descriptions of the other skills in this repository keep
their place. `blender-director` keeps its full description and routes to the
others. Delete an entry from `skillOverrides` to give that skill its full
description back.

The skills drive Blender through the Blender MCP server, which talks to a
running copy of Blender on the same computer. That server is not configured
in this repository.

To update, replace the folders with the newer ones from the source repository
and change the commit above.

## License (MIT)

Copyright (c) 2026 blender-skills contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
