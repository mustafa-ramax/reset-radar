# Reset Radar design review · 17/10/2026

One focused dashboard, icon and naming update using the frontend-design skill. The visual direction is a quiet host-themed panel: one primary record surface, supporting sections, system typography, restrained teal and more top space. The static radar mark is the only decorative signature; it does not imply background scanning.

## Assets

The production vector source is [`public/reset-radar.svg`](../../public/reset-radar.svg). Transparent PNG exports at 64, 192 and 512px use that exact source. The dashboard embeds the same geometry with `currentColor` to follow its theme. The Next.js website uses the SVG favicon and 192px Apple icon. No MCP server/tool icon metadata was added: browser icon support does not establish ChatGPT metadata support.

The built-in imagegen tool produced a preview-only reference, followed by a simpler hand-authored SVG. It is not a raster embedded in an SVG wrapper. Reference prompt:

> Use case: logo-brand. Preview-only visual reference for Reset Radar, a tiny open-source ChatGPT MCP app. One intentionally simple geometric radar symbol: two concentric rings, a subtle scanning arc in the upper right, one signal dot. Flat single restrained teal colour, transparent background, generous clear space. Clean strokes, recognisable at 24x24 pixels. No text, no gradients, no shadows, no mockup, no background tile, no extra decoration. The eventual production asset will be redrawn as true SVG.

## Screenshot evidence

These are the actual production widget bundle in a temporary local JSON-RPC fixture host, **not screenshots of ChatGPT or live provider data**. The harness is outside the repository and is not shipped. Its header labels each state and width. Dates use the unchanged viewer-locale formatter.

| Preview | Width / theme | Scenario |
| --- | --- | --- |
| [Light](light-360.jpg) | 360px / light | Available source; original source link; no announcement returned |
| [Dark](dark-280.jpg) | 280px / dark | Narrow layout; 24px icon samples on both backgrounds |
| [Stale](stale-280.jpg) | 280px / dark | Recorded evidence retained; upcoming state unknown; warning shown |
| [Unavailable](unavailable-280.jpg) | 280px / dark | Status unknown; evidence link hidden; outage warning shown |
| [Refreshing](refreshing-280.jpg) | 280px / dark | Refresh disabled while a bridge response is pending |
| [Announcement](pending-640.jpg) | 640px / light | Announcement source link and publication timestamp |
| [Loading](loading-640.jpg) | 640px / light | Initial read pending; neutral loading labels |

## Validation

- Existing 10 tests passed; typecheck and production build passed. Bundled widget check passed with no external scripts. No tests or package manifests changed.
- Inspected available, announcement, empty, stale, unavailable, loading and refreshing states in the browser. Released a held response and confirmed Refresh recovered. A later Refresh issued a new `get_tibo_status` call.
- Host theme changes applied immediately in both directions. Body width equalled scroll width at 280, 360 and 640px. Keyboard Tab reached the original-post link with a visible focus outline. Original-post clicks reached the host's `ui/open-link` handler.
- The real SVG was displayed at 24px on light and dark backgrounds; PNGs were exported directly from it.
- Chrome's Dark Reader extension interfered with the first review. Final screenshots use the clean in-app browser without modifying the user's extension settings.
- The first sandboxed production build hit a Windows EPERM while creating generated files; the approved rerun outside the sandbox passed.
- Installing existing dependencies reported three high-severity advisories. Detailed `npm audit` was unavailable because the repository has no lockfile. No dependency upgrades are included.

## Acceptance boundary

Vercel preview and remote MCP smoke results will be recorded after the branch is pushed. Real ChatGPT sidebar (`global`), right panel (`thread`) and inline rendering remain an owner acceptance gate for this redesign. Before merging, capture each surface and check host theme changes, Refresh, source links, loading, stale and unavailable presentation where feasible. Existing host acceptance of the old UI does not certify this redesign.

The asset files do not change an installed ChatGPT app's directory icon by themselves. Plugin registration icons and any cached tool titles must be reviewed in the host separately. This design PR does not establish readiness for public directory publication.
