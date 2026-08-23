# Sangraha Narratives: First-Pass Narrative Detection on Public Data

*Sample generated 2026-08-23T09:31:22Z. Draft worker: `stealth/ox-alpha` via OpenRouter. Inputs: public data only — no secrets, env vars, private repo content, customer data, or internal prompts.*

---

## What this is

Sangraha Narratives is a first-pass layer that compresses scattered public signals into named, tagged narrative threads. It does not verify claims, price assets, or rank trades. It answers one narrow question: *what stories are forming in public data right now, and what evidence exists for each?*

This post walks through a public sample batch and explains the engineering choice behind it: running the drafting stage on a cheap preview model, explicitly treated as low-trust.

## Why a cheap preview model fits this stage

For AI builders, the task shape matters more than the model name:

- **Volume economics.** First-pass narrative work is a sweep problem. You want to touch every candidate cluster, not a sampled subset. A cheap preview model makes exhaustive coverage affordable and lets you over-generate candidates, discarding most of them later.
- **Bounded failure modes.** The model's job here is compression and co-occurrence flagging over already-retrieved public text — not open-ended reasoning. Worst case is a weak summary that a downstream reviewer rejects. Every claim must carry a pointer back to public evidence, which caps how far an error can propagate.
- **Preview pricing suits iteration.** Free or discounted preview windows are ideal for prompt iteration, pipeline shakedown, and regression testing before committing budget to a production route.
- **Trust is architectural, not model-intrinsic.** In a tiered pipeline, the drafting model never certifies anything. It produces labeled drafts; humans or stronger models adjudicate what survives.

## Trust tiering: `stealth/ox-alpha` as a low-trust draft worker

The sample was drafted by `stealth/ox-alpha`, routed through OpenRouter. Stealth models lack independent verification of identity and training provenance. That disqualifies them from unreviewed factual assertion — and is perfectly acceptable for drafting.

Accordingly, this model is treated as a **low-trust draft worker**: its output ships with provenance attached (model ID, route, timestamp), and nothing it produces is publication-grade until reviewed against the underlying public evidence. The model drafts; it does not vouch.

## What this batch contains

Six threads, falling into four functional categories:

**Promotion-pattern detection**

- **TSMC Arizona expansion ($TSM)** — Multiple financial outlets publishing near-identical articles framing the expansion and the stock as a "no-brainer buy." Sangraha flags a possible coordinated or template-driven promotion pattern rather than independent coverage. Status: rising, 3 evidence items. Note what this is: a hypothesis about *content provenance*, not a judgment on the company's fundamentals.

**Thematic threads**

- **European luxury / China recovery ($MC.PA, $RMS.PA, $LVMH.PA)** — Early signs of demand stabilization after a prolonged downturn. The source summary itself hedges: tradeable but still early. Status: rising, 2 evidence items — thin support, fresh timestamps.

**Company operations**

- **BMW i5 long-wheelbase localization in India ($BMW.DE)** — Localized production of a premium EV sedan, read as a more serious Indian executive-EV manufacturing strategy. Status: tracked, 2 evidence items.

**Disclosure stress chains (insight-engine)**

Co-occurring signals across public records — financing pressure, holder changes, insider selling, named-loser mentions:

- **Sivers Semiconductors ($SIVE)** — Four co-occurring signals, the densest chain in the batch. But two caveats: last evidence is 2026-06-05, roughly eleven weeks stale against the generation time, and social chatter already names the situation. Both cut the same way: whatever informational edge existed here is narrowing.
- **RaySearch Laboratories ($RAY B)** — Holder-change plus insider-selling chain, 3 signals, evidence current to 2026-08-18. Held as a watch item.
- **MilDef Group ($MILDEF)** — Two-signal chain. Flagged as notable because defense-adjacent names can reprice quickly when ownership signals shift. Status: tracked.

## Reading the metadata

- **`status`** — `rising` means recency-weighted activity; `tracked` means on watch, no current acceleration. Pipeline labels, not trade signals.
- **`evidence` / `size`** — Count of distinct public artifacts behind the thread. Every count in this batch is 2–4. That is small-n by construction; treat these as hypotheses with citations, not findings.
- **`lastEvidence`** — Freshness check. The Sivers thread demonstrates why it matters: a four-signal chain with stale evidence is historical context, not a live signal.

## Limits

- Detection is not verification. A narrative existing in public data says nothing about whether it is true, durable, or priced in.
- Evidence counts are small and recency-skewed. Staleness varies widely within a single batch.
- Coordinated-promotion flags are inferences from article similarity, not proof of coordination.
- Nothing here is investment advice, a recommendation, or a solicitation. Tickers appear as source-data tags. Do your own diligence.

---

*Sangraha Narratives sample, drafted by `stealth/ox-alpha` (OpenRouter) as a low-trust first pass. Descriptive commentary on public data only.*
