# Needle - Reverse Marketplace

A modern reverse marketplace platform where buyers post product requests and sellers compete to fulfill them. Built with Next.js, featuring real-time messaging, location-based search, and a seamless user experience.

## 🎯 Overview

Needle flips the traditional marketplace model. Instead of sellers listing products, buyers post what they need, and sellers make offers. This creates a competitive environment where buyers get exactly what they want at the price they're willing to pay.

## ✨ Features

### Core Functionality
- **Post Product Requests**: Buyers can post detailed requests with descriptions, prices, and ZIP codes
- **Browse Requests**: Sellers can search and filter requests by location and keywords
- **Make Offers**: Sellers can make offers with custom amounts and messages
- **Manage Offers**: View sent and received offers with accept/reject functionality
- **Real-Time Messaging**: WebSocket-powered chat system for accepted offers
- **Location-Based Search**: Find requests within a specified radius from your location or ZIP code

### User Experience
- **Authentication**: Secure authentication via Kinde
- **Responsive Design**: Beautiful, modern UI that works on all devices
- **Real-Time Updates**: Instant notifications and message updates
- **Intuitive Navigation**: Clean, organized interface for all features

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Server-side API endpoints
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **Socket.IO** - Real-time WebSocket communication

### Authentication & Services
- **Kinde Auth** - Authentication and user management
- **Zippopotam.us** - ZIP code validation and geocoding

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 20.19+ or 22.12+ or 24.0+
- **npm** or **yarn** or **pnpm**
- **PostgreSQL** database (local or cloud-hosted)
- **Kinde** account for authentication

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone aaksay1/needle
cd needle
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/needle?schema=public"

# Kinde Authentication
KINDE_SITE_URL=http://localhost:3000
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3000
KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3000
KINDE_CLIENT_ID=your_kinde_client_id
KINDE_CLIENT_SECRET=your_kinde_client_secret
KINDE_ISSUER_URL=https://your-domain.kinde.com

# Optional: Prisma Accelerate
PRISMA_ACCELERATE_URL=your_accelerate_url
```

### 4. Database Setup

Generate Prisma client and push the schema to your database:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (for development)
npx prisma db push

# Or run migrations (for production)
npx prisma migrate dev
```

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

**Note**: This project uses a custom server (`server.js`) to support WebSocket connections via Socket.IO. The dev script runs this custom server.

## 📁 Project Structure

```
needle/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   │   ├── auth/                # Authentication endpoints
│   │   ├── messages/            # Messaging API
│   │   ├── search-requests/     # Search functionality
│   │   └── ...
│   ├── browse-requests/         # Browse requests page
│   ├── my-offers/              # Offers management
│   ├── my-requests/            # User's posted requests
│   ├── messages/               # Messaging interface
│   ├── post-requests/          # Create new request
│   ├── components/             # Shared components
│   ├── lib/                    # Utility functions
│   └── actions.ts              # Server actions
├── components/                  # UI components
│   └── ui/                     # Reusable UI components
├── prisma/                     # Database schema
│   └── schema.prisma           # Prisma schema definition
├── server.js                   # Custom server for WebSockets
└── public/                     # Static assets
```

## 🔑 Key Features Explained

### Location-Based Search
- Users can search for requests by ZIP code or use their device's geolocation
- Requests are filtered by distance (5, 10, 15, 25, or 50 miles)
- ZIP codes are validated and converted to coordinates for distance calculations

### Offer System
- **Making Offers**: Sellers can make offers on any request (except their own)
- **Offer Management**: 
  - Accept: Creates a conversation and allows messaging
  - Reject: Permanently deletes the offer
- Offers include amount and optional message

### Real-Time Messaging
- When an offer is accepted, a conversation is automatically created
- The first message is the offer message (or a default message)
- Both users can see the conversation in their Messages tab
- Real-time message delivery via WebSocket

### Authentication
- Secure authentication handled by Kinde
- User data automatically synced to database
- Protected routes for authenticated features

## 🗄️ Database Schema

The application uses the following main models:

- **User**: User accounts and profiles
- **Product**: Product requests posted by buyers
- **Offer**: Offers made by sellers on products
- **Conversation**: Chat conversations between users
- **Message**: Individual messages within conversations

## 🧪 Development

### Available Scripts

```bash
# Development server (with WebSocket support)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Prisma commands
npx prisma generate    # Generate Prisma Client
npx prisma db push     # Push schema changes (dev)
npx prisma migrate dev # Create migration (prod)
npx prisma studio      # Open Prisma Studio
```

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- Component-based architecture

## 🚢 Deployment

### Prerequisites for Production
1. Set up a PostgreSQL database (e.g., Supabase, Railway, or AWS RDS)
2. Configure environment variables in your hosting platform
3. Ensure WebSocket support (required for real-time messaging)

### Recommended Platforms
- **Vercel**: Easy Next.js deployment (note: WebSocket support may require custom setup)
- **Railway**: Full-stack deployment with WebSocket support
- **Render**: Supports Node.js apps with WebSocket capabilities

### Deployment Steps
1. Push your code to a Git repository
2. Connect your repository to your hosting platform
3. Configure environment variables
4. Run database migrations: `npx prisma migrate deploy`
5. Deploy!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is private and proprietary.

## 🆘 Support

For issues and questions:
1. Check existing issues in the repository
2. Review the documentation
3. Create a new issue with detailed information

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Authentication by [Kinde](https://kinde.com/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)

---