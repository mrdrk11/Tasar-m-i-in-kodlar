# Higgsfield skills — source and license

These folders in this directory are unmodified copies of the nine skills from
Higgsfield AI's official skills repository (version 0.14.0):

`higgsfield-generate`, `higgsfield-soul-id`, `higgsfield-product-photoshoot`,
`higgsfield-brandkit`, `higgsfield-marketplace-cards`, `higgsfield-websites`,
`higgsfield-faceless-video`, `higgsfield-video-explainer`,
`higgsfield-youtube-thumbnail`

- Source: https://github.com/higgsfield-ai/skills
- Commit: 27000402070db19d958789d05b3b52b6f4718d7c (2026-11-05)
- License: MIT, Copyright (c) 2026 Higgsfield AI

Not copied: the repository's `setup` script, `scripts/update-check.sh`, plugin
manifests, evals and docs.

## What they need to work

The skills only give instructions; the work is done by the Higgsfield CLI,
signed in to a Higgsfield account (generation uses that account's credits):

```bash
curl -fsSL https://raw.githubusercontent.com/higgsfield-ai/cli/main/install.sh | sh
higgsfield auth login
```

Until the CLI is installed and signed in, the skills cannot generate anything.

To update: copy the same folders again from a newer commit of the source.
