# GutMantra - Premium eCommerce Platform

A production-ready eCommerce platform for GutMantra, specializing in premium stone-ground flour and organic grain products. Built with React, Firebase, and modern web technologies.

## 🌟 Key Features

### Authentication & Users
- **Google Sign-In** for seamless user onboarding
- **Email/Password Auth** for admin access
- **User Profiles** with order history and personal details
- **Persistent Sessions** with Firebase Auth
- **Role-Based Access** (Admin vs Regular Users)

### E-Commerce
- **Shopping Cart** with persistent storage
- **Product Catalog** with categories and subcategories
- **Checkout Flow** with order tracking
- **Multiple Payment Methods** (UPI, Cards, Cash on Delivery)
- **Order History** with status tracking
- **Admin Product Management** with image uploads

### Content & Branding
- **Our Story Page** with brand philosophy
- **Contact Us** with business information
- **Privacy Policy** with comprehensive coverage
- **Refund Policy** with clear terms
- **Mobile-Optimized** responsive design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Auth and Firestore enabled
- BillDesk account (optional, for payment integration)

### Installation

```bash
# 1. Navigate to project
cd /Users/akshadgawde/Desktop/Developer/gut

# 2. Install dependencies
npm install

# 3. Setup .env.local (see SETUP_GUIDE.md)
cp .env.example .env.local
# Edit .env.local with your Firebase credentials

# 4. Deploy Firestore rules
firebase deploy --only firestore:rules

# 5. Start development server
npm run dev
```

Visit `http://localhost:5173` (or `http://localhost:3000`)

## 📚 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup and configuration guide
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What's been implemented

## 🏗️ Architecture

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Context API** for state management

### Backend
- **Express.js** server
- **Firebase** for authentication and database
- **BillDesk** integration for payments

### Database
- **Firestore** for data storage
- **Firebase Storage** for images
- **Firebase Auth** for user authentication

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── admin/          # Admin pages
│   └── ...             # eCommerce components
├── context/            # React Context (Auth, Cart)
├── lib/                # Firebase config, utilities
├── services/           # Firebase operations
├── App.tsx             # Main app with routing
└── main.tsx            # Entry point

server.ts              # Express backend
firestore.rules        # Database security rules
```

## 🔐 Authentication

### User Authentication (Google)
```typescript
import { useAuth } from '@/src/context/AuthContext';

const { user, login, logout } = useAuth();
```

### Admin Authentication (Email/Password)
- Access: `/admin`
- Requires: System admin email
- Verified via: `VITE_ADMIN_EMAIL` environment variable

## 🛍️ Core Features

### User Profile
- View personal information
- See complete order history
- Track spending
- Quick access to cart

### Admin Panel
- Add/edit products
- Upload product images
- Manage inventory
- View orders

### Support Pages
- Contact information
- Privacy & refund policies
- Customer support details

## 🌐 Deployment

### Firebase Hosting (Recommended)
```bash
firebase deploy
```

### Vercel
```bash
vercel deploy
```

### Other Platforms
- Netlify
- AWS Amplify
- Google Cloud Platform

## 🔧 Configuration

### Environment Variables (.env.local)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ADMIN_EMAIL=gawdeakshad@gmail.com
BILLDESK_MERCHANT_ID=
BILLDESK_SECRET_KEY=
```

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Lint check
npm run lint
```

## 🎨 Design System

- **Primary Color**: Brown (#8B5E3C)
- **Secondary Color**: Orange/Gold
- **Background**: Cream/Beige tones
- **Typography**: Modern, clean sans-serif
- **Components**: Fully responsive

## 📱 Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

This is a proprietary project for GutMantra/Kanak Enterprises.

## 📄 License

Proprietary - All rights reserved to Kanak Enterprises

## 📞 Support

**GutMantra**
- Email: GutMantra24@gmail.com
- Phone: +91 9028107111
- Address: Pune, Maharashtra, India

## 🎯 Roadmap

- [ ] Email notifications
- [ ] SMS updates
- [ ] Advanced inventory
- [ ] Customer reviews
- [ ] Wishlist feature
- [ ] Referral program
- [ ] Live chat support
- [ ] Multi-language support
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

---

**Last Updated**: April 8, 2026
**Version**: 1.0.0
**Status**: ✅ Production Ready
