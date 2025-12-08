import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Helmet } from "react-helmet";
import { Toaster } from "@/components/ui/toaster";

// 🌐 Site Components
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomePage from "@/components/HomePage";
import LoginPage from "@/components/LoginPage";
import ToolsPage from "@/components/ToolsPage";
import BillingPage from "@/components/BillingPage";
import FilesPage from "@/components/FilesPage";
import PricingPolicyPage from "@/components/PricingPolicyPage";
import CheckoutPage from "@/pages/CheckoutPage";
import FaqPage from "@/components/FaqPage";
import AboutPage from "@/components/AboutPage";
import ContactPage from "@/components/ContactPage";
import BlogPage from "@/components/BlogPage";
import PressPage from "@/components/PressPage";
import SecurityPage from "@/components/SecurityPage";
import PrivacyPolicyPage from "@/components/PrivacyPolicyPage";
import TermsPage from "@/components/TermsPage";
import CookiesPage from "@/components/CookiesPage";
import ScrollToTop from "./components/ScrollToTop";
import EditTools from "./pages/tools/EditTools";
import PaymentResult from "./pages/PaymentResult";
import BillingSettings from "./pages/BillingSettings";
import AuthSuccess from "@/components/AuthSuccess";
import ProfilePage from "@/components/ProfilePage";
import PaymentManagement from "@/pages/admin/PaymentManagement";
import Activities from "./pages/Activities";


import TopupPage from "@/components/TopupPage"; // User-facing page
import TopupManagement from "@/pages/admin/TopupManagement"; // Admin panel
import TopupPaymentResult from "@/pages/TopupPaymentResult";

// 👤 User Dashboard
import UserDashboard from "@/components/Dashboard";

// 🛠️ Admin Pages
import AdminLoginPage from "@/components/AdminLoginPage";
import AdminDashboard from "@/pages/admin/Dashboard";
import Users from "@/pages/admin/Users";
import Settings from "@/pages/admin/Settings";
import BlogManager from "@/pages/admin/BlogManager";
import BlogDetailPage from "./components/BlogDetailPage";
import HomePressReleaseDetail from "./components/HomePressReleaseDetail";
import PressReleaseAdmin from "./pages/admin/PressReleaseAdmin";
import CreatePressRelease from "./pages/admin/CreatePressRelease";
import EditPressRelease from "./pages/admin/EditPressRelease";
import PricingManagement from "./pages/admin/PricingManagement";


// 🔐 Auth & Route Guards
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";

// ✨ NEW: Notification System
import { NotificationProvider } from "@/contexts/NotificationContext";
import NotificationContainer from "@/components/Notification/NotificationContainer";

// ✨ Animations
import { AnimatePresence } from "framer-motion";
import ContactUser from "./pages/admin/Contact";
import RefundPolicy from "./components/Refund-policy";
import SignUpForm from "./components/SignUpForm";

// 🏗️ Admin Layout Component
const AdminLayout = ({ children }) => {
  return <div className="min-h-screen bg-gray-100">{children}</div>;
};

// Create a SignUpPage component that uses SignUpForm
const SignUpPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
};

// ❌ 404 Page
const NotFoundPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <h1 className="text-6xl font-bold text-red-600 mb-4">404</h1>
    <p className="text-xl text-gray-700 mb-4">Oops! Page not found.</p>
    <a href="/" className="text-purple-600 hover:underline">
      Go back home
    </a>
  </div>
);

