# Harness Engineering: How ICML 2026 Learned to Stop Worrying and Build the Scaffold

For two years the story of LLM agents was a story about *models*. Bigger context windows,
better reasoning traces, more capable base weights. ICML 2026 tells a different story. Across
the program, a striking share of the strongest agent papers are not about the model at all —
they are about the **harness**: the runtime, the tool layer, the orchestrator, the evaluation
scaffold, and the control boundary that sits *around* the model and decides what actually
happens. Call it **harness engineering**.

The thesis running through this literature is blunt: as base models converge in raw capability,
the harness becomes the locus of both value and failure. *AdaptOrch* states it directly — "as
models converge, orchestration becomes the differentiator" [\[24\]](https://arxiv.org/abs/2602.16873). *Recognize Your
Orchestrator* shows it empirically — across deep-research, coding, GUI, and RAG agents, the
**orchestrator, not the executors, is the primary failure source** [\[23\]](https://arxiv.org/abs/2606.01351). And *Base Models
Know How to Reason, Thinking Models Learn When* argues the capability is already latent; the
control layer decides when it fires [\[22\]](https://arxiv.org/abs/2510.07364).

This post surveys the harness-engineering landscape at ICML 2026 across five facets —
**scaffolding & runtimes, tool use, evaluation harnesses, orchestration, and safety/control** —
and cites the work behind each. A note on honesty up front: most papers below are confirmed
ICML 2026 acceptances (linked to `icml.cc`); a handful are 2026 arXiv preprints or adjacent-venue
prior art (ICLR 2025, ICSE 2026), and I label those inline. Forty-five papers, forty-two with
verified abstracts.

---

## 1. Scaffolding & Runtimes: the harness as engineered infrastructure

The most literal reading of "harness engineering" is: treat the scaffold as a first-class
artifact you compile, schedule, and debug — not a prompt you hand-tune.

**SAGE** is the purest expression of this idea, modeling agent pipelines as a *compiled dataflow*
with explicit resource contracts, bounded-queue backpressure, and p99 latency guarantees — the
harness as systems infrastructure, not a prompt [\[5\]](https://icml.cc/virtual/2026/poster/63809). **OpenSage** goes a step further and
*synthesizes* the scaffold itself: an agent-development kit where the topology, toolset, and
hierarchical memory are generated rather than hand-authored [\[4\]](https://icml.cc/virtual/2026/poster/66121). **MAS-Orchestra** does the
same for multi-agent systems, generating a whole coordination structure "at once" and shipping
MASBENCH to measure when that structure actually helps — finding, importantly, that multi-agent
benefit is task-dependent, not universal, at >10× efficiency over baselines [\[3\]](https://icml.cc/virtual/2026/poster/66445). The direct
predecessor to all of this is **AFlow** (ICLR 2025 Oral), which framed scaffold generation as MCTS
over code-represented workflows [\[10\]](https://arxiv.org/abs/2410.10762).

Two papers treat the harness as *debuggable infrastructure*. **HarnessFix** (arXiv 2026 preprint)
analyzes failed execution traces, attributes failures to specific harness components, and applies
targeted repairs for 6.3–18.4% gains [\[8\]](https://arxiv.org/abs/2606.06324). **The Interplay of Harness Design and Post-Training**
(arXiv 2026 preprint) shows the harness is a variable you must *co-design with training* — neglect
it during training and robustness collapses under environment shift [\[9\]](https://arxiv.org/abs/2606.25447).

Rounding out the facet: **DeepHA** builds a hierarchical planner/executor whose Chain-of-Action
cuts context ~75% and hits SOTA on 800+ Minecraft tasks [\[6\]](https://icml.cc/virtual/2026/poster/66241); **AutoTool** learns dynamic
tool selection via a Plackett–Luce ranking that generalizes to unseen tools [\[1\]](https://icml.cc/virtual/2026/poster/65574); **Gecko**
gives the tool-calling inner loop a stateful simulation to refine against, lifting GPT-4o on
BFCLv3 from 76.9%→84.6% [\[2\]](https://icml.cc/virtual/2026/poster/65078); and **Agentic Proposing** composes modular reasoning skills
into verifiable trajectories, reaching 91.6% on AIME25 [\[7\]](https://icml.cc/virtual/2026/poster/62973).

## 2. Tool Use & Function Calling: the load-bearing layer

If the harness has a load-bearing wall, it is the tool interface. The most actionable finding of
the cycle comes from **AgentNoiseBench**: across 25 models, **corrupted tool feedback degrades
agents more than ambiguous user requests** [\[11\]](https://icml.cc/virtual/2026/poster/64355). That single result reframes where a harness
should spend its defensive budget — validate and sanitize what comes *back* from tools, not just
what the user sends in.

Evaluation of tool use is shifting from outcomes to trajectories. **TRACE** ("Beyond the Final
Answer") grades the *call sequence* — redundancy, hallucinated tool outputs — rather than final
accuracy, and does it without ground-truth trajectories using small open-source judges [\[12\]](https://icml.cc/virtual/2026/poster/64255).
**ComplexMCP** stress-tests the modern regime directly: 300+ tools across 7 stateful MCP sandboxes,
where leading models reach ~60% versus ~90% for humans, and names the three bottlenecks a harness
must engineer against — retrieval at scale, calibration, and recovery [\[13\]](https://icml.cc/virtual/2026/poster/66421). **AppWorld-UL**
adds the human-in-the-loop axis, showing correct user-interaction is decisive (top models: 38.2%)
[\[15\]](https://icml.cc/virtual/2026/poster/62856).

On the systems side, **RealtimeTool** attacks tool-call *latency* with parallel decoding of
function names and arguments, for 3–6× (up to 9.6×) speedups [\[14\]](https://icml.cc/virtual/2026/poster/62617). **D-CORE** incentivizes
task decomposition for complex multi-step tool use [\[16\]](https://icml.cc/virtual/2026/poster/61056), and **SciAgentGym** provides a
multi-step scientific tool-use benchmark [\[17\]](https://icml.cc/virtual/2026/poster/66785).

## 3. Evaluation Harnesses: you can't engineer what you can't measure

A remarkable amount of this year's work is *harness-engineering about harness engineering* —
building the reproducible scaffolds that let us evaluate agents at all.

**VeRO** is the most on-the-nose: an evaluation harness for the emerging "agent optimizes agent"
task, with versioned snapshots, budget-controlled evaluation, and traces that **separate
deterministic code from stochastic LLM completions** — exactly the reproducibility machinery the
field has lacked [\[18\]](https://icml.cc/virtual/2026/poster/60518). **SWE-Bench Pro** modernizes code-agent evaluation with a
contamination-resistant public/private split over long-horizon, multi-file tasks [\[45\]](https://icml.cc/virtual/2026/poster/61047),
and **daVinci-Dev** (Oral) operationalizes executable-repo environments with real tool outputs as
training substrate, hitting SOTA-open on SWE-Bench Verified at under half the tokens [\[27\]](https://icml.cc/virtual/2026/oral/71032).
**SWE-Compass** pushes toward a unified coding-agent evaluation [\[26\]](https://icml.cc/virtual/2026/poster/64552).

The most elegant idea in the facet is **AutoWebWorld**: generate *intrinsically verifiable* web
environments from finite state machines, so ground truth is programmatic — 11,663+ verified
trajectories at ~$0.04 each, no LLM judge required [\[19\]](https://arxiv.org/abs/2602.14296). **CUARewardBench** benchmarks the
*judge itself*, evaluating reward models on computer-using-agent trajectories [\[20\]](https://icml.cc/virtual/2026/poster/63367), and
**EnterpriseOps-Gym** offers a containerized, stateful enterprise sandbox where the best agent
manages only 34.1% — and notably fails to *decline infeasible tasks* [\[21\]](https://icml.cc/virtual/2026/poster/64162). **DSGym** extends
the "gym" pattern to data-science agents [\[25\]](https://icml.cc/virtual/2026/poster/66567).

Two safety-flavored eval harnesses stand out as textbook reproducibility engineering.
**Jailbreak Foundry** (Oral) auto-translates attack papers into runnable modules with a unified
judge, reproducing 30 attacks with half the code [\[28\]](https://icml.cc/virtual/2026/oral/71103). **SandboxEscapeBench** (Oral) measures
whether an agent can break out of the very container meant to isolate it — a nested-sandbox CTF
built on Inspect-AI — which matters for anyone whose harness executes untrusted agent code [\[29\]](https://icml.cc/virtual/2026/oral/71104).

## 4. Orchestration: the control layer is where systems break

Section 3's evaluation tells us where to look; the orchestration papers tell us what they find.
**Recognize Your Orchestrator** introduces a Mean-Field Entropy Dynamics view and a measurable
"scheduling entropy," showing the orchestrator is the primary failure locus and identifying a
"Reasoning Trap" where reasoning-heavy models degrade under context squeeze [\[23\]](https://arxiv.org/abs/2606.01351).
**AOrchestra** answers with automatic, on-the-fly sub-agent creation via a clean 4-tuple
abstraction (instruction, context, tools, model), +16.28% over the strongest baseline on
GAIA/SWE-Bench/Terminal-Bench [\[30\]](https://arxiv.org/abs/2602.03786). **AgentConductor** treats the communication *topology*
as a first-class learnable object, evolving who-talks-to-whom for hard code generation [\[32\]](https://icml.cc/virtual/2026/poster/66333).

Two position-shaping results anchor the facet: **AdaptOrch** (preprint) — orchestration is the
differentiator as models converge [\[24\]](https://arxiv.org/abs/2602.16873) — and **Base Models Know How to Reason** — control,
not capability, governs realized performance [\[22\]](https://arxiv.org/abs/2510.07364). **InfoPO** adds a concrete harness gate:
a turn-level information-gain reward teaching agents *when to ask versus act* [\[31\]](https://arxiv.org/abs/2603.00656).

## 5. Safety & Control Harnesses: gating on effect, not intent

The fastest-moving facet is the control boundary — and it has converged on a sharp idea: **gate on
what an action does, not on whether the input looked harmful.** The motivating result is **When
Benign Inputs Lead to Severe Harms**, which shows innocuous-looking inputs can trigger severe
harmful actions in computer-use agents [\[35\]](https://icml.cc/virtual/2026/poster/64242). If harm is a property of the *effect*, then a
content filter on the input is the wrong instrument; you need an effect boundary at the harness.

Several papers build that boundary. **SafeHarbor** turns an abstract "adaptive boundary" into a
concrete real-time defense pipeline over agent actions, backed by hierarchical memory [\[33\]](https://icml.cc/virtual/2026/poster/64556).
**The Oversight Game** gives it a formal spine: a two-player Markov game where the agent chooses
act-vs-defer and the human chooses trust-vs-oversee, with a proof that — under a Markov Potential
Game — an agent gaining autonomy *cannot* decrease the human's value [\[34\]](https://arxiv.org/abs/2510.26752). **ANCHOR** audits
CLI agents (the highest-stakes effect surface) for real-world harmful outcomes [\[36\]](https://icml.cc/virtual/2026/poster/63234), and
**TRACER** provides the early-warning signal such a boundary needs, flagging unreliable trajectories
within the first ~20% of a conversation [\[39\]](https://arxiv.org/abs/2602.11409).

The prior art here is essential and worth citing precisely: **Progent** (arXiv 2025) is the
canonical programmable-privilege DSL enforced at execution without touching the model [\[43\]](https://arxiv.org/abs/2504.11703);
**AgentSpec** (ICSE 2026) is a customizable runtime-enforcement layer intercepting actions at
execution time [\[42\]](https://arxiv.org/abs/2503.18666); and **SafeMCP** (arXiv 2026) filters risky tools from the action space
*before* the agent even chooses — a pre-selection boundary rather than pre-execution [\[44\]](https://arxiv.org/abs/2606.01991).
The open design question these three frame is *where the boundary sits* and whether it is certified
or heuristic.

Rounding out the facet: **CausalArmor** gates indirect prompt injection at the tool boundary via
causal attribution [\[37\]](https://icml.cc/virtual/2026/poster/62590); **Constitutional Black-Box Monitoring** detects scheming from
behavior alone, no model internals [\[38\]](https://icml.cc/virtual/2026/poster/65104); **AIR** frames safety operationally as
detect→contain→respond [\[40\]](https://arxiv.org/abs/2602.11749); and **Architecture Matters for Multi-Agent Security** shows the
attack surface is itself a function of the orchestration topology — the clean bridge back to
Section 4 [\[41\]](https://arxiv.org/abs/2604.23459).

---

## What it adds up to

Five threads run through these forty-five papers:

1. **The harness, not the model, is the locus of value and failure.** (Recognize Your Orchestrator,
   AdaptOrch, Base Models Know How to Reason, HarnessFix, Interplay of Harness Design.)
2. **Bad tool output — not bad user input — is the dominant failure driver**, which relocates the
   defensive budget to the tool-return path. (AgentNoiseBench, CausalArmor.)
3. **Mock-and-refine and simulation layers for tool calls are now first-class technique.** (Gecko,
   ComplexMCP.)
4. **Evaluation is moving from final-answer to trajectory, and toward cheap deterministic
   verifiers.** (TRACE, AutoWebWorld's FSMs, SWE-Bench Pro's public/private split, CUARewardBench.)
5. **Safety is converging on effect-boundary / action-authorization at the harness layer** — gate
   on the action's effect, not the input's apparent harmfulness. (When Benign Inputs, SafeHarbor,
   The Oversight Game, Progent, AgentSpec, SafeMCP.)

The engineering lesson is that the interesting design surface has moved. The model is increasingly
a component; the harness — the runtime, the tool contract, the orchestrator, the eval scaffold, the
effect boundary — is the system. ICML 2026 is the year the field started building it like one.

---

## References

**[1] AutoTool: Dynamic Tool Selection and Integration for Agentic Reasoning.** Jiaru Zou, Ling Yang, … Mengdi Wang. ICML 2026. https://icml.cc/virtual/2026/poster/65574
**[2] Gecko: A Simulation Environment with Stateful Feedback for Refining Agent Tool Calls.** Zeyu Zhang, Guohao Li, Zhenchang Xing, … Liang Zheng. ICML 2026. https://icml.cc/virtual/2026/poster/65078
**[3] MAS-Orchestra: Understanding and Improving Multi-Agent Reasoning Through Holistic Orchestration and Controlled Benchmarks.** Zixuan Ke, Yifei Ming, Austin Xu, … Shafiq Joty (Salesforce AI). ICML 2026. https://icml.cc/virtual/2026/poster/66445
**[4] OpenSage: Self-programming Agent Generation Engine.** Hongwei Li, Zhun Wang, … Dawn Song. ICML 2026. https://icml.cc/virtual/2026/poster/66121
**[5] SAGE: A Dataflow-Native Framework for Modular, Controllable, and Transparent LLM-Augmented Reasoning.** Jun Liu, Peilin Liu, Ruicheng Zhang, … Hai Jin. ICML 2026. https://icml.cc/virtual/2026/poster/63809
**[6] DeepHA: Scaling Action Chains Elicits Deep Hierarchical Agents.** Zihao Wang, Muyao Li, … Yitao Liang. ICML 2026. https://icml.cc/virtual/2026/poster/66241
**[7] Agentic Proposing: Enhancing LLM Reasoning via Compositional Skill Synthesis.** Zhengbo Jiao, Shaobo Wang, … Linfeng Zhang. ICML 2026. https://icml.cc/virtual/2026/poster/62973
**[8] From Failed Trajectories to Reliable LLM Agents: Diagnosing and Repairing Harness Flaws (HarnessFix).** Mengzhuo Chen, Junjie Wang, … Qing Wang. arXiv 2026 (preprint). https://arxiv.org/abs/2606.06324
**[9] The Interplay of Harness Design and Post-Training in LLM Agents.** Kyungmin Kim, Youngbin Choi, … Sangdon Park. arXiv 2026 (preprint). https://arxiv.org/abs/2606.25447
**[10] AFlow: Automating Agentic Workflow Generation.** ICLR 2025 (Oral). https://arxiv.org/abs/2410.10762
**[11] AgentNoiseBench: Benchmarking Robustness of Tool-Using LLM Agents Under Noisy Conditions.** Ruipeng Wang, Yuxin Chen, … Tat-Seng Chua. ICML 2026. https://icml.cc/virtual/2026/poster/64355
**[12] Beyond the Final Answer: Evaluating the Reasoning Trajectories of Tool-Augmented Agents (TRACE).** Wonjoong Kim, Sangwu Park, … Chanyoung Park. ICML 2026. https://icml.cc/virtual/2026/poster/64255
**[13] ComplexMCP: Evaluation of LLM Agents in Dynamic, Interdependent, and Large-Scale Tool Sandbox.** Yuanyang Li, Xue Yang, … Hongyang Chen. ICML 2026. https://icml.cc/virtual/2026/poster/66421
**[14] RealtimeTool: Parallel Decoding for Real-Time LLM Function Calling.** Xiaoxin Shi, Jiaxin Wan, … Zengfeng Huang. ICML 2026. https://icml.cc/virtual/2026/poster/62617
**[15] AppWorld-UL: Benchmarking Diverse Agent-User Interactions for Tool-Use.** Junzhi Chen, Harsh Trivedi, … Ashish Sabharwal. ICML 2026. https://icml.cc/virtual/2026/poster/62856
**[16] D-CORE: Incentivizing Task Decomposition in Large Reasoning Models for Complex Tool Use.** ICML 2026. https://icml.cc/virtual/2026/poster/61056
**[17] SciAgentGym: Benchmarking Multi-Step Scientific Tool-Use in LLM Agents.** ICML 2026. https://icml.cc/virtual/2026/poster/66785
**[18] VeRO: An Evaluation Harness for Agents to Optimize Agents.** Varun Ursekar, Apaar Shanker, Veronica Chatrath, Yuan Xue, Samuel Denton. ICML 2026. https://icml.cc/virtual/2026/poster/60518
**[19] AutoWebWorld: Synthesizing Infinite Verifiable Web Environments via Finite State Machines.** Yifan Wu, Yiran Peng, … Yuyu Luo. ICML 2026. https://arxiv.org/abs/2602.14296
**[20] CUARewardBench: Benchmarking Reward Models on Computer-using Agent Trajectories.** Haojia Lin, Xiaoyu Tan, … Xing Sun (Tencent). ICML 2026. https://icml.cc/virtual/2026/poster/63367
**[21] EnterpriseOps-Gym: Environments and Evaluations for Stateful Agentic Planning and Tool Use in Enterprise Settings.** Shiva Malay, Perampalli Shravan Nayak, … Sai Rajeswar Mudumba. ICML 2026. https://icml.cc/virtual/2026/poster/64162
**[22] Base Models Know How to Reason, Thinking Models Learn When.** ICML 2026. https://arxiv.org/abs/2510.07364
**[23] Recognize Your Orchestrator: An Entropy Dynamics Perspective for LLM Multi-Agent Systems.** NJU-NLP. ICML 2026. https://arxiv.org/abs/2606.01351
**[24] AdaptOrch: Task-Adaptive Multi-Agent Orchestration in the Era of LLM Performance Convergence.** arXiv 2026 (preprint). https://arxiv.org/abs/2602.16873
**[25] DSGym: A Standardized and Holistic Framework for Advancing Data Science Agents.** ICML 2026. https://icml.cc/virtual/2026/poster/66567
**[26] SWE-Compass: Towards Unified Evaluation of Agentic Coding Abilities for LLMs.** ICML 2026. https://icml.cc/virtual/2026/poster/64552
**[27] daVinci-Dev: Agent-native Mid-training for Software Engineering.** Ji Zeng, Dayuan Fu, … Pengfei Liu. ICML 2026 (Oral). https://icml.cc/virtual/2026/oral/71032
**[28] Jailbreak Foundry: From Papers to Runnable Attacks for Reproducible Benchmarking.** Zhicheng Fang, Jingjie Zheng, Chenxu Fu, Wei Xu. ICML 2026 (Oral). https://icml.cc/virtual/2026/oral/71103
**[29] Quantifying Frontier LLM Capabilities for Container Sandbox Escape (SandboxEscapeBench).** Rahul Marchand, Art Cathain, … Harry Coppock. ICML 2026 (Oral). https://icml.cc/virtual/2026/oral/71104
**[30] AOrchestra: Automating Sub-Agent Creation for Agentic Orchestration.** FoundationAgents. ICML 2026. https://arxiv.org/abs/2602.03786
**[31] InfoPO: Information-Driven Policy Optimization for User-Centric Agents.** ICML 2026. https://arxiv.org/abs/2603.00656
**[32] AgentConductor: Topology Evolution for Multi-Agent Competition-Level Code Generation.** ICML 2026. https://icml.cc/virtual/2026/poster/66333
**[33] SafeHarbor: Hierarchical Memory-Augmented Guardrail for LLM Agent Safety.** ICML 2026. https://icml.cc/virtual/2026/poster/64556
**[34] The Oversight Game: Learning to Cooperatively Balance an AI Agent's Safety and Autonomy.** ICML 2026. https://arxiv.org/abs/2510.26752
**[35] When Benign Inputs Lead to Severe Harms: Unintended Harmful Behaviors in Computer-Use Agents.** ICML 2026. https://icml.cc/virtual/2026/poster/64242
**[36] ANCHOR: Automated Alignment Auditing for CLI Agents Detecting Real-World Harmful Outcomes.** ICML 2026. https://icml.cc/virtual/2026/poster/63234
**[37] CausalArmor: Efficient Indirect Prompt-Injection Guardrails via Causal Attribution.** ICML 2026. https://icml.cc/virtual/2026/poster/62590
**[38] Constitutional Black-Box Monitoring for Scheming in LLM Agents.** ICML 2026. https://icml.cc/virtual/2026/poster/65104
**[39] TRACER: Trajectory Risk Aggregation for Critical Episodes in Agentic Reasoning.** Ranganath Krishnan et al. (Capital One / UIC). ICML 2026. https://arxiv.org/abs/2602.11409
**[40] AIR: Improving Agent Safety through Incident Response.** ICML 2026. https://arxiv.org/abs/2602.11749
**[41] Architecture Matters for Multi-Agent Security.** ICML 2026. https://arxiv.org/abs/2604.23459
**[42] AgentSpec: Customizable Runtime Enforcement for Safe and Reliable LLM Agents.** ICSE 2026. https://arxiv.org/abs/2503.18666
**[43] Progent: Programmable Privilege Control for LLM Agents.** arXiv 2025. https://arxiv.org/abs/2504.11703
**[44] SafeMCP: Proactive Power Regulation via Environment-Grounded Look-Ahead Reasoning.** arXiv 2026. https://arxiv.org/abs/2606.01991
**[45] SWE-Bench Pro: Can AI Agents Solve Long-Horizon Software Engineering Tasks?** Xiang Deng, Jeff Da, … Brad Kenstler (Scale AI). ICML 2026. https://icml.cc/virtual/2026/poster/61047

---

*Compiled from a 45-paper harness-engineering survey of ICML 2026 (icml.cc/virtual/2026),
with abstracts fetched from arXiv and icml.cc. Papers labeled "preprint" or with non-ICML venues
are prior art / not-yet-confirmed and cited as such. Author lists shortened where the source
truncated them; verify on the linked page before formal citation.*
