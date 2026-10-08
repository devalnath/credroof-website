# CredRoof landing pages

Static site. No build step, no dependencies, no framework, no database. Open a page in a browser and it works.

## Files

- `index.html`: the main page. "Find a home in the Kerala area you choose."
- `apply.html`: the short callback page for high-intent traffic. Form first, no navigation.
- `privacy.html`: the plain-language privacy note linked from every form.
- `assets/styles.css`: the whole design system in one file.
- `assets/app.js`: call-button wiring, the form handoff, and the internal calculator.
- `assets/config.js`: the only file you normally edit.
- `assets/img/`: the hero (wide and portrait crops), the home photograph in the start section, the backwater photograph in the moment section, the keys photograph in the callback section, and the social-share image, each as JPG plus WebP. Unused and safe to delete before deploying: `home-keys.jpg`, `kerala-moment-1104.webp`, `detail-door.jpg`, `detail-door-1000.webp`, `detail-courtyard.jpg`, `detail-courtyard-1000.webp`.
- `assets/fonts/`: self-hosted Switzer (display) and Satoshi (reading). Retired Clash Display, General Sans and Sentient files stay here until the next deploy; nothing references them.
- `tools/check-contrast.mjs`: verifies the palette against WCAG. Run it after any colour change.
- `tools/serve.mjs`: local preview server.

## Before this goes live

1. Open `assets/config.js` and set `phone` to the sales number. That single value turns every call button into a real tap-to-call link and prints the number in the footer. Until it is set, the call buttons read "Get a callback" (short label "Call" in the nav pill) and scroll to the form. Setting `whatsapp` also reveals the WhatsApp button in the mobile call bar.
2. Set `whatsapp` to the same number in international format, digits only, for example 919876543210.
3. Add the registered business name, address and grievance contact to the footer of `index.html` and `apply.html`. They are deliberately absent right now rather than filled with a placeholder, so the current footer reads as a finished page.
4. Review every line against `../ops/01-CLAIMS-POLICY.md`. Section 1 is a hard list of words and topics that must never appear on a customer page.
5. Add three real customer quotes to the hidden story block in `index.html`, then delete the `hidden` attribute. Never invent a testimonial.
6. Remove `<meta name="robots" content="noindex" />` only when this becomes the public site. Paid-traffic landing pages are usually left out of search on purpose.
7. Run `node tools/check-contrast.mjs`. It must print all checks passed.

## How the forms work

Two steps, no documents. Step one takes a name and a mobile number; step two takes the district, budget, area and a preferred call time. On submit the page opens WhatsApp with a structured message to the sales number, so the lead lands in the team's phone instantly. Nothing is stored on the site, because there is no server.

If a CRM is connected later, put its endpoint in `config.js` as `formEndpoint` and the same payload is also posted there as JSON.

## Interactive pieces on the page

| Piece | What it does | What it needs to go live |
|---|---|---|
| EMI preview | A slider from ₹15 lakh to ₹2 crore that shows an indicative monthly EMI at 8.75% over 20 years | Nothing. It states its assumptions and says it is for eligible applicants |
| District picker | Fourteen chips. Tapping one fills the district in the form and confirms we work there | Nothing |
| What happens when you call | Four steps that remove the fear of a sales call | Nothing |
| Two-step form | Name and mobile first, then the details. Inline errors, Indian mobile auto-formatting | Nothing |
| Preferred call time | Now / this evening / tomorrow morning / any time, added to the lead message | The sales rota should honour it |
| Phone menu | Below 820px the pill shows a Menu button instead of the inline links. It opens a full-height sheet with the same navigation, a call action, and a focus trap. Closes on link tap, Escape, backdrop tap, or when the viewport widens past 820px | Nothing |
| Customer stories | Three quote cards, built and hidden | Three real quotes with written consent |
| Chat proof | A framed WhatsApp screenshot, built and hidden | One real conversation, name removed, consent on file |
| Office card | Says the call comes from the Thrissur team | The real street address and a map link |

Two sections carry the `hidden` attribute until their real content exists. To switch one on, replace the bracketed placeholder text and delete that section's `hidden` attribute. Never publish an invented testimonial or a fabricated chat screenshot.

## Design record

- `../DESIGN.md` is the shipped design system: palette with measured contrast,
  type scale, radius system, components, motion.
- `../design/NOTES.md` records what changed in the 2026-09-19 rebuild, what was
  cut, and what is still weak.
- `../design/shots/` holds the review screenshots. Regenerate them with
  `node ../design/shots/capture.mjs <chrome.exe> <url> <width> <height> <prefix> [selectors]`,
  which drives headless Chrome over CDP at an exact viewport with reduced motion
  so captures are deterministic.

## URL parameters

Ads can prefill the visitor's location and budget, and the source is recorded in the message:

```
index.html?area=Kuriachira&budget=45-60l&utm_source=meta&utm_campaign=thrissur_100
```

Budget values must match the option values in the form: `below-30l`, `30-45l`, `45-60l`, `60-80l`, `80l-1cr`, `above-1cr`.

## Hosting

Upload the `site` folder as the web root. Any static host works: Netlify, Cloudflare Pages, GitHub Pages, Vercel, or existing hosting with a folder. No environment variables, no server.

## Internal tools

`../internal/cash-calculator.html` works out the real cash requirement on a deal. It sits outside this folder on purpose so it can never be uploaded with the site. Open it directly in a browser.
