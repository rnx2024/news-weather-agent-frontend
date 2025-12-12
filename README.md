# News & Weather Intelligence Frontend

This repository contains the **frontend application** for a location-aware AI agent that generates concise, actionable summaries by combining **live weather data**, **local news**, and **contextual risk signals**.

The frontend provides a modern, card-based interface where users can select a location, ask natural-language questions, and receive structured responses from a secured backend agent API.

---

## Overview

The application is built with **Next.js (App Router)** and **React**, styled using **Tailwind CSS** with a clean, minimal, and modern UI.  
It acts as a **thin client**: all intelligence, data fetching, and reasoning are handled by the backend.

---

## Key Features

- **Location-based querying**
  - Preset city buttons and free-text location input
- **Conversational interface**
  - User/agent message bubbles
  - Loading indicators during processing
- **Quick prompts**
  - One-click predefined questions
- **Modern UI design**
  - Card-style layout
  - Rounded components
  - Clear visual hierarchy

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **UI Library:** React
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **State Management:** React hooks

---

## Getting Started (Local Development)

1. Install dependencies

2. Start the development server:

npm run dev  

Open the application:
``
http://localhost:3000  
```

Edits to `app/page.tsx` or files under `components/` will hot-reload automatically.

- The backend is responsible for fetching live weather data, fetching relevant news, and synthesizing a concise response using an AI agent.

- This frontend can be deployed to any platform that supports Next.js. such as Vercel or Netlify. 
