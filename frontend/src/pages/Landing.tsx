/**
 * @fileoverview Landing page for Truflr.ai.
 * 
 * Public-facing marketing page that introduces Truflr.ai's product discovery
 * capabilities. Features clean Truflr.ai pig branding, value proposition,
 * and call-to-action elements to drive user engagement.
 * 
 * Key Features:
 * - Clean typography-focused branding with pig emoji
 * - Swiss design principles with generous white space
 * - Clear "sniff out products" value proposition
 * - Prominent beta access request
 * - Professional contact information
 * 
 * @author Truflr.ai Team
 * @version 2.0.0
 */

import { Button } from "@/components/ui/button";
import { ArrowRight, Play, LogIn, Linkedin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Landing page component providing marketing introduction to the platform.
 * 
 * Serves as the public entry point for new users, showcasing the platform's
 * capabilities and guiding users toward authentication. Features responsive
 * design and professional branding elements.
 * 
 * @returns {JSX.Element} Complete landing page with branding and navigation
 */
const Landing = () => {
  const navigate = useNavigate();
  const { actualTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Top controls - Theme toggle and Login */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <ThemeToggle />
        <button
          onClick={() => navigate("/login")}
          className="text-muted-foreground hover:text-accent transition-gentle p-2 rounded-lg hover:bg-muted/50"
          aria-label="Login"
        >
          <LogIn className="h-5 w-5" />
        </button>
      </div>

      {/* Main Content - Typography focused hero */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-5xl mx-auto text-center">
          {/* Clean, sophisticated Truffle branding */}
          <div className="mb-16">
            <button 
              onClick={() => navigate("/")}
              className="flex items-center justify-center gap-6 mb-6 hover:opacity-80 transition-opacity"
            >
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-foreground tracking-tight">
                truflr.ai
              </h1>
              <img 
                src={actualTheme === 'dark' ? '/logo-dark.png' : '/logo-light.png'} 
                alt="Truflr.ai Logo" 
                className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28"
                onError={(e) => {
                  console.error('Landing logo failed to load:', e.currentTarget.src);
                  console.log('Current theme:', actualTheme);
                }}
                onLoad={() => {
                  console.log('Landing logo loaded successfully:', actualTheme === 'dark' ? '/logo-dark.png' : '/logo-light.png');
                }}
              />
            </button>
            <p className="text-xl md:text-2xl text-muted-foreground font-light tracking-wide">
              Sniff out your next big product
            </p>
          </div>

          
          {/* Clean CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="xl" 
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-medium transition-gentle shadow-card hover:shadow-elevated"
              onClick={() => navigate("/login")}
            >
              Request Beta Access 
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="xl" 
              variant="outline" 
              className="border-border text-foreground hover:bg-muted/50 font-medium transition-gentle"
            >
              <Play className="mr-2 h-5 w-5" /> 
              Watch Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Clean, minimal footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center text-muted-foreground">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              <span className="text-foreground font-semibold text-lg">truflr.ai</span>
              <img 
                src={actualTheme === 'dark' ? '/logo-dark.png' : '/logo-light.png'} 
                alt="Truflr.ai Logo" 
                className="w-6 h-6"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-center sm:text-right">
              <span className="flex items-center gap-2">
                Ford Prior
                <a 
                  href="https://www.linkedin.com/in/ford-prior/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-accent transition-gentle inline-flex"
                  aria-label="LinkedIn Profile"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </span>
              <span className="hidden sm:inline text-muted-foreground/50">•</span>
              <span>ford@flyingpig.ai</span>
              <span className="hidden sm:inline text-muted-foreground/50">•</span>
              <span>Richmond, VA</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;