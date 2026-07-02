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

Repo **Settings → Pages → Deploy from a branch**, pick the branch and `/ (root)`.

## Adding a portrait

Drop a photo at `assets/img/portrait.jpg` and replace the placeholder in
`index.html`:

```html
<div class="portrait"><img src="assets/img/portrait.jpg" alt="Nihal Jani" /></div>
```
