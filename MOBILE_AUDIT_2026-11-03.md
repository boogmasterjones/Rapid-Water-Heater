# Mobile audit and makeover, pass 1 of 3 (2026-11-03)

Branch `mobile/2026-11-03` (from `seo/2026-10-31`). Not pushed or deployed.

## Method

- I screenshotted all 25 routes screen by screen in headless Chrome with touch emulation, at 390x844, 360x780, 430x932 and 768x1024. Scroll reveals were forced visible and the Astro dev toolbar was hidden.
- An automated check on every page and size looked for horizontal overflow, elements poking past the viewport, visible text under 14px, and tap targets under 44px.
- **Desktop proof:** I dumped the computed styles and box geometry of every element on all 25 pages at 1440x900, with the changes stashed and again after them. **0 of 25 pages differ.** Pixel diffs of the 179 desktop screenshots are under 0.2% on every page except /thanks, at up to 1.3%. All of that is the animated rain. /thanks is high because it redirects to /contact without `?shot`, so the rain is not hidden there.
- Every new rule sits in a `max-width` media query (900px or narrower), or in phone-only markup or script:
  - the new `src/styles/mobile.css`;
  - the media blocks inside the components;
  - `src/scripts/glass/mobile.ts`, which runs only at 760px or narrower.
- No content, facts or claims changed, and no files in `content/` were touched. Tracking is untouched: phone links, `call_click` handlers, the form, `progressive-form.js` and the Jobber submit path are all as before.

## Scores (390px, before → after, out of 10)

| Page | Before | After |
|---|---|---|
| Home | 7 | 8.5 |
| Service pages (x6) | 6 | 8.5 |
| Location pages (x6) | 6 | 8.5 |
| Services hub | 6.5 | 8.5 |
| Service Areas hub | 5.5 | 8 |
| About | 6.5 | 8.5 |
| Meet the Family | 6.5 | 8 |
| Contact / Thanks | 7 | 8.5 |
| Reviews | 7 | 8 |
| Blog index | 7 | 8 |
| Blog post | 6.5 | 8.5 |
| Privacy / Terms / 404 | 7.5 | 8 |

Page height at 390px, before → after:

| Page | Before | After |
|---|---|---|
| Water Heater Installation | 10,663px | 6,615px |
| About | 7,430px | 6,806px |
| Service Areas hub | 8,139px | 7,220px |
| Contact | 4,268px | 4,110px |

## Site-wide (every page)

| Issue found | Change |
|---|---|
| Icon cards put a 56px icon on its own row, or indented all text 64px, wasting 60-90px per card | Phones: the icon sits beside the title and the body runs full width underneath (`.card:has(> .card-icon)`) |
| 56px section padding left near-empty bands between sections | Phone `--section-y` is now 48px |
| Long-form panels had 20px gutter plus 20px padding, so lines held about 38 characters and paragraphs ran 8-9 lines deep | Phones: `.content-block` runs edge to edge (side borders off, gradient top rule kept), so lines hold about 44 characters |
| Breadcrumbs wrapped to 2-3 lines on long titles, and their links were 19px-tall tap targets | One line, the current crumb ellipsizes (the H1 repeats it), and links get an invisible 43px tap area |
| Phone menu was a flat 2-column list with service names wrapping onto 2 lines | Grouped menu: a "Services · All services ›" header, then the six services one to a row, a divider, the pages two-up, then a Free Estimate button. The page behind is dimmed |
| Header pill covered about 76px of every screen | Slides away while reading down (only once the bottom Call/Estimate bar is showing) and comes back on any scroll up, when the menu opens, or on focus |
| Footer: about 1.6 screens long, a duplicate Google pill, phone buried after the service list, 40px links | Contact column moved straight after the brand, phone in bold white, duplicate Google pill hidden, "Find us online" plus icons on one row, 44px link rows, smaller legal lines with tappable Privacy/Terms |
| Quote form choices: 18px checkboxes in a loose 2-column list with wrapped labels | Each choice is a bordered 52px tile (the whole tile taps) and turns gold when chosen. SMS disclosure text goes from 12.8px to 13.4px |
| Text under 13px | Hero badge 10.9 → 11.5px, gallery captions 12.8 → 13.4px, photo tags 11.5 → 12px, team role labels 11.8 → 12.8px, trust-strip sublines 13.4 → 14px, tank label 11.8 → 12.8px |
| Tablet (761-900): the drawn tank illustration filled a whole 730x620 block after the split stacked | Hidden on tablets as on phones. Real photos stay, at 16:10 |
| Tablet: interior heroes kept a 68vh floor, leaving a third of the screen empty | Floor removed |
| Tablet: three-card rows went two-up plus an orphan | Exactly-three grids stay three across from 761 to 900px. From 621 to 760px a lone last card spans the row |

