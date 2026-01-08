import { LoginForm } from "@/components/LoginForm";
import { Tv } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";
import heroImage from "@assets/generated_images/hero_banner_anime_warrior.png";

export default function Login() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/80" />
        <div className="relative flex flex-col justify-center items-center text-white p-12">
          <Tv className="h-16 w-16 text-primary mb-4" />
          <h1 className="text-4xl font-bold mb-4">Welcome to AniVerSiTy</h1>
          <p className="text-xl text-white/80 text-center max-w-md">
            Stream thousands of anime episodes and discover your next favorite series
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <Link href="/">
            <div className="flex items-center justify-center gap-2 mb-8 cursor-pointer lg:hidden">
              <Tv className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">AniVerSiTy</span>
            </div>
          </Link>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
