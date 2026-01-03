# SquadUp - Project Overview

**SquadUp** is a cutting-edge, real-time "Looking For Group" (LFG) platform designed for modern gamers. It leverages AI and real-time socket connections to create seamless, dynamic squad-finding experiences.

## Core Features
- **Real-Time Lobby System**: Instant updates for new lobbies and member joins using WebSockets.
- **Neural Matchmaking**: AI-powered semantic search allows users to find lobbies using natural language queries (e.g., "Chill Valorant game for beginners") rather than just rigid filters.
- **AI Toxicity Shield**: Client-side analysis checks lobby names and descriptions for toxic content before allowing creation, promoting a positive community.
- **Secure Authentication**: Integrated with Clerk for robust and secure user management.
- **Dynamic "The Board" UI**: A futuristic, cyberpunk-interface that feels alive with animations and instant feedback.

## Technology Stack

### Frontend (Client)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Real-time**: [Socket.io-client](https://socket.io/)
- **AI/ML**: [Transformers.js](https://huggingface.co/docs/transformers.js/index) (`@xenova/transformers`) for in-browser embeddings and text classification.

### Backend (Server)
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Real-time**: [Socket.io](https://socket.io/)
- **Database**: [MongoDB](https://www.mongodb.com/) (via [Mongoose](https://mongoosejs.com/))
- **Utilities**: `dotenv`, `cors`, `nodemon`

## Architecture Highlights
- **Hybrid AI Approach**: AI processing (embeddings and toxicity checks) runs **client-side** using `Transformers.js`, reducing server load and ensuring privacy/speed.
- **Event-Driven Updates**: The server broadcasts events (`lobby_created`, `lobby_updated`) to all connected clients to ensure "The Board" is always in sync without manual refreshing.
- **Monorepo Structure**: Separation of concerns with distinct `client` and `server` directories for independent scaling and development.
