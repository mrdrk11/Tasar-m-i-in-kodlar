# UI UX Pro Max — source and license

These folders in this directory are copies of the skills shipped by UI UX Pro
Max (version 2.15.0):

`ui-ux-pro-max`, `design`, `design-system`, `ui-styling`, `brand`,
`banner-design`, `slides`

- Source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (`.claude/skills/` folder)
- Commit: `6ae86f61f520d6ca229d2f40e070410638c908c5` (2026-11-10)

Two differences from the source:

- `ui-ux-pro-max/SKILL.md`: the search script path
  `${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max/scripts/search.py` is
  written as `.claude/skills/ui-ux-pro-max/scripts/search.py`, because this is
  a project install and not a plugin install. The upstream installer makes the
  same substitution.
- `ui-styling/scripts/.coverage` (a leftover test-coverage database) is left out.

The scripts need Python 3. The image-generation scripts in `design/` only work
with your own API key (`GEMINI_API_KEY`, `ATLASCLOUD_API_KEY` or
`MUAPI_API_KEY`) and send the prompt to that provider. The fonts in
`ui-styling/canvas-fonts/` carry their own OFL license files.

To update, replace the folders with the newer ones from the source repository,
re-apply the path change, and update the commit above.

## License (MIT)

Copyright (c) 2024 Next Level Builder

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
