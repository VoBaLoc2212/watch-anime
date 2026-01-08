import { Mail, Github, Tv } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Tv className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Animever</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed text-justify">
              An online anime streaming platform developed for educational and research purposes. 
              This project aims to provide the best user experience and apply modern web technologies.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <a className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Home
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/browse">
                  <a className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Browse
                  </a>
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com/VoBaLoc2212/watch-anime" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Source Code
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider">Contact</h3>
            <div className="space-y-3">
              <a 
                href="mailto:asagawatakaku2212@gmail.com"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
              >
                <Mail className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span>asagawatakaku2212@gmail.com</span>
              </a>
              <a 
                href="https://github.com/VoBaLoc2212" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
              >
                <Github className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span>GitHub Profile</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              © {currentYear} Animever. Developed for educational and research purposes.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="hidden sm:inline">Made with ❤️ for learning</span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            <strong>Note:</strong> This is an educational and research project. 
            All content used in this project is for educational purposes only and is not intended for commercial use.
            Please respect the copyrights of the original authors and producers.
          </p>
        </div>
      </div>
    </footer>
  );
}
