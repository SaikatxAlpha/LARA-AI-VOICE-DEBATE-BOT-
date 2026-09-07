# LARA — AI Voice Debate Bot

<p align="center">

<img src="assets/lara-ui.png" alt="LARA AI Voice Debate Bot" width="100%">

</p>

<h3 align="center">
An AI-powered voice debate partner that challenges your reasoning in real time.
</h3>

<p align="center">

Say it. Defend it. Think better.

</p>

---

## 🧠 About LARA

**LARA (AI Voice Debate Bot)** is an interactive AI-powered debate system designed to help users practice critical thinking, argumentation, communication, and public speaking.

Unlike a conventional chatbot that primarily answers questions or agrees with the user, LARA acts as a **debate opponent**.

The user presents an argument through voice or text. LARA analyzes the argument, identifies weaknesses or assumptions, generates a counterargument, and asks a challenging follow-up question.

The conversation can then continue through multiple rounds.

---

## ✨ Features

- 🎙️ Voice-based argument input
- 🧠 AI-powered counterarguments
- 🔊 AI voice responses
- 💬 Text-based debate support
- 🔄 Multi-round debate conversations
- 🧩 Conversation context
- 🎯 Challenging follow-up questions
- 📊 Round tracking
- 🔁 Replay LARA responses
- 🎚️ Browser voice selection
- ⚡ Real-time frontend/backend communication
- 🌑 Modern dark futuristic interface
- 📱 Responsive user interface

---

# 🏗️ System Architecture

<p align="center">

<img src="assets/architecture.png" alt="LARA System Architecture" width="100%">

</p>

### High-Level Architecture

```text
                         ┌──────────────────────┐
                         │        USER          │
                         │  Speaks an argument  │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  SPEECH RECOGNITION  │
                         │ Browser Web Speech   │
                         │       API            │
                         └──────────┬───────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                           │
│                                                             │
│  Topic Selection → Argument Input → Debate Interface       │
│                                                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ POST /api/debate
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    NODE.JS BACKEND                          │
│                                                             │
│  Express Server                                              │
│       │                                                      │
│       ▼                                                      │
│  Debate Controller                                            │
│       │                                                      │
│       ▼                                                      │
│  Debate Engine                                                │
│       │                                                      │
│       ▼                                                      │
│  Prompt + Debate Context                                     │
│                                                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
                  ┌────────────────────┐
                  │      GROQ API      │
                  │                    │
                  │ openai/gpt-oss-20b│
                  └─────────┬──────────┘
                            │
                            │ AI Response
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                           │
│                                                             │
│        Display Counterargument + Challenge Question         │
│                           │                                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
                 ┌────────────────────────┐
                 │   SPEECH SYNTHESIS     │
                 │ Browser Web Speech API │
                 └────────────┬───────────┘
                              │
                              ▼
                       🔊 LARA SPEAKS
