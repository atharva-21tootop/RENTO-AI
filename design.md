# RetinoCare AI — Frontend Design System
## Structured by Route Group: `public/` and `dashboard/`

> This replaces the feature-based structure with the actual app structure: the
> **public marketing site** (unauthenticated, storytelling-driven) and the
> **dashboard/app** (authenticated, task-driven). These two halves of the product
> intentionally use different design languages — don't apply hero/scanner/wow-
> element treatment to the dashboard, and don't apply dense form/table density to
> the public site.

---

# PART A — `public/`

Routes: `/`, `/about`, `/how-it-works`, `/features`, `/contact`

This is the storytelling half of the product — animated, scroll-driven, built to
convince a judge or a PHC decision-maker in under 10 seconds. Full detail for
every component below (exact animation timing, color tokens, copy, wow elements)
lives in the previously delivered feature-based `design.md` — this section is a
condensed page-by-page index into that content so `public/` has one clear home.

## A.0 Public Pages at a Glance (one-line brief per page)

A single quick-reference summary of all five public pages — use this for a fast
overview; the full build-out for each page is in A.2–A.6 below.

| Page | Route | Purpose (one line) | Primary Goal |
|---|---|---|---|
| **Home** | `/` | Answers "what is this, who's it for, why does it matter" within 10 seconds, then walks the visitor through the problem, the solution pipeline, a live AI demo, and impact stats. | Convince a first-time visitor (judge, PHC decision-maker) the product is real and credible. |
| **About** | `/about` | Tells the origin story — why this was built, the design principles behind it, the tech architecture, and the team. | Build trust and depth beyond the homepage pitch. |
| **How It Works** | `/how-it-works` | A step-by-step, scroll-driven walkthrough of the actual screening workflow (Capture→Upload→Analyze→Review→Refer), plus an interactive click-through demo. | Make the workflow concrete and tangible, not abstract. |
| **Features** | `/features` | A bento-grid product showcase of individual capabilities (AI screening, risk classification, referral workflow, security, explainability). | Let a technical or clinical evaluator scan capabilities quickly. |
| **Contact** | `/contact` | A simple contact form plus FAQ, framed as a "healthcare coordination center" rather than a generic contact page. | Give visitors (partners, hospitals, researchers) a low-friction way to reach the team. |

**Shared thread across all five:** every page ultimately reinforces the same
one-line direction — *Eye → AI → PHC → Healthcare Worker → Specialist → Earlier
Action* — and the same non-negotiables: no fake accuracy numbers, no unsupported
medical claims, AI results always labeled as assistive, human-in-the-loop always
visible somewhere on the page.

## A.1 Shared Across All Public Pages

- **Header:** transparent over hero → blurred floating header on scroll. Same
  nav on every public page: Home · How It Works · Features · About · Contact ·
  [Sign In] [Get Started].
- **Footer:** dark navy, same on every public page (Platform / Company /
  Resources columns + subtle network graphic).
- **Design tokens:** Deep Navy `#071A2B`, Electric Teal `#00C9B7`, Vision Cyan
  `#4DE8FF`, Soft Amber `#FFCA6B`, Soft White `#F7FAFC`. Typography: Inter (UI/
  body) + Space Grotesk (display/headlines).
- **Medical disclaimer** must appear anywhere an AI result is shown, even in
  demo form: *"AI-assisted screening result. Not a standalone medical diagnosis.
  Clinical decisions should be made by qualified healthcare professionals."*
- **Motion:** GSAP/ScrollTrigger or Framer Motion, scroll-reveal driven, generous
  whitespace, no aggressive animation. Respect `prefers-reduced-motion`.

## A.2 `/` (Home)

```text
Header → Hero (animated RetinaScanner + eye visual) → Trust Strip →
Problem Section (3 cards) → Problem→Solution transformation animation →
Solution Pipeline (Capture→Analyze→Classify→Review→Refer) →
Live AI Visualization (labeled DEMO) → Who Benefits (3 personas) →
Rural Healthcare Network (India silhouette + PHC nodes) →
Impact Stats (real numbers: 77M+ diabetics, ~18% DR prevalence, 90% preventable
vision loss, 1:100,000 ophthalmologist ratio) → Final CTA →
PHC Network "wow" element → Footer
```

Hidden interaction: hovering the hero eye ~1s reveals "AI CAN SEE MORE... but
healthcare professionals decide what happens next."

## A.3 `/about`

```text
Header → About Hero ("Technology should reduce the distance between a patient
and the right care") → The Why (real narrative, can cite the ophthalmologist-
ratio stat here) → Design Principles (Accessibility, Simplicity, Explainability,
Human-in-the-loop) → Technology Architecture diagram (animated) →
Team ("mission wall", expands on hover) → CTA → Footer
```

