import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Building2 } from "lucide-react";

export default function GuestNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 50);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isMobileOpen]);

  const navLinks = [
    { label: "Trang chủ", path: "/" },
    { label: "Căn hộ", path: "/apartments" },
    { label: "Giới thiệu", path: "/about" },
    { label: "Liên hệ", path: "/contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100"
        : "bg-white/80 backdrop-blur-sm"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-t-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}>
              <Building2 size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gray-800">YuKi House</span>
          </Link>

          {/* Desktop menu */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === link.path
                  ? "text-primary-600 bg-primary-50"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:block w-5 h-5"></div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label={isMobileOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={isMobileOpen}
            aria-controls="guest-mobile-menu"
            className="cursor-pointer rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileOpen && (
          <div id="guest-mobile-menu" className="border-t border-gray-100 py-4 animate-slide-in-up lg:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileOpen(false)}
                className={`block px-4 py-3 text-sm font-medium rounded-lg ${location.pathname === link.path
                  ? "text-primary-600 bg-primary-50"
                  : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
