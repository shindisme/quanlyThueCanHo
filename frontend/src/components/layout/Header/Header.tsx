import HeaderMenuButton from "./HeaderMenuButton";
import HeaderBreadcrumb from "./HeaderBreadcrumb";
import NotificationDropdown from "./NotificationDropdown";
import UserDropdown from "./UserDropdown";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 sm:px-4 lg:px-6">
      {/* Left side */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <HeaderMenuButton />
        <HeaderBreadcrumb />
      </div>

      {/* Right side */}
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <NotificationDropdown />
        <div className="hidden sm:block w-px h-8 bg-gray-200 mx-2" />
        <UserDropdown />
      </div>
    </header>
  );
}

export default Header;
