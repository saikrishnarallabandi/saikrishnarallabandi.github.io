# Closing the Loop — Building an RSI Agent

*The reflect–propose–apply loop is easy to build and hard to close. Notes on wiring the edge that turns it from a workflow into a system that improves — and why the machinery is the easy half.*

---

A self-improvement loop is easy to describe. Keep a memory of what happened. Reflect on it. Propose a change to your own behavior. Apply it. Reflect, propose, apply — a sound design, and the one most self-improving agents are built on.

The hard part isn't any of those steps. It's the edge that turns the sequence into a *loop*: the one that feeds back whether the change actually helped, so the next round can be better than the last. For a deployed assistant that edge is genuinely difficult, because — unlike a model training against a benchmark — it has no test to check itself against.

These are notes on wiring that edge, and the two that travel with it: a safe way to adopt a change on its own, and a way to undo one that made things worse. Together they're what separate a loop that improves from a workflow that merely edits itself.

## Three edges we didn't have

When we looked hard at our own loop, it was really a workflow: it reflected, proposed, applied — and never got better at it. Three edges were missing, the three that turn *changing* into *improving*.

- **Outcome attribution.** Did the change kill the problem it was born to fix — in the world, not in the model's own opinion?
- **A way to adopt on its own.** Or the loop only ever moves as fast as a human says yes.
- **A way to undo.** A remembered before, and an automatic hand to pull the change back the moment a number turns.

Missing all three, as we were, you don't have a loop. You have an agent editing itself and hoping.

## The measurement problem

The first edge is the hardest to build. The well-known self-improvement methods — the ones that learn from their own attempts — lean on a cheap oracle to tell them whether an attempt was any good: a unit test, a gold label, a benchmark score. A deployed assistant has none of those. The question we cared about wasn't "does the model think this is better," but "did the thing the person kept complaining about stop happening."

So we bind each change to the complaint that caused it. When a change is born because someone keeps correcting the same mistake, the test is almost embarrassingly simple: did the correction stop coming back?

Which meant first learning to *hear* the friction — turning a stream of messages into named signals: corrections, frustrations, wishes, the same request asked a third time. A small model reading each message does this well enough.

*Public data — the signal & its recurrence:*

- **WildChat** — real assistant conversations to run a distiller over.
- **WildFeedback** — in-conversation (dis)satisfaction mined from those chats; the closest label scaffold.
- **USS · EmoWOZ · SAIF** — dialogues labeled with satisfaction, and real human–AI correction pairs, for training the signal detector.
- **MSC · Conversation Chronicles · LoCoMo** — same-user-over-time corpora, to measure recurrence before versus after.

*No public set gives you the real thing — a live deployment with labeled friction and a controlled change. That gap is exactly why the deployment matters.*

> Optimize the applause and you build a crowd-pleaser. Optimize the outcome and you build an agent that helps.

It's also the only guard we have against the oldest trap in optimization — **Goodhart's law.** The moment the reward becomes "the judge liked it" or "we shipped a lot of changes," a system learns to please the judge and pad the count. So the thing we actually optimize is kept honest: an *independent* signal of real behavior, one the agent never grades, held to the side as a verdict rather than handed over as a dial.

The real world also starves you of data. One person throws off a handful of any single friction, not a thousand — so a greedy rule ("it dropped by half, ship it") crowns noise as triumph. We test conservatively, and when the evidence hasn't arrived, we say so and wait. A false *"it helped"* is the expensive lie: it teaches the loop the wrong lesson, and lessons compound.

**⚙ Mechanism — the attribution test.** Count how often the friction recurred in a window before the change and an equal window after. Under the null of no effect, the after-count follows a `Binomial(before + after, ½)`; a one-sided lower-tail probability under your significance level is what earns a *helped*. A neat consequence: if a complaint simply stops — zero events after — you need a handful of instances *before* for that zero to be significant at all, a built-in guard against declaring victory on one vanished occurrence (the "rule of three"). Because friction can fall for reasons unrelated to your change, run it as a **difference-in-differences**: compare the target signal's drop against the drop in *all other* friction over the same window, and credit the change only if it beats that background. When even a perfect result couldn't clear significance, return `insufficient_evidence` and widen the window rather than guess.

