import React from 'react';
import { CachedRoute } from '../components/CachedRoute';
import { GuestOnlyRoute } from '../components/auth/GuestOnlyRoute';
import Home from '../pages/Home';
import Shop from '../pages/Shop';
import About from '../pages/About';
import Contact from '../pages/Contact';
import ProductPage from '../pages/ProductPage';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Customize from '../pages/Customize';
import ResetPassword from '../pages/ResetPassword';
import OrderConfirmation from '../pages/OrderConfirmation';
import CustomizationConfirmation from '../pages/CustomizationConfirmation';
import AuthDebug from '../pages/AuthDebug';
import RegistrationSuccess from '../pages/RegistrationSuccess';
import PaymentSuccess from '../pages/PaymentSuccess';
import AppwriteTestPage from '../pages/AppwriteTestPage';
import VerifyEmail from '../pages/VerifyEmail';
import BringYourOwnItem from '../pages/BringYourOwnItem';

// Wrap components with CachedRoute to preserve state during navigation
const withCache = (Component: React.ComponentType<any>, cacheKey: string) => {
  return (props: any) => (
    <CachedRoute cacheKey={cacheKey}>
      <Component {...props} />
    </CachedRoute>
  );
};

// Pages that should keep their state when navigating away and back
const CachedHome = withCache(Home, 'home-page');
const CachedShop = withCache(Shop, 'shop-page');
const CachedAbout = withCache(About, 'about-page');
const CachedContact = withCache(Contact, 'contact-page');
const CachedCustomize = withCache(Customize, 'customize-page');
const CachedBringYourOwnItem = withCache(BringYourOwnItem, 'bring-your-own-item-page');

export const publicRoutes = [
  { index: true, element: <CachedHome /> },
  { path: "shop", element: <CachedShop /> },
  { path: "about", element: <CachedAbout /> },
  { path: "contact", element: <CachedContact /> },
  { path: "product/:id", element: <ProductPage /> },
  { path: "cart", element: <Cart /> },
  { path: "checkout", element: <Checkout /> },
  { path: "customize", element: <CachedCustomize /> },
  { path: "customize/bring-your-own-item", element: <CachedBringYourOwnItem /> },
  { path: "login", element: <GuestOnlyRoute><Login /></GuestOnlyRoute> },
  { path: "register", element: <GuestOnlyRoute><Register /></GuestOnlyRoute> },
  { path: "registration-success", element: <GuestOnlyRoute><RegistrationSuccess /></GuestOnlyRoute> },
  { path: "reset-password", element: <GuestOnlyRoute><ResetPassword /></GuestOnlyRoute> },
  { path: "verify-email", element: <GuestOnlyRoute><VerifyEmail /></GuestOnlyRoute> },
  { path: '/order-confirmation/:orderId', element: <OrderConfirmation /> },
  { path: '/customization-confirmation/:requestId', element: <CustomizationConfirmation /> },
  { path: 'payment/success', element: <PaymentSuccess /> },
  { path: 'auth-debug', element: <AuthDebug /> },
  { path: 'appwrite-test', element: <AppwriteTestPage /> },
];
