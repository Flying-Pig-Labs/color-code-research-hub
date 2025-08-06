import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Shield, Target, Bug, Lightbulb, FileText, LucideIcon } from "lucide-react";
import { HealthCheck } from "@/components/HealthCheck";

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  variant?: "red-team" | "black-team" | "white-team" | "ghost";
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
  icon?: string;
  navItems?: NavItem[];
  showHealthCheck?: boolean;
}

const Header = ({ 
  title = "Wayfinder",
  subtitle = "Cross-Discipline Intelligence",
  icon = "🌌",
  navItems,
  showHealthCheck = true
}: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const defaultNavItems = [
    { path: "/red-team", label: "Red Team", icon: Target, variant: "red-team" as const },
    { path: "/black-team", label: "Black Team", icon: Bug, variant: "black-team" as const },
    { path: "/white-team", label: "White Team", icon: Lightbulb, variant: "white-team" as const },
  ];
  
  const items = navItems || defaultNavItems;

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div 
            className="flex items-center gap-3 cursor-pointer transition-transform hover:scale-105"
            onClick={() => navigate("/")}
          >
            <span className="text-2xl mr-2">{icon}</span>
            <div className="flex flex-col items-start">
              <span className="text-xl font-bold text-foreground">{title}</span>
              <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">{subtitle}</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              {items.map((item) => {
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
            </div>
            {/* Only show Reports button on main Wayfinder header */}
            {title === "Wayfinder" && (
              <>
                <div className="h-6 w-px bg-border" />
                <Button
                  variant={location.pathname === "/" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate("/")}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Reports
                </Button>
              </>
            )}
            {showHealthCheck && (
              <div className="pl-4 border-l border-border">
                <HealthCheck />
              </div>
            )}
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