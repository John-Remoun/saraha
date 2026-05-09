# Saraha — Anonymous Messaging App

A full-stack anonymous messaging application built with **Node.js + Express + MongoDB** (backend) and **React + Vite** (frontend).

---

## Features

### Backend
- JWT-based authentication (access + refresh tokens)
- Email verification via OTP
- Forgot-password flow (OTP code & magic link)
- Google OAuth2 sign-in
- Anonymous & authenticated message sending
- Inbox / Sent / All-messages endpoints with pagination
- **Notification system** – in-app notifications on new messages
- Redis-based token revocation & OTP rate-limiting
- File uploads via Multer (profile picture, message attachments)
- AES-256-CBC phone number encryption

### Frontend (React)
- Login / Register / Email confirmation pages
- Protected dashboard with shareable anonymous link
- Inbox with paginated message list, expand/collapse, delete
- Public send-message page (no login required)
- Real-time unread notification badge in nav (polls every 30 s)
- Clean, minimal UI with custom CSS variables

---

## Project Structure

```
saraha/
├── Code/                   ← Express backend
│   ├── config/
│   │   ├── .env.development
│   │   └── .env.production
│   ├── src/
│   │   ├── DB/             ← Mongoose models & DB connection
│   │   ├── common/         ← Shared utils, enums, services
│   │   ├── middleware/     ← Auth & validation middleware
│   │   └── modules/        ← Feature modules (auth, user, messages, notifications)
│   └── package.json
└── frontend/               ← React + Vite frontend
    ├── src/
    │   ├── pages/          ← Login, Register, Dashboard, Inbox, SendMessage, ConfirmEmail
    │   ├── components/     ← Layout, Spinner
    │   ├── context/        ← AuthContext
    │   └── utils/          ← Axios API client
    └── package.json
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| MongoDB | ≥ 6 (local or Atlas) |
| Redis | ≥ 7 (local or Upstash) |

---

## Setup & Run

### 1 – Clone / unzip

```bash
unzip saraha.zip
cd saraha
```

### 2 – Backend setup

```bash
cd Code
npm install
```

Edit `config/.env.development` and fill in your real values:

| Variable | Description |
|----------|-------------|
| `DB_URI` | MongoDB connection string |
| `REDIS_URI` | Redis connection string |
| `EMAIL_APP` | Gmail address used to send OTPs |
| `EMAIL_APP_PASSWORD` | Gmail App Password (not your normal password) |
| `CLIENT_IDS` | Google OAuth client ID (optional) |
| `ENC_BYTE` | Must be exactly **32 characters** |

Start the backend in development mode:

```bash
npm run start:dev
```

The server starts on **http://localhost:3000**.

### 3 – Frontend setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The React app starts on **http://localhost:5173**.

Vite automatically proxies all `/api/*` requests to `http://localhost:3000`, so no CORS configuration is needed in development.

---

## API Endpoints

### Auth  `/auth`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/signup` | Register new user |
| PATCH | `/confirm-email` | Verify OTP |
| PATCH | `/resend-confirm-email` | Resend OTP |
| POST | `/login` | Login |
| POST | `/login/gmail` | Google OAuth login |
| POST | `/request-forget-password-code` | Send reset OTP |
| PATCH | `/verify-forget-password-code` | Verify reset OTP |
| PATCH | `/reset-forget-password-code` | Reset password via OTP |
| POST | `/request-forget-password-link` | Send reset magic link |
| PATCH | `/reset-forget-password-link` | Reset password via link |

### User  `/user`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get own profile |
| POST | `/logout` | Logout (single or all sessions) |
| PATCH | `/password` | Change password |
| POST | `/rotate-token` | Refresh access token |
| GET | `/:userId/share-profile` | Public profile (no auth needed) |
| GET | `/:userId/visit-profile` | Visit profile (increments counter) |
| POST | `/profile-image` | Upload profile picture |
| PATCH | `/profile-image` | Replace profile picture |
| DELETE | `/profile-image` | Remove profile picture |
| PATCH | `/profile-cover-image` | Upload cover images |

### Messages  `/message`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/:receiverId` | Send a message (anonymous OK) |
| GET | `/inbox` | Get received messages (auth required) |
| GET | `/sent` | Get sent messages (auth required) |
| GET | `/list` | Get all messages (auth required) |
| GET | `/:messageId` | Get single message |
| DELETE | `/:messageId` | Delete message (receiver only) |

### Notifications  `/notification`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get paginated notifications |
| GET | `/unread-count` | Get unread badge count |
| PATCH | `/:id/read` | Mark one as read |
| PATCH | `/read-all` | Mark all as read |
| DELETE | `/:id` | Delete notification |

### Other
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |

---

## Sending Anonymous Messages

Share your profile link:

```
http://localhost:5173/send/<your-user-id>
```

Anyone with this link can send you a message without creating an account.  
Your user ID appears on your **Dashboard** page.

---

## Environment Variables Reference

### Backend (`Code/config/.env.development`)

```env
PORT=3000
APPLICATION_NAME="Saraha_App"
DB_URI="mongodb://localhost:27017/Saraha_App"
REDIS_URI="redis://localhost:6379"
ENC_BYTE="12378978901234567891114567890122"   # exactly 32 chars
User_TOKEN_SECRET_KEY="your-secret"
User_REFRESH_TOKEN_SECRET_KEY="your-refresh-secret"
System_TOKEN_SECRET_KEY="your-admin-secret"
System_REFRESH_TOKEN_SECRET_KEY="your-admin-refresh-secret"
ACCESS_EXPIRES_IN=1800
REFRESH_EXPIRES_IN=31536000
SALT_ROUND=12
EMAIL_APP="you@gmail.com"
EMAIL_APP_PASSWORD="your-app-password"
CLIENT_IDS="google-client-id.apps.googleusercontent.com"
FACEBOOK_LINK="https://facebook.com/"
INSTAGRAM_LINK="https://instagram.com/"
TWITTER_LINK="https://x.com/"
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000   # only needed for production builds
```

---

## Notes

- The `ENC_BYTE` value **must be exactly 32 characters** for AES-256-CBC encryption.
- Email sending requires a valid Gmail App Password. Enable 2FA on your Google account and create an App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
- For production, use a reverse proxy (nginx/Caddy) in front of both servers and set `ORIGINS` to your frontend domain.
