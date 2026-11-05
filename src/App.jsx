import { useEffect } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { CartDrawer, Toast } from "./components/CartDrawer";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Collections from "./pages/Collections";
import Membership from "./pages/Membership";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import Terms from "./pages/Terms";
import Admin from "./pages/Admin";
import { Blog, Post } from "./pages/Blog";
import { useTitle } from "./useTitle";

function ScrollTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (hash) {
        const target = document.querySelector(hash);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }
      window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
  return null;
}

function NotFound() {
  useTitle("Page not found");
  return (
    <section className="section">
      <div className="wrap narrow empty">
        <h1>That page is out of bounds.</h1>
        <p className="muted">The link may have moved. The shop is still open.</p>
        <Link to="/shop" className="btn-lime">
          Shop now
        </Link>
      </div>
    </section>
  );
}

export default function App() {
  const location = useLocation();
  const admin = location.pathname.startsWith("/admin");

  return (
    <>
      <ScrollTop />
      {!admin && <Header />}
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/services" element={<Services />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<Post />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!admin && (
        <>
          <Footer />
          <CartDrawer />
          <Toast />
          <FloatingWhatsApp />
        </>
      )}
    </>
  );
}