## A.4 `/how-it-works`

```text
Header → Hero ("Five steps. One screening workflow.") →
Vertical scroll-activated step timeline:
  01 Capture (image quality meter animates)
  02 Upload (device → server progress)
  03 AI Analysis (most visually impressive — scan line, vessel detection,
     feature extraction, classification, risk estimation)
  04 Result (sample result card, labeled DEMO)
  05 Refer (healthcare pathway diagram)
→ Interactive Simulation ([Start Demo] → 5 scripted scenes, labeled
  INTERACTIVE DEMONSTRATION, frontend-only, no real backend call) →
FAQ Accordion → CTA → Footer
```

## A.5 `/features`

```text
Header → Feature Hero ("Everything needed for AI-assisted retinal screening") →
Bento Grid:
  AI-Assisted Screening (large) | PHC-Ready
  Image Analysis | Risk Classification
  Referral Workflow | Patient History / Secure Data / Explainable Results
→ CTA → Footer
```

Each card: AI Screening reuses the RetinaScanner; Risk Classification uses the
animated gauge (Low/Moderate/High); Explainable Results shows actual detected
indicators, never a bare "Disease: YES"; Secure Data never claims uncertified
compliance (e.g. no "100% HIPAA compliant" unless genuinely true).

## A.6 `/contact`

```text
Header → Contact Hero ("Have a question about the platform?") →
Contact Options (General / Technical Support / Collaboration) →
Contact Form (Name, Email, Organization, Reason, Message — 5 fields max,
  Send Message → Sending... → ✓ Message received) →
FAQ Accordion (shared component with How It Works) → Footer
```

---

# PART B — `dashboard/`

Routes (per your actual app): `/dashboard/phc`, `/dashboard/new-screening`,
`/dashboard/patients`, `/dashboard/screening-history`,
`/dashboard/screening-reports`, `/dashboard/phc-profile`

This is the **authenticated, task-driven** half of the product — a healthcare
worker using this daily, not a visitor being persuaded. Priorities flip
completely from Part A: **speed, density, clarity, zero decorative animation**
over storytelling. This section did not exist in the original creative spec
(which only covered the public site) — it's defined here from the actual shipped
UI (per your screenshots) so it has a real spec instead of being improvised
page-by-page.

## B.1 Dashboard Shell (shared across every dashboard page)

**Layout:** fixed dark sidebar (left) + fluid main content area (right).

```text
┌────────────────┬──────────────────────────────────────────┐
│  SIDEBAR        │  TOPBAR (breadcrumb / PHC name chip)     │
│  (dark navy)    ├──────────────────────────────────────────┤
│                 │                                          │
│  Logo           │  PAGE CONTENT (white/light background)   │
│  Nav items      │                                          │
│  ...            │                                          │
│                 │                                          │
│  User/session   │                                          │
│  (bottom)       │                                          │
└────────────────┴──────────────────────────────────────────┘
```

**Critical layout rule (fixes the cut-off bug):** the main content column must
be a flex/grid child with `min-w-0` (Tailwind) or an equivalent `min-width: 0` —
a fixed-width sidebar next to a content area without this will clip content at
the viewport edge instead of letting it shrink/wrap, exactly like the PHC
Profile form currently does. Every dashboard page inherits this from the shared
shell, so fix it once at the layout level, not per-page.

**Sidebar:**
- Background: Deep Navy `#071A2B`.
- Logo + product name top-left ("RetinoCare / PHC DR SCREENING AI").
- Section label "MAIN NAVIGATION" in muted small caps.
- Nav items: PHC Dashboard, New Screening (badged "AI Screening" in teal pill),
  Patients, Screening History, Screening Reports, PHC Profile & Settings.
- Active nav item: filled Electric Teal background (`#00C9B7`) or teal-bordered
  highlight, not just a text color change — must be unambiguous at a glance.
- Bottom: session/user chip (avatar initial, name, "Authenticated" status with a
  small verified icon), sign-out affordance.

