# Insula Neurosciences website

The website of Dr Jemish Mayani. It's a static site with no database, no backend and no build step. Every page is a plain HTML file you can edit directly.

## What's inside

```
index.html              Home: an interactive story about the nervous system
about.html              About
neurosurgery.html       Neurosurgery
spine.html              Spine
conditions.html         Conditions directory
conditions/*.html       One page per condition (10)
resources.html          Patient resources
resources/*.html        One page per guide (6)
contact.html            Contact
privacy.html            Privacy policy
disclaimer.html         Medical disclaimer
404.html                "Page not found"
assets/css/style.css    All styling, including the colour palette
assets/js/main.js       Animations and interactions
assets/img/             Logo, favicon, portrait, social preview image
robots.txt              For search engines
.nojekyll               Tells GitHub Pages to serve files as they are
```

All links between pages are relative, so the site works at a custom domain and under a GitHub repository subpath (`username.github.io/repo-name/`) without changes.

---

## Deploying to GitHub Pages

1. Sign in to GitHub and create a new repository, for example `insula-website`. Make it **public** (Pages on private repositories needs a paid plan).
2. On the repository page, click **uploading an existing file**. Drag in **the contents of this folder**, not the folder itself, so `index.html` sits at the top level. Click **Commit changes**.
   - `.nojekyll` is a hidden file and may not upload. If it's missing, use **Add file > Create new file**, name it `.nojekyll`, leave it empty and commit.
3. Go to **Settings > Pages**. Under **Build and deployment**, set Source to **Deploy from a branch**, Branch to **main**, folder **/ (root)**, then **Save**.
4. After a minute or two the site is live at `https://jemishmayani.github.io/insula-website/` (the last part matches your repository name).

### Updating an already-published site
Upload the new files to the same repository. GitHub asks whether to replace existing files: accept, then **Commit changes**. The live site updates within a couple of minutes. If you still see the old version, refresh with Ctrl+Shift+R (Cmd+Shift+R on a Mac).

### When you buy a domain

1. Buy it from a registrar such as Cloudflare, Namecheap or GoDaddy.
2. In **Settings > Pages > Custom domain**, enter it (for example `www.insulaneurosciences.com`) and save.
3. At your registrar, add the DNS record GitHub shows you. For a `www` address, that's a `CNAME` record pointing to `jemishmayani.github.io`. GitHub's guide: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site
4. Once verified, tick **Enforce HTTPS**.
5. Optional, for nicer link previews on WhatsApp and LinkedIn: in every page's `<head>`, add
   `<meta property="og:image" content="https://www.yourdomain.com/assets/img/og-image.png">`
   The image is already in `assets/img/`. It needs the full address, which is why it waits for your domain.

---

## Updating content

### Editing a page
Open the `.html` file on GitHub, click the pencil icon, edit the text, and commit. Text sits between tags such as `<p>...</p>` (paragraphs), `<h2>...</h2>` (headings) and `<li>...</li>` (list items). Change only the words between the tags.

### Changing the email address
Use a code editor such as **VS Code** (free). Open the folder, then **Edit > Replace in Files** (Ctrl+Shift+H, or Cmd+Shift+H on a Mac). Find `insulaneurosciences@gmail.com`, replace it with the new address, and click **Replace All**. The Instagram handle works the same way: search for `insula.neurosciences`.

### Adding details later
- **Phone number or address:** add a card on `contact.html` by copying the Instagram card block (`<div class="card contact-card">` to its closing `</div>`).
- **Training history, institution, clinical interests:** add them on `about.html` under Qualifications, copying one `<li>` row for each new line.

### Replacing the photo
Save a new photo as `portrait.jpg` (portrait shape, about 960 × 1200 pixels) and upload it to `assets/img/`, replacing the old file.

### Replacing the logo
Replace these files in `assets/img/`, keeping the **same names**:
- `logo-mark-96.png` (96 × 96, transparent background): header and footer
- `logo-mark-512.png` and `logo-mark.png`: larger copies
- `favicon-32.png` (32 × 32): browser tab icon
- `apple-touch-icon.png` (180 × 180, on a dark background): phone home-screen icon
- `og-image.png` (1200 × 630): link preview image

