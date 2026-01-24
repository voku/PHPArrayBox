# Anno 1602 visual research notes

## Web research attempts (blocked)
The following sources were attempted for style reference, but the network proxy returned 403 (CONNECT tunnel failed). This prevented loading the content for citation.

- https://en.wikipedia.org/wiki/Anno_1602
- https://en.m.wikipedia.org/wiki/Anno_1602
- https://www.mobygames.com/game/anno-1602/
- https://raw.githubusercontent.com/
- https://r.jina.ai/http://en.wikipedia.org/wiki/Anno_1602

## Commands run
- `curl -L -o /tmp/anno1602_wiki.html https://en.wikipedia.org/wiki/Anno_1602`
- `curl -L -o /tmp/anno1602_mwiki.html https://en.m.wikipedia.org/wiki/Anno_1602`
- `curl -L -o /tmp/anno1602_mobygames.html https://www.mobygames.com/game/anno-1602/`
- `curl -I https://raw.githubusercontent.com/`
- `curl -L -o /tmp/anno1602_jina.txt https://r.jina.ai/http://en.wikipedia.org/wiki/Anno_1602`

## Interim art-direction notes (no external source)
Until web access is available, the following are internal art-direction cues inferred from common Anno‑series visual traits:

- Isometric, low‑saturation palette with earthy browns, clay reds, and muted sea blues.
- Shorelines should be visible but subtle, with sandy or light‑stone edges.
- Labels should be minimal and non‑obstructive to keep the terrain readable.
- Terrain surfaces should avoid high‑frequency noise to prevent shimmer on mobile.

## Next steps if external access is enabled
- Pull reference screenshots from official/press kits and fan wikis.
- Extract a small palette from screenshots (sea, sand, roof, soil) and map to CONFIG.colors.
- Validate readability and motion stability with additional 3D screenshots.
