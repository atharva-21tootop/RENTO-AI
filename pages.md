# RetinoCare AI — `public/` Pages Content Brief
## Every section · every animation · exactly what content you still need to fill in

> **How to read this doc:** each page is broken into its sections in scroll
> order. Each section has: **Animation** (exact motion spec), **Draft Copy**
> (usable now, written from real research — see §0), and a **CONTENT NEEDED**
> flag telling you precisely what's missing and can't be invented by anyone but
> you/your team.
>
> Research grounding: real DR-screening products (Eyenuk/EyeArt — FDA-cleared
> autonomous AI screening; AEYE Health — portable point-of-care screening;
> Remidio Fundus-on-Phone — India-specific handheld camera + AI, explicitly
> markets "clinical decision support tools that keep clinicians in control");
> and current (2026) SaaS landing page research (headlines under 8 words /
> ~44 characters convert best; real product screenshots outperform stock
> photos and abstract 3D art; trust signals placed near CTAs lift conversion;
> bento grids for scanning multiple features quickly; pages written at a
> 5th–7th grade reading level convert far better than dense copy).

---

# 0. Non-Negotiable Content Rules (apply to every page below)

1. **Never invent a number.** The only hard stats you're allowed to state as
   fact anywhere on the site are the ones already grounded in the real SIH
   problem statement (77M+ diabetic adults in India, ~18% DR prevalence, 90%
   preventable vision loss, ~1 ophthalmologist per 100,000 rural population).
   Anything about *this specific system's* accuracy/sensitivity/specificity
   must come from your own team's actual validation results once they exist —
   until then, say "designed to target >90% sensitivity / >85% specificity for
   referable DR," framed as a design goal, not an achieved result.
2. **Never claim a certification you don't have** (FDA-cleared, ISO, HIPAA-
   compliant, clinically validated) unless it is genuinely true and documented.
   Real competitors (Eyenuk, AEYE Health) lead with "FDA-cleared" because they
   actually have it — don't borrow that language without the same backing.
3. **Every AI result shown, even as a demo, needs the disclaimer:**
   *"AI-assisted screening result. Not a standalone medical diagnosis. Clinical
   decisions should be made by qualified healthcare professionals."*
4. **Screenshots over stock photos, and over abstract gradients/3D shapes.**
   Once you have a working screening flow, real product screenshots (cropped,
   stylized if needed) will out-convert both stock photography and decorative
   abstract art — this applies directly to the Live AI Visualization (Home)
   and the Features bento grid.
5. **Headlines: under ~8 words, plain language.** Every H1 in this doc is
   already written to this constraint — don't lengthen them when filling in
   real copy.

---

# 1. HOME (`/`)

**Page goal:** answer "what is this / who's it for / why does it matter" in
under 10 seconds, then walk the visitor through problem → solution → proof →
impact → action.

## 1.1 Header (persistent across all pages — defined once here)

**Animation:** logo fades in → nav items slide upward → CTA buttons scale
0.95→1, sequenced on load. On scroll past 40px: transparent → blurred floating
header (`backdrop-filter: blur()`, slight shadow, smooth transition).

**Draft copy:**
```text
Logo: RetinoCare AI
Nav: Home · How It Works · Features · About · Contact
CTA: [Sign In]  [Get Started]
```

**CONTENT NEEDED:** final product name (confirm "RetinoCare" vs "RetinaCare" —
both appear across your own materials so far; pick one and use it everywhere).
Final logo mark/SVG.

## 1.2 Hero

**Animation:** eye outline draws itself (SVG stroke-dashoffset) → retina
appears → scanning ring activates → AI nodes appear → detection markers appear
→ "AI ANALYSIS READY" label fades in. Loops slowly, never aggressively.
Hidden interaction: hover the eye ~1s → "AI CAN SEE MORE" → "But healthcare
professionals decide what happens next."

**Draft copy (headline under 8 words, per research):**
```text
H1: See Diabetic Retinopathy Risk, Sooner
Sub: AI-assisted retinal screening built for Primary Health Centres —
     where specialists can't always reach.
CTA: [Start Screening]   [See How It Works]
```

**CONTENT NEEDED:** none — this is ready to use, but confirm the H1 tone
matches your team's preferred phrasing (this is a draft, not final copy).

