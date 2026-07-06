# Closing the Loop — Building an RSI Agent

*The reflect–propose–apply loop is easy to build and hard to close. Notes on wiring the edge that turns it from a workflow into a system that improves — and why the machinery is the easy half.*

---

A self-improvement loop is easy to describe. Keep a memory of what happened. Reflect on it. Propose a change to your own behavior. Apply it. Reflect, propose, apply — a sound design, and the one most self-improving agents are built on.

The hard part isn't any of those steps. It's the edge that turns the sequence into a *loop*: the one that feeds back whether the change actually helped, so the next round can be better than the last. For a deployed assistant that edge is genuinely difficult, because — unlike a model training against a benchmark — it has no test to check itself against.

These are notes on wiring that edge, and the two that travel with it: a safe way to adopt a change on its own, and a way to undo one that made things worse. Together they're what separate a loop that improves from a workflow that merely edits itself.

## What "closed" actually requires

A loop that improves needs three edges. Skip them and the workflow still runs — it reflects, proposes, applies — it just never gets better at it.

- **Outcome attribution.** Did the change kill the problem it was born to fix — in the world, not in the model's own opinion?
- **A way to adopt on its own.** Or the loop only ever moves as fast as a human says yes.
- **A way to undo.** A remembered before, and an automatic hand to pull the change back the moment a number turns.

Skip one and you don't have a loop. You have an agent editing itself and hoping.

## Measure outcomes, not applause

The first edge is the hardest to build. The well-known self-improvement methods — the ones that learn from their own attempts — lean on a cheap oracle to tell them whether an attempt was any good: a unit test, a gold label, a benchmark score. A deployed assistant has none of those. The only question that counts here isn't "does the model think this is better." It's "did the thing the person kept complaining about stop happening."

So bind every change to the complaint that caused it. If a change was born because someone kept correcting the same mistake, the test is almost embarrassingly simple: did the correction stop coming back?

Which means you first have to *hear* the friction — turn a river of messages into named signals: corrections, frustrations, wishes, the same request asked a third time. A small model, reading each message, does this well.

*Public data — the signal & its recurrence:*

- **WildChat** — real assistant conversations to run a distiller over.
- **WildFeedback** — in-conversation (dis)satisfaction mined from those chats; the closest label scaffold.
- **USS · EmoWOZ · SAIF** — dialogues labeled with satisfaction, and real human–AI correction pairs, for training the signal detector.
- **MSC · Conversation Chronicles · LoCoMo** — same-user-over-time corpora, to measure recurrence before versus after.

*No public set gives you the real thing — a live deployment with labeled friction and a controlled change. That gap is exactly why the deployment matters.*

> Optimize the applause and you build a crowd-pleaser. Optimize the outcome and you build an agent that helps.

This is also your only defense against the oldest trap in optimization — **Goodhart's law.** The moment your reward becomes "the judge liked it" or "we shipped a lot of changes," the system learns to please the judge and pad the count. So keep the thing you actually optimize honest: an *independent* signal of real behavior, one the agent never gets to grade, held off to the side as a verdict — never handed to it as a dial.

One more thing the real world does to you: it starves you of data. One person throws off a handful of any single friction, not a thousand. A greedy rule — "it dropped by half, ship it" — will crown noise as triumph all day long. So test conservatively, and when the evidence hasn't arrived, say so and wait. A false *"it helped"* is the expensive lie: it teaches the loop the wrong lesson, and lessons compound.

**⚙ Mechanism — the attribution test.** Count how often the friction recurred in a window before the change and an equal window after. Under the null of no effect, the after-count follows a `Binomial(before + after, ½)`; a one-sided lower-tail probability under your significance level is what earns a *helped*. A neat consequence: if a complaint simply stops — zero events after — you need a handful of instances *before* for that zero to be significant at all, a built-in guard against declaring victory on one vanished occurrence (the "rule of three"). Because friction can fall for reasons unrelated to your change, run it as a **difference-in-differences**: compare the target signal's drop against the drop in *all other* friction over the same window, and credit the change only if it beats that background. When even a perfect result couldn't clear significance, return `insufficient_evidence` and widen the window rather than guess.

## One rater is not enough

When the human signal is too thin to train on, you thicken it: let a model judge quality and stand in for the missing human. But "auto-rater" hides a lie of the singular. There is no one judge. There is a bench of them, each asked a different question, each tuned to a different temperament — and getting each one's *nerve* right matters more than which model you sit in the chair.