## Per page

**Home**
- Hero:
  - The badge was 10.9px; now 11.5px, still one line at 360px.
  - The intro column beside the photo was 159px wide; the photo shrank from 50% to 44% wide, so the column is now 180px.
  - The phone CTA is still inside the first screen at 360, 390 and 430.
- Gallery:
  - At 360px the "Our work / Meet the family" buttons wrapped onto 2 lines. They are now a full-width segmented control. Arrows hide at 400px and narrower; swiping with the next photo peeking in does their job.
  - Photos were 203px tall; now 250px at 390.
- Service areas: seven full-width 60px rows are now wrapping pills, about 4 rows.
- Trust strip sublines are 14px.
- Tablet: the hero was a full-width button stack over a photo two screens tall. It is now a two-column layout like desktop (copy left, photo stack right).

**Service pages (x6)**
- The "Signs you need…" icon cards are compact.
- The long keyword section folds behind "Keep reading" at about 520px with a fade. It opens with an animation; text is in the DOM throughout.
- On tablets the tank art panel no longer fills a screen, and the 3-card row stays 3-up.

**Location pages (x6)**
- Service cards are compact.
- Long keyword sections fold, including the second `section-md-tail` blocks on Bradenton, Lakewood Ranch, North Port and Punta Gorda.

**Service Areas hub**
- 13 area cards are compact (the pin beside the city name).
- The long closing section folds.
- `#city` anchors still land (cards are not inside folded blocks). Any hash target inside a folded block opens it first.

**Services hub**
- Cards are compact.
- The long "Why professional installation matters" block folds.

**About**
- The four brand cards were full width, about 110px each; they now pair two-up.
- The "Why it matters" icon cards are compact.

**Meet the Family**
- Team portraits went from 4:5 (about 440px tall each) to 1:1 at 350px.
- Role labels are larger.

**Contact / Thanks**
- Form choices are tiles.
- The consent text is larger.

**Blog post**
- One-line breadcrumb with ellipsis.
- The meta line fits on one line.
- The article runs edge to edge.
- Blog posts are never folded.

**Blog index / Reviews / Privacy / Terms / 404**
- Section-wide rhythm, breadcrumb, header, menu and footer changes only. No other issues found.

Checks after the change, at 360, 390, 430 and 768:
- No horizontal overflow on any page. The only wide element is the fixed decorative backdrop, which is clipped.
- Remaining sub-44px targets are only the 28x44 carousel dots, inline legal links and breadcrumbs at 43px.

## Left for pass 2 to double-check

1. **"Keep reading" folds on service, location and hub pages.**
   - Google indexes text inside a collapsed section on mobile; the text stays in the HTML.
   - Still, the owner should see it, since it changes how much keyword copy a phone visitor sees without a tap.
   - To remove it, delete block 2 in `src/scripts/glass/mobile.ts`.