function AppContent() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>PDF Works - The Future of Document Management</title>
        <meta
          name="description"
          content="AI-powered PDF editing, conversion, compression, OCR, and e-signature."
        />
        <link rel="icon" href="/image (1).png" type="image/png" />
        <link rel="apple-touch-icon" href="/image (1).png" />
        <link rel="shortcut icon" href="/image (1).png" type="image/png" />
      </Helmet>
      <ScrollToTop />

      {/* ✨ NEW: Notification Container */}
      <NotificationContainer />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* ================= ADMIN ROUTES ================= */}
          <Route
            path="/admin"
            element={
              localStorage.getItem("pdfpro_admin_token") ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />

          <Route
            path="/admin/login"
            element={
              localStorage.getItem("pdfpro_admin_token") ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <AdminLoginPage />
              )
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <Users />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/blog-management"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <BlogManager />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <Settings />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/press-release"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <PressReleaseAdmin />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/press-release/create"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <CreatePressRelease />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/press-release/edit/:id"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <EditPressRelease />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/contact-details"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <ContactUser />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/payments"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <PaymentManagement />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          {/* ✅ PRICING MANAGEMENT ROUTE */}
          <Route
            path="/admin/pricing"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <PricingManagement />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          {/* ✅ NEW: TOPUP MANAGEMENT ROUTE */}
          <Route
            path="/admin/topup"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <TopupManagement />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          {/* ================= PUBLIC & USER ROUTES ================= */}
          
          {/* Public Pages with Header & Footer */}
          <Route path="/" element={
            <>
              <Header />
              <main className="flex-1 pt-20 pb-10 px-6">
                <HomePage />
              </main>
              <Footer />
            </>
          } />
          
          <Route path="/login" element={
            <>
              <Header />
              <main className="flex-1 pt-20 pb-10 px-6">
                <LoginPage />
              </main>
              <Footer />
            </>
          } />
          
          <Route path="/signup" element={
            <>
              <Header />
              <main className="flex-1 pt-20 pb-10 px-6">
                <SignUpPage />
              </main>
              <Footer />
            </>
          } />
          
          <Route path="/tools" element={
            <>
              <Header />
              <main className="flex-1 pt-20 pb-10 px-6">
                <ToolsPage />
              </main>
              <Footer />
            </>
          } />
          
          <Route path="/pricing" element={
            <>
              <Header />
              <main className="flex-1 pt-20 pb-10 px-6">
                <BillingPage />
              </main>
              <Footer />
            </>
          } />

          {/* ✅ NEW: SEPARATE TOPUP PAGE */}
          <Route path="/topup" element={
            <>
              <Header />
              <main className="flex-1 pt-20 pb-10 px-6">
                <TopupPage />
              </main>
              <Footer />
            </>
          } />
          
          <Route path="/faq" element={
            <>
              <Header />
              <main className="flex-1 pt-20 pb-10 px-6">
                <FaqPage />
              </main>
              <Footer />
            </>
          } />
          
          <Route path="/about" element={
            <>
              <Header />
              <main className="flex-1 pt-20 pb-10 px-6">
                <AboutPage />
              </main>
              <Footer />
            </>
          } />
          
          <Route path="/contact" element={
            <>
              <Header />
              <main className="flex-1 pt-20 pb-10 px-6">
                <ContactPage />
              </main>
              <Footer />
            </>
          } />
          
          <Route path="/blog" element={
            <>
              <Header />
              <main className="flex-1 pt-20 pb-10 px-6">
                <BlogPage />
              </main>
              <Footer />
            </>
          } />
          
          <Route path="/blog/:id" element={
            <>
              <Header />
              <main className="flex-1 pt-20 pb-10 px-6">
                <BlogDetailPage />
              </main>
              <Footer />
            </>
          } />
          
          <Route path="/press" element={
            <>
              <Header />
              <main className="flex-1 pt-20 pb-10 px-6">
                <PressPage />
              </main>
              <Footer />
            </>
          } />
          
          <Route path="/security" element={
            <>
              <Header />
              <main className="flex-1 pt-20 pb-10 px-6">
                <SecurityPage />
              </main>
              <Footer />
            </>
          } />
          
          <Route path="/privacy" element={
            <>
              <Header />
              <main className="flex-1 pt-20 pb-10 px-6">
                <PrivacyPolicyPage />
              </main>
              <Footer />
            </>
          } />
          
          <Route path="/refund-policy" element={
            <>
              <Header />
              <main className="flex-1 pt-20 pb-10 px-6">
                <RefundPolicy />
              </main>
              <Footer />
            </>
          } />
          
          <Route path="/pricing-policy" element={
            <>
              <Header />
              <main className="flex-1 pt-20 pb-10 px-6">
                <PricingPolicyPage />
              </main>
              <Footer />
            </>
          } />
          
          <Route path="/terms" element={
            <>
              <Header />
              <main className="flex-1 pt-20 pb-10 px-6">
                <TermsPage />
              </main>
              <Footer />
            </>
          } />
          
          <Route path="/cookies" element={
            <>
              <Header />
              <main className="flex-1 pt-20 pb-10 px-6">
                <CookiesPage />
              </main>
              <Footer />
            </>
          } />
          
          <Route path="/homepress" element={
            <>
              <Header />
              <main className="flex-1 pt-20 pb-10 px-6">
                <HomePressReleaseDetail />
              </main>
              <Footer />
            </>
          } />

          {/* Protected User Pages */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Header />
                <main className="flex-1 pt-20 pb-10 px-6">
                  <UserDashboard />
                </main>
                <Footer />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/billing/settings"
            element={
              <ProtectedRoute>
                <Header />
                <main className="flex-1 pt-20 pb-10 px-6">
                  <BillingSettings />
                </main>
                <Footer />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/tools/edit"
            element={
              <ProtectedRoute>
                <Header />
                <main className="flex-1 pt-20 pb-10 px-6">
                  <EditTools />
                </main>
                <Footer />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/files"
            element={
              <ProtectedRoute>
                <Header />
                <main className="flex-1 pt-20 pb-10 px-6">
                  <FilesPage />
                </main>
                <Footer />
              </ProtectedRoute>
            }
          />

          <Route
            path="/activities"
            element={
              <ProtectedRoute>
                <Header />
                <main className="flex-1 pt-20 pb-10 px-6">
                  <Activities />
                </main>
                <Footer />
              </ProtectedRoute>
            }
          />
          
          {/* Profile Page Route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Header />
                <main className="flex-1 pt-20 pb-10 px-6">
                  <ProfilePage />
                </main>
                <Footer />
              </ProtectedRoute>
            }
          />

          {/* Public routes without Header/Footer */}
          <Route path="/checkout/:planId" element={<CheckoutPage />} />
          <Route path="/payment/result" element={<PaymentResult />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
            <Route path="/payment/topup-result" element={<TopupPaymentResult />} />
          {/* Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>

      <Toaster />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* ✨ NEW: Wrap with NotificationProvider */}
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;