**Topbar:** shows current PHC identity as a pill/chip (e.g. "Alandi PHC
(PHC-MH-QW-098)") so a healthcare worker always knows which PHC context they're
operating in — this matters when a single login may relate to more than one PHC
down the line.

**Content cards:** white background, rounded corners (consistent with the
`border-radius: 20px` / thin border token from the public site, but with
noticeably less padding/whitespace than public marketing cards — this is a
working tool, not a landing page).

**Color usage in dashboard specifically:**
- Deep Navy: sidebar, active states.
- Electric Teal: primary actions, active nav, success/verified badges.
- Soft White background for main content; avoid dark mode by default here
  unless explicitly toggled — clarity and scan-speed matter more than mood.
- Status colors (new, not in the original palette, needed for dashboard use):
  define a consistent **success/verified green**, **warning/attention amber**
  (`#FFCA6B` already fits this), and **error/red** for form validation and
  quality-check failures — do not invent ad hoc colors per page.

**Motion in the dashboard:** minimal. Only functional feedback:
- Button press/hover micro-states (same 150–250ms token as public site).
- Loading indicators for async operations (image upload, AI analysis running).
- No scroll-reveal, no parallax, no decorative animation — a healthcare worker
  should never wait on an animation to complete a task.

**Forms (all dashboard forms — PHC Profile, Patient registration, etc.):**
- Clear required-field marking (`*`).
- Inline validation, not just on-submit.
- Never let a field's content be visually clipped — every input must be allowed
  to shrink to its container width (see the layout rule above).
- Submit buttons: same primary button token as public site (Electric Teal
  fill), but sized for a dense form, not a hero CTA.

## B.2 `/dashboard/phc` (PHC Dashboard)

Landing page after login. Overview cards / at-a-glance stats for the PHC:
recent screenings, pending reviews, patient count, quick links into New
Screening. Keep this scannable in a few seconds — this is a daily-use home
screen, not a marketing impact section.

## B.3 `/dashboard/new-screening` (New Screening / AI Screening)

The core operational workflow — matches the earlier backend contract exactly:

```text
Patient Context (select existing patient, or + Register New) →
Select Eye Examined (Left/Right) →
Retinal Fundus Image Upload (drag/drop or file picker, JPG/JPEG/PNG, max 10MB) →
[Analyze Retinal Image with AI]
```

States the UI must visibly handle (these map directly to backend response
states, not decorative UI states):
- Upload in progress.
- Image quality **poor** → recapture message with the specific issue(s) from
  `image_quality.issues` (including the fundus-validity check, if implemented).
- Image quality **good**, AI processing in progress (a compact loading
  indicator — reuse the "AI ENGINE ONLINE / ANALYZING IMAGE / ANALYSIS COMPLETE"
  status pattern from the public site's shared component, since it's a good fit
  here too).
- Completed result: DR grade + label, confidence, Grad-CAM heatmap
  (Original / Grad-CAM / Side-by-Side toggle, as already shown in your actual
  build), risk level + recommendation, "Generate Printable Report" action.
- Any demo/testing-only controls (sample image buttons, "force quality
  failure") must be visually distinct from the real workflow (e.g. a clearly
  bordered "Demo Testing Controls" box, as already present) so they're never
  mistaken for production behavior by an actual healthcare worker.

Medical disclaimer must appear on the result view here too, same wording as the
public site.

## B.4 `/dashboard/patients`

List/search of registered patients. Table or card list — table is likely more
appropriate here given the density this page needs (ID, name, age/gender,
diabetes duration, screening count, last screened date). Include a clear
"+ Register New Patient" action, consistent with the one already available
inline on the New Screening page.

## B.5 `/dashboard/screening-history`

List of past screenings with filters (patient, risk level, grade, date range).
Each row should surface risk level with a color-coded badge (Low/Monitor/High/
Urgent/Recapture) — reuse the same badge treatment as the result view in B.3
rather than inventing a new visual language for risk here.

## B.6 `/dashboard/screening-reports`

Report data / printable reports. Keep secondary to the P0 screening flow —
per the original backend priority ordering, don't let this page's complexity
grow past what the current backend actually returns.

## B.7 `/dashboard/phc-profile` (PHC Profile & Settings)

The page shown in your screenshot. Fields: PHC Name, State, Full Address,
Contact Number, verification status indicator, Save action. This page is the
one to fix first for the layout bug (B.1's layout rule) since it's the most
visibly broken right now — every field and the page heading itself are
currently clipped off-screen.

---

# PART C — What NOT to Cross-Contaminate

- Do not bring hero animations, scanning rings, wow-element hover reveals, or
  scroll-storytelling into any `dashboard/` page — a healthcare worker mid-task
  should never wait on or be distracted by decorative motion.
- Do not bring dashboard information-density (tables, dense forms, status
  badges) into `public/` pages — the public site's job is persuasion in 10
  seconds, not data entry.
- Both halves share only: the color tokens, the typography pairing, the button
  system, the medical disclaimer wording, and the AI status indicator pattern
  (`● AI ENGINE ONLINE` / `◌ ANALYZING IMAGE` / `✓ ANALYSIS COMPLETE`) — because
  that one small component genuinely fits both a marketing demo and a real
  in-progress screening.