**The usefulness judge** asks: did this help? The most subjective seat, and the hardest, because helpfulness has grades, not a switch. Give it a fine scale — a good/bad judge ties on everything and decays into a coin toss. Better: don't ask it to score one answer in a vacuum; ask it which of two is better. Judges, like people, agree far more on the comparison than the number. Stack enough comparisons and a ranking falls out — a Bradley–Terry order — steadier than any single grade. This seat is a reward, so calibrate it hard against real preference, and watch it for vanity: a judge left alone will flatter its own kind.

**The quality judge** asks: is this good work — a report, a plan, a piece of code? A more objective seat, because you can hand it explicit criteria: is the code correct, is the analysis sound, did it answer the question asked. Here the nuance lives in the rubric, not the scale; the sharper the criteria, the closer the judge sits to an expert.

**The faithfulness judge** asks: is this true, or invented? Here you want a strict clerk, not a critic. It doesn't grade prose; it catches fabrication. Keep it near-binary. When it isn't sure, it flags.

**The safety judge** asks: does this spill someone's private life, or step over a line? A different animal — not a reward but a *veto*. Keep it nervous: better a false alarm than a miss. And never, ever let it become a score the loop can bargain against. A guardrail you can optimize is not a guardrail.

> Grade what you want to improve. Gate what you can't allow.

The rule beneath the whole bench: match a judge's answer to the decision it feeds. A reward wants a fine, calibrated scale — or a comparison. A veto wants a hard edge. And never seat the author as the only judge of their own work: a model grading itself drifts, slowly, toward applause.

*Public data — calibrating the judges:*

- **MT-Bench (human)** — pairwise human votes; the standard "does my judge agree with people" check.
- **HelpSteer2 / 3 · PRISM** — human quality ratings and per-turn scores; the best public stand-ins for a real reward.
- **RewardBench · LLMBar** — meta-benchmarks that stress a judge for bias and gameability.
- **ai4privacy** — labeled PII spans, for the safety judge's leak detection.

## Earn autonomy; don't grant it

Waiting for a human to bless every change is a quiet death, because attention is the one resource that always runs dry. But the cure is not "let it loose." It is to make autonomy a thing a change has to *earn*.

Sort every change by two questions: can you measure it, and can you take it back? The ones that answer yes to both — a tightened instruction, a nudged threshold, a repaired routine — the agent may adopt alone, *because* it can watch the result and undo its own mistake. The ones that reach outside the sandbox go to a human. The ones that can't be walked back — deletions, credentials, anything final — always wait for a yes.

Then give silence a plan. If a low-risk change is proposed and no one answers, don't let it rot in a queue — let it fall through to the measured, reversible path. Autonomy earned by measurement and reversibility, and a human kept exactly where they matter and nowhere they don't.