The "INSULA NEUROSCIENCES" wordmark beside the logo is live text in Bebas Neue, so it stays sharp at every size.

### Adding a new condition page
1. In `conditions/`, copy an existing page, for example `brain-tumours.html`, and rename the copy.
2. Edit the title, description, headings and text. Update the "On this page" list so each link matches a section `id`.
3. Open `conditions.html`, copy one condition card (a block starting `<a class="card cond-card"`), paste it into the right group, and change its link, title and summary. Set `data-area` to `brain` or `spine`, and put a few search words in `data-search` in lowercase.
4. Update "Last reviewed" at the bottom of the page.

Patient guides work the same way, using `resources/` and `resources.html`.

### Changing colours
All colours are defined once at the top of `assets/css/style.css`.

---

## Animations and interactions

All of these live in `assets/js/main.js`, with their styles in `assets/css/style.css`:

- **Nerve-cell network** behind every page, top to bottom. Signals hop between cells, and the cursor or a tap fires new ones. Interactive panels, cards and the bottom navigation tiles sit above it on solid backgrounds.
- **Nervous system explorer** on the home page. Choose brain, spinal cord or nerves, or send a signal down to the foot and back.
- **Slipped-disc slider** on the home page, the Spine page and the slipped disc guide.
- **Insula reveal** on the home page. The opercula part as you scroll, or when the brain is tapped.
- **Condition animations**, one in every condition guide:
  - Brain tumours: a growing tumour pushes the midline across
  - Brain aneurysm: a pulsing berry aneurysm, untreated, ruptured, coiled or clipped
  - Hydrocephalus: the fluid pathway in a mid-line view, blocked at the aqueduct, with a shunt or with an ETV
  - Head injury: a cross-section from the front, with extradural, acute subdural and chronic subdural bleeds and midline shift
  - Trigeminal neuralgia: V1, V2 and V3 in sequence, an artery beating against the nerve, and the felt cushion after surgery
  - Lumbar canal stenosis: an anatomical cross-section of the vertebra narrowing, plus a side view of standing versus bending forward
  - Cervical myelopathy: discs compressing the cord, before and after surgery
  - Cauda equina syndrome: a disc squeezing the nerve roots and the saddle area going numb
  - Spinal tuberculosis: a linked spine where the front of two vertebrae collapses into a hump
- **Emergency boxes** carry a small siren light that alternates red and blue.
- **Navigation:** on desktop a pulse travels along the current page's underline. In the phone menu, the current page shows its own icon drawing in, and items slide in one after another.
- Numbers that count up, headings that rise in word by word, staggered cards, a soft cursor light on cards, a scroll progress bar, and gentle fades between pages.

Animations pause when the browser tab is hidden, and switch off for anyone with "reduce motion" turned on in their device settings. Every page still works with JavaScript off.

---

## Brand palette

| Colour | Hex | Used for |
|---|---|---|
| Void | `#0D1114` | Page background |
| Raised | `#171C21` | Cards, alternate sections |
| Chalk | `#E9ECEE` | Headings and primary text |
| Body text | `#C5CBD0` | Long paragraphs (a softened chalk, easier on the eyes) |
| Steel | `#8B959C` | Captions, labels, secondary text |
| Cobalt | `#7E9BFF` | Links, buttons, signals, the thread divider, brain category |
| Orchid | `#C49BE8` | Spine category, returning "feeling" signal |
| Ember | `#FF6B57` | Emergency warnings and nerve pain only |
| Gold | `#D9A521` | Logo wordmark only |

Typefaces: Bebas Neue (wordmark), Bricolage Grotesque (headings), Archivo (labels and buttons), Newsreader (body text), Space Mono (small labels and numerals).

---

## Notes

- **No tracking.** The site sets no cookies and uses no analytics. If you add analytics later, update the privacy policy.
- **Fonts** load from Google Fonts, which the privacy policy mentions. If they fail to load, the site falls back to system fonts and stays readable.
- **Before publishing,** have a senior colleague review the medical content, and check the site against your institution's social media policy and current National Medical Commission guidance.
