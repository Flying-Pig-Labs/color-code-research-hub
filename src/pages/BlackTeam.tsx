import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionWrapper from "@/components/SectionWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug, Code, Wrench, Database, ArrowRight, Shield } from "lucide-react";

const BlackTeam = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <SectionWrapper theme="black" className="pt-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-black-team shadow-smooth-lg">
              <Bug className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Black Team Research
            <span className="block text-black-team">Vendor Replacement Engineering</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Specialized reverse engineering and vendor replacement strategies through technical analysis and systematic implementation pathways.
          </p>
          
          <Button variant="black-team" size="xl" className="gap-2">
            <Shield className="h-5 w-5" />
            Access Technical Reports
          </Button>
        </div>
      </SectionWrapper>

      {/* Focus Areas */}
      <SectionWrapper>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Reverse Engineering Excellence
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Our Black Team focuses on systematic reverse engineering of software solutions to identify vendor replacement opportunities and develop alternative implementation strategies.
            </p>
            <ul className="space-y-3 text-foreground/80">
              <li className="flex items-start gap-3">
                <div className="p-1 rounded bg-black-team/20 mt-1">
                  <Code className="h-4 w-4 text-black-team" />
                </div>
                Software architecture analysis and system decomposition
              </li>
              <li className="flex items-start gap-3">
                <div className="p-1 rounded bg-black-team/20 mt-1">
                  <Database className="h-4 w-4 text-black-team" />
                </div>
                Data flow mapping and integration point identification
              </li>
              <li className="flex items-start gap-3">
                <div className="p-1 rounded bg-black-team/20 mt-1">
                  <Wrench className="h-4 w-4 text-black-team" />
                </div>
                Implementation pathway development and technical feasibility
              </li>
            </ul>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="border-black-team/20 hover:border-black-team/40 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-black-team">Technical Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Deep technical analysis of vendor solutions and system architecture mapping.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-black-team/20 hover:border-black-team/40 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-black-team">Implementation Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Strategic development of replacement implementation pathways and migration strategies.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SectionWrapper>

      {/* Methodologies */}
      <SectionWrapper theme="black">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Engineering Methodologies</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our systematic approach to vendor replacement engineering
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center border-black-team/20">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-xl bg-black-team/10">
                  <Bug className="h-8 w-8 text-black-team" />
                </div>
              </div>
              <CardTitle className="text-black-team">System Analysis</CardTitle>
              <CardDescription>
                Comprehensive reverse engineering and system architecture analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="gap-2">
                Learn More <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center border-black-team/20">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-xl bg-black-team/10">
                  <Code className="h-8 w-8 text-black-team" />
                </div>
              </div>
              <CardTitle className="text-black-team">Code Engineering</CardTitle>
              <CardDescription>
                Advanced code analysis and alternative implementation development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="gap-2">
                Learn More <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center border-black-team/20">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-xl bg-black-team/10">
                  <Wrench className="h-8 w-8 text-black-team" />
                </div>
              </div>
              <CardTitle className="text-black-team">Implementation</CardTitle>
              <CardDescription>
                Strategic implementation planning and migration pathway development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="gap-2">
                Learn More <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>
      
      <Footer />
    </div>
  );
};

export default BlackTeam;