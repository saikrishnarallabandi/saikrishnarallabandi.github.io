# A Photo of Jensen, and the Trouble with Closing the Loop

*Field notes · recursive self-improvement (RSI) · a failure report*
*On Rallabandi Radar*

---

Last night my assistant made a small, ordinary mistake, and then did something that should have fixed it and didn't. The gap between those two events is the most honest thing I can tell you about building a self-improving agent.

In a group chat I dropped in a screenshot:

![Patrick Moorhead's post: "I told you our roadmap is intact." Patrick Moorhead on the left and Jensen Huang on the right, onstage.](assets/jensen-roadmap-meme.jpg)

It's a meme — the punchline to a week of noise. A semi-analysis piece claimed Nvidia's CPO / Kyber roadmap had slipped; Nvidia refuted it with that exact line; Patrick Moorhead turned the refutation into a joke, Jensen next to him onstage.

Judith — the assistant — read the image and produced a **market note**. Bullish for the AMD narrative, mildly bearish for the "Nvidia killed everyone" case, still wants MI350/MI400 traction. Competent. Completely beside the point. I hadn't asked for a trade; I'd shared a joke. When I pushed on who was in the picture, she got *that* wrong too — confidently placed **Lisa Su and an AMD frame** into an image that contains neither, before correcting to Patrick and Jensen.

Then she did the thing that's supposed to matter. She wrote herself a note — an actual file, titled *"Social Meme RSI Loop Miss"* — diagnosing exactly what went wrong: *collapsed a social/meme cue into financial analysis, missed the meta layer, misidentified the people.* She even proposed the fix and sketched an eval for it.

And that note changed nothing. The next meme would get the same treatment. The loop **observed** its own failure, **mined** it correctly, wrote a small essay about it — and did not improve. That is not a bug in this particular agent. It is the *default* outcome, and the reasons why are the subject of this post.

## What answering this actually requires

Before the loop, look at the task. "React to this screenshot" is not one capability; it's a **pipeline**, and a wrong answer can come from a failure at any stage:

| Subtask | What it needs | How Judith did | The honest fix |
|---|---|---|---|
| **OCR / scene-text** | read *"I told you our roadmap is intact"* + the @PatrickMoorhead byline | fine | data — TextVQA, DocVQA, ST-VQA |
| **Person / face ID** | Patrick Moorhead (L), Jensen Huang (R) | **failed** — hallucinated Lisa Su / AMD | a **tool**, not data — reverse-image / vision API. You can't finetune coverage of every public figure, and face-ID datasets are ethically fraught and often retracted |
| **Visual grounding** | two people on a stage; it's a screenshot of an X post | partial | data — VQAv2, [POPE](https://huggingface.co/datasets/lmms-lab/POPE) |
| **Intent / register** | is this a *joke* or a *trade request*? | **failed** — reflex market read | data — [SILICONE](https://huggingface.co/datasets/eusip/silicone), Switchboard dialogue acts, MET-Meme (intent), MemeCap |
| **Recent-events knowledge** | the Kario → "roadmap intact" → meme chain | **failed** — didn't know, didn't retrieve | **retrieval**, not training — it's past any cutoff — OK-VQA, [FEVER](https://huggingface.co/datasets/fever/fever) |
| **Social / pragmatic** | inside joke; the sharer wants recognition, and is testing the loop | **failed** | reasoning — hard to dataset |
| **Response-type selection** | brief ack vs analysis vs self-observation | **failed** — over-produced | policy / register |

At least four of seven stages failed, and **each needs a different intervention** — a tool for perception, data for intent, retrieval for recency, reasoning for pragmatics. Hold onto that: it means that even a *perfect* signal that "the answer was bad" leaves the loop with a second problem — *which stage was bad?* The reward is one scalar smeared across a seven-stage pipeline. Credit assignment *within* a single response, before you even get to credit assignment across the conversation.

## The loop everyone draws

Every RSI system has the same diagram: **observe an outcome → rate it → diagnose → propose a fix → validate → curate it back into behavior.** Six boxes, six arrows, back to the start. It's on my whiteboard and probably yours, and the mechanics of it are, by now, a solved engineering problem — reflect, propose, apply, gate, revert. I've built all of that.

The mechanics are not where loops fail. As Jason Wei argues in [*Verifier's Law*](https://www.jasonwei.net/blog/asymmetry-of-verification-and-verifiers-law), and Song et al. formalize as the [generation–verification gap](https://arxiv.org/pdf/2412.02674), self-improvement is bottlenecked on **verification** — on cheaply and correctly knowing whether an output is good. Lilian Weng makes the same point for auto-research and coding agents in [*Harness Engineering for Self-Improvement*](https://lilianweng.github.io/posts/2026-07-04-harness/): the ceiling is the evaluator. Where their work lives on *verifiable* tasks — code that compiles, math that checks, tests that pass — a deployed personal assistant has **no verifier to fall back on.** "Was that a good reply to a friend's meme" has no unit test. So the bottleneck they name for verifiable domains becomes, for a conversational agent, the *whole game* — and every arrow in that innocent diagram turns into a distinct measurement problem. Here they are, walked through the Jensen miss.

## Difficulty 1 — The rater is the crux

The naive instinct is to score the response in isolation: *was that a good answer?* You can't. Nothing in the message tells you whether it landed. The signal is in **what the conversation does next** — a real idea, and not mine: continuation-as-reward is developed by [Gooding & Grefenstette](https://arxiv.org/abs/2511.08394), and the older deployment-feedback line (Hancock et al.) uses "a human turn followed → label it good."

The reason this is a genuine upgrade is worth stating precisely: scoring a message alone asks a model for a **prior** — a guess. Reading the next few turns gives it **evidence** — it doesn't guess whether the market note was wanted, it *observes* me replying "you missed the point" and supplying the Kario chain. That's the difference between an opinion and an outcome.

But the continuation has a floor, and the floor is where most failures live: often the conversation gives you **nothing** — it just moves on. And **silence after a good answer is identical to silence after a bad one.** "Moved on" is not a pass and not a fail; from inside the chat it is undecidable. Liu, Zhang & Choi put the empirical version bluntly — implicit follow-up feedback is [useful for understanding users but *noisy* as a learning signal](https://arxiv.org/abs/2507.23158). A confidently wrong answer nobody challenges emits no signal at all.

So you build an auto-rater to read the continuation and grade it — and now you are in the single most-studied failure zone in this entire enterprise, and none of the news is good:

- The rater **inherits the base model's blind spots.** If it's the same family that made the error, its errors are *correlated* with the agent's — panels of judges [collapse to two effective votes](https://arxiv.org/pdf/2605.29800) because they agree for the same wrong reasons. A judge that shares the judged's prior certifies **consensus, not correctness.**
- Judges are **lenient and self-preferring** by default (the MT-Bench line). Our own calibration reproduced this exactly: the first rubric rated ~everything ≥ 2; 23 of 25 ignored messages were false positives.
- **Reliability is not validity** — a rater can be perfectly consistent and consistently wrong ([2606.19544](https://arxiv.org/pdf/2606.19544)). And to *know* your rater is valid you must calibrate it against real human judgment — the exact scarce signal you built the rater to avoid needing. The validation is circular.

Now the frontier's best answer to a *noisy discrete* score: Kwok, Finn, Pavone, Stoica & Mirhoseini's [**LLM-as-a-Verifier**](https://arxiv.org/abs/2607.05391) — don't take the argmax digit, take the **expectation over the score-token logits.** A continuous score, training-free, state-of-the-art on Terminal-Bench and SWE-Bench. We implemented it and ran the A/B it deserves — on a *deployed* signal, which their benchmark suite never touches — with real test-pass ground truth (nebius SWE-agent trajectories):

> Continuous edged discrete on separation (AUC **0.782 vs 0.759**) — but ΔAUC was **+0.024 with a bootstrap CI that includes zero.** Not a win at that sample. And the diagnostic told us *why*: the continuous score **diverged** from discrete on nearly every item (mean 0.47) and it *still* didn't separate better — because that divergence was **noise with respect to the outcome.**

The lesson, and it is the load-bearing sentence of this whole post: **a better scoring readout only helps in proportion to how *calibrated* the judge's uncertainty already is to the truth. It extracts more of the signal that is there; it cannot manufacture calibration where the ground truth is noise.** On patch-correctness the 35B's uncertainty is weakly calibrated, so continuous barely helps. On "will Sai reply," where the outcome is driven by mood, timing, and delivery failures the judge cannot see, there is nothing calibrated to extract, and no readout — discrete, continuous, or otherwise — can beat that ceiling.

> **Public data — hill-climb this segment.** Continuation-as-outcome: [SALT-NLP/SWE-chat](https://huggingface.co/datasets/SALT-NLP/SWE-chat) (real Claude Code sessions with commit-linked outcomes), [allenai/WildChat-1M](https://huggingface.co/datasets/allenai/WildChat-1M) and [lmsys/lmsys-chat-1m](https://huggingface.co/datasets/lmsys/lmsys-chat-1m) (real human–AI multi-turn), the **USS** user-satisfaction benchmark (turn-level satisfaction; a named benchmark, no single HF id). Rater validation: [allenai/reward-bench(-2)](https://huggingface.co/datasets/allenai/reward-bench), [nebius/SWE-agent-trajectories](https://huggingface.co/datasets/nebius/SWE-agent-trajectories) (test-pass ground truth — an *objective* anchor to catch a lenient judge).

## Difficulty 2 — Getting gold when the chat gives nothing

Say the rater flags a suspicion — *I think that was off* — but the chat stayed silent. Where does ground truth come from? Not the conversation: it isn't there, and it never was. You have to **leave the chat.** There are exactly three places, and the trick is routing the suspicion to the right one:

- **The world**, for anything checkable. The Jensen miss is mostly this — *who is in the image* and *what the news chain was* are facts. A reverse-image lookup, a vision call, a query for "Nvidia roadmap intact." No human, no chat signal; the gold is retrievable. Most factual and perceptual errors live here, and it's the path people underuse.
- **A stronger reference model**, for judgment calls reality can't settle ("was a market read the wrong register for a joke"). Better-calibrated than the model that erred. Silver, not gold.
- **The human**, rationed to the residue: unverifiable *and* high-stakes *and* high-suspicion. Everything else, log and let go.

Two traps. The **correlated-error trap**: if the agent "verifies" by re-examining with the same model that erred — especially the perception miss, where its own eyes are the weak link — it cheerfully re-confirms the mistake. The Blind-Spots literature's remedy is exactly this: separate signal from shared error with *independent* ground truth. And **triage is the whole game** — you cannot verify every turn and most don't deserve it.

> **Public data — hill-climb this segment.** Verify-against-world: [FEVER](https://huggingface.co/datasets/fever/fever) (claim → evidence), [pminervini/HaluEval](https://huggingface.co/datasets/pminervini/HaluEval) (asserted-unsupported-fact detection), and for the *image* claim specifically [POPE](https://huggingface.co/datasets/lmms-lab/POPE) and [MMHal-Bench](https://huggingface.co/datasets/Shengcao1006/MMHal-Bench) (is this claim about the picture true?). These target the face-ID and recency gaps directly.

## Difficulty 3 — A diagnosis is not an intervention

Suppose you paid for the gold and have a hypothesis. Judith had a *perfect* one, in writing, and it improved nothing — because knowing what broke is not the same as fixing it, and picking the wrong *kind* of fix is how you fool yourself. Route by the gap, which is where the pipeline from the top returns:

- **Knowledge gap** (the Kario chain) → a retrievable **memory**. Cheap; low-value, because news ages out.
- **Behavior / routing gap** (reflex market read) → a **rule or routing step**: classify intent before answering a shared image. The generalizable one.
- **Capability gap** (can't tell who's in a photo) → **no rule fixes this.** You cannot instruct a model into better perception. The honest fixes are a *tool* or "admit uncertainty when identity matters." Pretending a prompt cures a capability gap is the most common self-deception here.

And a gate that keeps the loop from rotting: **don't mint a permanent rule per mistake.** Rules bloat context, contradict each other, and cause **over-correction** — fix the meme case and now she under-reacts to a real market screenshot. One-off → a decaying memory; a recurring *class* → earn a rule; real *volume* → maybe weights. You climb that ladder on repetition, not on one bad night — and because the failure was spread across four pipeline stages, one rule was never going to close it.

> **Public data — hill-climb this segment.** Intent / social-layer routing: [SILICONE](https://huggingface.co/datasets/eusip/silicone) and [Switchboard](https://huggingface.co/datasets/swda) (dialogue acts), **MET-Meme** (has an explicit *intention* task; named benchmark), **MemeCap** (meme *interpretation*, not just detection; canonical repo is GitHub). Provenance flagged so you load the right thing.

## Difficulty 4 — An unvalidated fix is worse than none

This is the difficulty that makes the others dangerous instead of merely hard: a fix you didn't validate changes behavior in exactly the region you can't see. You will never watch the real market screenshot she now fumbles because of the meme rule.

So a change survives three gates before it touches live behavior: **held-out replay** (does it get the failure case right now?), a **regression set** (does it break cases it used to get right? — where over-correction dies), and **attribution** (does the failure class actually stop recurring?). Judith wrote the held-out eval for the meme case herself. It was never run. That distance — between a written eval and a *gated* one — is the distance between a lessons file and a learning system.

> **Public data — hill-climb this segment.** Held-out preference / over-correction checks: [reward-bench-2](https://huggingface.co/datasets/allenai/reward-bench-2), [allenai/preference-test-sets](https://huggingface.co/datasets/allenai/preference-test-sets), [Anthropic/hh-rlhf](https://huggingface.co/datasets/Anthropic/hh-rlhf), [openbmb/UltraFeedback](https://huggingface.co/datasets/openbmb/UltraFeedback) (fine-grained, so you can check the *targeted* axis improved without hurting others).

## Difficulty 5 — Curate-back: the stage where the loop actually dies

Which brings us back to the note. The note was the tombstone.

**Curate-back** — promoting a validated change into the agent's live, always-loaded behavior — is where nearly every deployed loop quietly fails. Not because it's conceptually hard, but because *writing a reflection feels like closing the loop*, and it isn't. This is the paradigm Reflexion popularized — verbalize a lesson, store it — and its unspoken failure mode: a perfect post-mortem in a `notes/` folder that no future turn reads is, behaviorally, identical to having learned nothing. The recent memory-systems survey names the same gap from the other side: agents are fine at *write* and *read* and neglect **manage** — [accumulation without curation is where systems fail](https://arxiv.org/abs/2603.07670). Judith wrote a genuinely good analysis and filed it exactly where it could not affect her.

And even wired, promotion fights you: the live policy has to stay **small and coherent.** A lessons file that grows one entry per mistake becomes its own failure mode — internally contradictory, too long to follow, the exact context-bloat you were optimizing away. Improvement is not accumulation. It's *maintaining a tight, validated policy* — merging, generalizing, and retiring rules as aggressively as you add them.

> **Public data — hill-climb this segment.** Long-horizon memory / policy maintenance: [LongMemEval](https://huggingface.co/datasets/xiaowu0162/longmemeval-cleaned) (multi-session recall + knowledge-update cases), [Multi-Session Chat](https://huggingface.co/datasets/nayohan/multi_session_chat), and **LoCoMo** (very-long conversations; GitHub release).

## What's actually new here

Almost none of the *failure modes* above are mine. Measurement-is-the-bottleneck is Wei and Weng; continuation-as-reward is Gooding & Grefenstette; every rater pathology — correlated errors, self-enhancement, leniency, reliability-without-validity — has a dedicated 2024–26 paper, and the continuous-scoring remedy is Finn et al. Assume a reader knows all of it. If you take one framework from this post, take Weng's; this is the companion from the other side of the glass — hers is the *verifiable* auto-research agent, this is the *unverifiable* conversational one.

What I haven't seen said, and will plant a flag on: the transposition of the verification bottleneck onto a **deployed personal agent whose target task has no verifier**; the blunt fact that **silence is symmetric** — the most common outcome is the least informative one; the **three-tier ground-truth routing** as an explicit policy; the empirical result that **a better scoring readout can't manufacture calibration that isn't in the signal**; and the one I'd stake the post on — **diagnosis without curate-back. The note is the tombstone.** An agent that can write a flawless account of its own failure and still hand you the same failure tomorrow is not a curiosity. It is the current state of the art.

## The honest part

None of this is about the model. A smarter model writes a more articulate wrong market note and a more confident wrong ID. And none of it is about the *machinery* — the bandits, the ledgers, the fail-closed gates. That's the easy half, and it's mostly done. The hard half is that **every edge of the loop is a question about evidence you mostly don't have.** A self-improving agent is only ever as good as its ability to *know it was wrong* — and on a real personal agent, in a real group chat, that knowledge is scarce, confounded, expensive to buy, and frequently just unavailable.

The Jensen photo is a good test precisely because it is so mundane. No adversary, no exotic capability, no safety cliff — a joke, a competent-but-wrong reply, a correction. If the loop can't close on *that*, it can't close.

The loop is easy to draw. Every arrow in it is a research problem. That's the post.
