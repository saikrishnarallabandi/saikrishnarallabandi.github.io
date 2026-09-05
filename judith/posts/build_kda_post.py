"""Render the KDA post into the blog's hand-written HTML shape.

The blog has no generator: each post is a self-contained page with inlined CSS. So we reuse
an existing post as the template -- head, hero, footer, nav -- and swap the article body,
rather than inventing a second visual language for one post.
"""
import re, html, markdown, sys

TEMPLATE = "a-small-injection-detector-that-doesnt-cry-wolf.html"
OUT = "kda-layers-into-qwen.html"
SRC = "kda-layers-into-qwen.md"

TITLE = "Putting Kimi Delta Attention into a Qwen model"
DEK = ("Gated DeltaNet is Kimi Delta Attention with one knob held still — so the swap costs "
       "no distillation and no training tokens. The recipe, five traps, and what it turns "
       "out to be worth.")
DESC = ("Qwen3.5's Gated DeltaNet layers convert into Kimi Delta Attention with no residual "
        "and no training tokens. The full weight mapping, the rank-16 construction that makes "
        "it work, why the reference implementation cannot receive your weights, how to verify "
        "an identity across two kernels, and whether the added expressivity does anything.")
OG_DESC = ("An exact GDN to KDA conversion of Qwen3.5 — the recipe, the five traps that cost "
           "us real time, and the measurement saying the new expressivity is still unused.")
KICKER = "Linear attention · Architecture conversion"

# One kicker per section, in document order. The template puts a mono label above each h2
# and the page reads wrong without them.
KICKERS = [
    "The premise", "Why bother", "The mapping", "The one construction",
    "Trap 1", "Trap 2", "Trap 3", "Trap 4", "Trap 5",
    "The honest part", "Checklist",
]

# Display maths. The blog inlines everything and pulls no CDN, so two equations do not justify
# MathJax; they are hand-set instead, with the ONE symbol that differs between the two
# recurrences highlighted, since that difference is the whole point of the section.
EQ_CSS = """
  /* display maths -- hand-set, no CDN */
  .eq{margin:1.7em 0; padding:20px 22px; border:1px solid var(--hair); border-radius:12px;
    background:var(--surface); overflow-x:auto;}
  .eqrow{display:grid; grid-template-columns:auto 1fr; gap:4px 16px; align-items:baseline;
    padding:8px 0;}
  .eqrow + .eqrow{border-top:1px solid var(--hair); margin-top:4px;}
  .eqtag{font-family:var(--mono); font-size:.68rem; letter-spacing:.14em; text-transform:uppercase;
    color:var(--accent-ink); padding-top:.35em;}
  .eqbody{font-family:var(--serif); font-size:1.16rem; line-height:1.9; white-space:nowrap;}
  .eqbody i{font-style:italic}
  .eqnote{grid-column:2; font-family:var(--mono); font-size:.72rem; color:var(--faint);
    letter-spacing:.02em;}
  .eqbody .hl{font-style:normal; color:var(--accent-ink); font-weight:600;
    background:var(--accent-soft); border-radius:4px; padding:.05em .28em;}
  .m{font-family:var(--serif); font-style:italic; white-space:nowrap;}
  @media (max-width:640px){ .eqbody{font-size:1rem} }
"""

body = open(SRC).read().split("---\n", 2)[2].strip()
h = markdown.markdown(body, extensions=["tables", "fenced_code"])

h = h.replace("<table>", '<table class="cap">')
h = re.sub(r"<pre><code[^>]*>", '<pre class="code">', h)
h = h.replace("</code></pre>", "</pre>")
h = h.replace("<code>", '<code style="font-family:var(--mono);font-size:.88em">')
h = h.replace("<p>", '<p class="lead">', 1)

ks = iter(KICKERS)
def kick(m):
    try:
        return f'<p class="sec-kick">{next(ks)}</p>\n    {m.group(0)}'
    except StopIteration:
        return m.group(0)
h = re.sub(r"<h2>.*?</h2>", kick, h)
left = list(ks)
n_h2 = len(re.findall(r"<h2>", h))
if left or n_h2 != len(KICKERS):
    sys.exit(f"FATAL: {n_h2} h2 sections but {len(KICKERS)} kickers ({len(left)} unused)")
print(f"sections: {n_h2}, all kickered")

# wide tables scroll inside themselves, never the page
h = re.sub(r'(<table class="cap">.*?</table>)',
           r'<div style="overflow-x:auto">\1</div>', h, flags=re.S)

# Indent for readability, but NEVER inside <pre> -- whitespace there is content.
parts = re.split(r'(<pre class="code">.*?</pre>)', h, flags=re.S)
h = "".join(p if p.startswith("<pre") else "\n    ".join(p.split("\n")) for p in parts)

tpl = open(TEMPLATE).read()
head, rest = tpl.split("<body>", 1)
_, tail = rest.split("</article>", 1)

head = re.sub(r'<meta name="description" content="[^"]*">',
              f'<meta name="description" content="{html.escape(DESC)}">', head)
head = re.sub(r"<title>[^<]*</title>", f"<title>{html.escape(TITLE)}</title>", head)
head = re.sub(r'<meta property="og:title" content="[^"]*">',
              f'<meta property="og:title" content="{html.escape(TITLE)}">', head)
head = re.sub(r'<meta property="og:description" content="[^"]*">',
              f'<meta property="og:description" content="{html.escape(OG_DESC)}">', head)
assert head.count("</style>") == 1, "template no longer has exactly one style block"
head = head.replace("</style>", EQ_CSS + "</style>")

page = f"""{head}<body>
<header class="hero">
  <div class="hero-in">
    <p class="kicker">
      <svg class="ring" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/></svg>
      {KICKER}
    </p>
    <h1>{html.escape(TITLE)}</h1>
    <p class="dek">{DEK}</p>
    <p class="byline">From building <a href="../">Judith</a> &middot; Sai Krishna Rallabandi &middot; 2 August 2026</p>
  </div>
</header>

<article>
  <div class="wrap">

    {h}

  </div>
</article>{tail}"""
open(OUT, "w").write(page)
print(f"wrote {OUT}: {len(page):,} bytes")
