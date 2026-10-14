# Owner attestation templates (unsigned)

Copy a section into `docs/licensing/attestations/` as a dated Markdown file, fill the fields, and commit.
Until a filled attestation exists, treat the corresponding blocker as open.

These templates are for the SagaTree repository owner (`iamthamanic`). They are not legal advice.

---

## A — Agent / alternate Git identities (incl. Raccoovaclaw)

**File suggestion:** `docs/licensing/attestations/YYYY-MM-DD-agent-identities.md`

```text
I, [LEGAL NAME], GitHub user iamthamanic, am the owner of the SagaTree repository
https://github.com/iamthamanic/SagaTree.

I confirm that the following Git author identities were used solely under my direction
on systems I control, for work I instructed, and were not independent third-party
human contributors asserting separate ownership:

- Raccoovaclaw <raccoovaclaw@gmx.de>
- OpenClaw <openclaw@localhost>
- OpenClaw Slay <noreply@openclaw.internal>
- Halteverbot Social Mac Pro <halteverbotsocialmacpro@mac.speedport.ip>

To the extent I own or control copyright in contributions made under those identities
that remain in this repository, I license them under AGPL-3.0-only as stated in LICENSE,
subject to third-party notices in LICENSES.md and docs/licensing/.

I understand that if any of those identities were in fact independent authors, this
attestation does not bind them and separate assent is required.

Signed: ____________________  Date: __________
```

---

## B — Figma Make import

**File suggestion:** `docs/licensing/attestations/YYYY-MM-DD-figma-make.md`

```text
I, [LEGAL NAME], controlled the Figma Make project that produced the initial SagaTree /
MakeMySaga frontend import (git commits by figma[bot], including 70d4a232 and cbab7df2).

I authorize relicensing of my Make-generated original expression remaining in this
repository under AGPL-3.0-only, while preserving third-party terms already noted in
src/Attributions.md (e.g. shadcn/ui MIT; Unsplash license for Unsplash photos).

Signed: ____________________  Date: __________
```

---

## C — First-party media (icons, species art, Meshy GLB/VRM, brand, screenshots)

**File suggestion:** `docs/licensing/attestations/YYYY-MM-DD-first-party-media.md`

```text
I, [LEGAL NAME], confirm that media classified as source=sagatree-first-party in
docs/licensing/asset-inventory.json were created for SagaTree under my accounts /
commissioned pipelines (including Cursor GenerateImage→SVG icons, Meshy generation
runs recorded in assets/species-3d/**/provenance.json, and brand/screenshot files
authored in-repo by iamthamanic).

I set the redistribution terms for those files as follows (choose one per class and
update asset-inventory.json accordingly):

- Runtime UI icons (public/assets/items, public/assets/npc-creatures): [e.g. CC BY 4.0 / All Rights Reserved with AGPL software / other]
- Species / avatar meshes shipped under public/assets/avatars/species: [e.g. …]
- Brand marks (docs/brand, src/assets/sagatree-logo.png, favicons): Reserved — see TRADEMARKS.md
- Docs screenshots (docs/screenshots): [e.g. All Rights Reserved / CC BY 4.0]

I confirm Meshy / Cursor / other vendor ToS for the generation accounts used allow
this redistribution in a public GitHub repository and self-host packages.

Signed: ____________________  Date: __________
```

After signing § C, re-run `node scripts/asset-license-inventory-check.mjs --write` and set matching inventory rows from `owner_pending` to `cleared` or `reserved` with `evidence` pointing at the attestation file.
