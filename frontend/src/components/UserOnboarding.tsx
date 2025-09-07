/**
 * @fileoverview User onboarding component for collecting user's full name.
 * 
 * This component is shown to authenticated users who haven't completed
 * their profile setup. It collects their full name and completes the
 * user profile creation process.
 * 
 * @author truflr.ai Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * UserOnboarding component for collecting user's full name.
 * 
 * Shown to authenticated users who haven't completed their profile setup.
 * Validates input and calls completeProfile to finish user setup.
 */
const UserOnboarding: React.FC = () => {
  const { completeProfile } = useUser();
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  /**
   * Validate the full name input.
   */
  const validateName = (name: string): string | null => {
    const trimmed = name.trim();
    
    if (!trimmed) {
      return 'Please enter your full name';
    }
    
    if (trimmed.length < 2) {
      return 'Name must be at least 2 characters long';
    }
    
    if (trimmed.length > 100) {
      return 'Name cannot exceed 100 characters';
    }
    
    // Basic validation for at least two parts (first and last name)
    const nameParts = trimmed.split(/\s+/);
    if (nameParts.length < 2) {
      return 'Please enter your first and last name';
    }
    
    return null;
  };

  /**
   * Handle form submission.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateName(fullName);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await completeProfile(fullName.trim());
      
      toast({
        title: "Welcome!",
        description: "Your profile has been set up successfully.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to complete profile:', error);
      setError('Failed to save your profile. Please try again.');
      
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle input changes with validation clearing.
   */
  const handleNameChange = (value: string) => {
    setFullName(value);
    if (error) {
      setError('');
    }
  };

  /**
   * Handle keyboard shortcuts.
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        {/* Welcome Header */}
        <div className="text-center space-y-2">
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

        {/* Onboarding Form */}
        <Card className="bg-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-accent" />
              Complete Your Profile
            </CardTitle>
            <CardDescription>
              Welcome! Please enter your full name to get started with truflr.ai.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your first and last name"
                  className={`bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-accent ${
                    error ? 'border-destructive focus:border-destructive' : ''
                  }`}
                  disabled={isSubmitting}
                  maxLength={100}
                  autoFocus
                  autoComplete="name"
                  required
                />
                {error && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-muted-foreground">
                  Press Ctrl+Enter (Cmd+Enter on Mac) to continue
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting || !fullName.trim()}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-card hover:shadow-elevated transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <User className="mr-2 h-4 w-4" />
                      Get Started
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-muted-foreground text-sm">
          Your information is securely stored and will only be used to personalize your experience.
        </p>
      </div>
    </div>
  );
};

export default UserOnboarding;