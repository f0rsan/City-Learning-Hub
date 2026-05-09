# System Evaluation First Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shift Shenzhen Learning Hub from manual curation to an 80% system-driven activity value judgment engine with 20% human calibration.

**Architecture:** Keep the current React/Vite app, but introduce a domain layer for candidate discovery, evaluation signals, scoring, recommendation explanation, and calibration. Public pages read evaluated recommendations; admin pages inspect and calibrate system decisions instead of manually curating every activity.

**Tech Stack:** Vite, React, TypeScript, React Router, localStorage prototype store, Vitest, Testing Library, Playwright.

---

## Strategy Lock

The product is not an activity list. It is a decision system that helps users know whether an activity is worth attending before they go.

The operating principle is:

- 80% system judgment: source discovery, field extraction, source trust, organizer history, venue signal, historical pattern, public feedback signal, risk detection, recommendation explanation.
- 20% human calibration: low confidence, high risk, conflicting evidence, new source quality, rule correction.

Manual curation is not the main workflow. Human input is a calibration layer.

## Current Baseline

Already working:

- Public home page.
- Family and adult entry pages.
- Activity detail judgment page.
- Submission and correction pages.
- Lightweight admin page for submission status and correction display.
- Unit tests, build, and Playwright e2e.

Known gaps:

- Public pages still read static seed activities.
- Admin does not expose evaluation signals.
- Submissions do not become evaluated candidates.
- Corrections do not affect risk, trust, or status.
- No source pool.
- No system recommendation score.
- No confidence level or evidence breakdown in cards.
- No import/export for local prototype data.

## File Structure

Create or modify:

- `src/domain/evaluationTypes.ts`: evaluation signal, scoring, confidence, evidence, and calibration types.
- `src/domain/evaluationRules.ts`: deterministic scoring rules and recommendation explanation generation.
- `src/domain/candidateStore.ts`: local candidate activity storage and seed merge.
- `src/domain/sourcePool.ts`: first stable Shenzhen source pool.
- `src/domain/calibrationStore.ts`: human calibration notes and correction impact.
- `src/components/EvaluationBadge.tsx`: recommendation and confidence display.
- `src/components/EvidenceSummary.tsx`: source, organizer, venue, history, social, and risk evidence.
- `src/pages/AdminPage.tsx`: change from manual review queue to system evaluation and calibration console.
- `src/components/ActivityCard.tsx`: show recommendation reasons, risk reasons, confidence, and evidence.
- `src/components/ActivityDetail.tsx`: show full evaluation breakdown before official link.
- `tests/domain/evaluationRules.test.ts`: scoring and confidence rule coverage.
- `tests/domain/candidateStore.test.ts`: seed and local candidate merge coverage.
- `tests/pages/EvaluationAdmin.test.tsx`: calibration workflow coverage.
- `e2e/hub.spec.ts`: update browser flow to verify evaluated recommendations.

## Task 1: Git Baseline And Plan Guard

**Files:**

- Existing: all project files.

- [x] **Step 1: Initialize Git in the migrated folder**

Run:

```bash
git init
git add .
git commit -m "chore: baseline migrated Shenzhen learning hub"
```

Expected: a clean `main` branch with the migrated runnable project committed.

- [ ] **Step 2: Commit this strategy update**

Run:

```bash
git add docs
git commit -m "docs: shift hub strategy to system evaluation first"
```

Expected: strategy documents are committed separately from runtime code.

## Task 2: Add Evaluation Domain Model

**Files:**

- Create: `src/domain/evaluationTypes.ts`
- Create: `tests/domain/evaluationRules.test.ts`
- Modify: `src/domain/types.ts`

- [ ] **Step 1: Write failing tests for evaluation output**

Add tests that assert every evaluated activity has:

- recommendation level.
- confidence level.
- value reasons.
- risk reasons.
- evidence signals.
- separate family and adult fit.

Run:

```bash
npm run test:run -- tests/domain/evaluationRules.test.ts
```

Expected: FAIL because evaluation types and rules do not exist yet.

- [ ] **Step 2: Add evaluation types**