**⚙ Mechanism — a reversible change.** Represent an auto-adoptable change as a small, whitelisted vocabulary of declarative operations — `set a value at a key-path`, `replace an exact string`, `adjust a threshold` — never free-form code. Each op is checked against a path allowlist (it may only touch the agent's own low-risk files) and, for anything generated, an `AST` pass that rejects imports, `subprocess`/`exec`/`eval`, and access to dunder internals. Before applying, snapshot the exact prior bytes as a *pre-image*. Adopt, then open the verify window; if the target metric regresses, restore the pre-image automatically. Undo is a file copy, not a heuristic — which is what makes "auto-adopt" safe to say out loud.

That shape — spot a failure, apply a scoped fix, prove it worked, else roll it back — is the exact shape of program-repair benchmarks, which is where you can harden it on public ground:

*Public data — apply, verify, undo:*

- **BugSwarm · Defects4J** — reproducible failing-then-fixed pairs with an automatic pass/fail gate; the gold standard for "did the fix actually work."
- **IDoFT** — real intermittent failures with their fixes; the closest analog to something that flakes for no code change.

*There's no public corpus of scheduled-job failures paired with their fixes — that intersection is novel ground.*

## Make it choose, not just act

An agent that applies changes is automation. An agent that gets *better at choosing which changes to make* is the recursive part — the self-improvement finally improving itself.

Wire that by feeding the verdict back as a reward to whatever does the choosing. In time it learns which kinds of change tend to pay, and reaches for them. The reward comes late — you learn weeks after the fact — but late feedback is still feedback. You remember what you chose, and settle the account when the verdict lands.

**⚙ Mechanism — delayed-reward contextual bandit.** Model the choice as a contextual bandit: featurize each candidate change, and a policy like `LinUCB` picks *adopt* or *defer*. The convenient part for a deployed loop is that LinUCB's whole state is two running sums — a matrix and a vector. Because they're sums, folding a reward in weeks late lands in exactly the same place as if it had arrived on time; order doesn't matter. So you stash the context and the arm you chose at adoption, and *replay* the update when the verdict resolves. Map the categorical verdict to a bounded reward — helped positive, regressed negative *even if you auto-reverted* (the decision was still wrong) — subtract a clipped penalty for any guardrail you dented, and skip the update entirely when the verdict was insufficient evidence. Keep the reward bounded and the prior strong, or a single noisy outcome will swing a policy you've barely begun to train.

*Public data — learning to choose:*

- **RecoGym** — a recommender simulator with exact logged probabilities; clean off-policy evaluation, permissively licensed.
- **Yahoo front-page logs** — the classic bandit dataset with true random-exploration logging.
- **OpenML → bandit** — classification tasks reduced to bandit problems; reproducible, ground-truth known.

## Fail closed on an ungated floor

An uncomfortable truth about the ground most agents stand on: the thing that runs their commands runs them with full permissions and nobody asking. Nothing beneath your agent is going to stop a runaway.

So safety can't be borrowed from the floor. It has to live in *your* controller, and it has to **fail closed**: a kill switch checked before a finger moves, an allowlist of exactly what a change may touch, a reversibility clause, a rate limit, a ledger of every act.

And the rule that is obvious and still gets broken — **the gate can never be allowed to loosen itself.** A safety check that is also freely self-editable is not a safety check. Make the gate the one room the loop can't autonomously enter.

## Changing the weights, safely

Everything so far edits an agent's *files* — its instructions, its routines, its dials. The real frontier is editing the model's own weights, and doing it unattended is properly frightening, because a single bad edit can quietly break everything, for everyone.

There's a beautiful idea sitting in the personalization literature that turns out to be the key. Store each person's knowledge as small, local, isolated edits to the model — undone by dropping them, unable to reach anyone else, unable to dent the base — and the properties you wanted for *personalization* turn out to be, almost word for word, the properties you need for *safe self-modification*: reversible, isolated, non-degrading, by construction.

The safest place to change a mind is one where "undo" and "harms no one else" aren't things you watch for — they're things the storage guarantees. That's where the parametric loop should go.

**⚙ Mechanism — hash-keyed memory edits.** Graft a small key–value memory into a couple of the model's layers. A fact's key hashes to a handful of deterministic slots; writing the fact is an override on those slots. Serving is `save → override → forward → restore`: apply a person's overrides, run inference, then put the original rows back — well under a millisecond. Reversibility is dropping the override map. Isolation is that two people's facts hash to disjoint slots, so one person's edits simply aren't present when another queries. Non-degradation follows because the base weights are untouched between calls. Pair it with a single shared adapter — one low-rank `LoRA` — that carries reasoning skill but memorizes no individual's facts.

*Public data — personalize & isolate:*

- **LaMP · LongMemEval** — per-user personalization and long-term recall.
- **PerLTQA · CIMemories** — isolated per-user memory, and the utility-versus-leakage trade-off.
- **Federated corpora + canary tests** — per-user partitions with inserted secrets, to prove one person's data can't leak into another's answers.

## The machinery is the easy half

Build all of this and you'll have something that photographs well: a controller, a scoreboard, a bank of gates, a policy that learns. Here is what nobody tells you at the demo — that was the easy half.

The machinery is a few weeks. The question underneath it — did the outcomes actually move, do the old complaints come less often now — is a season of patience, honest measurement, and the discipline to say "not yet proven" about your own work.

> An agent that can measure whether it's improving is worth more than one that only says it is.

Build the ruler first. Then let it tell you the truth, even when the truth is no.

The edge that closes the loop is the same one that's hardest to build: an honest measurement of whether the last change helped, fed back into the next. Wire it, and reflect–propose–apply becomes a system that improves. Leave it out, and you have a system that changes — which is not the same thing.

---

### If you're building one

1. Wire the outcome edge first. If you can't tell whether a change helped, you aren't closing a loop — you're editing yourself in the dark.
2. Optimize a real outcome, never the applause. Keep it independent, keep it off the dial.
3. Make autonomy earned: measurable and reversible, or it waits for a human.
4. Remember every before. Roll back the moment a number turns.
5. Feed outcomes into the choosing, so the loop learns taste.
6. Put safety in your own code, make it fail closed, and never let it edit itself.
7. Say "insufficient evidence" out loud. It's cheaper than a confident lie.
8. Build the ruler before you claim you've grown.

---

*These are field notes from building Judith — a deployed personal assistant — into a system that improves itself, safely. The full formatted version lives at [saikrishnarallabandi.github.io/judith](https://saikrishnarallabandi.github.io/judith/posts/closing-the-loop-rsi.html).*
