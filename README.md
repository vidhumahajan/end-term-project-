# SprintBoard — Student Project Workflow Manager

SprintBoard is a full-stack MERN application for students who need to plan and deliver software projects with a small team. It focuses on a practical workflow rather than a generic list of CRUD screens: projects have members, tasks move through a controlled status workflow, tasks can be assigned to project members, and every meaningful task change is recorded in an activity feed.

## Problem statement
Student teams often coordinate deadlines, responsibilities, and progress across scattered chats and documents. SprintBoard gives a team one place to organise a project, assign work, track progress, and see what changed.

## Target users
- Students working on course projects or hackathons
- Small teams building a software MVP
- Individual students who want a lightweight project tracker

## Key workflows
1. Register or sign in securely.
2. Create a project and invite teammates by adding their registered email addresses.
3. Create tasks, set priority and due date, and assign them to project members.
4. Move tasks across `Backlog → In Progress → Review → Done`.
5. Read task activity and comments to understand progress and decisions.

## Features
- JWT authentication with hashed passwords
- Project membership and server-side authorization
- Project dashboard with progress summary
- Task creation, editing, filtering, assignment, and status transitions
- Comments and activity history for tasks
- Input validation and consistent API errors
- Responsive React UI with loading, empty, success, and error states
- MongoDB persistence

## Tech stack
- **Frontend:** React, Vite, React Router, plain CSS
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Authentication:** JSON Web Tokens, bcryptjs
- **Validation:** express-validator
- **HTTP client:** Axios

## Architecture
```text
Browser (React + Vite)
        │ Axios / JSON over HTTP
        ▼
Express REST API
  ├── Authentication middleware (JWT)
  ├── Validation middleware
  ├── Route/controller logic
  └── Mongoose models
        │
        ▼
     MongoDB
```

The API is split into routes, middleware, and models. All project and task operations verify membership on the server; hiding a button in the UI is not treated as authorization. Task updates generate activity records, and comments are stored with their author and timestamp.

## Requirements
- Node.js 18 or newer
- npm
- MongoDB local instance or MongoDB Atlas database

## Run locally

### 1. Clone and install
```bash
git clone <your-repository-url>
cd sprintboard-mern
npm install
npm run install:all
```

### 2. Configure the server
Copy `server/.env.example` to `server/.env` and set values:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/sprintboard
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
```
Use a strong, unique secret. Do not commit `.env`.

### 3. Start development servers
In one terminal:
```bash
npm run dev
```
This starts the API and Vite frontend together. The frontend is at `http://localhost:5173`; the API health check is `http://localhost:5000/api/health`.

Alternatively:
```bash
npm run dev:server
npm run dev:client
```

## Environment variables
| Variable | Required | Description |
|---|---|---|
| `PORT` | No | API port; defaults to `5000` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign access tokens |
| `CLIENT_URL` | No | Allowed frontend origin; defaults to local Vite URL |
| `NODE_ENV` | No | Set to `production` in deployment |

Never put server secrets in frontend environment variables.

## API overview
Base URL: `/api`

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Sign in |
| GET | `/auth/me` | Get current user |
| GET, POST | `/projects` | List or create projects |
| GET | `/projects/:id` | Project details and members |
| POST | `/projects/:id/members` | Add a registered member by email |
| GET, POST | `/projects/:id/tasks` | List or create project tasks |
| PATCH | `/tasks/:id` | Update task fields/status |
| POST | `/tasks/:id/comments` | Add a comment |
| GET | `/tasks/:id/activity` | Get task activity history |
| GET | `/health` | API health check |

All project/task endpoints require `Authorization: Bearer <token>` except registration and login.

## Deployment
Deploy the Express server to a Node-compatible host and the React client to a static frontend host. Use a hosted MongoDB database such as MongoDB Atlas.

For production:
1. Set `MONGODB_URI` and `JWT_SECRET` in the backend host's secret/environment settings.
2. Set `CLIENT_URL` to the exact deployed frontend origin.
3. Set the frontend variable `VITE_API_URL` to the deployed API base URL, for example `https://your-api.example.com/api`.
4. Configure the host to run `npm start` in `server` and `npm run build` / `npm run preview` or serve `client/dist` on the frontend.
5. Test registration, login, project membership, task updates, and unauthorized access from a private browser window.

## Scripts
Root:
- `npm run dev` — run client and server together
- `npm run install:all` — install client and server dependencies
- `npm run dev:server` / `npm run dev:client`
- `npm run build` — build the client

Server:
- `npm start` — production server
- `npm run dev` — nodemon server

Client:
- `npm run dev` — Vite development server
- `npm run build` — production build

## Security notes
- Passwords are hashed with bcrypt; plain-text passwords are never stored.
- JWT secret and database credentials stay on the server.
- Protected routes validate identity and project membership.
- Request bodies are validated; errors avoid returning stack traces in production.
- For a public production deployment, add rate limiting, HTTPS, monitoring, backups, and a formal account recovery flow before handling sensitive data.

## Limitations and future improvements
This version is a focused student-team workflow tool. It does not include email delivery, password reset, file attachments, or real-time push updates. These are intentionally left out to keep the main workflows complete and testable.

# demo video
https://drive.google.com/file/d/1x0yl0IGBYMDgPugGUbed1Inh9fq4FP-U/view?usp=sharing

