import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, Plus, Minus, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [demoKeyword, setDemoKeyword] = useState("");
  const [demoResult, setDemoResult] = useState("");

  const handleDemo = () => {
    if (demoKeyword) {
      setDemoResult(`Market insight: "${demoKeyword}" shows 23% YoY growth with untapped segments in enterprise SaaS.`);
    }
  };

  const faqs = [
    {
      question: "How does Ocean Studio integrate with my existing data?",
      answer: "Ocean Studio seamlessly connects to your S3 buckets, data warehouses, and CRMs through secure APIs. Your private data enhances every analysis."
    },
    {
      question: "What makes the 'shark' feedback different from regular AI analysis?",
      answer: "Our sharks are specialized AI agents trained on real founder and investor feedback patterns. They provide brutally honest, actionable insights that typical AI tools miss."
    },
    {
      question: "How long does it take to generate a complete MVP plan?",
      answer: "Most plans are ready in 15-20 minutes. Complex enterprise projects may take up to 30 minutes for comprehensive analysis."
    },
    {
      question: "Can I customize the output for my team's workflow?",
      answer: "Yes! Ocean Studio exports to GitHub Issues, Jira, Linear, and custom formats. You can also configure templates for your specific process."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-blue-50/80 backdrop-blur-md z-50 border-b border-blue-200">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🌊</span>
            <span className="text-lg sm:text-xl font-semibold text-gray-900" style={{ fontFamily: "'PT Sans', sans-serif" }}>Ocean Studio</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <Button variant="outline" onClick={() => navigate("/home")}>Sign In</Button>
            <Button onClick={() => navigate("/home")}>Request Beta Access</Button>
          </div>
          <div className="md:hidden flex items-center space-x-2">
            <Button size="sm" onClick={() => navigate("/home")}>Request Beta</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Abstract wave background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <svg className="w-full h-full" viewBox="0 0 1440 800" preserveAspectRatio="none">
              <path
                d="M0,400 C360,300 720,500 1440,400 L1440,800 L0,800 Z"
                fill="url(#wave-gradient)"
                className="animate-wave"
              />
              <defs>
                <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E40AF" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-blue-900 mb-4 sm:mb-6 leading-tight" style={{ fontFamily: "'Cairo Play', sans-serif", fontWeight: 200 }}>
            Raw Data into<br className="hidden sm:block" />
            Seaworthy Convictions
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
            Deploy agent swarms to transform private data, public zeitgeist, & deep research 
            into novel, battle-tested products and the roadmaps to create them.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto" onClick={() => navigate("/home")}>
              Request Beta Access <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto">
              <Play className="mr-2 h-4 sm:h-5 w-4 sm:w-5" /> Watch 2-min Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 bg-blue-900 text-blue-100">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🌊</span>
              <span className="text-white font-semibold text-xl" style={{ fontFamily: "'PT Sans', sans-serif" }}>Ocean Studio</span>
            </div>
            <div className="text-sm space-y-1">
              <p className="text-blue-200">Ford Prior</p>
              <p className="text-blue-200">ford@flyingpig.ai</p>
              <p className="text-blue-200">Richmond, VA</p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;