## 1.3 Trust Strip

**Animation:** small icons + animated counters, appears just below hero.

**Draft copy:**
```text
Designed for PHCs · AI-Assisted · Fast Screening
Secure Patient Data · Human Review · Rural-Ready
```

**CONTENT NEEDED:** none for copy. If you later have real numbers (e.g. "X
screenings completed in testing," "Y PHCs piloting"), this strip is exactly
where SaaS research says trust signals convert best — placed immediately after
the hero, before the visitor has to scroll far.

## 1.4 The Problem

**Animation:** scroll-triggered transformation — the broken path fades in
first, then morphs into the product's path (see 1.5).

**Draft copy:**
```text
Headline: The Bottleneck Isn't Patients. It's Screening.
Card 1 — Specialist Access: Retinal specialists aren't available everywhere.
Card 2 — Delayed Detection: Damage often occurs before symptoms appear.
Card 3 — Screening Bottleneck: Manual screening can't scale to match demand.
```

**CONTENT NEEDED:** optionally strengthen Card 1 with the real ratio stat from
§0 ("~1 ophthalmologist per 100,000 rural population") if you want a specific
number here instead of a general statement — your call on whether the general
version or the cited version reads better in this spot.

## 1.5 Problem → Solution Transformation

**Animation:** `Specialist → ❌ → Remote PHC → Patient` morphs on scroll into
`Patient → PHC → AI Screening → Risk Assessment → Specialist Referral`.

**Draft copy:** diagram labels only, no paragraph copy needed — the animation
itself carries the message.

**CONTENT NEEDED:** none.

## 1.6 Solution Pipeline

**Animation:** horizontal pipeline, each stage activates as user scrolls past
it.

**Draft copy:**
```text
Headline: From Retinal Image to Actionable Insight
CAPTURE → ANALYZE → CLASSIFY → REVIEW → REFER
```

**CONTENT NEEDED:** none.

## 1.7 Live AI Visualization

**Animation:** dark "lab" section, static/looping demo, not scroll-linked.

**Draft copy:**
```text
Label (must stay visible): DEMO VISUALIZATION — NOT A MEDICAL DIAGNOSIS
Left: RETINAL ANALYSIS [Image]
Right: AI ANALYSIS
       Risk Level: Moderate
       Confidence: 94.2%
       Detected Indicators: ● Microaneurysm ● Hemorrhage ● Exudate
       Recommendation: Specialist review recommended.
```

**CONTENT NEEDED — this is your biggest single gap:** per research finding #4
above, this section converts far better with a **real screenshot from your
actual working screening flow** than with an illustrated mockup. Once
`/dashboard/new-screening` produces a real (even mock-adapter) result, crop
that into this section instead of a designed placeholder. Until then, keep the
label extremely visible so nobody mistakes the illustrated version for a real
result.

## 1.8 Who Benefits

**Animation:** subtle animated illustrations per persona, reveal-on-scroll.

**Draft copy:**
```text
Healthcare Worker: Capture retinal image → Upload → Receive AI-assisted result
Doctor:            Review → Interpret → Refer
Patient:           Screen → Understand → Act Earlier
```

**CONTENT NEEDED:** none for copy, but §0 rule #4 applies — if you have any
real photography of Indian healthcare workers/PHC settings (not staged stock),
this is a good spot; otherwise keep it illustration-based.

## 1.9 Rural Healthcare Network

**Animation:** simplified India silhouette, PHC nodes animate in on scroll:
`Village → PHC → District Hospital → Specialist`.

**Draft copy:**
```text
Headline: Built for Where Specialists Aren't
```

**CONTENT NEEDED:** if you want to name real target states/districts (e.g. tied
to your PHC seed data — "Alandi PHC," Maharashtra, per your dashboard
screenshots), decide now whether the public site should reference specific
real PHC names/locations or stay generic — this is a product decision, not a
design one.

## 1.10 Impact Numbers

**Animation:** large typography, animated counters.

**Draft copy (only real, citable numbers — see §0 rule #1):**
```text
77M+       Diabetic adults in India
~18%       Affected by Diabetic Retinopathy
90%        Of vision loss preventable with early screening
1:100,000  Ophthalmologist-to-rural-population ratio
```

**CONTENT NEEDED:** none — these are already sourced from your real problem
statement. Do not add a 5th stat about your own system's performance until you
have a real validated number.

## 1.11 Final CTA

**Animation:** dark section, simple fade-in, no scroll gimmicks.

**Draft copy:**
```text
Headline: Make Early Eye Screening Part of Primary Care
Sub: AI can help identify risk. Healthcare professionals make the decision.
CTA: [Explore the Platform]   [See How It Works]
```

**CONTENT NEEDED:** none.

## 1.12 PHC Network "Wow" Element

**Animation:** self-connecting node network at page bottom; hover a node →
"PRIMARY HEALTH CENTRE — Connected screening point."

**CONTENT NEEDED:** decorative only — no real content required, but same
real-vs-generic-location decision as §1.9 applies if you want it to feel like
an actual live network rather than an illustrative one.

## 1.13 Footer (persistent — defined once here)

**Draft copy:**
```text
RetinoCare AI
AI-assisted retinal screening for primary healthcare.

Platform: Home · Features · How It Works
Company: About · Contact
Resources: Documentation · Privacy · Terms

© 2026 RetinoCare AI
Built for accessible healthcare.
AI-assisted screening • Human-led care
```

**CONTENT NEEDED:**
- **Privacy Policy and Terms of Service pages/links** — currently referenced
  in the footer but not designed anywhere in this spec. Even a hackathon demo
  should have at least a placeholder page here rather than a dead link,
  especially since the product handles patient health data.
- Confirm whether "Documentation" links anywhere real yet.

---

# 2. ABOUT (`/about`)

**Page goal:** build trust and depth beyond the homepage pitch — tell the real
story, not "we are a team passionate about healthcare."

## 2.1 About Hero

**Animation:** animated path `Patient → PHC → AI → Healthcare Professional →
Specialist`, simple fade/draw-on.

**Draft copy:**
```text
H1: Closing the Distance to the Right Care
Sub: RetinoCare AI was built around one challenge: making diabetic
     retinopathy screening accessible at the primary-care level.
```

**CONTENT NEEDED:** none for the draft, but this is the single most "voice of
the team" section on the site — consider having a real team member rewrite
this in their own words rather than shipping the draft as-is.

## 2.2 The Why

**Animation:** split layout, large typography left, story right, simple
reveal-on-scroll.

**Draft copy:**
```text
Left (large type): WHY WE BUILT THIS

Right: Diabetic retinopathy can progress silently. In India, screening access
is deeply uneven — with roughly one ophthalmologist for every 100,000 people
in rural areas, mass manual screening isn't feasible. Primary Health Centres
are already closer to patients than any specialist ever will be. AI can help
close that gap — flagging risk early enough to matter, and explaining why,
so a healthcare worker or doctor can act with confidence. AI should support
clinical decisions, never replace them.
```

**CONTENT NEEDED:** none — ready to use, grounded in the real §0 stats.

## 2.3 Design/Product Principles

**Animation:** simple card reveal, no special treatment needed.

**Draft copy (verbatim, reused from design.md — do not diverge wording):**
```text
Accessibility — Designed for environments with limited specialist access.
Simplicity — A healthcare worker should not need technical expertise.
Explainability — The system communicates why a result requires attention.
Human-in-the-loop — AI assists. Healthcare professionals remain responsible
  for clinical decisions.
```

**CONTENT NEEDED:** none.

## 2.4 Technology Architecture

**Animation:** animated diagram, data visually "flows" through it on scroll
(stroke-dashoffset or similar draw effect).

**Draft copy:** diagram only —
```text
FRONTEND → BACKEND → (AI MODEL + DATABASE)
```

**CONTENT NEEDED:** confirm this should stay generic/illustrative, or whether
you want to show your *actual* stack (Next.js, FastAPI, MongoDB, PyTorch) by
name — showing the real stack is a legitimate credibility signal for a
technical judge, but only do it once the architecture is stable (per the auth
migration work still in progress).

## 2.5 Team ("Mission Wall")

**Animation:** horizontal wall, each item expands on hover.

**Draft copy (structure only):**
```text
AI / ML — Model development
BACKEND — APIs & infrastructure
FRONTEND — Healthcare UX
INTEGRATION — System architecture
```

**CONTENT NEEDED — this entire section is placeholder until you fill it in:**
- Real names of each team member (or role-only if the team prefers not to be
  named individually on a public page).
- One short line per person on what they actually contributed — generic role
  labels ("Backend") are fine as the category header, but a real one-liner per
  person reads far more credible to judges than a bare label.
- Decide whether to include photos — if using real photos, they should be
  actual team photos, not stock headshots (per §0 rule #4's spirit).

## 2.6 CTA + Footer

Same footer as Home (§1.13) — no new content needed.

---

# 3. HOW IT WORKS (`/how-it-works`)

**Page goal:** make the workflow concrete and tangible via a scroll-driven,
step-by-step walkthrough — not an abstract 5-item list.

## 3.1 Hero

**Animation:** glowing vertical line; active step lights up as user scrolls.

**Draft copy:**
```text
H1: Five Steps. One Screening Workflow.
```

**CONTENT NEEDED:** none.

## 3.2 Step 01 — Capture

**Animation:** camera frame corners animate in, then an image-quality meter
fills:
```text
IMAGE QUALITY  ██████████  96%
```

**Draft copy:**
```text
Capture a clear retinal image using the available imaging setup.
```

**CONTENT NEEDED:** if your team is using or targeting a specific real camera
(e.g. a Remidio-style handheld fundus-on-phone device, or a specific model),
name it here — being specific about the actual hardware is a credibility
signal (real competitors like Remidio and AEYE Health lead with their exact
device names). If you're intentionally camera-agnostic, say so explicitly
instead of staying vague by omission.

## 3.3 Step 02 — Upload

**Animation:** `DEVICE → ◉ → SERVER`, with an upload progress indicator.

**Draft copy:** diagram only, no paragraph needed.

**CONTENT NEEDED:** none.

## 3.4 Step 03 — AI Analysis

**Animation:** animated scan line over the retinal image; the most visually
impressive section on this page.

**Draft copy:**
```text
RETINAL IMAGE
↓ vessel detection
↓ feature extraction
↓ classification
↓ risk estimation
```

**CONTENT NEEDED:** none — this stays illustrative/technical, not claim-based.

## 3.5 Step 04 — Result

**Animation:** reuses the sample result card pattern from Home §1.7.

**Draft copy:**
```text
SCREENING RESULT
Risk Category: Moderate
AI Confidence: 94%
Indicators: 3 detected
Action: Specialist review recommended

DEMO RESULT — NOT A MEDICAL DIAGNOSIS
```

**CONTENT NEEDED:** same as Home §1.7 — swap for a real screenshot once the
pipeline is stable.

## 3.6 Step 05 — Referral

**Animation:** reuses the healthcare pathway diagram.

**Draft copy:**
```text
PHC → Screening → Risk detected → Doctor review → Referral → Specialist
```

**CONTENT NEEDED:** none.

## 3.7 Interactive Simulation

**Animation:** `[Start Demo]` triggers 5 scripted scenes (Retinal Image →
Analyzing... → Detecting Features... → Risk Assessment Ready → Recommended
Action). Frontend-only, no real backend call.

**Draft copy:** label must read `INTERACTIVE DEMONSTRATION`.

**CONTENT NEEDED:** none for copy — this is a build task (see the shared
`<AIDemoSequence />` component note in design.md §6), not a content gap.

## 3.8 FAQ

**Animation:** accordion expand/collapse.

**Draft copy (ready to use, shared with Contact page — build once):**
```text
Is the AI a replacement for doctors?
  No. It is designed as a screening support tool.

Who is the platform designed for?
  Primary healthcare environments and healthcare workers.

Does the system diagnose diabetic retinopathy?
  The system provides AI-assisted screening/risk information. Clinical
  diagnosis should remain with qualified healthcare professionals.

Can it work in rural PHCs?
  The product is specifically designed around PHC workflows and constrained
  access to specialists.

What happens after a high-risk result?
  The result should support appropriate clinical review and referral
  according to the healthcare workflow.
```

**CONTENT NEEDED:** consider adding 1–2 FAQ items specific to your actual
build — e.g. "What image formats/sizes are supported?" (you already have a
real answer: JPG/JPEG/PNG, max 10MB) and "What happens if my photo quality is
poor?" (you already have a real answer: recapture guidance). These are free,
accurate content since you already built the actual behavior.

## 3.9 CTA + Footer

Same as Home.

---

# 4. FEATURES (`/features`)

**Page goal:** let a technical or clinical evaluator scan capabilities quickly
via a bento grid — per research, bento grids are the current standard for
scanning multiple features fast (used by Notion, Linear, Framer-style sites).

## 4.1 Feature Hero

**Draft copy:**
```text
H1: Everything Needed for AI-Assisted Retinal Screening
```

**CONTENT NEEDED:** none.

## 4.2 Bento Grid (8 cards)

| Card | Draft Copy | Animation | CONTENT NEEDED |
|---|---|---|---|
| AI-Assisted Screening (large) | "Retinal analysis that flags risk in seconds, not days." | Hover reveals scanning ring (reuses RetinaScanner) | None |
| PHC-Ready | "Built for primary care, not specialist clinics." | Static, minimal | None |
| Image Analysis | "Vessel detection, feature extraction, structural analysis." | Hover: "Analyzing vessels... Detecting anomalies..." text cycle | None |
| Risk Classification | Shows LOW/MODERATE/HIGH | Animated gauge | None |
| Referral Workflow | "PHC → Doctor → Specialist, without the wait." | Animated route line | None |
| Patient History | Timeline mockup, e.g. `2026 → Screening → Follow-up → Referral` | Simple reveal | **Only implement fields your actual backend supports** — do not show a timeline field (e.g. "Follow-up" status) the backend doesn't actually track yet |
| Secure Data Handling | "Patient data stays protected, end to end." | Lock → encrypted data → server visual | **Do not write "100% HIPAA compliant" or any compliance claim unless genuinely true and documented** — this is the single highest-risk piece of copy on the whole site if written wrong |
| Explainable Results | Shows real indicator-style output (not "Disease: YES") | Static | Only ever list indicators your model actually outputs — confirm with your AI teammate exactly which lesion types the current model detects before finalizing this card's copy |

## 4.3 CTA + Footer

Same as Home.

---

# 5. CONTACT (`/contact`)

**Page goal:** low-friction way for partners, hospitals, researchers to reach
the team — framed as a coordination center, not a generic contact form.

## 5.1 Contact Hero

**Draft copy:**
```text
H1: Have a Question About the Platform?
Sub: Talk to the team building AI-assisted screening for primary healthcare.
```

**CONTENT NEEDED:** none.

## 5.2 Contact Options Grid

**Draft copy:**
```text
General Questions — Project information and platform questions.
Technical Support — Integration and technical issues.
Collaboration — Hospitals, institutions, researchers, and partners.
```

**CONTENT NEEDED:** a real destination for each — decide whether these route
to one shared inbox/form, or three separate email addresses/recipients. If
using real email addresses, confirm what they are before launch.

## 5.3 Contact Form

**Draft copy:**
```text
Fields: Name · Email · Organization · Reason for contacting · Message
Button: [Send Message] → "Sending..." → "✓ Message received"
```

**CONTENT NEEDED:** where do submissions actually go? (email service, a
database table, a third-party form service) — this is a real backend/wiring
decision, not a copy decision, but it blocks this section from being "done."

## 5.4 FAQ

Same content as How It Works §3.8 — build the `<FAQAccordion />` component
once, reuse it here.

## 5.5 Footer

Same as Home.

---

# 6. Cross-Page Content Checklist (quick scan of everything still open)

- [ ] Final product name locked (RetinoCare vs RetinaCare)
- [ ] Final logo asset
- [ ] Real screenshot of the working screening result, to replace the
      illustrated demo on Home §1.7 and How It Works §3.5
- [ ] Decision: real PHC/location names on the public site, or stay generic
- [ ] Privacy Policy and Terms of Service pages (even minimal ones)
- [ ] Team member names/roles/one-liners for the About page mission wall
- [ ] Decision: name the actual camera hardware in How It Works Step 1, or
      stay device-agnostic on purpose
- [ ] Confirm exact list of lesion indicators the model actually detects,
      before finalizing Explainable Results copy on Features
- [ ] Decide Secure Data Handling copy carefully — no compliance claims
      without real backing
- [ ] Contact form destination (email/DB/service) and per-category routing
- [ ] Optional: add 1–2 build-specific FAQ items (file formats/size limits,
      what happens on poor image quality) since you already have real answers
