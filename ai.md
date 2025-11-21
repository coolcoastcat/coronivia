# Coronivia Project Summary for AI Agent

## Project Purpose

Coronivia is an open-source, real-time online trivia game designed for friends, families, and colleagues to play together remotely (e.g., over Zoom, Teams, Skype).

## Architecture

-   **Backend:** Node.js application using the Express.js framework. Located in the root directory (`coronivia-server.js`).
-   **Frontend:** React single-page application, likely bootstrapped with Create React App. Located in the `client/` directory.
-   **Communication:** Real-time communication between client and server is handled via Socket.IO.
-   **Database:** PouchDB is used, likely as an in-memory database for managing game state (rooms, players, scores).
-   **Deployment:** Configured for deployment to Google Cloud Platform App Engine (see `app.yaml`, `.gcloudignore`, and the `deploy` script in `package.json`).

## Key Technologies

-   **Backend:**
    -   Node.js
    -   Express.js
    -   Socket.IO (Server)
    -   PouchDB / PouchDB-find
    -   Winston (Logging)
    -   `node-fetch`
-   **Frontend:**
    -   React (with `react-scripts`)
    -   Material-UI (Core & Icons)
    -   React Router (`react-router-dom`)
    -   Socket.IO (Client)
    -   `react-countdown`
-   **Package Manager:** Yarn (`yarn.lock` files present in root and `client/`).
-   **Development:** `concurrently` is used to run the server (`nodemon`) and client (`react-scripts start`) simultaneously via `yarn dev`. The client proxies API requests to the backend server at `http://localhost:5000`.

## Core Functionality

-   **Game Creation:** An owner creates a game, specifying rounds, questions per round, and categories.
-   **Waiting Room:** Players join using a 4-character code and wait for the owner to start. Player names are displayed.
-   **Gameplay:**
    -   Game proceeds in rounds and questions.
    -   Questions are displayed with multiple-choice answers and a countdown timer (default 15s, configurable).
    -   Players submit answers; correctness and points are revealed after the timer.
    -   Scores are updated and displayed.
    -   Owners can pause between rounds.
-   **End Game:** Final scores are displayed, highlighting the winner.
-   **Trivia Questions:** Sourced from the Open Trivia Database API (`opentdb.com`), potentially with local caching/modification (`opentdb_questions.json`, `trivia-questions.js`).

## Project Structure Highlights

-   `coronivia-server.js`: Main backend server file.
-   `package.json`: Defines server dependencies and scripts (`dev`, `package`, `deploy`).
-   `client/`: Contains the React frontend application.
    -   `client/package.json`: Defines client dependencies and scripts.
    -   `client/src/`: Main source code for the React app.
        -   `client/src/index.js`: Entry point for the React app.
        -   `client/src/components/`: Contains React components (e.g., `Game.jsx`, `Question.jsx`, `CreateGame.jsx`).
-   `app.yaml`: Google Cloud App Engine configuration file.
-   `opentdb_questions.json`: Likely contains the trivia questions used by the game.
-   `README.md`: Detailed project description, setup, and contribution guidelines.
-   `docs/`: Contains documentation images and potentially other docs.
-   `public/`: Likely the target directory for the built client application, used for deployment.

## How to Run Locally

Use the command `yarn dev` in the root directory. This starts both the backend server (on port 5000) and the React development server (on port 3000).
