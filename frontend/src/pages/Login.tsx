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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <span className="text-4xl">🌊</span>
          </div>
          <h1 className="text-2xl text-blue-300" style={{ fontFamily: "'Cairo Play', sans-serif", fontWeight: 200 }}>
            Ocean Studio
          </h1>
          <p className="text-gray-400 mt-2 text-sm" style={{ fontFamily: "'Cairo Play', sans-serif", fontWeight: 200 }}>
            Beta Access Portal
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-950/50 backdrop-blur-sm rounded-lg border border-gray-800/50 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300 text-sm">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                placeholder="Enter username"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 text-sm">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center animate-pulse">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400 }}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Access Beta
            </Button>
          </form>
        </div>

        {/* Footer hint */}
        <p className="text-center text-gray-500 text-xs mt-6" style={{ fontFamily: "'Cairo Play', sans-serif", fontWeight: 200 }}>
          Invitation only • Richmond, VA
        </p>
      </div>
    </div>
  );
};

export default Login;