---
layout: post
title: "Putting Kimi Delta Attention into a Qwen model"
date: 2026-08-02
tags: [linear-attention, kda, gated-deltanet, qwen, architecture-conversion]
---

Swapping a model's attention mechanism normally costs you something. You replace the mixer,
copy across whatever happens to fit, and then spend billions of tokens distilling to win back
the capability you just destroyed. Every conversion paper of the last two years —
[T2R](https://arxiv.org/abs/2103.13076), [SUPRA](https://arxiv.org/abs/2405.06640),
[LoLCATs](https://arxiv.org/abs/2410.10254),
[Mamba-in-Llama](https://arxiv.org/abs/2408.15237),
[MOHAWK](https://arxiv.org/abs/2408.10189), [Llamba](https://arxiv.org/abs/2502.14458) — is a
variation on how much you lose and how cheaply you can buy it back.

There is one swap where you lose nothing at all. If your model uses [**Gated DeltaNet**](https://arxiv.org/abs/2412.06464), you
can convert it to [**Kimi Delta Attention**](https://arxiv.org/abs/2510.26692) with no
distillation, no training tokens, and no residual error — because GDN is not a different mixer from KDA. It is KDA with one knob held
still.

Qwen3.5's hybrids are GDN. So you can take Qwen3.5-4B-Instruct and produce a Kimi Delta
Attention model that provably computes the same function, in about the time it takes to load
the weights twice.

We did it on four models. Here is the recipe, the five traps we fell into, and — at the end —
the part nobody tells you, which is what the conversion is actually worth once you have it.

## One knob apart

{{FIG_GDN_KDA}}

<div class="eq">
  <div class="eqrow">
    <span class="eqtag">GDN</span>
    <span class="eqbody"><i>S</i><sub>t</sub> = <em class="hl">α<sub>t</sub></em> (<i>I</i> − β<sub>t</sub><i>k</i><sub>t</sub><i>k</i><sub>t</sub><sup>⊤</sup>) <i>S</i><sub>t−1</sub> + β<sub>t</sub><i>k</i><sub>t</sub><i>v</i><sub>t</sub><sup>⊤</sup></span>
    <span class="eqnote">α<sub>t</sub> ∈ ℝ &nbsp;·&nbsp; one scalar per head</span>
  </div>
  <div class="eqrow">
    <span class="eqtag">KDA</span>
    <span class="eqbody"><i>S</i><sub>t</sub> = (<em class="hl">Diag(α<sub>t</sub>)</em> − β<sub>t</sub><i>k</i><sub>t</sub><i>k</i><sub>t</sub><sup>⊤</sup><em class="hl">Diag(α<sub>t</sub>)</em>) <i>S</i><sub>t−1</sub> + β<sub>t</sub><i>k</i><sub>t</sub><i>v</i><sub>t</sub><sup>⊤</sup></span>
    <span class="eqnote">α<sub>t</sub> ∈ ℝ<sup>d<sub>k</sub></sup> &nbsp;·&nbsp; one value per channel</span>
  </div>
</div>

That is the entire difference. GDN decays its whole state by a single scalar per head; KDA
decays each channel of the state at its own rate. Hold every channel of `Diag(α_t)` equal
and the second line collapses into the first. The Kimi Linear paper puts it the same way —
KDA "refines GDN's scalar decay by introducing a fine-grained diagonalized gate", in the manner
of [gated linear attention](https://arxiv.org/abs/2312.06635).

The generalisation is *strict*, and that is the whole trick. Your source model doesn't need
approximating into the target's parameter space. It already lives there, at one specific
degenerate point. The only question is whether you can land on that point exactly.

Qwen3.5 makes the offer concrete: the 0.8B has 18 of its 24 layers as GDN, the 4B has 24 of
32, with full softmax attention interleaved every fourth layer. Those linear layers are
sitting there waiting.

## What you actually get

Let's kill the obvious wrong reason first. **The conversion buys you no speed.** Linear
attention decodes in constant state and constant time per token — but if your base model is
already a GDN hybrid, you already have that. GDN→KDA changes the shape of the decay, not the
cost of the recurrence. We had to withdraw an efficiency claim we'd made before checking
this, and it's the first thing anyone assumes.

What you get instead is worth more:

**An instruction-tuned linear-attention model for the cost of a script.** Post-trained weights
convert exactly like pretrained ones. On the [Berkeley Function Calling
Leaderboard](https://gorilla.cs.berkeley.edu/leaderboard.html), our converted 4B matched its
instruction-tuned source to within *one item in 1,240*. No distillation run, no data mixture,
no drift.

**A starting point you can verify.** Almost no architecture change gives you a reference
answer. This one does: the converted model must reproduce its source, so any harness you
point at both must report zero difference. If it doesn't, your harness is broken — and it
says so at the one moment when there's no real difference for a bug to hide behind.

**Strictly more expressivity, initialised at a provably inert value.** The added per-channel
freedom starts pinned at exactly zero utilisation. So anything you find in those parameters
later *was learned*. Hold that thought; it's where this post ends.

## The swap

Every parameter of `Qwen3_5GatedDeltaNet` lands in `KimiDeltaAttention` by a copy, a
contiguous split, or a broadcast. There are exactly two exceptions.

| teacher | student | how |
|---|---|---|
| `in_proj_qkv` (6144, 1024) | `q/k/v_proj` | row split |
| `conv1d` (6144, 1, 4) | three `ShortConvolution` k=4 | channel split |
| `in_proj_b` | `b_proj` | copy — both sigmoid downstream |
| `A_log` (16,) | `A_log` (16,) | copy |
| `dt_bias` (16,) | `dt_bias` (2048,) | `repeat_interleave` per head |
| `in_proj_a` (16, 1024) | `f_proj`: 1024→128→2048 | **constructed, needs rank 16** |
| `out_proj` | `o_proj` | copy |
| `in_proj_z` (2048, 1024) | `g_proj`: 1024→128→2048 | **breaks** |
| `norm`, silu | `o_norm`, sigmoid | **breaks** |

Before any of that, check one thing: **KDA hardcodes L2-normalisation of q and k.** If your
source model doesn't normalise in the same place, the two mixers compute different functions
and no weight mapping on earth repairs it. Qwen3.5 does normalise. That was the single most
likely fatal mismatch and it resolved favourably — but check it first on any new source,
because if it fails nothing else matters.

## Getting a scalar out of a bottleneck

The one interesting construction. Your teacher drives its decay gate from a per-head scalar;
KDA drives its from a per-channel vector produced through a low-rank bottleneck. You need the
bottleneck to emit the same number in all 128 channels of a head.

With `H = 16` heads and `d_k = 128` channels each, the teacher computes

<div class="eq">
  <div class="eqrow">
    <span class="eqbody"><i>a</i><sub>t</sub><sup>(h)</sup> = (<i>W</i><sub>a</sub><i>x</i><sub>t</sub>)<sub>h</sub> &nbsp;&nbsp;&nbsp;&nbsp; <i>g</i><sub>t</sub><sup>(h)</sup> = −e<sup>A<sub>h</sub></sup> · softplus(<i>a</i><sub>t</sub><sup>(h)</sup> + δ<sub>h</sub>)</span>
  </div>
</div>

and KDA computes the same expression per channel with the gate input factored as
<span class="m">P<sub>2</sub>P<sub>1</sub>x<sub>t</sub></span>. Equality for all *t* needs
<span class="m">(P<sub>2</sub>P<sub>1</sub>x<sub>t</sub>)<sup>(h,c)</sup> = a<sub>t</sub><sup>(h)</sup></span>
for every channel *c*. Two matrices do it:

```python
kda.f_proj[0].weight.zero_()
kda.f_proj[0].weight[:num_heads].copy_(gdn.in_proj_a.weight)   # P1: a_t into the first H coords
sel = torch.zeros_like(kda.f_proj[1].weight)                   # P2: one-hot broadcast
for h in range(num_heads):
    sel[h*head_k_dim:(h+1)*head_k_dim, h] = 1.0
kda.f_proj[1].weight.copy_(sel)
kda.dt_bias.copy_(gdn.dt_bias.repeat_interleave(head_k_dim))
```

`P1` parks the teacher's projection in the leading 16 coordinates and zeroes the rest; `P2`
fans coordinate *h* out to all 128 channels of head *h*. The feasibility condition is a rank
one: you need rank ≤ 16, the bottleneck gives you 128. It fits with room to spare.

Remember that sentence. It is precisely why the *other* bottleneck in the layer does not
survive the same argument.

## Trap 1: the reference implementation can't take your weights

[flash-linear-attention](https://github.com/fla-org/flash-linear-attention) is where a KDA
layer comes from if you don't write one yourself. It isn't a third-party clone, either — the
KDA layer is by Songlin Yang, Yu Zhang and Zhiyuan Li, and Yu Zhang leads the Kimi Linear
author list. This is the architecture's own authors' code.

And you cannot inherit into it unmodified.

FLA factors the **output** gate through a bottleneck: `Linear(1024→128) → Linear(128→2048)`.
Your teacher's `in_proj_z` is a single `Linear(1024→2048)`. Same shape at both ends, wildly
different capacity in the middle — and unlike the decay gate, there is no rank deficiency here
to exploit. It's just a trained 2048×1024 matrix.

How bad? Truncating it to rank 128 throws away 65–78% of the matrix in weight space. That
overstates the damage — real hidden states are anisotropic, and on actual activations plain
truncation costs 23–52%, a data-fitted map only 14–32%. But it doesn't rescue anything: a
single truncated layer moves the logits **31–403× further than kernel noise**, and the sweep
has no knee. At rank 768 — three quarters of full rank — the worst layer is still 139× out.

The lesson isn't "FLA compresses a fragile matrix." Truncate `out_proj` instead, same rank,
same layer, and it's slightly *worse*. Rank 128 is simply far too small for any 1024-wide
matrix in this model, and the output gate happens to be the one the library factors. For a
KDA model trained from scratch — the case FLA is written for — that bottleneck is a perfectly
sensible parameter saving.

> A layer that is correct as a trainable module can be unusable as an initialisation target,
> and the difference is invisible until you check the rank of what you're copying in.

The fix is two overrides in a subclass: widen `g_proj` to a single full-rank `Linear`, and
change `o_norm`'s activation from FLA's hardcoded `sigmoid` to your teacher's `silu`. Widening
costs 30M parameters against a stock-FLA student and *nothing* against the teacher, because
it is exactly the teacher's own matrix. The price you do pay is that you now carry a subclass:
pin FLA, and diff `fla/layers/kda.py` on every bump. An upstream change to `g_proj` or to the
forward's kwarg handling breaks your inheritance silently.

## Trap 2: there is no tolerance you can pick

You will want to assert `max |Δlogits| == 0`. Don't. On this conversion that test doesn't
merely fail to discriminate — it returns the wrong verdict.

The teacher runs `chunk_gated_delta_rule`, the student runs `chunk_kda`. Different Triton
kernels, different reduction order, and floating-point addition is not associative. A nonzero
disagreement is guaranteed *before* correctness even enters the picture. Our verified,
provably-correct conversion sits at 3.1 × 10⁻². Every constant a careful person picks in
advance — 10⁻⁶, 10⁻⁴, a generous 10⁻³ — rejects it. And the natural response to that failure
is to loosen the constant until the light turns green, which is indistinguishable from having
had no test at all.

You can't derive the right number either. It isn't machine epsilon. It depends on reduction
order, sequence length, how deep the stack is, the data — and it shifts by 8× between float32
and bfloat16.

**So measure it.** Run the teacher against its own pure-torch fallback: identical mathematics
by an unrelated arithmetic path, so whatever they disagree by contains no semantic component
whatsoever. That is the smallest difference your comparison can resolve. Now the question
stops being "is the student identical to the teacher?" and becomes:

> Is the student closer to the teacher than the teacher is to itself?

Ours: floor 4.05 × 10⁻², student 3.11 × 10⁻². **A ratio of 0.77.** Swapping the entire mixer
moved the logits less than re-implementing the same arithmetic did.

Report the ratio, never the raw delta. In bfloat16 the deviation is 12× larger, which reads
alarming and means nothing — the floor rises by the same factor and the ratio only drifts from
0.77 to 1.20. The general form of this is worth stealing for any port, rewrite or kernel
swap: **when you compare two implementations of the same computation, the null hypothesis is
not zero. It is the disagreement between two implementations you already believe are
equivalent.**

## Trap 3: your test will pass anyway

Nearly any bug in a conversion produces a model that still runs, still emits plausible logits,
and still exits zero. So agreement alone proves nothing. Inject deliberate faults and demand
each one be loudly visible.

| deliberate bug | how far out |
|---|---|
| rank-128 output gate — i.e. stock FLA | **507× floor** |
| `repeat` instead of `repeat_interleave` | **679×** |
| head/channel indices swapped in the selector | **360×** |
| one of 16 heads' gate zeroed | **52×** |
| the same, in one layer only | 0.96× — *silent* |

Those middle two matter most, because they are invisible to every cheap check: shapes match,
parameter counts match, nothing raises, and the model trains happily. Only a numerical
comparison against a known-correct reference catches an index-layout inversion.

Two things to steal from that table. First, **the first control we wrote didn't fire**, and
the tempting reading was "the instrument is broken" or "the conversion is subtly wrong." The
correct reading was "the control is too weak" — one head in one layer of eighteen is a fault
genuinely at the noise scale. Calibrating your controls isn't preparation for the experiment;
it *is* part of the experiment. Second, that last row is your sensitivity limit, and you
should publish it: below about 1× floor this comparison is blind, which means single-layer
ablations sit inside the blind spot.

The same disease shows up one level later, in the test for your *exported* model. The obvious
test is a round trip — build the class, save, reload, assert the tensors match. We wrote it.
Ten green assertions. It passed while the class was quietly building a vision tower it should
never have had.

Of course it did. **Save-and-reload is self-consistent for any class, correct or not.** The
export loads the state dict of construction A into an instance of construction B, so the test
has to build *both* and compare their key sets. Test the pair, not the round trip.

## Trap 4: four quiet ones

**Serialise the gate tensors in fp32.** In bf16, the representable step at `dt_bias`'s
magnitude is 1.49 × 10⁻¹ — larger than any movement a short run produces. Your gate analysis
then reads a clean, confident, entirely fabricated zero. This destroyed one of our
measurements at *save* time rather than at train time, which is the worst possible place for
it.

**Keep fp32 master weights.** Same failure one level up: `dt_bias` sits exactly where a bf16
update falls below one unit in the last place. 8-bit Adam moments are fine — they're running
statistics, not parameters — but the masters are not optional.

**Know which model you actually loaded.** Qwen3.5-4B ships as a vision-language checkpoint:
`architectures: ["Qwen3_5ForConditionalGeneration"]`, a `vision_config`, a video preprocessor.
But `AutoModelForCausalLM` resolves to `Qwen3_5ForCausalLM`, whose config class is the *text*
config, and the vision tower is dropped at load. So the thing you are converting is the text
tower — your parameter counts must exclude the tower, and any class you write to hold the
result has to subclass the text config. Getting this wrong late cost us a strict load failing
on 879 missing and 546 unexpected keys.

**Derive the parameter assertion from the config; never hardcode it.** The 0.8B and 4B differ
in hidden size *and* in value-head count — the 4B uses grouped value attention, 32 value heads
against 16 key heads, so `in_proj_qkv` splits 2048/2048/4096 rather than into equal thirds. A
constant that's right for one is wrong for the other by 3×, and it reads as a conversion
defect rather than a stale assertion. The 4B is also the model that genuinely *tests* the
mapping: at 0.8B key dim equals value dim, so code that confuses them produces identical
output.

## Trap 5: a converted model is not a model

This one is structural and it bit hardest. Conversion is surgery on a live object — you swap
each `linear_attn` block and leave the *config* untouched. So `save_pretrained` writes KDA
tensors under a config that still declares Gated DeltaNet, and `from_pretrained` reads that
config, builds GDN modules, and mismatches every added tensor.

Which means: your checkpoints are bare state dicts only your own training script can
instantiate. vLLM and SGLang dispatch on `config.architectures`, and no registered
architecture describes a Qwen3.5 hybrid whose linear layers are KDA, so every rollout and
every eval crawls through HF `generate` one batch at a time. And a model that only its trainer
can load cannot be deployed at all — which was the point of converting it.

The fix is registration, not modelling. Declare a `model_type`, and a class that **builds**
KDA layers in `__init__` rather than converting into them, so the module tree exists before
the weights arrive:

```python
class Qwen35KdaConfig(Qwen3_5TextConfig):        # the TEXT config — see trap 4
    model_type = "qwen3_5_kda"

class Qwen35KdaForCausalLM(Qwen3_5ForCausalLM):
    config_class = Qwen35KdaConfig
    def __init__(self, config):
        super().__init__(config)
        swap_to_kda(self, config)                # structure only — copies nothing

AutoConfig.register("qwen3_5_kda", Qwen35KdaConfig)
AutoModelForCausalLM.register(Qwen35KdaConfig, Qwen35KdaForCausalLM)
```

Two traps hiding in nine lines. The swap at construction must copy **no weights** — under
`from_pretrained` the GDN weights it starts from are uninitialised or on the meta device, so
inheriting from them copies noise or raises outright. And building the config as
`KdaConfig(**source.to_dict())` looks right and isn't: that dict carries `model_type` and
`architectures` naming the *source*, which land as instance attributes shadowing your class
attributes. The saved file still looks correct, because `save_pretrained` writes the class
attribute — so your object disagrees with the directory it produces, and nothing complains
until something reads `config.model_type` at runtime and cheerfully routes to Gated DeltaNet.

Accept the export on **exact** equality, not closeness. This is the one comparison where zero
is the right bar, because both sides run identical kernels and there's no arithmetic noise to
absorb. Ours reads `max |Δ| = 0.000e+00`.

One honest limit: this registers an architecture, it doesn't embed one. Whoever loads the
directory has to import your module first. Without it they get a loud *"does not recognize
this architecture"* — which is the right failure. Far better than silently building GDN layers
under a KDA checkpoint's name.

## So does the extra expressivity do anything?

Here is the part we would rather report differently.

The conversion pins KDA's added freedom — per-channel variation of the decay inside a head —
at exactly zero. Measured: within-head channel spread is **0.000 in every layer**. It has to
be, and confirming it is a second, independent check on the conversion, arriving from a
different measurement than the logit comparison. It also makes the architecture's entire
premise cheap to falsify. Just ask: does training move it?

We gave it every chance. Four training runs differing only in how much extra learning rate the
gate got, then a surgical ablation — restore the gate parameters alone to their conversion
values, leave every other trained weight in place, re-evaluate.

**The parameters are reachable.** Gate displacement scales 1 : 5.0 : 11.0 against a nominal
1 : 4 : 10 as you raise its learning rate. Training can absolutely move them.

**The movement does no work.** Resetting the gate — undoing everything it learned — changes
[MMLU](https://arxiv.org/abs/2009.03300) by under two tenths of a standard error, and not even consistently in one direction. That
holds in the arm where 1,661 channels had moved. The evaluation isn't blind, either: a
deliberately damaged control run reads *below* the 25% chance floor of a four-way multiple
choice, and its own gate reset is exactly 0.0000, as it must be.

Then we tried 375× the data — a 27.4M-token instruction run. Across 200 optimiser steps the
maximum within-head spread didn't merely stay similar, it stayed **identical**: 4.8828 × 10⁻⁴,
which is exactly 2⁻¹¹. Over the same interval the number of moved channels *fell*, from 419 to
409. A quantity that is genuinely being learned does not hold an exact power of two for two
hundred steps while its support shrinks.

So at both budgets we tested, the converted model stays functionally the Gated DeltaNet it
came from, wearing KDA's parameters.

We don't think that closes the question — it's one architecture, one scale, and an objective
that never once rewards using the gate. But it does mean the honest pitch for a GDN→KDA
conversion today is *"a free, verified, strictly more expressive starting point,"* not *"a
better model."* The expressivity is real, it's present, and so far nothing has taught it to
matter.

Which, if you're going to convert a model, is exactly the thing you want to know before you
book the GPUs.

## The short version

1. Check q/k L2-normalisation agreement first. If the source doesn't normalise where KDA
   hardcodes it, stop.
2. Read the reference layer for bottlenecks before copying into it. Rank, not shape, decides
   whether a projection can receive your weights.
3. Measure your noise floor and report ratios, never a borrowed constant. Run the check in
   float32 — bf16 is an 8× blunter instrument.
4. Write negative controls that attack your specific constructions, and make each one fire.
   A control that stays silent is a result about the control.
5. Register the architecture *before* you train anything, or every eval pays for a conversion
   and nothing can serve the result.
6. Assert the parameter delta, derived from the config, on every single run. A conversion that
   silently no-ops leaves you with a model that trains beautifully and is just the unconverted
   teacher — the one failure that invalidates everything while looking exactly like success.