Implement types for:

- `SignalScore`
- `EvidenceSignal`
- `AudienceFit`
- `ActivityEvaluation`
- `RecommendationLevel`
- `ConfidenceLevel`
- `CalibrationNote`

- [ ] **Step 3: Verify type integration**

Run:

```bash
npm run build
```

Expected: TypeScript compiles.

## Task 3: Implement Rule-Based System Evaluation

**Files:**

- Create: `src/domain/evaluationRules.ts`
- Modify: `tests/domain/evaluationRules.test.ts`

- [ ] **Step 1: Write scoring tests**

Cover these cases:

- official source raises trust but does not automatically raise value.
- missing child safety blocks high-confidence family recommendation.
- cancelled activities are blocked.
- new organizer with good content can be medium confidence, not automatically low value.
- social signal cannot dominate the final score alone.

- [ ] **Step 2: Implement deterministic scoring**

Create functions:

- `evaluateActivity(activity, context)`
- `scoreSourceSignal(activity, source)`
- `scoreOrganizerSignal(activity, organizerHistory)`
- `scoreVenueSignal(activity, venueHistory)`
- `scoreContentSignal(activity)`
- `scoreRiskSignal(activity)`
- `deriveRecommendationLevel(evaluation)`
- `deriveConfidenceLevel(evaluation)`

- [ ] **Step 3: Verify scoring behavior**

Run:

```bash
npm run test:run -- tests/domain/evaluationRules.test.ts
npm run build
```

Expected: tests and build pass.

## Task 4: Build Candidate Activity Store

**Files:**

- Create: `src/domain/candidateStore.ts`
- Modify: `src/domain/localStore.ts`
- Create: `tests/domain/candidateStore.test.ts`

- [ ] **Step 1: Write failing candidate store tests**

Tests must cover:

- seed activities and local candidates are merged.
- duplicate slug or official URL is detected.
- submission can become a candidate draft.
- published candidates can appear in public recommendations only after evaluation.

- [ ] **Step 2: Implement local candidate store**

Use localStorage for first version, but keep the API replaceable:

- `getCandidateActivities()`
- `saveCandidateActivity(candidate)`
- `createCandidateFromSubmission(submissionId)`
- `updateCandidateStatus(id, status)`
- `resetCandidateData()`

- [ ] **Step 3: Verify candidate store**

Run:

```bash
npm run test:run -- tests/domain/candidateStore.test.ts
npm run test:run
```

Expected: all tests pass.

## Task 5: Replace Manual Admin With Evaluation Console

**Files:**

- Modify: `src/pages/AdminPage.tsx`
- Create: `src/components/EvidenceSummary.tsx`
- Create: `src/components/EvaluationBadge.tsx`
- Create: `tests/pages/EvaluationAdmin.test.tsx`

- [ ] **Step 1: Write failing admin tests**

Tests must verify:

- admin shows system recommendation level.
- admin shows confidence level.
- admin shows value reasons and risk reasons.
- admin can confirm, lower confidence, reject, or send to calibration.
- admin can convert an approved submission into a candidate draft.

- [ ] **Step 2: Implement evaluation console UI**

Admin sections:

- System recommended.
- Needs calibration.
- Candidate drafts.
- Corrections affecting trust.
- Source pool health.

- [ ] **Step 3: Verify admin workflow**

Run:

```bash
npm run test:run -- tests/pages/EvaluationAdmin.test.tsx
npm run build
```

Expected: tests and build pass.

## Task 6: Update Public Cards And Details To Explain System Decisions

**Files:**

- Modify: `src/components/ActivityCard.tsx`
- Modify: `src/components/ActivityDetail.tsx`
- Modify: `tests/pages/HomePage.test.tsx`
- Modify: `tests/pages/ActivityPage.test.tsx`

- [ ] **Step 1: Write failing public page tests**

Tests must verify:

- card shows recommendation level.
- card shows confidence level.
- card shows at least one value reason.
- card shows at least one risk reason when present.
- detail page shows evidence breakdown before official link.

