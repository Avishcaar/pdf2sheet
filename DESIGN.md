# PDF2Sheet — Design Direction & System Specifications

> Dial: ENERGY 2 / RHYTHM 2 / MOTION 1

## 1. Product Identity & Character
PDF2Sheet is an autonomous financial document intelligence system. It captures invoices from email inboxes (IMAP IDLE push) and file uploads, extracts structured accounting data using high-speed language models (Groq LPU), performs mathematical audit reconciliation, and syncs verified transactions to Google Sheets in real-time.

The interface must feel like an **executive-grade financial terminal**: calm, precise, dense, legible, and trustworthy.

## 2. Color Palette Discipline (R-01, R-29)
- **Surfaces**:
  - Dark: Deep Obsidian (`#0B0F19`), Panel Charcoal (`#111827`), Card Slate (`#1E293B`)
  - Light: Clean Canvas (`#F8FAFC`), Surface White (`#FFFFFF`), Card Neutral (`#F1F5F9`)
  - Borders: Hairline definition (`rgba(255, 255, 255, 0.08)` in dark mode, `rgba(15, 23, 42, 0.08)` in light mode)
- **Primary Brand Accent**: Slate Indigo (`#6366F1`) & Electric Violet (`#8B5CF6`)
- **Semantic Accents (Strictly Functional)**:
  - Emerald (`#10B981`): Reconciled / Processed / 100% Math Match
  - Amber (`#F59E0B`): Review Needed / Human Verification Required
  - Rose (`#EF4444`): Discrepancy / Math Error / Destructive Action

No multi-color rainbow gradients. All progress bars, charts, and metrics adhere to single-hue progressive density or functional semantic coloring.

## 3. Typography & Numerical Precision (R-06, R-17)
- **Primary UI**: `Inter` (sans-serif) for labels, headings, metadata, and buttons.
- **Financial & Telemetry Data**: `JetBrains Mono` / Tabular monospace for currency amounts, invoice numbers, tax IDs, confidence percentages, and timestamps.
- **Hierarchy**: Restrained scale with strong contrast. Avoid unnecessary decorative uppercase tracking.

## 4. Anti-Slop Discipline & Clutter Removal
- **No Decorative Gimmicks**: No artificial custom cursor trails, no film grain noise overlays, no vignette filters, no animated background blobs.
- **No Redundant Controls**: Single consolidated search and filtering surface. No duplicate stacked search inputs.
- **Restrained Badges (R-09)**: Maximum 1 status badge per card/row. No decorative badges stacked on top of metadata.
- **Honest Terminology (R-02, R-16)**: Eliminate marketing buzzwords ("Auto-Pilot Magic", "Supercharged Multimodal OCR", "Revolutionary"). Use exact accounting and engineering terms ("Processed", "Review Needed", "Spreadsheet Sync", "Groq LPU").
- **Theme Integrity (R-34)**: Both Light and Dark modes provide high contrast (WCAG AA compliant) with zero washed-out text or invisible borders.
