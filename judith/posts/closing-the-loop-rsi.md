# Closing the Loop — Building an RSI Agent

*How to build an RSI agent — one that actually improves itself — and why the machinery is the easy half.*

---

There's a pattern every "self-improving" agent seems to ship with. It keeps a memory of what happened, reflects on that memory, proposes a change to its own behavior, and applies it. Reflect, propose, apply. Draw it on a whiteboard and it's a beautiful closed loop.

Run it in production for a while and you notice something uncomfortable: the loop is closed in *shape*, not in *substance*. It never checks whether a change actually helped. It can't adopt anything without a human in the hot path, so it stalls the moment attention runs out. And when a change makes things worse, there's no way to take it back.

That's not a self-improvement loop. It's a self-*modification* loop with the feedback edge drawn in but never wired up. The gap between those two is the whole game.

## What "closed" actually requires

A real loop needs three edges the demo version skips. Everything else is detail.

- **Outcome attribution.** Did the change reduce the problem it was meant to fix — out in the world, not in the model's own opinion?
- **A safe way to adopt on its own.** So progress doesn't depend on a human saying "yes" to every micro-change.
- **A way to undo.** A captured before-state and an automatic rollback when a signal moves the wrong way.

Miss any one and you don't have a loop — you have an agent editing itself and hoping.

## Measure outcomes, not applause

The hardest and most important edge is the first one. Most self-improvement systems that *do* measure improvement measure it against a cheap oracle — a unit test, a benchmark, the model grading its own work. A deployed assistant has no such oracle. The question isn't "does the model think this is better." It's "did the thing the user kept complaining about stop happening."

So tie every shipped change back to the signal that motivated it. If a change was born because someone kept correcting the agent about the same thing, the measure of that change is simple: did that correction stop recurring, after, compared to before?

Which means you first need to *read* the friction — turn a stream of messages into typed signals: corrections, frustrations, unmet wishes, repeated asks. A small model classifying each message does this well.

*Public data — the signal & its recurrence:*

- **WildChat** — real assistant conversations to run a distiller over.
- **WildFeedback** — in-conversation (dis)satisfaction mined from those chats; the closest label scaffold.
- **USS · EmoWOZ · SAIF** — dialogues labeled with satisfaction, and real human–AI correction pairs, for training the signal detector.
- **MSC · Conversation Chronicles · LoCoMo** — same-user-over-time corpora, to measure recurrence before versus after.

*No public set gives you the real thing — a live deployment with labeled friction and a controlled change. That gap is exactly why the deployment matters.*

> Optimize applause and you get a crowd-pleaser. Optimize the real outcome and you get an agent that helps.

This is also your defense against the oldest failure in optimization — **Goodhart's law.** The instant your reward becomes "the judge liked it" or "we adopted a lot of changes," the system learns to farm the judge and inflate the count. The fix is to keep the thing you actually optimize an *independent* signal of real behavior, something the agent doesn't get to grade, and to hold it off the optimization path — used as a verdict, not a dial.

One caveat that bites hard in the real world: you get very little data per signal. A single person produces a handful of instances of any one friction. A naive rule — "recurrence dropped by half, ship it" — will crown noise as success constantly. Use a conservative test, and when the evidence isn't there yet, prefer *"insufficient evidence, keep watching"* over a confident wrong answer. A false "it helped" is the expensive mistake: it teaches the loop the wrong lesson, and lessons compound.

**⚙ Mechanism — the attribution test.** Count how often the friction recurred in a window before the change and an equal window after. Under the null of no effect, the after-count follows a `Binomial(before + after, ½)`; a one-sided lower-tail probability under your significance level is what earns a *helped*. A neat consequence: if a complaint simply stops — zero events after — you need a handful of instances *before* for that zero to be significant at all, a built-in guard against declaring victory on one vanished occurrence (the "rule of three"). Because friction can fall for reasons unrelated to your change, run it as a **difference-in-differences**: compare the target signal's drop against the drop in *all other* friction over the same window, and credit the change only if it beats that background. When even a perfect result couldn't clear significance, return `insufficient_evidence` and widen the window rather than guess.

## One rater is not enough

When the human signal is too sparse to train on directly, you can *densify* it — have a model judge quality and use that as a stand-in reward. But "auto-rater" makes it sound like a single thing. It isn't. You need a small panel of judges, each answering a different question, each tuned differently — and getting the *granularity* right for each one matters more than which model you pick.

