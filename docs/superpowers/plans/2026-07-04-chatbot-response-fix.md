# Chatbot Response Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display the reply returned by `POST /chat` instead of the frontend fallback.

**Architecture:** Keep the backend's shared `{ success, data }` response envelope. Correct the Axios response type first so TypeScript reproduces the invalid property access, then read the nested reply.

**Tech Stack:** React, Axios, TypeScript

---

### Task 1: Correct the chatbot response contract

**Files:**
- Modify: `frontend/src/pages/Guest/components/GuestChatbox.tsx:83-84`
- Test: TypeScript build via `frontend/package.json`

- [ ] **Step 1: Make the response type match the backend envelope**

```ts
const res = await api.post<{ data: { reply: string } }>("/chat", { message: textToSend });
const responseText = res.data?.reply || "Tôi chưa có câu trả lời cho vấn đề này.";
```

- [ ] **Step 2: Run the build to verify RED**

Run: `npm run build` from `frontend`

Expected: FAIL because `reply` does not exist on `{ data: { reply: string } }`.

- [ ] **Step 3: Read the reply from the envelope**

```ts
const res = await api.post<{ data: { reply: string } }>("/chat", { message: textToSend });
const responseText = res.data.data.reply || "Tôi chưa có câu trả lời cho vấn đề này.";
```

- [ ] **Step 4: Run the build to verify GREEN**

Run: `npm run build` from `frontend`

Expected: PASS with no TypeScript or Vite build errors.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-07-04-chatbot-response-fix.md frontend/src/pages/Guest/components/GuestChatbox.tsx
git commit -m "fix: read wrapped chatbot reply"
```
