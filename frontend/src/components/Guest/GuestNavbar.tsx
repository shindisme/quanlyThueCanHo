import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

// Navbar cho Guest Website
// Trong suot khi o trang chu, co nen khi cuon xuong
export default function GuestNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Theo doi cuon trang de doi mau navbar
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 50);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Trang chu", path: "/" },
    { label: "Can ho", path: "/apartments" },
    { label: "Toa nha", path: "/buildings" },
    { label: "Gioi thieu", path: "/about" },
    { label: "Lien he", path: "/contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white shadow-card"
          : "bg-white/90 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">DK</span>
            </div>
            <span className="text-lg font-bold text-gray-800">DuKiHome</span>
          </Link>

          {/* Menu desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? "text-primary-600 bg-primary-50"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Nut dang nhap */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
            >
              Dang nhap
            </Link>
          </div>

          {/* Menu mobile toggle */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu mobile */}
        {isMobileOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-slide-in-up">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/login"
              onClick={() => setIsMobileOpen(false)}
              className="block mt-2 px-4 py-3 text-sm font-medium text-primary-600 bg-primary-50 rounded-xl text-center"
            >
              Dang nhap
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
