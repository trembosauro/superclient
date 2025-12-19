import { APP_LOGO } from "@/const";
import { Link } from "wouter";
import { Mail, Phone, Linkedin } from "lucide-react";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <nav className="container flex items-center justify-between h-16 md:h-20">
        <Link href="/" className="flex items-center gap-3 font-medium text-lg text-accent hover:opacity-80 transition-opacity">
          <img src={APP_LOGO} alt="Logo" className="w-10 h-10 rounded-full object-cover" />
          <span className="hidden sm:inline">Kahuê</span>
        </Link>
        
        <ul className="hidden md:flex items-center gap-8">
          <li>
            <a href="#about" className="text-foreground/70 hover:text-accent transition-colors text-sm font-medium">
              About
            </a>
          </li>
          <li>
            <a href="#projects" className="text-foreground/70 hover:text-accent transition-colors text-sm font-medium">
              Projects
            </a>
          </li>
          <li>
            <a href="#contact" className="text-foreground/70 hover:text-accent transition-colors text-sm font-medium">
              Contact
            </a>
          </li>
        </ul>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <a
              href="https://www.linkedin.com/in/ukahue/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 text-foreground/70 hover:text-accent transition-colors"
              title="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="mailto:kahuemorais@gmail.com"
              className="p-2.5 text-foreground/70 hover:text-accent transition-colors"
              title="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
            <a
              href="tel:+5511910612191"
              className="p-2.5 text-foreground/70 hover:text-accent transition-colors"
              title="Phone"
            >
              <Phone className="w-5 h-5" />
            </a>
          </div>

          <a
            href="https://www.linkedin.com/in/ukahue/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 bg-accent text-accent-foreground rounded-[var(--radius-button)] font-medium text-sm hover:opacity-90 transition-opacity shadow-sm hover:shadow-md"
          >
            LinkedIn
          </a>
        </div>
      </nav>
    </header>
  );
}
