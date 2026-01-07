# OpinionHub - Product Poll & Voting Platform

A full-stack Next.js application for creating and managing product polls with voting functionality. Built with TypeScript, MongoDB, Mongoose, and Tailwind CSS.

## Features

### User Side
- 📋 View list of categories
- 🔥 Browse trending products with images and statements
- ✅ Vote using Yes/No buttons with CAPTCHA verification
- 🚫 Prevent multiple votes from the same user
- ✨ Success message after voting
- 🔍 Filter products by category
- 📊 View vote percentages and statistics

### Admin Side
- 🔐 Email and password-based authentication
- 📁 Create and delete categories
- 📝 Create polls with:
  - Product name
  - Statement (e.g., "Is iPhone worth buying?")
  - Product image URL
  - Custom Yes/No button text
- 📊 View all polls with Yes/No vote percentages
- 🗑️ Delete polls

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB
- **ORM**: Mongoose
- **Styling**: Tailwind CSS
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod
- **Image Storage**: Cloudinary (with local storage fallback)

## Project Structure

```
OpinionHub/
├── app/
│   ├── api/
│   │   ├── categories/          # Public category endpoints
│   │   ├── polls/               # Public poll endpoints
│   │   └── admin/               # Admin endpoints (protected)
│   ├── admin/
│   │   ├── login/               # Admin login page
│   │   └── dashboard/           # Admin dashboard
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page (user side)
├── components/
│   ├── admin/                   # Admin components
│   ├── CategoryFilter.tsx       # Category filter component
│   └── PollCard.tsx             # Poll card component
├── lib/
│   ├── auth.ts                  # Authentication utilities
│   ├── mongodb.ts               # MongoDB connection
│   └── utils.ts                 # Utility functions
├── models/
│   ├── Admin.ts                 # Admin model
│   ├── Category.ts              # Category model
│   ├── Poll.ts                  # Poll model
│   └── Vote.ts                  # Vote model
├── scripts/
│   └── seed-admin.ts            # Admin seeding script
├── types/
│   └── index.ts                 # TypeScript types
└── .env.example                 # Environment variables example
```

## Getting Started

### Quick Start

For a quick setup guide, see **[SETUP.md](./SETUP.md)**

For detailed MongoDB setup instructions, see **[MONGODB_SETUP.md](./MONGODB_SETUP.md)**

For Cloudinary image storage setup, see **[CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md)**

### Prerequisites

- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas account
- Cloudinary account (for image storage) - See [CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md)
- Cloudflare Turnstile keys (optional for development)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment variables are already configured** in `.env.local`:
   - ✅ JWT_SECRET is already generated
   - ⚠️ Update `MONGODB_URI` with your MongoDB connection string
   - ⚠️ Add Cloudinary credentials (recommended) - See [CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md)
   - ⚠️ Add Cloudflare Turnstile keys (optional for development)

3. **Set up MongoDB Database:**
   
   **Option A: Local MongoDB**
   ```bash
   # macOS
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community
   ```
   
   **Option B: MongoDB Atlas (Cloud)**
   - See [MONGODB_SETUP.md](./MONGODB_SETUP.md) for detailed steps
   - Update `.env.local` with your Atlas connection string

4. **Create an admin user:**
   ```bash
   # Run the migration to create admin account
   npm run migrate:admin
   
   # Or use the seed script with custom credentials
   npx ts-node scripts/seed-admin.ts admin@example.com mypassword123
   ```
   
   **Default Admin Credentials:**
   - Email: `abhishek.singh@cosmostaker.com`
   - Password: `Admin@12`
   
   ⚠️ **Important:** Change the default password after first login!

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   - User side: http://localhost:3000
   - Admin login: http://localhost:3000/admin/login

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `NODE_ENV` | Environment (development/production) | Optional |

## API Endpoints

### Public Endpoints

- `GET /api/categories` - Get all categories
- `GET /api/polls` - Get all polls (optional `?category=categoryId` query)
- `POST /api/polls/vote` - Submit a vote (requires CAPTCHA)

### Admin Endpoints (Protected)

- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/me` - Get current admin info
- `GET /api/admin/categories` - Get all categories
- `POST /api/admin/categories` - Create category
- `DELETE /api/admin/categories/[id]` - Delete category
- `GET /api/admin/polls` - Get all polls with stats
- `POST /api/admin/polls` - Create poll
- `DELETE /api/admin/polls/[id]` - Delete poll

## Security Features

- ✅ JWT-based authentication for admin routes
- ✅ Password hashing with bcrypt
- ✅ CAPTCHA verification for votes
- ✅ IP-based vote prevention (prevents duplicate votes)
- ✅ Input validation with Zod
- ✅ Secure HTTP-only cookies for admin sessions
- ✅ Protected admin API routes

## Database Models

### Admin
- Email (unique)
- Password (hashed)

### Category
- Name (unique)
- Slug (auto-generated)

### Poll
- Product name
- Statement
- Product image URL
- Yes/No button text
- Category reference
- Vote counts (yes/no)

### Vote
- Poll reference
- User identifier (Device ID)
- Vote value (yes/no)
- Unique constraint on (poll, userIdentifier)

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Notes

- **Vote Prevention**: Votes are tracked by device ID (stored in browser localStorage). Each device can vote once per poll.
- **Image URLs**: Product images must be publicly accessible URLs.
- **Admin Password**: Change the default admin password after first login.

## License

This project is open source and available under the MIT License.