The first time this ran over our own history it embarrassed us, usefully. A recurring nag had dropped by roughly two-thirds after a change we were rather proud of — but every other kind of friction had fallen about as much that week; the person was simply busy elsewhere. The honest verdict was *no effect*, and it was right. A cruder rule would have handed us a trophy.

## One rater is not enough

When the human signal is too thin to train on, we thicken it: a model judges quality and stands in for the missing human. But "auto-rater" hides a lie of the singular. There isn't one judge; there's a bench of them, each asked a different question, each needing a different temperament — and we found that getting each one's *nerve* right mattered more than which model sat in the chair.

**The usefulness judge** asks: did this help? The most subjective seat, and the hardest, because helpfulness has grades, not a switch. It wants a fine scale — a good/bad judge ties on everything and decays into a coin toss. Better than scoring one answer in a vacuum is asking it which of two is better; judges, like people, agree far more on the comparison than the number, and enough comparisons give a ranking — a Bradley–Terry order — steadier than any single grade. It's a reward, so it has to be calibrated hard against real preference, and watched for vanity: a judge left alone will flatter its own kind.

**The quality judge** asks: is this good work — a report, a plan, a piece of code? A more objective seat, because it can be handed explicit criteria: is the code correct, is the analysis sound, did it answer the question asked. Here the nuance lives in the rubric, not the scale; the sharper the criteria, the closer the judge sits to an expert.

**The faithfulness judge** asks: is this true, or invented? This one behaves like a strict clerk, not a critic — it doesn't grade prose, it catches fabrication, and it stays near-binary, flagging when it isn't sure.

**The safety judge** asks: does this spill someone's private life, or step over a line? A different animal — not a reward but a *veto*. It stays nervous, preferring a false alarm to a miss, and it never becomes a score the loop can bargain against. A guardrail you can optimize is not a guardrail.

> Grade what you want to improve. Gate what you can't allow.

The pattern under the whole bench is to match a judge's answer to the decision it feeds: a reward wants a fine, calibrated scale or a comparison; a veto wants a hard edge. And the author is never the only judge of its own work — a model grading itself drifts, slowly, toward applause.

*Public data — calibrating the judges:*

- **MT-Bench (human)** — pairwise human votes; the standard "does my judge agree with people" check.
- **HelpSteer2 / 3 · PRISM** — human quality ratings and per-turn scores; the best public stand-ins for a real reward.
- **RewardBench · LLMBar** — meta-benchmarks that stress a judge for bias and gameability.
- **ai4privacy** — labeled PII spans, for the safety judge's leak detection.

## Why the loop stalled

The first thing we learned about autonomy, we learned by not having enough of it. Our loop had quietly stalled — not for lack of problems, but because its one way to adopt anything was to wait for a human to reply *yes*, and the replies mostly didn't come. Attention is the resource that always runs dry.

The cure isn't "let it do anything." It's to make autonomy something a change earns. We sort every change by two questions: can we measure it, and can we take it back? The ones that answer yes to both — a tightened instruction, a nudged threshold, a repaired routine — the agent adopts alone, *because* it can watch the result and undo its own mistake. The ones that reach outside the sandbox go to a human. The ones that can't be walked back — deletions, credentials, anything final — always wait for a yes.

For the low-risk changes that get proposed and then meet silence, we gave silence a plan: rather than let them rot in a queue, they fall through to the measured, reversible path. Autonomy earned by measurement and reversibility, and a human kept where they matter and nowhere they don't.

Underneath all of it is the part that lays a change down and can lift it back off — reversible, declarative operations behind a safety check, wrapped in a verify-and-rollback window.