2. **The header now auto-hides on phones.** Check on a real iPhone (Safari toolbar collapse plus the bottom call bar) that it feels calm, not jumpy.
3. **Tablet hero.** At 761-860px there is still about 130px of quiet space under it. Consider a tighter pairing with the gallery head.
4. **How It Works tank on phones.** It sits static above the steps, so its fill animation plays while the steps are scrolled past. A small sticky gauge could make it serve the steps, but it risks gimmick territory.
5. **Edge-to-edge reading panels.** Check they feel deliberate next to the inset cards on the same page.
6. **Gallery arrows.** Hidden at 400px and narrower (all common iPhones). Confirm swipe discoverability with the peeking photo.
7. **Reduced motion.** The site still honours prefers-reduced-motion (rain off, reveals still) from earlier work. The owner's standing rule is that animations always play. I added no new opt-outs but did not remove the existing ones; that is a separate decision.
8. **Pre-existing type error.** `astro check` reports 1 error in `GlassHero.astro` line 38 (the `style` prop on `<Picture>`). It was already there before this pass, and the build and audit pass.
9. **Real devices.** Not tested on real devices or iOS Safari specifically. Check `:has()` support on older iOS (16.4 and later are fine) and the `100svh` hero.

---

# Pass 2 of 3 (2026-11-03): fresh eyes

## Method

- All 31 built routes were checked: 25 pages plus the 7 blog posts, with /thanks counted. Phones were screenshotted at 390x844 and tablets at 768x1024, 1024x768 and 1180x820. An automated audit ran at 360x780 and 430x932. Spot checks went to 360, 800x1100 and 1024.
- **Interactions tested:**
  - the phone menu and the tablet dropdown;
  - FAQ accordions;
  - "Keep reading";
  - gallery swipe, jump buttons and arrows;
  - the review carousel;
  - the quote form, filled step by step to the last section in a dev build. Submit was intercepted, so nothing went to formsubmit or Jobber.
- **Measurements:**
  - layout shift on load, using the layout-shift API while scrolling the page;
  - long-word overflow: a 50-letter word injected into headings, cards, panels, FAQ, breadcrumb, CTA and footer.
- **Desktop proof (1440x900, all 31 routes):**
  - I dumped the computed style and geometry of every element before and after.
  - The only difference is the class name `pf-ready` on the two quote forms. Their geometry and every measured style are identical.
  - Pixel diffs are under 0.13% everywhere except /thanks, at up to 3%. That is the animated rain, not hidden there (see pass 1).
  - Every visual change sits in a `max-width` query of 1240px or narrower, or in a 861-1240px range.
- **Checks:** `astro check` reports 0 errors (the GlassHero error is fixed), `npm run build` passes, and `npm run audit` reports 0 errors and 0 warnings. The built site was also checked with `astro preview`.

## What pass 1 missed, and the fixes

