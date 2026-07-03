# Nihal Jani — Personal Portfolio

Personal portfolio site for **Nihal Jani** — Physics & Mathematics educator,
founder of NJ's Learning Hub (Ahmedabad), and builder of education software.

Plain HTML/CSS/JS — no build step, no dependencies. Ready for GitHub Pages.

## Pages

| Page | What's on it |
|---|---|
| `index.html` | About, Experience, Education, Skills & Tools, Publications, Projects, Achievements, Contact |
| `tools.html` | **Interactive Lab** — live simulations: projectile motion, simple pendulum, wave superposition, unit circle & trig functions |

## Features

- **Dark & light themes** — toggle in the header; the choice is remembered
  (`localStorage`) and defaults to the system preference. Simulations repaint
  with the active palette.
- **Interactive simulations** on the tools page, written in vanilla canvas:
  - *Projectile motion* — angle/speed sliders, selectable gravity (Earth,
    Moon, Mars, Jupiter), animated flight, hover to read `(x, y, t)` along
    the predicted path, live range / max-height / time-of-flight readouts.
  - *Simple pendulum* — real large-angle dynamics (numerical integration,
    not the small-angle approximation).
  - *Wave superposition* — two travelling waves and their sum; make beats.
  - *Unit circle & trig functions* — a point moving round the unit circle
    traces the sine and cosine curves; drag the angle or press play, with
    live sin/cos/tan readouts.
- "Field notes" theme: graph-paper light mode, chalkboard dark mode, with an
  animated projectile-arc doodle in the hero.
- Responsive, respects `prefers-reduced-motion`, no frameworks.

## Local preview

Any static server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying to GitHub Pages

A GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) publishes the
site to the `gh-pages` branch on every push. One-time setup (repo admin):

1. **Settings → Pages → Build and deployment**
2. Source: **Deploy from a branch**
3. Branch: **`gh-pages`**, folder **`/ (root)`** → **Save**

The site then serves at `https://njlearninghub.github.io/nihal-jani/` and
republishes automatically on every push.

## Getting `nihal-jani.github.io`

A `<name>.github.io` URL comes from the **account name**, not the repo. Steps:

1. Create a GitHub account named **`nihal-jani`** (github.com/signup — the
   form tells you if the name is free; fallbacks: `nihaljani`, `nihal-jani7`).
2. In that account, create a new **public** repo named exactly
   **`nihal-jani.github.io`** (leave it empty — no README).
3. Push this site's code to it:

   ```bash
   git clone -b claude/personal-portfolio-repo-mfeckv https://github.com/NJLearninghub/nihal-jani.git portfolio
   cd portfolio
   git remote set-url origin https://github.com/nihal-jani/nihal-jani.github.io.git
   git push -u origin claude/personal-portfolio-repo-mfeckv:main
   ```

   (The site currently lives on the `claude/personal-portfolio-repo-mfeckv`
   branch; the command above publishes it as `main` in the new repo. If the
   branch has been merged to `main` here first, a plain
   `git push -u origin main` works instead.)

For a `<name>.github.io` repo, GitHub Pages turns on automatically and serves
the default branch — no settings needed. The site appears at
`https://nihal-jani.github.io/` within a couple of minutes. All paths in this
site are relative, so the same code works unchanged at either URL.

## Custom domain (`nihaljani.com`) — when you buy it

1. Repo **Settings → Pages → Custom domain** → enter `nihaljani.com` → Save
   (this creates a `CNAME` file in the repo).
2. At your domain registrar, add DNS records:
   - Four **A** records for `nihaljani.com` (apex) pointing to
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - One **CNAME** record for `www` pointing to `nihal-jani.github.io`
3. Back in Settings → Pages, tick **Enforce HTTPS** once the certificate is
   issued (can take up to an hour).

## Adding a portrait

Drop a photo at `assets/img/portrait.jpg` and replace the placeholder in
`index.html`:

```html
<div class="portrait"><img src="assets/img/portrait.jpg" alt="Nihal Jani" /></div>
```
