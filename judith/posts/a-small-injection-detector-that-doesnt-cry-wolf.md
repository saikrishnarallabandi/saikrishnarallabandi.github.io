---
layout: post
title: "A small prompt-injection detector that doesn't cry wolf"
date: 2026-07-15
tags: [jataayu, llm-security, prompt-injection, open-source]
---

We just shipped the first model in [**Jataayu**](https://github.com/saikrishnarallabandi/jataayu):
a **0.8B prompt-injection detector**, Apache-2.0, on the Hub as
[`srallaba/Jataayu.promptinjection.v0.1`](https://huggingface.co/srallaba/Jataayu.promptinjection.v0.1).
It's small, it's permissively licensed, and the interesting part of building it wasn't the detection.
It was learning **not to over-react**.

## The part everyone benchmarks

Prompt-injection detectors are usually sold on catch-rate: what fraction of attacks do you flag at a
fixed, low false-positive rate? On that axis, small models do fine. An off-the-shelf Qwen-4B *judge*,
with no training at all, already matches small encoder baselines (ProtectAI, Prompt-Guard-2) on our
held-out suite. Give a 0.8B model a continuous score head — read the injection probability off the
first token instead of asking for a coarse 0–100 integer — and a light LoRA pushes recall past all of
them. Catch-rate is close to a solved problem at this scale.

So we built it, and the leaderboard said we were #1. And it was a trap.

## The part nobody survives

The number that actually decides whether a detector is deployable is **over-defense**: how often it
flags *benign* text as an attack. The community has a brutal little benchmark for this — **NotInject**
— made of legitimately benign sentences that happen to be dense with injection-*looking* phrases:
"ignore the previous section," "the system prompt," "reveal the answer." A keyword-matcher lights up
on every one.

Our shiny #1 model flagged **~24% of NotInject as attacks.** A guardrail that cries wolf a quarter of
the time gets switched off in a week. Off-the-shelf models sit near 0% there — they know a trigger
word isn't an attack. We'd traded the one property that makes a detector usable for a leaderboard
rank.

Worse: our in-training "over-defense monitor" had reported **zero** false positives the entire run.
It was too easy — a proxy that doesn't resemble the hard cases tells you nothing, and a proxy reading
*perfect* is a red flag, not a green light. We were overfitting into over-defense and couldn't see it.

## The fix was data, not a knob

We scored every checkpoint across training against real held-out NotInject. There was no magic
checkpoint hiding in there — the *entire* high-recall regime over-defended. You can't re-select your
way out of a problem that's baked into what the model learned. The frontier had to be **lifted**, and
that meant teaching the boundary explicitly.

So we synthesized ~9,000 **trigger-dense benign** examples — text packed with injection-looking
phrases but genuinely harmless: security tutorials *about* injection, a user quoting an attack to ask
what it means, red-team writeups, API docs, log analysis. All labeled benign. The lesson we wanted the
model to internalize: **a trigger is not an attack.** We oversampled them hard, retrained, and — this
time — selected checkpoints against real held-out NotInject with a floor that *refuses* to certify an
over-defending model.

Watching the retrain, the over-defense false-positives fell from **82 to 6** while recall stayed high.
The two properties stopped fighting.

## Where it landed

| | mean Recall@1%FPR | NotInject over-defense | 
|---|---|---|
| **Jataayu-0.8B v0.1** | **0.853** | **0.98** (6 FP) |
| Qwen3.5-4B judge (off-the-shelf) | 0.737 | 1.00 |
| ProtectAI deberta-v3-v2 | 0.787 | 0.75 |
| Prompt-Guard-2 86M | 0.764 | 0.89 |

A 0.8B adapter with **higher detection recall than a 4B judge and every small encoder we tested, at
over-defense close to the best of them.** That's the combination that was hard to get.

## The honest caveats

It's **v0.1**. Jailbreak-*contrast* coverage (attack-style phrasing with no injection payload) is still
modest — this is an injection detector, and that's its weakest axis. It's English-dominant. And a
determined adversary can craft evasions, because **detectors are evadable — all of them.**

Which is the whole point of Jataayu's design: detection is a defense-in-depth *signal*, never the
control. The control is the **effect boundary** — you authorize the *action* an agent is about to take
against its provenance and a capability policy, deterministically, instead of trying to classify every
input string as safe or not. The detector raises suspicion on untrusted spans; the boundary decides
what's allowed to actually happen. This model is the first; more task adapters follow.

## Try it

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
# srallaba/Jataayu.promptinjection.v0.1  — full usage in the model card
```

- Model: <https://huggingface.co/srallaba/Jataayu.promptinjection.v0.1>
- Code: <https://github.com/saikrishnarallabandi/jataayu>

Everything — data recipe, eval harness, and the frontier plots that talked us out of a bad checkpoint
— is in the repo. If you're building agent guardrails, the over-defense number is the one to watch.
