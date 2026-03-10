# 🧲 RM Scheduler — AI-Powered MRI Scheduling Assistant

> **Intelligent decision support for MRI scheduling at Hospital de la Santa Creu i Sant Pau (Barcelona)**
> Converts unstructured clinical notes into precise machine assignments, protocol recommendations, and shift planning — in real time.

---

## What is this?

Scheduling an MRI in a busy radiology department is deceptively hard. You need to match each clinical request to the right machine (considering field strength, gantry size, injector availability), the right protocol, the right number of time slots, and the right shift — while respecting a dense web of hard institutional constraints.

This tool does all of that automatically. Administrative staff paste a free-text clinical note, and the system instantly returns:

| Field | Example |
|---|---|
| **Protocol** | RM Hipòfisi amb contrast |
| **Machine** | RM3 (or RM2 if unavailable) |
| **Contrast** | YES |
| **Injector (bomba)** | YES |
| **Slots** | 1 |
| **Shift** | Flexible (predominantly afternoon) |
| **Confidence** | HIGH |
| **Justification** | "Pituitary always requires RM3>RM2; RM4 and RM5 absolutely excluded" |

---

## Features

### 🤖 Hybrid AI + Rule Engine
The system combines a **large language model** (Claude, Anthropic) for natural language understanding with a **deterministic constraint layer** that enforces all hard rules. The LLM interprets ambiguous, multilingual, abbreviation-heavy clinical notes — the rule engine guarantees safety. Hard constraints (e.g., *RM5 has no automatic injector — never schedule contrast exams there*) can never be overridden by the model.

### 📚 Comprehensive Knowledge Base
Encodes the full scheduling logic of a 5-scanner department:
- **50+ MRI protocols** across neurology, MSK, abdomen, pelvis, thorax, and interventional
- **5 machines** with heterogeneous specs (1.5T / 3T, 60 cm / 70 cm gantry, injector presence)
- **Machine priority chains** per protocol (e.g., `RM3 > RM2 > RM1 > RM4` — first available wins)
- **Absolute hard constraints** (exclusive machines, prohibited combinations)
- **Shift rules** (mandatory morning, mandatory afternoon, day-of-week specific)
- **Slot rules** (1 slot default; 2 slots for spinal cord, liver Primovist/Multihance, Menière)

### 🔄 Continuous Learning from Real Feedback
Every AI recommendation can be **accepted or corrected** by administrative staff. Radiologist-validated corrections are stored in a cloud database and automatically injected as **dynamic few-shot examples** into the next LLM call — no model retraining needed. The system gets smarter as it accumulates real institutional knowledge.

```
Staff sees AI suggestion → Accepts or corrects →
Radiologist validates correction →
Correction becomes a few-shot example →
Next query benefits from it automatically
```

### 🛡️ Admin Dashboard
Radiologists can:
- Review the full feedback history
- Validate or reject administrative corrections
- Delete erroneous entries to maintain few-shot data quality

### 📊 Confidence Scoring & Audit Trail
Each recommendation comes with a confidence level (`HIGH / MEDIUM / LOW`) and a structured justification explaining which rules were applied. All interactions are logged.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js Frontend                     │
│              (React, TypeScript, Tailwind CSS)           │
└────────────────────────┬────────────────────────────────┘
                         │ API call
┌────────────────────────▼────────────────────────────────┐
│              Edge Function — /api/claude                 │
│                                                          │
│  1. Fetch recent validated corrections from Supabase     │
│  2. Build system prompt (knowledge base + few-shots)     │
│  3. Call Claude API with clinical note                   │
│  4. Parse structured JSON response                       │
│  5. Apply deterministic hard-constraint layer            │
└────────────┬───────────────────────┬────────────────────┘
             │                       │
┌────────────▼──────────┐  ┌────────▼────────────────────┐
│   Anthropic Claude    │  │         Supabase             │
│   (LLM inference)     │  │  (feedback store + few-shots)│
└───────────────────────┘  └─────────────────────────────┘
```

**Stack:**
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js Edge Functions (API Routes)
- **AI:** Anthropic Claude API (claude-sonnet)
- **Database:** Supabase (PostgreSQL, REST API)
- **Deployment:** Vercel (edge-optimized)

---

## Machine Reference

| Machine | Field | Gantry | Injector | Key Use Cases |
|---------|-------|--------|----------|---------------|
| **RM1** | 1.5T | 60 cm | ✅ | General, pediatric anesthesia, arthrography (exclusive) |
| **RM2** | 3T | 60 cm | ✅ | Neuro/MSK high quality, hand/wrist (3T required), fetal MRI |
| **RM3** | 3T | 70 cm | ✅ | HIFU (exclusive), Menière (exclusive), CAR-T, Parkinson preECP, CRI |
| **RM4** | 1.5T | 70 cm | ✅ | MSK general, large patients |
| **RM5** | 1.5T | 70 cm | ❌ | **No injector** — contrast-free protocols only, large gantry |

---

## Hard Constraints (examples)

These are enforced deterministically — the LLM cannot override them:

- `RM5` → **never** if protocol requires injector
- `RM5` & `RM4` → **never** for pituitary (RM HIPÒFISI)
- `RM3` → **exclusive** for HIFU, Menière, CAR-T, Parkinson preECP, DBS 3T, CRI (priority)
- `RM2` → **exclusive** for fetal MRI (Tuesday afternoon only)
- `RM1` → **exclusive** for arthrography (shoulder/hip), pediatric anesthesia
- Hand/wrist → **3T only** (RM2 or RM3) — diagnostic quality requirement
- Menière → RM3, 2 consecutive slots, morning 08:00–13:00
- CRI (Rapid Stroke Circuit) → RM3 > RM5 only, scheduled within **3 calendar days**
- Breast MRI → only one breast exam can run simultaneously across RM2/RM3 (single coil)

---

## Feedback Loop in Detail

```sql
-- Supabase table: rm_feedback
nota_radioleg          -- original clinical note (free text)
ia_protocol_n          -- AI-suggested protocol number
ia_nom_protocol        -- AI-suggested protocol name
ia_torn                -- AI-suggested shift
ia_equip1              -- AI-suggested primary machine
ia_conf                -- AI confidence level
decisio                -- 'acceptat' | 'corregit' | 'validat'
correccio_protocol_n   -- corrected protocol (if staff disagreed)
correccio_nom_protocol
correccio_torn
correccio_equip1
correccio_comment      -- free-text explanation of correction
```

Corrections with `decisio = 'validat'` (radiologist-approved) are pulled at inference time and injected as few-shot examples into the Claude system prompt.

---

## Getting Started

```bash
# Clone the repo
git clone <repo-url>
cd rm-scheduler

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Fill in: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |

---

## Clinical Context

Developed for the Radiology Department of **Hospital de la Santa Creu i Sant Pau** (Barcelona), a 650-bed tertiary university hospital with one of the most advanced MRI units in Catalonia. The scheduling rules encoded in this system reflect years of institutional protocol refinement by radiologists and administrative staff.

The tool is designed to assist — not replace — human judgment. All AI suggestions are visible with their reasoning, and the correction mechanism ensures that edge cases and local exceptions are captured and learned from.

---

## Publication

If you use this work or build on it, please cite:

> *AI-Assisted MRI Scheduling: A Large Language Model–Based Decision Support System with Continuous Learning from Radiologist Feedback.* Radiological Society of North America (RSNA) Annual Meeting, 2025.

---

## License

For academic and research use. Contact the Radiology Department of Hospital de Sant Pau for institutional licensing inquiries.
