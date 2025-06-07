# 🎨 Kri8tiveMerch - Custom Merchandise E-Commerce Platform

A modern, full-featured e-commerce platform for custom merchandise and printing services. Built with React, TypeScript, Appwrite, and TailwindCSS.

## ✨ Features

### 🛍️ Core E-Commerce
- **Product Management**: Complete CRUD operations for merchandise products
- **Shopping Cart**: Add, remove, and manage items with real-time updates
- **Order Processing**: End-to-end order management and tracking
- **Payment Integration**: Secure payments via Paystack
- **Inventory Management**: Stock tracking and low-stock alerts

### 🎨 Custom Design Tools
- **Canvas Designer**: Interactive design tool using Fabric.js
- **File Uploads**: Support for multiple image formats including AVIF
- **Design Templates**: Pre-built templates for quick customization
- **Real-time Preview**: Live preview of custom designs

### 👥 Multi-Role System
- **Customer**: Browse, customize, and purchase products
- **Shop Manager**: Manage products, orders, and customer requests
- **Super Admin**: Full system administration and user management

### 🖨️ Printing Services
- **Multiple Techniques**: Various printing methods with cost calculations
- **Fabric Quality Options**: Different material grades and pricing
- **Size-based Pricing**: Dynamic pricing based on product dimensions
- **Custom Requests**: Handle personalized printing requests

### 📱 Modern UI/UX
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Dark/Light Mode**: Theme switching capability
- **Accessibility**: WCAG compliant components
- **Performance**: Optimized with code splitting and lazy loading

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library

### Backend & Services
- **Appwrite** - Backend-as-a-Service (BaaS)
- **Paystack** - Payment processing
- **ImageKit** - Image optimization and delivery

### Design & Canvas
- **Fabric.js** - Interactive canvas for custom designs
- **HTML2Canvas** - Canvas to image conversion
- **jsPDF** - PDF generation for invoices

### State Management
- **Zustand** - Lightweight state management
- **React Context** - Component state sharing
- **React Hook Form** - Form state management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Appwrite instance (cloud or self-hosted)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kri8tivemike/Kri8tiveMerch-Private.git
   cd Kri8tiveMerch-Private
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your environment variables:
   ```env
   VITE_APPWRITE_ENDPOINT=https://your-appwrite-endpoint
   VITE_APPWRITE_PROJECT_ID=your-project-id
   VITE_PAYSTACK_PUBLIC_KEY=your-paystack-public-key
   VITE_IMAGEKIT_PUBLIC_KEY=your-imagekit-public-key
   VITE_IMAGEKIT_URL_ENDPOINT=your-imagekit-url
   ```

4. **Database Setup**
   ```bash
   # Initialize Appwrite database
   npm run appwrite:init
   
   # Create storage bucket
   npm run appwrite:create-bucket
   
   # Set up user collections
   npm run setup-user-collections
   
   # Create admin user
   npm run create-superadmin
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── admin/          # Admin dashboard components
│   ├── customization/  # Design and customization tools
│   ├── payment/        # Payment processing components
│   ├── product/        # Product-related components
│   └── ui/             # Reusable UI components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── pages/              # Page components
├── services/           # API and external services
├── stores/             # Zustand stores
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

## 🔧 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

### Database Management
- `npm run appwrite:init` - Initialize Appwrite database
- `npm run appwrite:create-bucket` - Create storage bucket
- `npm run setup-user-collections` - Set up user collections
- `npm run create-superadmin` - Create super admin user

### Code Quality
- `npm run cleanup-imports` - Remove unused imports
- `npm run scan-deprecated` - Scan for deprecated code
- `npm run cleanup-all` - Run all cleanup tasks

## 🎯 Key Features Walkthrough

### Custom Design Canvas
The platform includes a powerful design tool built with Fabric.js:
- Add text, images, and shapes
- Layer management
- Color customization
- Font selection
- Export to various formats

### Multi-Role Authentication
Secure role-based access control:
- JWT-based authentication via Appwrite
- Role-specific dashboards
- Permission-based feature access

### Payment Processing
Integrated payment system:
- Paystack integration
- Order tracking
- Invoice generation
- Payment verification

### Product Management
Comprehensive product system:
- Category management
- Inventory tracking
- Image galleries
- Variant support (colors, sizes)

## 🔐 Security Features

- **Authentication**: Secure JWT-based auth with Appwrite
- **Authorization**: Role-based access control
- **Data Validation**: Zod schema validation
- **File Upload Security**: Type and size validation
- **CORS Protection**: Configured for production

## 🌐 Deployment

### Environment Variables
Ensure all required environment variables are set:
- Appwrite configuration
- Payment gateway keys
- Image service credentials

### Build Process
```bash
npm run build
```

### Deployment Platforms
- **Vercel**: Recommended for frontend deployment
- **Netlify**: Alternative frontend hosting
- **Appwrite Cloud**: For backend services

## 📚 Documentation

### API Documentation
- Appwrite collections and attributes are documented in `/scripts`
- Service functions include JSDoc comments
- Type definitions provide comprehensive API contracts

### Component Documentation
- Components follow consistent patterns
- Props are typed with TypeScript interfaces
- Usage examples in component files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary. All rights reserved.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in `/docs`

## 🔄 Version History

- **v1.0.0** - Initial release with core e-commerce features
- **v1.1.0** - Added custom design canvas
- **v1.2.0** - Multi-role system implementation
- **v1.3.0** - Payment integration and order management

---

Built with ❤️ by the Kri8tive team 