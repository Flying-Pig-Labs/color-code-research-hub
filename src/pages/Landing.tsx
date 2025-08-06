import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, Target, Bug, Lightbulb, Zap, Shield, Clock, ChevronDown, Plus, Minus, Play } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🌊</span>
            <span className="text-lg sm:text-xl font-semibold text-gray-900">Ocean Studio</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How it Works</a>
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <Button variant="outline" onClick={() => navigate("/home")}>Sign In</Button>
            <Button onClick={() => navigate("/home")}>Get Started Free</Button>
          </div>
          <div className="md:hidden flex items-center space-x-2">
            <Button size="sm" onClick={() => navigate("/home")}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Abstract wave background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-full h-full opacity-5">
            <svg className="w-full h-full" viewBox="0 0 1440 800" preserveAspectRatio="none">
              <path
                d="M0,400 C360,300 720,500 1440,400 L1440,800 L0,800 Z"
                fill="url(#wave-gradient)"
                className="animate-wave"
              />
              <defs>
                <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Turn Market Data into<br className="hidden sm:block" />
            Go-to-Market Strategies<span className="hidden sm:inline">—</span><br className="sm:hidden" />Fast.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
            Ocean Studio unifies your private data, crowdsources expert-style feedback via AI "sharks," 
            and auto-generates an actionable product roadmap in a single workflow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto" onClick={() => navigate("/home")}>
              Get Started Free <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto">
              <Play className="mr-2 h-4 sm:h-5 w-4 sm:w-5" /> Watch 2-min Demo
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-6 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
            How Ocean Studio Works
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 text-center mb-8 sm:mb-12 max-w-3xl mx-auto px-4">
            Three powerful phases that transform raw market data into validated product strategies
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Wayfinder */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <Card className="relative h-full border-2 hover:border-blue-200 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl">Wayfinder</CardTitle>
                  <CardDescription>AI-powered market scouting</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Analyzes your market landscape, competitors, and opportunities using both public data 
                    and your private intelligence to identify strategic gaps.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Shark Swarmer */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <Card className="relative h-full border-2 hover:border-purple-200 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Bug className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-2xl">Shark Swarmer</CardTitle>
                  <CardDescription>Multi-agent vetting & scoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Deploys specialized AI agents that challenge your ideas with founder-level scrutiny, 
                    providing realistic feedback before you invest resources.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Reef Builder */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <Card className="relative h-full border-2 hover:border-green-200 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <Lightbulb className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl">Reef Builder</CardTitle>
                  <CardDescription>Instant MVP plan & resources</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Generates a complete product roadmap with phases, epics, and GitHub issues—ready 
                    for your team to execute immediately.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Deep-Dive Features */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
            Enterprise-Grade Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Private Data Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Securely connect your S3 buckets, databases, and internal docs. Your data never leaves your infrastructure.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Zap className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Synthetic Interviews</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  AI sharks trained on thousands of founder interviews provide brutally honest feedback on your ideas.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Clock className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Cost & Time Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Real-time estimates for development costs, timeline, and resource requirements for every generated plan.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gray-50">
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

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-20 px-4 sm:px-6 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 text-center mb-8 sm:mb-12">
            Pay only for the research credits you use
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl">Starter</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$99</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <ChevronDown className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>10 research reports/month</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronDown className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Basic shark feedback</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronDown className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>GitHub integration</span>
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline">Get Started</Button>
              </CardContent>
            </Card>

            {/* Professional */}
            <Card className="hover:shadow-lg transition-shadow border-blue-200 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">Most Popular</span>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Professional</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$299</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <ChevronDown className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>50 research reports/month</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronDown className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Advanced shark swarms</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronDown className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Private data integration</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronDown className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button className="w-full mt-6">Get Started</Button>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <ChevronDown className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Unlimited reports</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronDown className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Custom AI training</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronDown className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>On-premise deployment</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronDown className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>SLA & dedicated support</span>
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline">Contact Sales</Button>
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
            Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 bg-gray-900 text-gray-400">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">🌊</span>
                <span className="text-white font-semibold">Ocean Studio</span>
              </div>
              <p className="text-sm">
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
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>&copy; 2025 Ocean Studio. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;