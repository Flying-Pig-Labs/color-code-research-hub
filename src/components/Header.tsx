import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Shield, Target, Bug, Lightbulb } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Shield, variant: "corporate" as const },
    { path: "/red-team", label: "Red Team", icon: Target, variant: "red-team" as const },
    { path: "/black-team", label: "Black Team", icon: Bug, variant: "black-team" as const },
    { path: "/white-team", label: "White Team", icon: Lightbulb, variant: "white-team" as const },
  ];

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div 
            className="flex items-center gap-3 cursor-pointer transition-transform hover:scale-105"
            onClick={() => navigate("/")}
          >
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Research Labs</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant={isActive ? item.variant : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Mobile menu button - simplified for now */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <Shield className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;