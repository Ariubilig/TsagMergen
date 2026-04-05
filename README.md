# Цагмэргэн  AI-Powered Student Study Planner

> A smart study planning assistant designed to reduce academic stress for students by turning homework, deadlines, and personal study habits into realistic daily plans.

---

## Problem

Many students struggle with academic overload, procrastination, and poor time management.

Even when they know *what* they need to do, they often don’t know:

- which task to start first
- how much time to spend
- how to balance urgent vs difficult work
- how to study in a way that matches their personal learning style
- how to avoid stress and burnout

As a result, students often:
- miss deadlines
- feel overwhelmed
- lose motivation
- study inefficiently
- develop unhealthy study habits

Traditional to-do lists and reminder apps are too generic — they do not understand **student workload**, **deadline urgency**, or **personal study behavior**.

---

## Solution

**Цагмэргэн** is an AI-assisted student productivity platform that transforms homework and schedule data into a **personalized, stress-aware daily study plan**.

The system helps students by:

- collecting homework and deadline information
- estimating academic pressure using rule-based scoring
- prioritizing tasks based on urgency, difficulty, and available time
- generating a personalized study order
- providing supportive AI-generated reminder messages
- adapting suggestions based on the student’s learning style and self-reported habits

Instead of just reminding students, **Цагмэргэн actively guides them on what to do next**.

---

## What We Built

### Features
- Student onboarding questionnaire
- Homework/task input
- Subject + deadline + difficulty + estimated study time
- Simple class schedule structure
- Rule-based academic pressure scoring
- Task prioritization logic
- AI-generated study guidance / smart reminder
- Student-friendly dashboard UI
- Notification / reminder preview concept

### Example Output
The system can generate:
- today’s recommended study order
- which task to start first
- how long to spend on each task
- a short motivational reminder
- a stress-aware suggestion based on the student’s profile

---

## How It Works

Our approach is **hybrid**, combining deterministic logic with AI.

### 1. Rule-Based Workload Scoring
We first calculate academic pressure using structured factors such as:

- number of tasks
- deadline urgency
- task difficulty
- estimated study time
- available study window
- student stress tendency / procrastination tendency

This gives us a reliable baseline priority.

### 2. AI Personalization Layer
After the system creates a baseline plan, we use **GPT-4o** to transform that structured data into:

- a personalized study recommendation
- a student-friendly daily plan
- warm reminder / encouragement text
- learning-style-aware study tips

This means the AI does **not replace logic** — it improves clarity, personalization, and user experience.



## Architecture Overview

```text
Next.js Frontend
      ↓
Next.js API Route / Server Logic
      ↓
Supabase (PostgreSQL)
      ↓
Task / Schedule / Student Profile Data
      ↓
Planning Logic (Rule-based Scoring)
      ↓
OpenAI GPT-4o (AI Personalization Layer)
      ↓
Personalized Daily Plan + Smart Reminder
