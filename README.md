# Nava: Premium Bible Study & AI Companion

**Nava** is a cross-platform mobile application built with React Native and Expo, designed to provide a modern, high-fidelity interface for Bible study and guided spiritual practices. 

This project explores the intersection of spiritual growth and advanced mobile UI patterns, focusing on fluid animations, modular architecture, and AI integration.

---

## Technical Highlights

This application is built as a showcase of modern React Native development practices, featuring:

- **Custom Animation Engine:** Extensive use of the `Animated` API for parallax headers, staggered entrance animations, and interactive card stacks.
- **Glassmorphism UI:** Implemented using `expo-blur` and custom layering to achieve a premium, depth-heavy aesthetic.
- **AI Integration:** Leveraging the Supabase Edge Functions and OpenAI to provide contextual Bible guidance and chat capabilities.
- **State Management:** Organized via React Context and Hooks for responsive data updates across the Spiritual Rhythm dashboard.
- **Responsive Layouts:** Utilizing a Bento Grid system and dynamic dimension calculations to ensure a consistent experience across different device sizes.

---

## Core Modules

### 1. AI-Powered Bible Chat
A conversational interface for exploring Scripture. It handles complex theological queries by processing them through a fine-tuned AI layer, providing real-time references and insights.

### 2. Guided Prayer & Meditation
A structured experience that breaks down prayer into intentional, timed steps. This module uses specific data models to manage multi-step spiritual exercises.

### 3. Spiritual Rhythm Dashboard
A data-driven view that tracks user consistency. It features interactive charts (built from scratch using layout primitives) that visualize user activity over time.

### 4. Interactive Devotionals
Daily reflections presented through a cinematic UI, featuring "Verse of the Day" with custom sharing capabilities.

---

## Tech Stack

- **Framework:** [Expo SDK 54](https://expo.dev/) (React Native)
- **Language:** TypeScript
- **Styling:** StyleSheets with dynamic theme support (Dark/Light mode)
- **Persistence & API:** [Supabase](https://supabase.com/)
- **Typography:** Playfair Display (Serif) & Inter (Sans-serif)
- **Development Tools:** Maestro (End-to-end testing), Fastlane (Deployment)

---

## Local Development

### Prerequisites
- Node.js (v18+)
- Expo Go app or an iOS/Android Emulator

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/santusdominus123/Nava.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the development server:
   ```bash
   npx expo start
   ```

---

## Project Structure
- `src/screens`: UI Layer and Screen-specific logic.
- `src/components`: Reusable UI primitives and design system tokens.
- `src/services`: API clients and third-party integrations (Supabase, OpenAI).
- `src/context`: Global app state management.
- `src/data`: Mock data and static content for offline capability.

---

**Developed by Santus Dominus**
