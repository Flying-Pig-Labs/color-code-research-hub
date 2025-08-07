import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="container mx-auto">
          <header className="bg-gray-950/50 backdrop-blur-sm rounded-lg border border-gray-800/50 p-6 overflow-x-auto">
            <pre className="text-blue-400 text-[0.2rem] sm:text-[0.25rem] md:text-[0.3rem] lg:text-[0.375rem] xl:text-[0.5rem] font-mono text-center mx-auto whitespace-pre">
{` ██████╗  ██████╗███████╗ █████╗ ███╗   ██╗    ███████╗████████╗██╗   ██╗██████╗ ██╗ ██████╗ 
██╔═══██╗██╔════╝██╔════╝██╔══██╗████╗  ██║    ██╔════╝╚══██╔══╝██║   ██║██╔══██╗██║██╔═══██╗
██║   ██║██║     █████╗  ███████║██╔██╗ ██║    ███████╗   ██║   ██║   ██║██║  ██║██║██║   ██║
██║   ██║██║     ██╔══╝  ██╔══██║██║╚██╗██║    ╚════██║   ██║   ██║   ██║██║  ██║██║██║   ██║
╚██████╔╝╚██████╗███████╗██║  ██║██║ ╚████║    ███████║   ██║   ╚██████╔╝██████╔╝██║╚██████╔╝
 ╚═════╝  ╚═════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝    ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝`}
            </pre>
            <p className="text-gray-400 text-center mt-4">
              AI-Powered Go-To-Market Engine
            </p>
          </header>

          {/* Hero Content */}
          <div className="text-center mt-12 max-w-5xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-blue-300 mb-6 leading-tight" style={{ fontFamily: "'Cairo Play', sans-serif", fontWeight: 200 }}>
              Raw Data into<br className="hidden sm:block" />
              Seaworthy Convictions
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-10 max-w-3xl mx-auto px-4">
              Deploy agent swarms to transform private data, public zeitgeist, & deep research 
              into ideas filtered by math, vetted by sharks, and expanded into a complex GTM roadmap.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto" 
                onClick={() => navigate("/home")}
              >
                Request Beta Access <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-blue-400 text-blue-300 hover:bg-blue-900/50 text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto"
              >
                <Play className="mr-2 h-4 sm:h-5 w-4 sm:w-5" /> Watch 2-min Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 px-4 sm:px-6 border-t border-gray-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row justify-between items-center text-gray-400 text-sm">
            <div className="flex items-center space-x-2 mb-4 sm:mb-0">
              <span className="text-2xl">🌊</span>
              <span className="text-white font-semibold text-lg" style={{ fontFamily: "'PT Sans', sans-serif" }}>Ocean Studio</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-center sm:text-right">
              <span>Ford Prior</span>
              <span className="hidden sm:inline">•</span>
              <span>ford@flyingpig.ai</span>
              <span className="hidden sm:inline">•</span>
              <span>Richmond, VA</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;