**⚙ Mechanism — a reversible change.** Represent an auto-adoptable change as a small, whitelisted vocabulary of declarative operations — `set a value at a key-path`, `replace an exact string`, `adjust a threshold` — never free-form code. Each op is checked against a path allowlist (it may only touch the agent's own low-risk files) and, for anything generated, an `AST` pass that rejects imports, `subprocess`/`exec`/`eval`, and access to dunder internals. Before applying, snapshot the exact prior bytes as a *pre-image*. Adopt, then open the verify window; if the target metric regresses, restore the pre-image automatically. Undo is a file copy, not a heuristic — which is what makes "auto-adopt" safe to say out loud.

That shape — spot a failure, apply a scoped fix, prove it worked, else roll it back — is the exact shape of program-repair benchmarks, which is where you can harden it on public ground:

*Public data — apply, verify, undo:*

- **BugSwarm · Defects4J** — reproducible failing-then-fixed pairs with an automatic pass/fail gate; the gold standard for "did the fix actually work."
- **IDoFT** — real intermittent failures with their fixes; the closest analog to something that flakes for no code change.

*There's no public corpus of scheduled-job failures paired with their fixes — that intersection is novel ground.*

## Teaching it to choose

An agent that applies changes is automation. An agent that gets *better at choosing which changes to make* is the recursive part — the self-improvement finally improving itself.

We wire that by feeding the verdict back as a reward to whatever does the choosing; in time it learns which kinds of change tend to pay, and reaches for them. The reward comes late — weeks after the fact — but late feedback is still feedback. We remember what was chosen, and settle the account when the verdict lands.

**⚙ Mechanism — delayed-reward contextual bandit.** Model the choice as a contextual bandit: featurize each candidate change, and a policy like `LinUCB` picks *adopt* or *defer*. The convenient part for a deployed loop is that LinUCB's whole state is two running sums — a matrix and a vector. Because they're sums, folding a reward in weeks late lands in exactly the same place as if it had arrived on time; order doesn't matter. So you stash the context and the arm you chose at adoption, and *replay* the update when the verdict resolves. Map the categorical verdict to a bounded reward — helped positive, regressed negative *even if you auto-reverted* (the decision was still wrong) — subtract a clipped penalty for any guardrail you dented, and skip the update entirely when the verdict was insufficient evidence. Keep the reward bounded and the prior strong, or a single noisy outcome will swing a policy you've barely begun to train.

*Public data — learning to choose:*

- **RecoGym** — a recommender simulator with exact logged probabilities; clean off-policy evaluation, permissively licensed.
- **Yahoo front-page logs** — the classic bandit dataset with true random-exploration logging.
- **OpenML → bandit** — classification tasks reduced to bandit problems; reproducible, ground-truth known.

## Safety has to live in your own code

An uncomfortable fact about the ground most agents stand on: the thing that runs their commands runs them with full permissions and nobody asking. Nothing beneath the agent will stop a runaway.

We hit a small, telling version of this. We'd told the agent, in plain language, to treat a certain bookkeeping failure as non-fatal — keep going, it doesn't matter. It kept failing runs anyway, because the platform decides a run failed by a tool's *exit code*, not by the agent's good intentions. The fix had to live in code: make the tool exit clean. Prose is not a safety mechanism.

So safety can't be borrowed from the floor. In our system it lives in the controller and **fails closed**: a kill switch checked before a finger moves, an allowlist of exactly what a change may touch, a reversibility clause, a rate limit, a ledger of every act.

And one line we hold to: the gate is the one thing the loop can't edit. A safety check that is freely self-editable is not a safety check.

## Changing the weights, safely

Everything so far edits an agent's *files* — its instructions, its routines, its dials. The real frontier is editing the model's own weights, and we haven't crossed it yet: doing that unattended is properly frightening, because a single bad edit can quietly break everything, for everyone.

But there's a beautiful idea sitting in the personalization literature that looks like the right shape. Store each person's knowledge as small, local, isolated edits to the model — undone by dropping them, unable to reach anyone else, unable to dent the base — and the properties you'd want for *personalization* turn out to be, almost word for word, the properties you'd need for *safe self-modification*: reversible, isolated, non-degrading, by construction.

The safest place to change a mind is one where "undo" and "harms no one else" aren't things you watch for — they're things the storage guarantees. That's where we think the parametric loop should go, once we build it.

**⚙ Mechanism — hash-keyed memory edits.** Graft a small key–value memory into a couple of the model's layers. A fact's key hashes to a handful of deterministic slots; writing the fact is an override on those slots. Serving is `save → override → forward → restore`: apply a person's overrides, run inference, then put the original rows back — well under a millisecond. Reversibility is dropping the override map. Isolation is that two people's facts hash to disjoint slots, so one person's edits simply aren't present when another queries. Non-degradation follows because the base weights are untouched between calls. Pair it with a single shared adapter — one low-rank `LoRA` — that carries reasoning skill but memorizes no individual's facts.

*Public data — personalize & isolate:*

- **LaMP · LongMemEval** — per-user personalization and long-term recall.
- **PerLTQA · CIMemories** — isolated per-user memory, and the utility-versus-leakage trade-off.
- **Federated corpora + canary tests** — per-user partitions with inserted secrets, to prove one person's data can't leak into another's answers.

## The machinery is the easy half

Build all of this and you have something that photographs well: a controller, a scoreboard, a bank of gates, a policy that learns. What nobody tells you at the demo is that this was the easy half.

The machinery took us a few weeks. The question underneath it — did the outcomes actually move, do the old complaints come less often now — is a season of patience, honest measurement, and the discipline to say "not yet proven" about your own work. We're still in that season.

> An agent that can measure whether it's improving is worth more than one that only says it is.

We built the ruler first, and we're letting it tell us the truth — even when the truth is no.

## What we don't know yet

A few things we genuinely can't answer.

- **Does any of it move the outcomes?** The machinery runs; whether the complaints actually come less often is a verdict that resolves over weeks, and as we write this it hasn't yet.
- **Is the judge good enough?** We checked our quality judge against public human ratings and it agreed with people only weakly. That's uncomfortable to write down — and it's exactly why we don't let the judge be the thing we optimize.
- **Did the obvious fix work?** One of the most common frictions we see is simply being asked "any update?" We tried the obvious answer — push updates before they're requested — and our own test declined to call it a win: too few instances, too confounded to say. We still don't know.
- **How far should autonomy reach?** Everything the loop can touch on its own is deliberately low-stakes; the higher-leverage changes stay gated. Whether that line sits in the right place, we'll only learn by moving it, carefully.

The edge that closes the loop is the same one that's hardest to build: an honest measurement of whether the last change helped, fed back into the next. Wire it, and reflect–propose–apply becomes a system that improves. Leave it out, and you have a system that changes — which is not the same thing.

---

### What we'd tell ourselves, starting over

1. Wire the outcome edge first. Everything else is easy to build and easy to fool yourself with until you can measure whether a change helped.
2. Optimize a real outcome, not the applause. Keep it independent, keep it off the dial.
3. Let autonomy be earned — measurable and reversible, or it waits for a human.
4. Remember every before. Roll back the moment a number turns.
5. Feed outcomes into the choosing, so the loop learns taste.
6. Keep safety in your own code, make it fail closed, and never let it edit itself.
7. Say "insufficient evidence" out loud. It's cheaper than a confident lie.
8. Build the ruler before you claim you've grown.

---

*These are field notes from building Judith — a deployed personal assistant — into a system that improves itself, safely. The full formatted version lives at [saikrishnarallabandi.github.io/judith](https://saikrishnarallabandi.github.io/judith/posts/closing-the-loop-rsi.html).*
