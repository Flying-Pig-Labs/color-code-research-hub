import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (login(username, password)) {
      navigate("/home");
    } else {
      setError("Invalid credentials");
      // Clear error after 3 seconds
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <div className="light min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              truflr.ai
            </h1>
            <img 
              src="/logo-light.png"
              alt="truflr.ai Logo" 
              className="w-12 h-12 md:w-16 md:h-16"
            />
          </div>
          <p className="text-muted-foreground text-lg tracking-wide">
            root up go-to-market gold
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-card border border-border rounded-lg shadow-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-accent"
                placeholder="Enter username"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-accent"
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <div className="text-destructive text-sm text-center animate-pulse">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-card hover:shadow-elevated transition-all"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Request Beta Access
            </Button>
          </form>
        </div>

        {/* Footer hint */}
        <p className="text-center text-muted-foreground text-sm mt-6">
          Ford Prior • ford@flyingpig.ai • Richmond, VA
        </p>
      </div>
    </div>
  );
};

export default Login;