- [ ] **Step 2: Update public components**

Cards and detail pages should display:

- why worth going.
- why may not fit.
- source trust.
- organizer signal.
- venue signal.
- historical or social signal when available.
- confidence level.

- [ ] **Step 3: Verify public pages**

Run:

```bash
npm run test:run -- tests/pages/HomePage.test.tsx tests/pages/ActivityPage.test.tsx
npm run build
```

Expected: tests and build pass.

## Task 7: Wire Submissions And Corrections Into Evaluation

**Files:**

- Modify: `src/domain/localStore.ts`
- Modify: `src/pages/SubmitActivityPage.tsx`
- Modify: `src/pages/CorrectionPage.tsx`
- Modify: `tests/pages/SubmitAndAdmin.test.tsx`

- [ ] **Step 1: Write failing workflow tests**

Tests must verify:

- submitted activity becomes a candidate, not a public recommendation.
- correction can mark link failure, cancellation, time change, or venue change.
- correction affects risk/confidence after processing.

- [ ] **Step 2: Implement correction impact**

Correction types should map to structured impacts:

- cancellation lowers status to cancelled.
- link failure lowers source confidence.
- time or venue change lowers confidence until reconfirmed.
- repeated correction raises risk.

- [ ] **Step 3: Verify workflow**

Run:

```bash
npm run test:run -- tests/pages/SubmitAndAdmin.test.tsx
npm run e2e
```

Expected: tests and browser flow pass.

## Task 8: Add Source Pool And Simulated Auto-Collection Queue

**Files:**

- Create: `src/domain/sourcePool.ts`
- Create: `src/domain/collectionQueue.ts`
- Create: `tests/domain/collectionQueue.test.ts`
- Modify: `src/pages/AdminPage.tsx`

- [ ] **Step 1: Write failing source queue tests**

Tests must verify:

- stable sources can be listed.
- a collection run creates candidate records.
- source failures are recorded.
- collected candidates require evaluation before public display.

- [ ] **Step 2: Implement prototype source pool**

Start with manually maintained source definitions. Do not scrape live websites in this task. The goal is to model the pipeline safely.

- [ ] **Step 3: Verify source queue**

Run:

```bash
npm run test:run -- tests/domain/collectionQueue.test.ts
npm run build
```

Expected: tests and build pass.

## Task 9: Add Data Export And Import

**Files:**

- Create: `src/domain/exportImport.ts`
- Modify: `src/pages/AdminPage.tsx`
- Create: `tests/domain/exportImport.test.ts`

- [ ] **Step 1: Write failing export/import tests**

Tests must verify:

- export includes candidates, evaluations, submissions, corrections, calibrations, and source health.
- import validates shape before writing.
- malformed import is rejected.

- [ ] **Step 2: Implement export/import**

Add JSON export and import functions for local prototype data.

- [ ] **Step 3: Verify backup flow**

Run:

```bash
npm run test:run -- tests/domain/exportImport.test.ts
npm run test:run
```

Expected: all tests pass.

## Task 10: End-To-End System Judgment Verification

**Files:**

- Modify: `e2e/hub.spec.ts`

- [ ] **Step 1: Update Playwright tests**

Browser tests must cover:

- home page shows evaluated recommendations.
- detail page shows value reasons, risk reasons, evidence, and confidence.
- submission enters candidate queue.
- calibration changes recommendation or confidence.
- mobile layout remains readable.

- [ ] **Step 2: Run full verification**

Run:

```bash
npm run test:run
npm run build
npm run e2e
```

Expected: all checks pass.

## Confidence Loop

Before implementation starts, verify these statements:

- The product center is system judgment, not manual curation.
- Human work is calibration and exception handling, not mandatory activity editing.
- Public recommendations must include evidence and confidence.
- Social feedback is only one signal and cannot dominate alone.
- Official source improves trust but does not guarantee value.
- New organizers can be recommended with lower confidence rather than being rejected.
- A candidate must not become public solely because it was submitted.
- Every recommendation must explain both value and risk.

If any statement is contradicted by code or docs, fix docs first before implementation.
