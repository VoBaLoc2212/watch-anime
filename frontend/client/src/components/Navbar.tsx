import { Link, useLocation } from "wouter";
import { SearchBar } from "./SearchBar";
import { UserMenu } from "./UserMenu";
import { ThemeToggle } from "./ThemeToggle";
import { Tv } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-8 gap-4">
        <div className="flex items-center gap-8">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer" data-testid="link-logo">
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
                Đăng ký
              </Button>
            </Link>
            <Link href="/login">
              <Button data-testid="btn-login">Đăng nhập</Button>
            </Link>
          </div>
              );
            }

            // Logged in: read profile info from localStorage
            const fullName = isClient
              ? localStorage.getItem("fullName") ?? localStorage.getItem("fullName") ?? "Người dùng"
              : "Người dùng";
            const email = isClient ? localStorage.getItem("email") ?? "" : "";
            const photoUrl = isClient ? localStorage.getItem("photoUrl") ?? "" : "";

            const lastWord = fullName.trim().split(/\s+/).filter(Boolean).pop() ?? "";
            const initial = lastWord ? lastWord[0].toUpperCase() : "";

            return (
              <div className="flex items-center gap-3">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={fullName}
              className="h-8 w-8 rounded-full object-cover"
              data-testid="user-photo"
            />
          ) : (
            <div
              className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium"
              data-testid="user-initial"
            >
              {initial}
            </div>
          )}
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium" data-testid="user-fullname">
              {fullName}
            </span>
            {email ? (
              <span className="text-xs text-muted-foreground" data-testid="user-email">
                {email}
              </span>
            ) : null}
          </div>
              </div>
            );
          })()}
        </div>
      </div>
    </header>
  );
}
