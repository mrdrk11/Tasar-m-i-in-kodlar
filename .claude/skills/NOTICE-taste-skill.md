# Taste Skill — source and license

The `design-taste-frontend` folder in this directory is an unmodified copy of
the Taste Skill (tasteskill 2.5.1).

- Source: https://github.com/Leonxlnx/taste-skill (`skills/taste-skill/` folder)
- Commit: `f6b76575f949707b4e3c37cd86cb44b0b98643e8` (2026-11-07)
- Install name: `design-taste-frontend`

The skill runs its own Node 22+ scripts and headless Chrome, and its
`SKILL.md` registers a Stop hook (`scripts/gate.mjs`) while the skill is in
use. Bundled photographs and icons keep their own licences; the skill credits
them through `scripts/photos.mjs credits`.

To update, replace the folder with the newer `skills/taste-skill/` from the
source repository and change the commit above.

## License (MIT)

Copyright (c) 2026 Leonxlnx

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
