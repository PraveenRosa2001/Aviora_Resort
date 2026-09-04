import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ScrollToTopButton from '../components/common/ScrollToTopButton';
import FloatingWhatsAppButton from '../components/common/FloatingWhatsAppButton';
import SEO from '../components/common/SEO';
import Home from '../pages/Home';
import RoomsAndVillas from '../pages/RoomsAndVillas';
import VillaDetailPage from '../pages/VillaDetailPage';
import Dining from '../pages/Dining';
import WellnessSpa from '../pages/WellnessSpa';
import Sustainability from '../pages/Sustainability';
import Gallery from '../pages/Gallery';
import AboutDestination from '../pages/AboutDestination';
import Contact from '../pages/Contact';
import BookingPage from '../pages/BookingPage';
import AuthPage from '../pages/AuthPage';
import AdminDashboard from '../pages/AdminDashboard';
import ProtectedRoute from '../components/auth/ProtectedRoute';

const pageTransition = {
  initial:   { opacity: 0, y: 16 },
  animate:   { opacity: 1, y: 0 },
  exit:      { opacity: 0, y: -8 },
  transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
};

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      transition={pageTransition.transition}
    >
      {children}
    </motion.div>
  );
}

export default function AppRouter() {
  const location = useLocation();

  return (
    <>
      <SEO />
      <Navbar />
      <main id="main-content">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
            <Route path="/rooms-villas" element={<PageWrapper><RoomsAndVillas /></PageWrapper>} />
            <Route path="/rooms-villas/:slug" element={<PageWrapper><VillaDetailPage /></PageWrapper>} />
            <Route path="/booking" element={<PageWrapper><BookingPage /></PageWrapper>} />
            <Route path="/login" element={<PageWrapper><AuthPage initialMode="login" /></PageWrapper>} />
            <Route path="/signup" element={<PageWrapper><AuthPage initialMode="register" /></PageWrapper>} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <PageWrapper><AdminDashboard /></PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route path="/dining" element={<PageWrapper><Dining /></PageWrapper>} />
            <Route path="/wellness" element={<PageWrapper><WellnessSpa /></PageWrapper>} />
            <Route path="/sustainability" element={<PageWrapper><Sustainability /></PageWrapper>} />
            <Route path="/gallery" element={<PageWrapper><Gallery /></PageWrapper>} />
            <Route path="/destination" element={<PageWrapper><AboutDestination /></PageWrapper>} />
            <Route path="/contact" element={<PageWrapper><Contact /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
      <FloatingWhatsAppButton />
      <ScrollToTopButton />
    </>
  );
}
