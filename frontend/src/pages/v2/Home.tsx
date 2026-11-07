/**
 * @fileoverview Homepage component with no API calls for stable navigation.
 * 
 * Simple landing page within the authenticated area that provides overview
 * information and navigation to key sections without making any API requests.
 * 
 * @author Color Code Research Hub Team
 * @version 1.0.0
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen,
  Search, 
  Lightbulb, 
  ClipboardList, 
  Hammer,
  ArrowRight,
  BookOpen,
  Target,
  Zap,
  GitBranch,
  ChevronRight,
  Home as HomeIcon,
  User
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Homepage component providing overview and navigation.
 */
const Home: React.FC = () => {
  const { user } = useUser();
  const { actualTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header - MUST maintain this exact structure */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6" data-testid="homepage-header-container">
          <div className="absolute top-4 right-6 flex items-center gap-2">
            <button
              onClick={() => navigate('/v2/homepage')}
              className="p-2 rounded-full hover:bg-muted/50 transition-colors"
              title="Home"
            >
              <HomeIcon className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium font-heading ring-offset-background transition-gentle focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-foreground px-4 py-2 relative h-10 w-10 rounded-full hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="User profile menu"
              type="button"
            >
              <span className="relative flex shrink-0 overflow-hidden rounded-full h-9 w-9">
                <span className="flex h-full w-full items-center justify-center rounded-full text-sm font-medium bg-primary text-primary-foreground">
                  FP
                </span>
              </span>
            </button>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                truflr.ai
              </h1>
              <img 
                alt="truflr.ai Logo" 
                className="w-12 h-12 md:w-16 md:h-16" 
                src={actualTheme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
              />
            </div>
            <p className="text-muted-foreground font-light text-lg tracking-wide mt-2">
              root up go-to-market gold
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2 mb-4">
          <HomeIcon className="h-8 w-8 text-accent" />
          <h1 className="text-4xl font-bold text-foreground">Welcome to truflr.ai</h1>
        </div>
        <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
          Your research-to-patent workflow platform. Turn competitive intelligence into intellectual property.
        </p>
        {user?.email && (
          <Badge variant="outline" className="font-mono text-sm">
            {user.email}
          </Badge>
        )}
      </div>

      {/* Workflow Overview */}
      <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-accent" />
            <CardTitle>Research-to-Patent Workflow</CardTitle>
          </div>
          <CardDescription>
            Our streamlined process transforms research into patent-ready documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm">Research Phase</h3>
                <p className="text-xs text-muted-foreground">Competitive intelligence gathering</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm">Ideation Phase</h3>
                <p className="text-xs text-muted-foreground">AI-powered innovation discovery</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm">Patent Preparation</h3>
                <p className="text-xs text-muted-foreground">Documentation and filing support</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Projects */}
        <Link to="/v2/projects">
          <Card className="bg-card border-border hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-accent" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-accent transition-colors">
                Projects
              </h3>
              <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                Manage your research projects and track progress through the workflow
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Workflow</Badge>
                <Badge variant="secondary" className="text-xs">Management</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Research */}
        <Link to="/home">
          <Card className="bg-card border-border hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Search className="h-6 w-6 text-blue-500" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-blue-500 transition-colors">
                Research
              </h3>
              <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                Competitive intelligence gathering and market analysis tools
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Intelligence</Badge>
                <Badge variant="secondary" className="text-xs">Analysis</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Ideate */}
        <Link to="/shark-swarmer">
          <Card className="bg-card border-border hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-purple-500" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-purple-500 transition-colors">
                Ideate
              </h3>
              <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                AI-powered idea generation and innovation discovery
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">AI Innovation</Badge>
                <Badge variant="secondary" className="text-xs">Ideas</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Plan */}
        <Link to="/milestones">
          <Card className="bg-card border-border hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <ClipboardList className="h-6 w-6 text-orange-500" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-orange-500 transition-colors">
                Plan
              </h3>
              <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                Project planning, milestones, and strategic roadmapping
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Planning</Badge>
                <Badge variant="secondary" className="text-xs">Milestones</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Build */}
        <Link to="/build">
          <Card className="bg-card border-border hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Hammer className="h-6 w-6 text-green-500" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-green-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-green-500 transition-colors">
                Build
              </h3>
              <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                Development, implementation, and deployment management
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Development</Badge>
                <Badge variant="secondary" className="text-xs">Deployment</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Getting Started */}
        <Card className="bg-muted/20 border-dashed border-2 border-muted-foreground/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Target className="h-6 w-6 text-muted-foreground" />
              </div>
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg text-foreground">
              Getting Started
            </h3>
            <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
              New to truflr.ai? Start by creating your first research project
            </p>
            <div className="mt-4">
              <Link to="/v2/projects">
                <Button size="sm" className="w-full">
                  Create First Project
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Highlights */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            <CardTitle>Platform Features</CardTitle>
          </div>
          <CardDescription>
            Everything you need for successful research-to-patent workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold">Research Intelligence</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Competitive analysis</li>
                <li>• Market research</li>
                <li>• Technology scanning</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">AI-Powered Ideation</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Innovation discovery</li>
                <li>• Idea refinement</li>
                <li>• Concept validation</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Project Management</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Workflow tracking</li>
                <li>• Milestone management</li>
                <li>• Progress monitoring</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Patent Preparation</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Documentation support</li>
                <li>• Filing assistance</li>
                <li>• IP strategy</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;