**The usefulness judge** asks: did this actually help the person? It's the most subjective and the hardest, because helpfulness is graded, not binary. Give it a fine scale — a coarse good/bad judge ties on nearly everything and collapses to a coin flip, teaching the loop nothing. Better still, ask it to *compare* two responses rather than score one in a vacuum; judges, like people, agree far more on "which is better" than on "what number." Aggregate enough pairwise comparisons and you recover a ranking — a Bradley–Terry score — that's far steadier than any single absolute rating. This one is a reward, so it has to be calibrated hard against real human preference: measure agreement on pairwise sets and rank-correlation on scalar ones, and watch for the self-preference bias where a judge favors its own model's family.

**The deliverable-quality judge** asks: is this good work — a report, a plan, a piece of code? More objective than usefulness, because you can hand it explicit, domain-specific criteria: is the code correct, is the analysis sound, did it answer the question asked. Here the nuance lives in the rubric, not the scale; the sharper the criteria, the more the judge agrees with an expert.

**The faithfulness judge** asks: is this true and grounded in the source, or quietly made up? This one you want *strict*, not nuanced. It doesn't grade eloquence; it catches fabrication. Run it near-binary, and when in doubt, flag.

**The safety judge** asks: does this leak someone's private information, or cross a hard line? It's different in kind — not a reward but a *veto*. You want it conservative: high recall on real violations even at the cost of some false alarms. And you must never let it become a positive score the loop can trade away. A guardrail you can optimize against is not a guardrail.

> Grade the things you're trying to improve. Gate the things you can't allow.

The rule that ties the panel together: match a judge's output to the decision it feeds. A reward needs a fine, calibrated scale — or, better, a pairwise comparison. A veto needs a crisp boundary. And never let the model that wrote an answer be the only judge of it: a generator grading its own work drifts toward flattering itself.

*Public data — calibrating the judges:*

- **MT-Bench (human)** — pairwise human votes; the standard "does my judge agree with people" check.
- **HelpSteer2 / 3 · PRISM** — human quality ratings and per-turn scores; the best public stand-ins for a real reward.
- **RewardBench · LLMBar** — meta-benchmarks that stress a judge for bias and gameability.
- **ai4privacy** — labeled PII spans, for the safety judge's leak detection.

## Earn autonomy; don't grant it

The stall — waiting for a human to approve everything — is fatal, because attention is the one resource that always runs out. But the fix isn't "let it do anything." It's to make autonomy something a change has to *earn*.

Sort changes by how reversible and measurable they are. The reversible, scoped, measurable ones — a tightened instruction, an adjusted threshold, a repaired routine — the agent can adopt on its own, *because* it can measure the result and undo it if it's wrong. The consequential ones — new capabilities, anything reaching outside its own sandbox — get proposed to a human. The irreversible ones — deletions, credentials, anything that can't be walked back — always require an explicit yes.

Then add one more thing: a fallback for silence. If a low-risk change is proposed and no one answers, don't let it die in a queue — downgrade it to the measured-and-reversible path. Autonomy earned by measurability plus reversibility, with a human kept firmly in the loop exactly where it matters and nowhere it doesn't.

