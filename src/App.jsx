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
import CheckoutPage from "./components/CheckoutPage";
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

// 👤 User Dashboard (from components folder)
import UserDashboard from "@/components/Dashboard";

// 🛠️ Admin Pages (from pages/admin folder)
import AdminLoginPage from "@/components/AdminLoginPage";
import AdminDashboard from "@/pages/admin/Dashboard";
import Users from "@/pages/admin/Users";
import Settings from "@/pages/admin/Settings";
import BlogManager from "@/pages/admin/BlogManager";
import BlogDetailPage from "./components/BlogDetailPage";
import HomePressReleaseDetail from "./components/HomePressReleaseDetail";
import PressReleaseAdmin from "./pages/admin/PressReleaseAdmin";
import CreatePressRelease from './pages/admin/CreatePressRelease';
import EditPressRelease from './pages/admin/EditPressRelease';

// 🔐 Auth & Route Guards
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";

// ✨ Animations
import { AnimatePresence } from "framer-motion";
import ContactUser from "./pages/admin/Contact";
import RefundPolicy from "./components/Refund-policy";
import SignUpForm from "./components/SignUpForm";

// 🏗️ Admin Layout Component
const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      {children}
    </div>
  );
};

// Create a SignUpPage component that uses SignUpForm
const SignUpPage = () => {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoginMode, setIsLoginMode] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Add your signup logic here
    console.log("Signup data:", formData);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleToggleMode = () => {
    // Redirect to login page or toggle mode
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <SignUpForm
          formData={formData}
          setFormData={setFormData}
          isLoading={isLoading}
          onToggleMode={handleToggleMode}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

// ❌ 404 Page
const NotFoundPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <h1 className="text-6xl font-bold text-red-600 mb-4">404</h1>
    <p className="text-xl text-gray-700 mb-4">Oops! Page not found.</p>
    <a href="/" className="text-purple-600 hover:underline">Go back home</a>
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
      <ScrollToTop/>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* ================= ADMIN ROUTES ================= */}
          <Route
            path="/admin"
            element={
              JSON.parse(localStorage.getItem("pdfpro_admin"))
                ? <Navigate to="/admin/dashboard" replace />
                : <Navigate to="/admin/login" replace />
            }
          />

          <Route
            path="/admin/login"
            element={
              JSON.parse(localStorage.getItem("pdfpro_admin"))
                ? <Navigate to="/admin/dashboard" replace />
                : <AdminLoginPage />
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
                  <PressReleaseAdmin/>
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
                  <ContactUser/>
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />
          
          {/* ================= PUBLIC & USER ROUTES ================= */}
          <Route
            path="/*"
            element={
              <>
                <Header />
                <main className="flex-1 pt-20 pb-10 px-6">
                  <Routes location={location} key={location.pathname}>
                    {/* Public Pages */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route path="/tools" element={<ToolsPage />} />
                    <Route path="/pricing" element={<BillingPage />} />
                    <Route path="/faq" element={<FaqPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/blog/:id" element={<BlogDetailPage />} />
                    <Route path="/press" element={<PressPage />} />
                    <Route path="/security" element={<SecurityPage />} />
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="/refund-policy" element={ <RefundPolicy/>} />
                    <Route path="/pricing-policy" element={ <PricingPolicyPage/>} />
                    <Route path="/checkout/:planId" element={<CheckoutPage />} />
                   
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/cookies" element={<CookiesPage />} />

                    <Route path="/homepress" element={<HomePressReleaseDetail/>}/>
                    
                    
                    {/* Protected User Pages */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <UserDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/tools/edit"
                      element={
                        <ProtectedRoute>
                          <EditTools />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/files"
                      element={
                        <ProtectedRoute>
                          <FilesPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Not Found */}
                    <Route path="*" element={<NotFoundPage />} />
                   
                  </Routes>
                </main>
                <Footer />
              </>
            }
          />
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
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;