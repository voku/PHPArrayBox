# Anno 1602 visual research notes

## Web research attempts (blocked)
The following sources were attempted for style reference but were blocked by bot checks or returned proxy errors.

- https://www.mobygames.com/game/anno-1602/screenshots/ (Cloudflare challenge)
- https://duckduckgo.com/html/?q=react+three+fiber+isometric+city (challenge page)

## Commands run
- `curl -L https://en.wikipedia.org/wiki/Anno_1602`
- `curl -L https://docs.pmnd.rs/react-three-fiber`
- `curl -L https://github.com/daviddcarr/simple-city-builder`
- `curl -L https://codesandbox.io/s/isometric-city-u881g`
- `curl -L https://codesandbox.io/s/random-city-plan-generator-lzv31n`
- `curl -L https://github.com/chdonncha/react-city-builder`
- `curl -L https://github.com/aserg-ufmg/JSCity`
- `curl -L https://github.com/haf-decent/react-three-ocean`
- `curl -L https://tympanus.net/codrops/2021/05/04/creating-stylized-water-effects-with-react-three-fiber/`
- `curl -L https://www.mobygames.com/game/anno-1602/screenshots/`
- `curl -L "https://duckduckgo.com/html/?q=react+three+fiber+isometric+city"`

## Source notes (accessible)
The following references were reachable and inform the updated art direction and implementation.

- Wikipedia confirms Anno 1602 uses isometric graphics, reinforcing the need for crisp but muted readability from an angled camera.【https://en.wikipedia.org/wiki/Anno_1602】
- React Three Fiber documentation informs scene setup, lighting balance, and controls patterns that keep R3F scenes readable.【https://docs.pmnd.rs/react-three-fiber】
- `simple-city-builder` demonstrates a full R3F pipeline (Canvas → layout → buildings) and how city components are modeled for interactivity.【https://github.com/daviddcarr/simple-city-builder】
- `isometric-city` CodeSandbox provides camera constraints and scale relationships for a readable isometric view.【https://codesandbox.io/s/isometric-city-u881g】
- `random-city-plan-generator` highlights block/parcels mapping to R3F instances and top-down legibility patterns.【https://codesandbox.io/s/random-city-plan-generator-lzv31n】
- `react-city-builder` reinforces grid/selection patterns for city layouts in React + R3F.【https://github.com/chdonncha/react-city-builder】
- `JSCity` frames the “code as city” metaphor, aligning array structure → districts/blocks mapping.【https://github.com/aserg-ufmg/JSCity】
- `react-three-ocean` shows a reusable R3F ocean component pattern, useful for shader uniform flow.【https://github.com/haf-decent/react-three-ocean】
- Codrops stylized water tutorial emphasizes shallow/deep color blending and low-frequency motion for calm water readability.【https://tympanus.net/codrops/2021/05/04/creating-stylized-water-effects-with-react-three-fiber/】

## Updated art-direction notes (derived + sources)
- Preserve isometric readability with constrained camera angles and muted, low-contrast palettes; avoid high-frequency textures.
- Favor broad ocean gradients and shallow-to-deep transitions near shorelines, with subtle foam near the beach.
- Use warm sunlight/ambient lighting with gentle fog to soften edges and reduce high-contrast banding.
- Keep labels and grid outlines subtle so terrain remains primary.
- Prefer rounded island silhouettes over perfect rectangles to feel more natural.

- Isometric, low‑saturation palette with earthy browns, clay reds, and muted sea blues.
- Shorelines should be visible but subtle, with sandy or light‑stone edges.
- Labels should be minimal and non‑obstructive to keep the terrain readable.
- Terrain surfaces should avoid high‑frequency noise to prevent shimmer on mobile.

## Next steps if external access is enabled
- Pull reference screenshots from official/press kits and fan wikis.
- Extract a small palette from screenshots (sea, sand, roof, soil) and map to CONFIG.colors.
- Validate readability and motion stability with additional 3D screenshots.
