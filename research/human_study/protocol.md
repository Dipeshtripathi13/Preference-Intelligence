# Human-study protocol

Working title: *Cross-model, domain-conditioned response personalization*

Status: **draft for institutional review; no participants have been recruited and
no IRB/ethics approval is claimed.** Obtain the applicable IRB, research ethics,
or exempt-status determination before recruitment or pilot data collection with
people. Local law, institutional policy, provider terms, and data agreements take
precedence over this template.

## Objective

Estimate whether a provider-independent, dynamically learned,
domain-conditioned preference profile improves a user's evaluation of new LLM
responses, compared with no personalization, static global personalization,
history retrieval, and dynamic global personalization.

## Design

The proposed study is a randomized, blinded, incomplete-block, within-participant
experiment. Each participant completes:

1. eligibility, consent, and privacy comprehension;
2. preference/domain expertise elicitation;
3. a short teaching phase containing normal prompts and explicit corrections;
4. new evaluation tasks in at least two domains with differing self-rated
   familiarity;
5. blinded single-response ratings and pairwise comparisons;
6. a transparency/correction exercise and debrief.

Conditions A--E are defined in `../experiments/experimental_design.md`. The
primary comparison is E versus A. An incomplete block limits fatigue; the
allocation is generated before the session from a recorded seed and balances
condition, provider, domain, task, response position, and order.

## Participants

### Proposed inclusion criteria

- age of legal adult consent in the study jurisdiction;
- fluent enough in the study language to judge response style and understanding;
- prior use of a text-based AI assistant at least once;
- able to identify two included task domains with different familiarity levels;
- provides informed consent.

### Proposed exclusions

Thresholds must be finalized before condition labels are accessed. Candidate
reasons include duplicate participation, failed consent comprehension, automated
responses, failure of multiple instructed-response items, insufficient completed
evaluation blocks, or withdrawal. Disagreement with the system or preference for
unpersonalized answers is never an exclusion.

Avoid recruitment claims about vulnerable populations until the protocol is
specifically reviewed for them. Recruitment copy must not promise that the system
will understand participants or improve their AI experience.

## Procedures

### Elicitation (approximately 8 minutes)

Participants rate familiarity in the available domains and select two contrasting
domains. They choose/edit response preferences from the bounded, non-sensitive
dimensions and may leave any preference unknown. A free-text field is screened
for accidental personal information before research export.

### Teaching phase (approximately 10 minutes)

Participants interact with calibration prompts and can correct presentation (for
example, "shorter" or "give an example"). The interface identifies what will be
treated as preference evidence. Assistant-authored statements and retrieved page
content are not accepted as evidence.

### Evaluation (approximately 25 minutes)

On held-out tasks, participants see debranded answers in randomized order. They
first rate answers independently, then complete a subset of pairwise choices.
Condition, provider, and profile context are hidden. They can flag factual or
safety concerns and skip any task.

### Transparency exercise (approximately 7 minutes)

After primary ratings, participants inspect a selected-preference explanation,
identify an incorrect or unwanted inference if present, and edit, lock, delete,
or disable it. This measures control and correction usability without unblinding
the primary quality ratings.

### Debrief (approximately 5 minutes)

Explain the conditions, synthetic/learned profile distinction, model fallibility,
data retention, and withdrawal process. Do not reveal sensitive inferences because
the system is prohibited from making them.

## Outcomes

The primary endpoint is the blinded E-versus-A response preference. Secondary
outcomes are 7-point overall quality, usefulness, clarity, preference adherence,
personalization, relevance, satisfaction, and perceived understanding; bipolar
depth and detail appropriateness; behavioral constraint adherence; correction
success; and trust/control after transparency. See `questionnaire.md` and
`../experiments/metrics.md`.

## Blinding and randomization

Responses are stripped of provider branding and presentation artifacts that
would reveal condition where possible. A separate allocation table maps opaque
response IDs to condition. Participants and first-pass annotators do not access
compiled contexts. Analysts finalize preprocessing and primary model code against
masked condition labels. Blinding success is assessed only after primary ratings.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Accidental disclosure in prompts | Instruct participants not to enter secrets, provide synthetic task contexts, allow review/deletion before submission. |
| Sensitive or harmful model output | Exclude high-stakes advice tasks; monitor and flag outputs; provide skip/report controls; preserve safety instructions in every condition. |
| Incorrect inferred preference | Show learned values only after primary ratings; allow edit/delete/lock; do not infer protected traits. |
| Psychological discomfort or frustration | Voluntary tasks, break/withdraw controls, clear statement that model failures do not reflect participant ability. |
| Cross-provider data transfer | Use synthetic evaluation prompts; disclose each processor/provider; do not send the participant profile to a provider without approved consent and minimization. |
| Re-identification | Random IDs, separate contact/compensation data, minimized free text, access control, retention limit. |

This is expected to be no more than minimal risk only if the institution makes
that determination and the final task/provider/data flow supports it.

## Data handling

- Collect the minimum: random participant ID, broad domain familiarity,
  participant-authored preference evidence, ratings, timing/quality flags, and
  model/run metadata.
- Do not collect names in research records. Store contact/payment details in a
  separate system with a separate key.
- Default to synthetic task content and warn against personal, confidential,
  employer, health, financial, or legal details.
- Encrypt transport and institutional storage; restrict access to named research
  staff; audit exports.
- Define exact retention periods and deletion procedures in the submitted
  protocol and consent. The template leaves them as fields, not promises.
- Publish only de-identified data covered by consent. Review free text before
  release and consider withholding raw text if de-identification is unreliable.
- API providers are data processors/recipients, not anonymous infrastructure;
  document their actual retention settings and agreements before enrollment.

## Compensation and withdrawal

Compensation must be proportionate to the estimated duration, disclosed before
consent, and not contingent on giving complete or favorable responses. Define
whether prorated payment is available after withdrawal. Participants can withdraw
during the session. The consent form must state the practical deadline after
which already anonymized/aggregated data may no longer be removable.

## Quality control

Use comprehension and instructed-response checks sparingly. Record technical
failures and skipped items. Conduct rater training on a separate calibration set.
Do not exclude fast participants solely from a post hoc time cutoff. A study log
records deviations, outages, model-version changes, and adverse events.

## Analysis and sample size

Follow `../experiments/statistical_analysis_plan.md` and the simulation-based
`../experiments/power_analysis_plan.md`. Freeze the allocation, exclusions,
smallest effect of interest, non-inferiority margin, and analysis commit before
unblinding. Pilot feasibility results are not pooled into the confirmatory study
unless a blinded, prespecified rule permits it.

## Required approvals and readiness checklist

- [ ] IRB/ethics/exemption determination documented.
- [ ] Final consent, recruitment copy, compensation, and withdrawal procedure approved.
- [ ] Provider data handling and cross-border processing reviewed.
- [ ] Data management plan names retention periods and access roles.
- [ ] Accessibility and incident-response procedures tested.
- [ ] Benchmark factual reference points independently reviewed.
- [ ] Mock and limited API pilots completed without human data.
- [ ] Power simulation and preregistration frozen.
- [ ] No empirical claim is published before the masked analysis is complete.
