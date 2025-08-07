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
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-blue-900 mb-4 sm:mb-6 leading-tight" style={{ fontFamily: "'PT Sans', sans-serif" }}>
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

      {/* Interactive Demo */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-blue-50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
            Try It Now
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 text-center mb-6 sm:mb-8">
            Enter a keyword to see instant market insights
          </p>

          <Card className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Input
                placeholder="Enter an industry or product keyword..."
                value={demoKeyword}
                onChange={(e) => setDemoKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleDemo()}
                className="text-base sm:text-lg"
              />
              <Button onClick={handleDemo} disabled={!demoKeyword} className="w-full sm:w-auto">
                Analyze
              </Button>
            </div>
            {demoResult && (
              <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-900 text-sm sm:text-base">{demoResult}</p>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
            Trusted by Innovation Teams
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <p className="text-gray-600 italic mb-4">
                  "Ocean Studio helped us identify a $50M market opportunity we completely missed. 
                  The shark feedback was brutally honest—exactly what we needed."
                </p>
                <p className="font-semibold">Sarah Chen</p>
                <p className="text-sm text-gray-500">VP Product, TechCorp</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <p className="text-gray-600 italic mb-4">
                  "We reduced our market research time from 3 months to 3 days. The private data 
                  integration made our insights 10x more accurate."
                </p>
                <p className="font-semibold">Marcus Rodriguez</p>
                <p className="text-sm text-gray-500">Head of Innovation, FinanceInc</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <p className="text-gray-600 italic mb-4">
                  "The generated roadmaps are production-ready. We went from idea to MVP launch 
                  in half the usual time."
                </p>
                <p className="font-semibold">Alex Thompson</p>
                <p className="text-sm text-gray-500">CTO, StartupXYZ</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{faq.question}</h3>
                    {expandedFaq === index ? (
                      <Minus className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Plus className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </CardHeader>
                {expandedFaq === index && (
                  <CardContent className="pt-0">
                    <p className="text-gray-600">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Transform Your Go-to-Market Strategy?
          </h2>
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 opacity-90">
            Join thousands of product teams shipping smarter, faster products.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="text-lg px-8"
            onClick={() => navigate("/home")}
          >
            Request Beta Access <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 bg-blue-900 text-blue-100">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">🌊</span>
                <span className="text-white font-semibold">Ocean Studio</span>
              </div>
              <p className="text-sm text-blue-200">
                AI-powered go-to-market intelligence for modern product teams.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-blue-800 mt-12 pt-8 text-center text-sm">
            <p>&copy; 2025 Ocean Studio. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;