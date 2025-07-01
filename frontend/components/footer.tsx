import React from 'react';
import { Github, Twitter, Send } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full z-50 border-t bg-background/70 backdrop-blur-md shadow-lg rounded-t-xl py-6 px-4 mt-12 flex flex-col items-center gap-3 text-base transition-all duration-300">
      <nav className="flex gap-6 mb-1">
        <a href="https://github.com/harshdev2909" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="flex items-center gap-1 hover:text-primary transition-colors">
          <Github className="w-5 h-5" /> <span className="hidden sm:inline">GitHub</span>
        </a>
        <a href="https://x.com/harsh_sharmaa9" target="_blank" rel="noopener noreferrer" aria-label="Twitter/X" className="flex items-center gap-1 hover:text-primary transition-colors">
          <Twitter className="w-5 h-5" /> <span className="hidden sm:inline">Twitter</span>
        </a>
        <a href="https://t.me/harshdev1" target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="flex items-center gap-1 hover:text-primary transition-colors">
          <Send className="w-5 h-5" /> <span className="hidden sm:inline">Telegram</span>
        </a>
      </nav>
      <div className="opacity-80 select-none text-sm font-medium tracking-wide italic text-center">
        built by harsh sharma
      </div>
    </footer>
  );
} 