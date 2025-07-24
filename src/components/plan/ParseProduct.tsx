import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, FileText, Plus, X, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ParseProductProps {
  readmeContent?: string;
  initialData?: any;
  onNext: (data: any) => void;
}

const ParseProduct = ({ readmeContent = '', initialData, onNext }: ParseProductProps) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || 'Untitled Project',
    description: initialData?.description || '',
    domain: initialData?.domain || 'general',
    targetUsers: initialData?.targetUsers || ['developers'],
    techStack: initialData?.techStack || [],
    features: initialData?.features || [],
    complexity: initialData?.complexity || 'moderate'
  });

  const [newTargetUser, setNewTargetUser] = useState('');
  const [newTech, setNewTech] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const { toast } = useToast();

  // Auto-populate with AI when component mounts and README is available
  useEffect(() => {
    if (readmeContent && readmeContent.trim().length > 0 && formData.techStack.length === 0) {
      handleAIPopulate();
    }
  }, [readmeContent]);

  const handleAIPopulate = async () => {
    if (!readmeContent) {
      toast({
        title: "No README content",
        description: "Please provide README content to use AI suggestions.",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingAI(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/plan/populate-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          readmeContent,
          existingData: formData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to populate form');
      }

      const suggestions = await response.json();

      // Update form with AI suggestions
      setFormData(prev => ({
        ...prev,
        ...suggestions
      }));

      toast({
        title: "AI suggestions applied",
        description: "Form fields have been populated with intelligent suggestions."
      });
    } catch (error) {
      console.error('AI population failed:', error);
      toast({
        title: "AI suggestion failed",
        description: "Could not generate suggestions. Please fill manually.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Domain options
  const domainOptions = [
    { value: 'e-commerce', label: 'E-commerce' },
    { value: 'social-media', label: 'Social Media' },
    { value: 'productivity', label: 'Productivity' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'finance', label: 'Finance' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'devtools', label: 'Developer Tools' },
    { value: 'iot', label: 'IoT' },
    { value: 'general', label: 'General' }
  ];

  const addItem = (type: 'targetUsers' | 'techStack' | 'features', value: string) => {
    if (!value.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], value.trim()]
    }));
    
    // Clear input
    if (type === 'targetUsers') setNewTargetUser('');
    else if (type === 'techStack') setNewTech('');
    else if (type === 'features') setNewFeature('');
  };

  const removeItem = (type: 'targetUsers' | 'techStack' | 'features', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_: any, i: number) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title || !formData.description || formData.targetUsers.length === 0 || formData.features.length === 0) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    onNext(formData);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Parse Product
              </CardTitle>
              <CardDescription className="text-blue-100">
                Review and edit the detected project information
              </CardDescription>
            </div>
            {isLoadingAI && (
              <div className="flex items-center text-white">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="text-sm">Analyzing README...</span>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Title */}
          <Card>
            <CardContent className="pt-6">
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="My Awesome Project"
                className="mt-2"
                required
              />
            </CardContent>
          </Card>

          {/* Domain & Complexity */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="domain">Domain</Label>
                <Select
                  value={formData.domain}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, domain: value }))}
                >
                  <SelectTrigger id="domain" className="mt-2">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domainOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="complexity">Complexity</Label>
                <Select
                  value={formData.complexity}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, complexity: value }))}
                >
                  <SelectTrigger id="complexity" className="mt-2">
                    <SelectValue placeholder="Select complexity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="complex">Complex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card>
          <CardContent className="pt-6">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="A brief description of your project..."
              rows={4}
              className="mt-2"
              required
            />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Target Users */}
          <Card>
            <CardContent className="pt-6">
              <Label>Target Users</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newTargetUser}
                  onChange={(e) => setNewTargetUser(e.target.value)}
                  placeholder="Add target user..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem('targetUsers', newTargetUser);
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => addItem('targetUsers', newTargetUser)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.targetUsers.map((user: string, index: number) => (
                  <Badge key={index} variant="secondary" className="pr-1">
                    {user}
                    <button
                      type="button"
                      onClick={() => removeItem('targetUsers', index)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tech Stack */}
          <Card>
            <CardContent className="pt-6">
              <Label>Tech Stack</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  placeholder="Add technology..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem('techStack', newTech);
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => addItem('techStack', newTech)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.techStack.map((tech: string, index: number) => (
                  <Badge key={index} variant="outline" className="pr-1">
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeItem('techStack', index)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardContent className="pt-6">
              <Label>Key Features</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add feature..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem('features', newFeature);
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => addItem('features', newFeature)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.features.map((feature: string, index: number) => (
                  <Badge key={index} className="pr-1">
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeItem('features', index)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleAIPopulate}
            disabled={isLoadingAI || !readmeContent}
          >
            {isLoadingAI ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                AI Suggestions
              </>
            )}
          </Button>
          
          <Button 
            type="submit"
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Continue to Phase Generation
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ParseProduct;