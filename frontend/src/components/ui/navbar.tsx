"use client";
// Force update - Sign In button changes
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "./button";
import { Menu, X, GraduationCap, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "@/components/auth/LoginModal";
import { RegisterModal } from "@/components/auth/RegisterModal";
import { UserMenu } from "@/components/auth/UserMenu";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // Primary navigation - always visible
  const primaryNavigation = [
    { name: "Home", href: "/" },
    { name: "Volunteering", href: "/volunteering" },
    { name: "Eligibility", href: "/eligibility" },
    { name: "Check-in", href: "/tutor/checkin" },
    { name: "Tutor Status", href: "/tutor/status" },
  ];

  // Secondary navigation - only visible when logged in
  const secondaryNavigation = [
    { name: "Profile", href: "/tutor/profile", requireAuth: true },
  ];

  const handleLoginClick = () => {
    setShowLoginModal(true);
    setIsOpen(false);
  };

  const switchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const switchToLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-royal-blue rounded-full flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">GVHS</span>
                <span className="text-lg font-bold text-royal-blue ml-1">NHS</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {/* Primary Navigation */}
              {primaryNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors duration-200 relative group ${
                    pathname === item.href
                      ? "text-royal-blue"
                      : "text-gray-700 hover:text-royal-blue"
                  }`}
                >
                  {item.name}
                  <span className={`absolute inset-x-0 bottom-0 h-0.5 bg-royal-blue transition-transform duration-200 ${
                    pathname === item.href
                      ? "transform scale-x-100"
                      : "transform scale-x-0 group-hover:scale-x-100"
                  }`} />
                </Link>
              ))}

              {/* Secondary Navigation - Only when authenticated */}
              {isAuthenticated && (
                <>
                  <div className="w-px h-6 bg-gray-200"></div>
                  {secondaryNavigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-3 py-2 text-sm font-medium transition-colors duration-200 relative group ${
                        pathname === item.href
                          ? "text-royal-blue"
                          : "text-gray-600 hover:text-royal-blue"
                      }`}
                    >
                      {item.name}
                      <span className={`absolute inset-x-0 bottom-0 h-0.5 bg-royal-blue transition-transform duration-200 ${
                        pathname === item.href
                          ? "transform scale-x-100"
                          : "transform scale-x-0 group-hover:scale-x-100"
                      }`} />
                    </Link>
                  ))}
                </>
              )}

              {/* Authentication Section */}
              <div className="flex items-center space-x-3">
                {isAuthenticated ? (
                  <UserMenu />
                ) : (
                  <Button
                    size="sm"
                    onClick={handleLoginClick}
                    className="bg-royal-blue text-white hover:bg-blue-700 transition-all duration-200"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-700 hover:text-royal-blue"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
                {/* Primary Navigation */}
                {primaryNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                      pathname === item.href
                        ? "text-royal-blue bg-blue-50 border-l-4 border-royal-blue"
                        : "text-gray-700 hover:text-royal-blue hover:bg-blue-50"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}

                {/* Secondary Navigation - Only when authenticated */}
                {isAuthenticated && (
                  <>
                    <div className="border-t border-gray-200 my-2"></div>
                    {secondaryNavigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                          pathname === item.href
                            ? "text-royal-blue bg-blue-50 border-l-4 border-royal-blue"
                            : "text-gray-600 hover:text-royal-blue hover:bg-blue-50"
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </>
                )}

                {/* Mobile Authentication */}
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  {isAuthenticated ? (
                    <div className="px-3 py-2">
                      <UserMenu />
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleLoginClick}
                      className="w-full bg-royal-blue text-white hover:bg-blue-700"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Authentication Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={switchToRegister}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={switchToLogin}
      />
    </>
  );
}
