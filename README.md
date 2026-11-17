# Quinntin Saint Laurent — portfolio

A single-page, photo-led portfolio that runs in date order through five
chapters: Music, Magazine, Advertising, Film & Television, and People & AI.

It is a plain static site. There is no build step.

| Path | What it is |
| --- | --- |
| `index.html` | All of the content |
| `css/style.css` | Layout, type and motion |
| `js/main.js` | Scroll effects, credits filter, picture loading |
| `fonts/` | Archivo (SIL Open Font License) |
| `img/` | Put your own pictures here |

## Preview it

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publish it

On GitHub: Settings → Pages → Deploy from a branch → `main` / root. Any other
static host (Netlify, Vercel, Cloudflare Pages) works the same way.

## Pictures

Each poster and photo frame has a `data-wiki` attribute naming a Wikipedia
article. When the page opens, the visitor's browser asks Wikipedia for that
article's lead image and shows it. If nothing comes back, the frame shows a
designed title card instead, so the page never looks broken.

To use your own picture in any slot, save it in `img/` and add `data-img`:

```html
<a class="poster" data-kind="film" data-img="img/trouble-man.jpg" href="...">
```

`data-img` always wins over `data-wiki`. The short films have no Wikipedia
article, so they are the first ones worth adding stills or posters for.

Poster artwork belongs to the studios and distributors. Photographs come from
Wikipedia and carry their own licences.

## Contact form

The "Let's talk" form asks for a name, an email and the purpose of the talk.
Out of the box it opens the visitor's email app with the message filled in.
To have messages delivered straight to your inbox instead, create a free form
at https://formspree.io and paste its address into `data-endpoint` on the
`<form id="talk">` tag in `index.html`:

```html
<form class="talk reveal" id="talk" data-endpoint="https://formspree.io/f/yourcode" novalidate>
```

## Adding a credit

Copy one `<a class="poster">` block in `index.html`, set `data-kind` to `film`
or `tv`, point `href` at the IMDb page, and update the three counts on the
filter buttons above the grid.
