# Article Layout Design QA

- Source visual truth: `C:\Users\javad\.codex\generated_images\01a03923-176f-7601-b161-16ea662949e5\exec-60264a3c-9121-4aa4-b82f-7521bc840193.png`
- Alignment baseline: `src/features/articles/audit/01-current-alignment.png`
- Final implementation screenshot: `src/features/articles/design-qa/article-alignment-final.png`
- Combined comparison: `src/features/articles/design-qa/article-alignment-comparison.png`
- Route and state: `/articles/designing-resilient-frontend-systems/`, light theme, article start with the user-requested cover visible
- Browser viewport: 1234 x 1243 CSS px at device pixel ratio 1
- Original mock pixels: 1487 x 1058; baseline screenshot: 1234 x 1173; implementation screenshot: 1234 x 1228
- Density normalization: baseline and implementation were normalized to 1234 x 1024 and placed side by side. Baseline is left; implementation is right.

The source mock does not contain a cover image. Rendering the supplied cover is an intentional user-requested deviation, so this pass compares its integration, hierarchy, palette, and image treatment rather than treating the added image as design drift.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: headline, dek, author metadata, body type, and TOC hierarchy retain the selected teaching-journal treatment.
- Spacing and layout rhythm: the header and masthead now share an exact 1180 px outer shell. The cover and reader share an exact 1050 px inner shell; article copy begins at its left edge and the TOC ends at its right edge.
- Colors and visual tokens: the cover's ink navy, cobalt, and warm paper palette matches the page tokens.
- Image quality and asset fidelity: the real 1536 x 1024 raster cover loads at full intrinsic resolution, has meaningful alt text, uses `object-fit: cover`, and renders as a 1050 x 459 editorial banner in the captured desktop state.
- Copy and content: the cover is decorative support for the existing article and does not duplicate title text inside the image.
- Accessibility and behavior: the visible image has descriptive alt text, explicit intrinsic dimensions prevent layout shift, and the page has no horizontal overflow.

The high-resolution combined comparison keeps the masthead, cover, article opening, and TOC legible, so separate focused crops were not required.

## Comparison History

### Cover pass 1 — blocked

- P2 layout: the HTML height attribute overrode the responsive crop and made the cover 1024 px tall.
- Fix: added explicit CSS `height: auto` to both the article cover and list thumbnail while retaining their controlled aspect ratios.

### Cover pass 2 — passed

- Evidence: `src/features/articles/design-qa/article-cover-comparison.png`.
- The article cover is visible at 1050 x 459.375 px, the article-list thumbnail is visible at 208 x 138.656 px, both assets report natural dimensions of 1536 x 1024, and neither route logged browser errors or warnings.

### Alignment pass 1 — blocked

- P2 consistency: the header used a 1260 px maximum while the masthead used 1180 px. The reader occupied the 1180 px shell even though its columns formed a smaller, fluid inner grid, so its outer edges did not match the 1050 px cover.
- Evidence: `src/features/articles/audit/01-current-alignment.png`.
- Fix: introduced shared shell tokens, set header and masthead to 1180 px, set cover and reader to 1050 px, and defined fixed 660/170/220 px reading columns before the responsive single-column breakpoint.

### Alignment pass 2 — passed

- Evidence: `src/features/articles/design-qa/article-alignment-comparison.png`.
- Header and masthead both measure left 27 px, right 1207 px, width 1180 px. Cover and reader both measure left 92 px, right 1142 px, width 1050 px. Article copy begins at 92 px and the TOC ends at 1142 px.
- No horizontal overflow or browser console errors/warnings were found.

final result: passed
