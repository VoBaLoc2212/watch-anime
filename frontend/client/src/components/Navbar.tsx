import { Link, useLocation } from "wouter";
import { SearchBar } from "./SearchBar";
import { ThemeToggle } from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import { Tv, User, KeyRound, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTokenFromUrl, useUserInfo } from "@/hooks/useTokenUrl";
import { useState } from "react";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

export function Navbar() {
  const [location] = useLocation();
  useTokenFromUrl();
  const { data: userInfo } = useUserInfo();
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-8 gap-4">
        <div className="flex items-center gap-8">
          <Link href="/">
            <div
              className="flex items-center gap-2 cursor-pointer"
              data-testid="link-logo"
            >
              <Tv className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">AniVerSiTy</span>
            </div>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/">
              <Button
                variant="ghost"
                className={location === "/" ? "text-primary" : ""}
                data-testid="link-home"
              >
                Home
              </Button>
            </Link>
            <Link href="/browse">
              <Button
                variant="ghost"
                className={location === "/browse" ? "text-primary" : ""}
                data-testid="link-browse"
              >
                Browse
              </Button>
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 mx-4 md:mx-8 lg:mx-16">
          <SearchBar />
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {(() => {
            const isClient = typeof window !== "undefined";
            const token = isClient
              ? localStorage.getItem("Token") ?? localStorage.getItem("token")
              : null;

            if (!token) {
              return (
                <div className="flex items-center gap-2">
                  <Link href="/register">
                    <Button variant="ghost" data-testid="btn-register">
                      Register
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button data-testid="btn-login">Login</Button>
                  </Link>
                </div>
              );
            }
            

            const fullName = userInfo?.fullName ?? "Nguoi dung";
            const email = userInfo?.email ?? "";
            const photoUrl = userInfo?.photoUrl ?? "";
              

            const lastWord =
              fullName.trim().split(/\s+/).filter(Boolean).pop() ?? "";
            const initial = lastWord ? lastWord[0].toUpperCase() : "";

            const handleLogout = () => {
              localStorage.removeItem("token");
              window.location.href = "/";
            };

            return (
              <>
                <NotificationBell />
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={fullName}
                        className="h-8 w-8 rounded-full object-cover"
                        data-testid="user-photo"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling;
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div
                      className={`h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium ${photoUrl ? 'hidden' : ''}`}
                      data-testid="user-initial"
                    >
                      {initial}
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span
                        className="text-sm font-medium"
                        data-testid="user-fullname"
                      >
                        {fullName}
                      </span>
                      {email ? (
                        <span
                          className="text-xs text-muted-foreground"
                          data-testid="user-email"
                        >
                          {email}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{fullName}</span>
                      {email && (
                        <span className="text-xs text-muted-foreground">
                          {email}
                        </span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/user-information">
                    <DropdownMenuItem data-testid="menu-item-profile">
                      <User className="mr-2 h-4 w-4" />
                      Infomation
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem 
                    data-testid="menu-item-change-password"
                    onClick={() => setShowChangePasswordDialog(true)}
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    Change Password
                  </DropdownMenuItem>
                  {userInfo?.role === "Admin" && (
                    <Link href="/manage-anime">
                      <DropdownMenuItem data-testid="menu-item-profile">
                        <User className="mr-2 h-4 w-4" />
                        Anime Management
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    data-testid="menu-item-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            );
          })()}
        </div>
      </div>

      {/* Change Password Dialog */}
      <ChangePasswordDialog 
        open={showChangePasswordDialog}
        onOpenChange={setShowChangePasswordDialog}
      />
    </header>
  );
}
