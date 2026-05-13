# 📱 Drive + Exam Builder App (Mobile-First) — Product & Design Requirements

## 🧭 Overview

A mobile-first web application where users can:
- Create folders and organize files (like a simplified Google Drive)
- Create “Files” that act as exams/tests
- Add questions to files
- Share files with other users via email
- Allow others to attempt tests
- View results (auto + manual evaluation)

---

## 👤 User Roles

### 1. Owner (File Creator)
- Creates folders and files
- Adds questions
- Shares file
- Evaluates text-based answers
- Views all attempts

### 2. Participant
- Access shared files
- Attempts test
- Views own results

---

## 🔐 Authentication (MVP)

- Email + Password login/signup
- No email verification
- Unique email required
- No password reset (for now)

---

## 🏠 Main Navigation (Mobile First)

Bottom navigation (recommended):

- Home
- Drive
- Shared
- Profile

---

## 🏡 Home Screen

### Sections:
- Recent Files (horizontal scroll)
- Quick Actions:
  - Create File
  - Create Folder

---

## 📁 Drive Screen

### Features:
- Folder tree (flat UI, drill-down navigation)
- Default root folder: **Home**
- Users can:
  - Create folder
  - Create subfolder
  - Create file inside folder

### Folder Item:
- Name
- Tap → Open folder

### File Item:
- Name
- Metadata (optional: attempts count)
- Tap → Open file

---

## 🤝 Shared With Me

### Features:
- List of files shared with user
- Read-only (no edit)
- Actions:
  - Attempt Test
  - Clone File

---

## 📄 File (Exam) — Owner View

### Sections:

#### 1. Header
- File name
- Share button
- लॉक badge (if locked)

---

#### 2. Questions List
- Ordered list
- Each item:
  - Question text
  - Type label
  - Edit/Delete (only if not locked)

---

#### 3. Add Question Button

---

#### 4. Attempts Section
- List of attempts
- Each attempt:
  - User
  - Score
  - Status (Pending / Evaluated)
  - Tap → View details

---

## ❓ Question Types

### 1. Single Select
- Multiple options
- One correct answer

### 2. Multiple Select
- Multiple options
- Multiple correct answers

### 3. Yes/No
- Boolean

### 4. Text Answer
- Long input
- Requires manual evaluation

---

## ➕ Create / Edit Question Screen

### Fields:
- Question Text
- Question Type (dropdown)

Dynamic fields:
- Options (for MCQ)
- Correct Answer(s)
- Marks (default = 1)

### Actions:
- Save
- Cancel

---

## 🔗 Share File

### Input:
- Email field

### Behavior:
- Adds user to shared list
- If user not registered → still allow

---

## 📝 Attempt Test Screen (Participant)

### Behavior:
- Show all questions (paginated or scroll)
- Input based on type:
  - Radio buttons
  - Checkboxes
  - Yes/No toggle
  - Textarea

### Actions:
- Submit Attempt

---

## 📊 Submission Logic

After submission:
- Auto-evaluate objective questions
- Text questions → pending

---

## 📈 Result Screen

### For Participant:
- Score (if evaluated)
- “Pending Evaluation” (if text exists)

---

### For Owner:
- Full answer sheet
- Manual grading UI:
  - Assign marks for text answers
  - Mark correct/incorrect

---

## 🔒 File Locking Rule

- Once at least ONE attempt is submitted:
  - File becomes **locked**
  - No edits allowed

### Alternative:
- Show “Clone & Edit” option

---

## 📄 Clone File

### Behavior:
- Copies:
  - All questions
- Does NOT copy:
  - Attempts
  - Shared users

---

## 📊 Analytics (Basic)

For each file:
- Total attempts
- Average score
- Pass rate (optional)

---

## 🧠 UX Principles

- Mobile-first design
- Minimal clicks
- Clear hierarchy
- Avoid clutter
- Fast interactions

---

## 🎨 Design Guidelines

### Layout:
- Single column
- Card-based UI

### Components:
- Bottom navigation
- Floating action button (FAB)
- Modal for quick actions

### States:
- Empty states (important)
- Loading states
- Error states

---

## 🚫 Out of Scope (for now)

- Drag & drop folders
- Real-time collaboration
- Notifications
- Email verification
- Advanced permissions

---

## 🚀 Future Enhancements

- Google login
- Password reset
- Timed exams
- Section-wise tests
- Leaderboards
- File versioning

---

## 🧩 Suggested Pages

- `/login`
- `/signup`
- `/home`
- `/drive`
- `/folder/[id]`
- `/file/[id]`
- `/attempt/[fileId]`
- `/result/[attemptId]`
- `/shared`

---

## 🧱 Component Breakdown (Frontend)

- Navbar
- FileCard
- FolderCard
- QuestionCard
- AttemptCard
- ResultView
- QuestionForm
- ShareModal

---

## ⚙️ State Considerations

- Auth state (global)
- Current folder navigation
- File details
- Attempt state
- Evaluation state

---

## ✅ MVP Success Criteria

- User can create file
- Add questions
- Share file
- Another user can attempt
- Owner can evaluate
- Results visible

---

## 🛠 Implementation stack (this repo)

- **Framework:** Next.js (App Router) — UI and **Route Handlers** (`app/api/**`) for the backend API.
- **Database:** MongoDB with **Mongoose** for models and persistence.
- **Auth:** Email + password; password hashing with **bcryptjs**; session via **signed HTTP-only cookie** (JWT using **jose**).
- **Styling:** Tailwind CSS v4, mobile-first layout (max width ~480px content column).
- **Env:** `MONGODB_URI`, `JWT_SECRET` (or `AUTH_SECRET`), optional `NEXT_PUBLIC_APP_URL`.

---
