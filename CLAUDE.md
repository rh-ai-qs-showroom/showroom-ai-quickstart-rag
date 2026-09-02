# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Red Hat Showroom lab guide built with [Antora](https://antora.org). Showroom is a split-pane web platform: AsciiDoc instructions on the left, interactive terminals/consoles on the right. This repo is based on the `showroom_template_nookbag` template.

## Local Preview

```sh
# Podman (recommended)
podman run --rm --name antora -v $PWD:/antora -p 8080:8080 -i -t ghcr.io/juliaaano/antora-viewer

# On SELinux systems, append :z to the volume mount
podman run --rm --name antora -v $PWD:/antora:z -p 8080:8080 -i -t ghcr.io/juliaaano/antora-viewer
```

Preview at http://localhost:8080. The container watches for changes and rebuilds automatically.

## Build (CI)

The GitHub Actions workflow (`.github/workflows/gh-pages.yml`) runs:
```sh
npm i -g @antora/cli@3.1 @antora/site-generator@3.1 @sntke/antora-mermaid-extension@0.0.9
antora --fetch site.yml
```
Output goes to `www/`.

## Repository Structure

- `site.yml` — Antora playbook: site title, content sources, UI bundle, extensions, output dir
- `ui-config.yml` — Showroom UI: tab layout, right-pane tabs (terminals, consoles, external URLs), split width
- `content/antora.yml` — Antora component descriptor (name, title, version, **runtime attributes**)
- `content/modules/ROOT/nav.adoc` — Left-side navigation tree
- `content/modules/ROOT/pages/` — AsciiDoc lab pages (the actual content)
- `content/supplemental-ui/` — CSS overrides (`css/site-extra.css`), favicon, header template
- `examples/` — Demo and workshop example pages and templates for reference

## Content Conventions

- Lab pages live in `content/modules/ROOT/pages/` as `.adoc` files
- Navigation is defined in `content/modules/ROOT/nav.adoc` using `xref:` links
- Pages are numbered with prefix (e.g., `02-accessing-the-cluster.adoc`); `index.adoc` is the unnumbered landing page and implicitly occupies the `01` slot, there is no `01-*.adoc` file
- The Antora component version is set to `~` (versionless) in `content/antora.yml`
- Mermaid extension (`@sntke/antora-mermaid-extension`) is installed in CI but currently commented out in `site.yml` and unused by any page. Enable the `antora.extensions` block there if a page needs it
- Runtime variables (credentials, hostnames) are injected as AsciiDoc attributes during deployment
- **Page navigation**: do NOT hand-author "Next: …" links at the foot of pages. The UI bundle (`v2.0.0`+) ships a native Prev/Next pager (`partials/pagination.hbs`, included by `article.hbs`) that renders automatically from `nav.adoc` order with the theme's elegant styling (thin rule, small Prev/Next labels, `‹`/`›` chevrons). It only renders when the `page-pagination` attribute is set — this is enabled globally via `asciidoc.attributes.page-pagination: ''` in `content/antora.yml`. Keep `nav.adoc` ordering correct and the pager follows.

## Code Block Conventions (Showroom Theme)

Executable bash commands **must** use `role="execute"` to get a copy/run button in the Showroom split-pane UI. Commands with dynamic variables also need `subs=attributes+`:

```asciidoc
[source,bash,role="execute",subs=attributes+]
----
oc login --insecure-skip-tls-verify \
  -u {user} \
  -p {password} \
  {openshift_api_url}
----
```

- `role="execute"` — adds the copy button in the Showroom theme (required for all user-executable commands)
- `subs=attributes+` — enables `{variable}` substitution inside the block (required when the block references runtime attributes)
- Omit `role="execute"` for blocks the user should **not** copy verbatim (e.g., commands with `<placeholder>` the user must fill in, YAML/JSON config snippets, sample output)
- Sample output blocks use plain `----` delimiters (no `[source,...]` header) or `[source]`, preceded by `_Expected output:_` in italics
- Never hardcode credentials, namespaces, or cluster URLs — always use `{attribute}` references

## Runtime Attributes

Defined in `content/antora.yml` under `asciidoc.attributes`. At deploy time the Showroom provisioner overrides these with real values. The defaults are placeholders for local preview:

| Attribute | Example placeholder | Purpose |
|-----------|-------------------|---------|
| `{user}` | `user1` | OpenShift username |
| `{password}` | `openshift` | OpenShift password |
| `{user}-rag` | `user1-rag` | Project/namespace (composed from `{user}`) |
| `{openshift_api_url}` | `https://api.cluster-GUID...` | API server URL |
| `{openshift_console_url}` | `https://console-openshift-console...` | Web console URL |
| `{openshift_cluster_ingress_domain}` | `apps.cluster-GUID...` | Apps ingress domain |

## Image Conventions

- Use `role=expand` on every `image::` macro for a pop-out lightbox: `image::screenshot.png[Alt text,role=expand]`. This is a native feature of the `rhdp_showroom_theme` UI bundle (`v2.0.0`+) — no `link=`/`window=` attributes or custom JS needed.
- **Tightly couple images to the step or block they illustrate.** An `image::` that belongs to a numbered/bulleted list item must be attached with a `+` continuation line directly under that item (no blank line), never left as a standalone block floating between items. An image that illustrates an admonition (NOTE/IMPORTANT/etc.) goes *inside* the `====` delimiters. Only section-level images with no owning list item/block (e.g. an architecture diagram under a `==` heading) stand alone. This is a standing author preference — apply it to every image you add or touch.
- No trailing period after credential examples in inline text

## Key Configuration

- **UI bundle**: `rhdp_showroom_theme`, pinned to tag `v2.0.3` in `site.yml`. Bundle versions matter: tags before `v2.0.0` (e.g. the old `patternfly-6` tag) ship an uninitialized vendor `clipboard.js` with no copy/run-in-terminal button wiring and no lightbox at all — `role="execute"` and `role=expand` silently do nothing on those. Check a bundle's `js/vendor/clipboard.js` and `js/site.js` for `listingblock`/`lightbox` references before pinning to a new tag.
- **`ui.supplemental_files` gotcha**: must be a bare string (`supplemental_files: ./content/supplemental-ui`) to recursively overlay the whole directory. The list form (`- path: ./content/supplemental-ui`) is for individual file entries and silently does nothing without an accompanying `contents:` key — verify with `antora --fetch site.yml` locally and check `www/_/css/site-extra.css` actually exists after a bundle/config change.
- **Showroom collection version**: Set via `showroom-collection-version` attribute in `site.yml`
- **Right-pane tabs**: Configured in `ui-config.yml` — currently Terminal + Llamastack Docs. Deployed tenants override the tab layout via the AgnosticV-injected `SHOWROOM_UI_CONFIG` env var (Terminal, OpenShift Console, OpenShift AI, RAG UI), so prose that names a tab must match the deployed labels (e.g. *Terminal*, not "Bastion")
