Good question—and this is exactly how you avoid building something that *works* but feels average.

I’ll give you **real, high-quality inspiration mapped to your app**, not random Dribbble shots. Also, I’ll tie each one to **specific pages + components** so you can actually implement it.

---

# 🌍 Overall Product Inspiration (closest matches)

### 1. Google Drive

* Folder structure
* Clean list/grid views
* Sharing UX

👉 Use for:

* Drive page
* Folder navigation
* File cards

---

### 2. Typeform

* Beautiful question UI
* Minimal, distraction-free
* Smooth transitions

👉 Use for:

* Exam taking experience
* Question design

---

### 3. Notion

* Clean layout
* Card + list hybrid
* Soft UI

👉 Use for:

* Overall visual style
* File + question editor

---

### 4. Google Forms

* Simple logic
* Familiar UX
* Fast input

👉 Use for:

* Question creation
* MCQ layout

---

### 5. Duolingo

* Engaging interactions
* Feedback system
* Progress UX

👉 Use for:

* Exam feedback
* Result screen polish

---

# 📱 Page-by-Page Inspiration

---

## 🏠 Home Page

### Reference:

* Notion dashboard
* Google Drive home

### What to copy:

* “Recent items” horizontal scroll
* Minimal cards
* Quick actions at top

### UI Idea:

* Greeting
* Recent files (scrollable)
* FAB (Create)

---

## 📁 Drive Page

### Reference:

* Google Drive

### Key Patterns:

* Folder-first layout
* Clean spacing
* Icons + labels

---

### Components to replicate:

#### Folder Card

* Icon + name
* Tap → open

#### File Card

* Name
* Subtext (attempts / updated)

---

👉 Keep it **ultra clean** like Drive
Don’t overdesign here.

---

## 🤝 Shared With Me

### Reference:

* Google Drive shared tab

### UX Pattern:

* Same UI as Drive
* Just filtered data

👉 Important:

* Add subtle “shared” indicator

---

## 📄 File (Exam Builder)

### Reference:

* Google Forms
* Notion

---

### Components:

#### Question List

* Card-based
* Editable inline (like Notion)

#### Add Question Button

* Sticky bottom or FAB

---

### UX Trick:

* Show question type badge:

  * “MCQ”
  * “Text”
  * etc.

---

## ➕ Question Creation Modal

### Reference:

* Google Forms

---

### Pattern:

* Bottom sheet (mobile)
* Dynamic fields

---

### Extra polish:

* Animate when changing question type

---

## 📝 Exam Taking Page (MOST IMPORTANT)

### Best Reference:

* Typeform
* Duolingo

---

### Two possible styles:

---

### 🔹 Option 1 (Recommended MVP)

**Google Forms style (scroll)**

Reference:

* Google Forms

Pros:

* Easy to build
* Familiar UX

---

### 🔹 Option 2 (Premium Feel)

**One question at a time**

Reference:

* Typeform

Pros:

* Feels modern
* Focused UX

---

👉 My recommendation:
Start with **scroll version**, upgrade later.

---

### Components:

#### Question Card

* Large text
* Clear spacing
* Big tap targets

#### Options

* Rounded
* Animated select

---

## 💾 Auto-Save UX Inspiration

### Reference:

* Notion

---

### Pattern:

* Tiny “Saving…” → “Saved ✓”
* No interruptions

---

👉 This is **critical polish**

---

## 📊 Result Screen

### Reference:

* Duolingo
* Google Forms

---

### Components:

* Big score
* Status badge
* Answer review list

---

👉 Add:

* Green/red indicators
* Clean breakdown

---

## ✍️ Evaluation Screen (Owner)

### Reference:

* Google Classroom

---

### Pattern:

* Question
* User answer
* Marks input

---

👉 Keep it functional, not fancy

---

# 🧩 Component-Level Inspiration

---

## Buttons

### Reference:

* Stripe Dashboard

👉 Clean, minimal, slightly rounded

---

## Cards

### Reference:

* Airbnb

👉 Soft shadows, spacing, clarity

---

## Forms

### Reference:

* Linear

👉 Fast, minimal, keyboard-friendly

---

# 🛠️ Tech + Tools for Design

---

## 🎨 UI Framework

### 1. Tailwind CSS

* Fast iteration
* Mobile-first

---

### 2. shadcn/ui

* Beautiful defaults
* Accessible
* Works perfectly with Tailwind

---

## 🎯 Icons

* Lucide
* Clean + modern

---

## 🎞️ Animations

* Framer Motion

Use for:

* Page transitions
* Button feedback
* Question transitions

---

## 🧪 Prototyping

* Figma

👉 Highly recommended before coding

---

# 🔥 Final Design Direction (what YOU should aim for)

If I had to summarize your app style:

> **Google Drive (structure) + Typeform (exam UX) + Notion (clean UI)**

---

# 💡 My honest pushback (important)

Don’t try to make it “too fancy” early.

What makes apps feel premium:

* Smoothness
* Spacing
* Feedback
* Reliability (auto-save)

NOT:

* Gradients
* Fancy animations
* Complex layouts

---

# Implementation status (repo)

This document’s direction is reflected in the **Next.js + Tailwind** app in this repository.

| Area | Feedback applied |
|------|-------------------|
| **Overall** | Drive-style lists, Notion-like spacing and soft cards (`SurfaceCard`), minimal chrome. |
| **Home** | Time-based greeting, first-name from email, horizontal **snap** scroll for recent files, **FAB** + **bottom sheet** for create (file / folder). |
| **Drive / folder** | Lucide icons, folder-first rows, chevrons, subtle shadows; same vocabulary as Drive on folder drill-down. |
| **Shared** | Same card pattern as Drive plus a clear **“Shared”** pill (violet) on list and header. |
| **File (builder)** | Question **type badges** (MCQ / Multi / Y/N / Text), card list, **FAB** + **bottom sheet** for new questions (Google Forms–style fields), **bottom sheet** for share. |
| **Exam attempt** | Forms-style **scroll**, large question type, **progress** bar and answered count, **pill** option buttons with selected state, debounced auto-save with **Saving / Saved** chip. |
| **Results** | Large score hero, status pill, per-question **green / red / amber** border + icons from server **`review`** payload (objective correctness + text pending/graded). |
| **Owner grading** | Clear “Grade” block on text questions (Classroom-style), primary save CTA. |
| **Nav** | Bottom bar with **Lucide** tab icons and blur background. |
| **Tech** | Tailwind v4, **lucide-react**; motion limited to sheet enter + CSS transitions (no heavy animation stack). |

Optional later (not required for “premium feel” per this doc): shadcn/ui, Framer Motion for page transitions, one-question-at-a-time (Typeform) mode.

---

## Component map (code)

- `components/design/SurfaceCard.tsx` — Airbnb-soft card shell  
- `components/design/BottomSheet.tsx` — mobile question + share flows  
- `components/design/Fab.tsx` — primary create / add question  
- `components/design/QuestionTypeBadge.tsx` — MCQ / Multi / Y/N / Text labels  
- `lib/review.ts` + `GET /api/attempts/[id]` **`review`** — result breakdown indicators
