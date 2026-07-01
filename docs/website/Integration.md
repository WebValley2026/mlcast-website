# Integrations and dynamic data

## Integration model

The site uses two data-delivery patterns:

- GitHub community statistics and starter issues are fetched during GitHub Pages
  deployment and served to browsers as same-origin JSON.
- The precipitation catalog is fetched directly by `data.html` from raw GitHub
  content.

Secrets are allowed only in the deployment environment. Never put a token in
HTML, `header.js`, `tailwind-config.js`, or other published JavaScript.

## Community statistics

### Purpose

Keep the community card in `home.html` current without making many anonymous
GitHub API requests from every visitor's browser.

### Locations

- Producer: `scripts/fetch-gh-stats.sh`
- Deployment call: `.github/workflows/deploy.yml`
- Generated artifact: `dist/gh-stats.json`
- Consumer: final data-loading script in `home.html`
- DOM targets: `#gh-contributors`, `#gh-repos`, `#gh-commits`,
  `#gh-collab-count`, and `#gh-avatars`

### How it works

1. The workflow passes its `GITHUB_TOKEN` to the shell script.
2. The script paginates through all public repositories in
   `mlcast-community`.
3. It paginates through each repository's contributors, excludes bots, sums
   GitHub's `contributions` values per login, and selects the top four.
4. It writes `{repos, contributors, commits, top, generated}` to
   `dist/gh-stats.json`.
5. `home.html` fetches `gh-stats.json` with `cache: "no-cache"` and updates the
   card. Avatar images still load from
   `https://github.com/{login}.png?size=64`.

“Commits” is the sum of values returned by GitHub's contributor endpoint, not an
independent commit-history audit.

### Failure handling

If no repositories can be fetched, the build script exits successfully without
writing a zero-valued file. Because each `dist/` is assembled fresh, the client
then receives a missing/non-OK JSON response and keeps `home.html`'s hard-coded
fallback values. Per-repository contributor failures are treated as empty
contributor lists, so a JSON file may contain partial contribution totals.

### Safe modification notes

- Preserve API pagination, bot filtering, and JSON field names.
- Keep the token confined to the workflow process environment.
- Version the consumer and producer together if the schema changes.
- Keep fallback values honest and periodically reviewed.
- Remember that the workflow's daily schedule controls data freshness.

### Testing checklist

- Run the producer with and without `GITHUB_TOKEN` where network access permits.
- Validate generated JSON with `jq`.
- Test `home.html` with valid, missing, malformed, and partial `gh-stats.json`.
- Verify all counters and four optional avatars.

## Good-first issues

### Purpose

Populate the contributor page with a small current set of open issues while
avoiding anonymous browser requests to GitHub's Search API.

### Locations

- Producer: `scripts/fetch-gh-issues.sh`
- Deployment call: `.github/workflows/deploy.yml`
- Generated artifact: `dist/gh-issues.json`
- Consumer: issue-loading script in `contributing.html`
- DOM target: `#issue-list`

### How it works

1. The producer searches GitHub for open `good first issue` items in the
   `mlcast-community` organization, sorted by recent updates.
2. The default limit is six issues.
3. `jq` reduces each result to `{repo, title, number, url}` and adds a
   `generated` timestamp.
4. `contributing.html` fetches `gh-issues.json`, escapes remote text, and renders
   cards linking to the issue URLs.

### Failure handling

If GitHub returns no usable `items` payload, the producer leaves the output file
unwritten. A missing, non-OK, malformed, or empty JSON response makes the page
render one actionable link to the equivalent GitHub web search.

### Safe modification notes

- Keep remote text escaped before assigning generated markup to `innerHTML`.
- Validate issue URLs before changing their use in `href`.
- Change the producer limit and page layout together.
- Preserve the fallback search link.

### Testing checklist

- Validate populated, empty, malformed, missing, and offline JSON behavior.
- Check long titles and repository names at mobile and desktop widths.
- Confirm issue links and the fallback search URL.

## Dataset catalog

### Purpose

Render the current public precipitation catalog from its source repository so
dataset cards track upstream catalog changes without manual duplication.

### Locations

- Consumer and parser: `data.html`
- Remote source:
  `https://raw.githubusercontent.com/mlcast-community/mlcast-datasets/main/src/mlcast_datasets/catalog/precipitation/catalog.yml`
- DOM targets: `#dataset-search`, `#dataset-catalog-list`,
  `#dataset-catalog-count`, and `#dataset-catalog-status`
- Debug/state hook: `window.datasetCatalogLinks`

### How it works

1. Fetch raw YAML in the visitor's browser and require an OK response.
2. Use an indentation-based parser to find `sources`.
3. Read `description`, `driver`, `urlpath`, `endpoint_url`, and `consolidated`.
4. Normalize names and add hard-coded flag/provider/range/cadence metadata based
   on source-name patterns.
5. Escape upstream values and generate dataset cards and `xarray` examples.
6. Filter the in-memory results as the user types.

The parser is not a general YAML implementation. Multiline scalars, aliases,
changed indentation, nested structures, or renamed fields can break it.

### Dependencies and connections

- Raw GitHub content and its CORS behavior.
- FlagCDN SVGs inferred from source names.
- The visible catalog link targets the published `mlcast-datasets` site.
- A static Intake example in `data.html` references `catalog/catalog.yml`,
  whereas the live UI fetches `catalog/precipitation/catalog.yml`; verify both
  paths when upstream changes.
- Provider/range/cadence details are hard-coded presentation data, not read from
  YAML.

### Failure handling

Fetch, HTTP, or parser errors are logged. The count, accessible status, and list
change to an explicit “Unable to load” state. There is no retry or cache.

### Safe modification notes

- Prefer prebuilt JSON or a real parser if the YAML schema becomes complex.
- Keep `escapeHtml` around all upstream values used in HTML/code.
- Update the hard-coded source-name metadata with upstream naming changes.
- Keep loading, empty search, empty catalog, and error states distinct.

### Testing checklist

- Test valid, empty, malformed, non-OK, and schema-changed catalog responses.
- Search by name, description, driver, path, and endpoint.
- Verify flags, metadata, and copied code examples for each source.

## Shared external dependencies

| Service | Use |
| --- | --- |
| GitHub REST API | Build-time repositories, contributor totals, and starter issues. |
| GitHub profile images | Browser-loaded top-contributor avatars. |
| Raw GitHub content | Browser-loaded precipitation YAML. |
| Tailwind browser CDN | Runtime utility CSS with forms/container-query plugins. |
| Google Fonts | Geist, Inter, JetBrains Mono, and Material Symbols. |
| FlagCDN | Coverage-map and dataset country flags. |
| Slack, Microsoft Teams, Google Docs, `mailto:` | Outbound community actions; no embedded widget or form submission. |

## Current non-integrations

- The dataset/repository/contributor placeholders in `contributing.html` are not
  populated by a script.
- There is no analytics beacon, iframe, WebSocket, EventSource, query-parameter
  reader, authenticated browser request, or native form-submission script.
- Generated `gh-stats.json` and `gh-issues.json` are deployment artifacts, not
  repository source files.