**⚙ Mechanism — a reversible change.** Represent an auto-adoptable change as a small, whitelisted vocabulary of declarative operations — `set a value at a key-path`, `replace an exact string`, `adjust a threshold` — never free-form code. Each op is checked against a path allowlist (it may only touch the agent's own low-risk files) and, for anything generated, an `AST` pass that rejects imports, `subprocess`/`exec`/`eval`, and access to dunder internals. Before applying, snapshot the exact prior bytes as a *pre-image*. Adopt, then open the verify window; if the target metric regresses, restore the pre-image automatically. Undo is a file copy, not a heuristic — which is what makes "auto-adopt" safe to say out loud.

That machinery — detect a failure, apply a scoped fix, prove the fix worked, else roll back — is exactly the shape of program-repair benchmarks, so you can build and stress it on public data:

*Public data — apply, verify, undo:*

- **BugSwarm · Defects4J** — reproducible failing-then-fixed pairs with an automatic pass/fail gate; the gold standard for "did the fix actually work."
- **IDoFT** — real intermittent failures with their fixes; the closest analog to something that flakes for no code change.

*There's no public corpus of scheduled-job failures paired with their fixes — that intersection is novel ground.*

## Make it choose better, not just act

An agent that applies changes is automation. An agent that gets *better at choosing which changes to make* is the recursive part — the self-improvement actually improving itself.

Close that edge by feeding the outcome verdict back as a reward for whatever picks the changes. Over time it learns which kinds of changes tend to help, and leans toward them. The reward arrives late — you only learn weeks later whether a change worked — but late feedback is still feedback. You just remember what you chose, and credit it when the verdict finally lands.

**⚙ Mechanism — delayed-reward contextual bandit.** Model the choice as a contextual bandit: featurize each candidate change, and a policy like `LinUCB` picks *adopt* or *defer*. The convenient part for a deployed loop is that LinUCB's whole state is two running sums — a matrix and a vector. Because they're sums, folding a reward in weeks late lands in exactly the same place as if it had arrived on time; order doesn't matter. So you stash the context and the arm you chose at adoption, and *replay* the update when the verdict resolves. Map the categorical verdict to a bounded reward — helped positive, regressed negative *even if you auto-reverted* (the decision was still wrong) — subtract a clipped penalty for any guardrail you dented, and skip the update entirely when the verdict was insufficient evidence. Keep the reward bounded and the prior strong, or a single noisy outcome will swing a policy you've barely begun to train.

*Public data — learning to choose:*

- **RecoGym** — a recommender simulator with exact logged probabilities; clean off-policy evaluation, permissively licensed.
- **Yahoo front-page logs** — the classic bandit dataset with true random-exploration logging.
- **OpenML → bandit** — classification tasks reduced to bandit problems; reproducible, ground-truth known.

## Fail closed on an ungated floor

Here's an uncomfortable truth about most agent platforms: the thing running your agent's commands does so with full permissions and no per-action approval. Nothing underneath is going to stop a runaway loop.

Which means safety can't be inherited from the substrate. It has to live in *your* controller, and it has to **fail closed**: a kill switch checked before anything happens, an allowlist of exactly what a change may touch, a reversibility precondition, rate limits, and an audit trail of every action.

And one rule that sounds obvious and is easy to get wrong — **the safety gate must never be able to weaken itself.** A self-modifying system whose safety checks are also freely self-modifiable has no safety checks. Make the gate the one thing the loop can't autonomously touch.

## Changing the weights, safely

Everything above works on an agent's *files* — instructions, routines, thresholds. The deeper frontier is changing the model's own parameters, and doing that autonomously is genuinely frightening, because one weight edit can silently wreck everything.

There's a lovely idea from the personalization literature that turns out to be the answer. If you store each person's knowledge as small, local, isolated edits to the model — reversible by simply dropping them, unable to touch anyone else's, provably unable to degrade the base — then the properties you wanted for *personalization* are exactly the properties you need for *safe self-modification*: reversible, isolated, non-degrading, by construction.

The safest parametric change surface is one where "undo" and "can't hurt anyone else" aren't things you monitor — they're guaranteed by how the change is stored. That's the direction the parametric loop should go.

**⚙ Mechanism — hash-keyed memory edits.** Graft a small key–value memory into a couple of the model's layers. A fact's key hashes to a handful of deterministic slots; writing the fact is an override on those slots. Serving is `save → override → forward → restore`: apply a person's overrides, run inference, then put the original rows back — well under a millisecond. Reversibility is dropping the override map. Isolation is that two people's facts hash to disjoint slots, so one person's edits simply aren't present when another queries. Non-degradation follows because the base weights are untouched between calls. Pair it with a single shared adapter — one low-rank `LoRA` — that carries reasoning skill but memorizes no individual's facts.

*Public data — personalize & isolate:*

- **LaMP · LongMemEval** — per-user personalization and long-term recall.
- **PerLTQA · CIMemories** — isolated per-user memory, and the utility-versus-leakage trade-off.
- **Federated corpora + canary tests** — per-user partitions with inserted secrets, to prove one person's data can't leak into another's answers.

## The machinery is the easy half

If you build all of this, you'll have something that looks impressive: a controller, a scoreboard, safety gates, a policy that learns. Here's the thing nobody tells you — that's the easy half.

The machinery is buildable in a few weeks. The real question is whether the outcomes actually move — whether, six weeks in, the things people complained about happen *less*. That takes patience, honest measurement, and the discipline to say "not yet proven" about your own system.

> An agent that can measure whether it's improving is worth more than one that merely claims to be.

Build the ruler first. Then let it tell you the truth.

---

### If you're building one

1. Wire the outcome edge before anything else. If you can't measure whether a change helped, you're not closing a loop.
2. Optimize a real-world signal, never the applause. Keep it independent, and off the dial.
3. Earn autonomy through reversibility and measurement. Auto-adopt only what you can undo.
4. Always capture a before-state. Auto-revert the moment a signal regresses.
5. Feed outcomes back into the choosing, so the loop learns to pick.
6. Put safety in your own code and make it fail closed — and never let it edit itself.
7. Prefer "insufficient evidence" to a confident wrong answer.
8. Build the ruler before you claim you've grown.

---

*These are field notes from building Judith — a deployed personal assistant — into a system that improves itself, safely. The full formatted version lives at [saikrishnarallabandi.github.io/judith](https://saikrishnarallabandi.github.io/judith/posts/closing-the-loop-rsi.html).*