| # | Issue | Where | Fix |
|---|---|---|---|
| 1 | **Meet the Family galleries broken.** `<picture>` is `display: contents`, so its `<source>` tags became empty grid items. Every "How We Work" photo and both Callahan & Lewis photos sat in the right column with the left column empty, so the gallery ran about 1,100px too long on phones | /family, phones and tablets | At 900px and narrower, `picture > source { display: none }`. At 641-900px the 8-photo gallery is 4 across (2 rows instead of 4 rows of 380px portraits). /family at 390px: 7,807 → 6,731px |
| 2 | The same stray `<source>` added a 10px gap inside the header logo | Header, at 900px and narrower | Fixed by #1. The footer logo's baseline is pinned so the footer height is unchanged |
| 3 | **The contact page jumped on load.** The quote form painted at full length, then progressive-form.js collapsed it: CLS 0.20 on phones | /contact, and /thanks, which redirects to /contact | CSS pre-hides the later form sections until the script marks the form `.pf-ready`. CLS is now 0.00 in dev and in the built site. Safety net: `html.pf-late` (set by an inline timer after 5s) shows all sections if the script never loads, and with no JS nothing is hidden |
| 4 | Review carousel arrows sat on top of the review text | 561-1039px (every tablet) | Arrows move into the dots row under the cards, one at each end |
| 5 | The menu sheet was 98% opaque, so the hero headline ghosted through behind the menu items | Phones and tablets | Solid sheet at 1240px and narrower. The tablet dropdown is 310px wide, so "Tankless Water Heater Installation" no longer wraps |
| 6 | Tablet hero had about 130px of empty space under it (pass 1, item 3) | 761-860px | Hero bottom padding 72 → 12px. The gap to the gallery is now about 85px |
| 7 | "5.0 on Google" badge and the mascot touched or crossed the screen edge | 861-1240px (iPad landscape, small laptops) | Pulled inside the photo edge in that range only |
| 8 | Quote form tiles at 360px: a 90px label column, "Water Heater Installation" on 3 lines, and "No Rush" sitting half-width beside a hole | Phones | Lone last tile spans the row and labels use balanced wrapping. At 400px and narrower the card padding is 16px and the tiles are tighter. Tiles are now an even 55px |
| 9 | Drop cap floated about 1.5 lines deep and read as a stray letter ("W e're", "I f you're") | Every phone reading panel | Sized to sit exactly two lines deep |
| 10 | Long centred intros ran 7 ragged lines | About ("Why it matters"), Reviews (mission), phones | `mobile.ts` left-aligns any centred paragraph of 6 or more lines on phones. Short centred intros stay centred |
| 11 | A long unbroken word (URL, email, model number) ran past its card or panel and was cut off | Every page, phones and tablets | `overflow-wrap` on headings, FAQ questions, paragraphs and lists at 900px and narrower. Normal words never break |
| 12 | CTA band buttons were two full-width bars stacked on tablets | 561-860px | Side by side, equal width |
| 13 | `astro check` error: the `style` prop on `<Picture>` (it never applied, so the phone hero photo ignored `photoPosition`) | GlassHero line 38 | Passed as `--pos` on the wrapper. The phone photo now uses the configured 58% 50% crop. Desktop is untouched (that copy of the photo is `display: none` there) |

## Checked and fine

- No horizontal overflow on any route at 360, 390, 430 or 768.
- Only sub-44px targets remaining: carousel dots (28x44), inline legal links and the 43px breadcrumbs (as in pass 1).
- Bottom Call/Estimate bar: the footer's legal lines clear it on every page.
- Layout shift is 0.00 on home, about, family, a service page, a location page and a blog post.
- **Interactions:**
  - The FAQ accordion opens.
  - "Keep reading" opens to full height and the button goes.
  - Gallery swipe to the end switches the segmented control to "Meet the family", and the jump buttons glide back.
- **Tracking untouched:** `call_click` handlers, every tel: link, the form fields and names, and the Jobber/formsubmit path. progressive-form.js only gains the ready class.
- Facts, "24/7" and content files are untouched.

## Owner decisions: new evidence

- **"Keep reading" folds.** They work as built (tap opens to full height with all text in the DOM). No new issues.
- **Auto-hiding header.** It behaved correctly in emulation. Still needs a real-iPhone feel test.
- **Reduced motion.** Nothing added or removed.

## Left for pass 3

1. **Desktop bug (not fixed because desktop must not change; needs a go).** The same `<source>` problem breaks the /family galleries at 1440: the 4-column "How We Work" grid shows photos only in columns 2 and 4, and the Callahan & Lewis pair stacks in the right column. The header logo also has a stray 10px gap. Fix: move `picture > source { display: none; }` from the 900px block in `mobile.css` to `base.css`, unscoped.
2. Inner-page H1s run 4 lines at 360-390px on long location and service titles ("Water Heater Installation & Plumbing in Venice, FL"). A slightly smaller phone H1 (about 30px) would save a line. Left alone because the CTA is still in the first screen.
3. The SMS consent text is 14 lines on phones, between the phone field and Submit. It is required 10DLC wording. A shorter visible summary with the full text a tap away is a compliance question, not a design one.
4. The phone menu's "About & Contact" label sits beside "About" and duplicates it. That is a label question for the owner.
5. The "Find us online" footer label is muted grey serif and reads as disabled. It matches desktop, so it was left.
6. Real-device checks are still outstanding: the iOS Safari toolbar with the call bar and the auto-hiding header, `text-wrap: balance` support (iOS 17.5+; older devices just wrap normally), and `:has()` support (iOS 15.4+).
