import { RegisterForm } from "@/components/RegisterForm";
import { Tv } from "lucide-react";
import { Link } from "wouter";
import heroImage from "@assets/generated_images/fantasy_battle_hero_banner.png";

export default function Register() {
  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/80" />
        <div className="relative flex flex-col justify-center items-center text-white p-12">
          <Tv className="h-16 w-16 text-primary mb-4" />
          <h1 className="text-4xl font-bold mb-4">Join AniVerSiTy</h1>
          <p className="text-xl text-white/80 text-center max-w-md">
            Create your account and start your anime journey today
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
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
