import HeaderMenuButton from "./header/HeaderMenuButton";
import HeaderBreadcrumb from "./header/HeaderBreadcrumb";
import NotificationDropdown from "./header/NotificationDropdown";
import UserDropdown from "./header/UserDropdown";

export function Header() {
  return (
    <header className="sticky top-0 z-10 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <HeaderMenuButton />
        <HeaderBreadcrumb />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        <NotificationDropdown />
        <div className="hidden sm:block w-px h-8 bg-gray-200 mx-2" />
        <UserDropdown />
      </div>
    </header>
  );
}

export default Header;
