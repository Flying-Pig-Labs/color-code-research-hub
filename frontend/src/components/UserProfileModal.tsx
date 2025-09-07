/**
 * @fileoverview User profile modal component for editing user information.
 * 
 * Provides a clean modal interface for viewing and editing user profile
 * information including name, email, and viewing credit balance.
 * Includes form validation and error handling.
 * 
 * @author truflr.ai Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  CreditCard, 
  Save, 
  X, 
  Loader2,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";

/**
 * Props interface for UserProfileModal component.
 */
interface UserProfileModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Current user name */
  userName?: string;
  /** Current user email */
  userEmail?: string;
  /** User avatar URL */
  avatarUrl?: string;
  /** Current credit balance */
  credits?: number;
}

/**
 * Validate name input.
 * 
 * @param name - Name to validate
 * @returns Validation result with success status and error message
 */
const validateName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Name is required' };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, error: 'Name cannot exceed 50 characters' };
  }
  
  // Check for valid characters (letters, spaces, common punctuation)
  const validNameRegex = /^[a-zA-Z\s\-'.]+$/;
  if (!validNameRegex.test(name.trim())) {
    return { isValid: false, error: 'Name contains invalid characters' };
  }
  
  return { isValid: true };
};

/**
 * Validate email input.
 * 
 * @param email - Email to validate
 * @returns Validation result with success status and error message
 */
const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

/**
 * Get user initials from name for avatar fallback.
 */
const getUserInitials = (name?: string): string => {
  if (!name) return 'US';
  
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return 'US';
};

/**
 * User profile modal component for editing user information.
 * 
 * Features:
 * - View and edit user name and email
 * - Display current credit balance (read-only)
 * - Form validation with error messages
 * - Loading states for save operations
 * - Success/error feedback
 * - Keyboard navigation support
 * - Mobile responsive design
 */
export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userName: propUserName = 'User',
  userEmail: propUserEmail = '',
  avatarUrl: propAvatarUrl,
  credits: propCredits = 0
}) => {
  const { toast } = useToast();
  const { user, updateProfile, isLoading: userLoading } = useUser();
  
  // Use user context data if available, fallback to props
  const userName = user?.name || propUserName;
  const userEmail = user?.email || propUserEmail;
  const avatarUrl = user?.avatarUrl || propAvatarUrl;
  const credits = propCredits;
  
  // Form state
  const [formData, setFormData] = useState({
    name: userName,
    email: userEmail
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update form data when props change
  useEffect(() => {
    setFormData({
      name: userName,
      email: userEmail
    });
    setErrors({});
    setHasUnsavedChanges(false);
  }, [userName, userEmail, isOpen]);

  /**
   * Handle input changes with validation.
   */
  const handleInputChange = (field: 'name' | 'email', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Track unsaved changes
    const hasChanges = 
      (field === 'name' ? value !== userName : formData.name !== userName) ||
      (field === 'email' ? value !== userEmail : formData.email !== userEmail);
    
    setHasUnsavedChanges(hasChanges);
  };

  /**
   * Validate all form fields.
   */
  const validateForm = (): boolean => {
    const nameValidation = validateName(formData.name);
    const emailValidation = validateEmail(formData.email);
    
    const newErrors: { name?: string; email?: string } = {};
    
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error;
    }
    
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission.
   */
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Use user context to update profile
      await updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
      });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        duration: 3000,
      });
      
      setHasUnsavedChanges(false);
      onClose();
      
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle modal close with unsaved changes warning.
   */
  const handleClose = () => {
    if (hasUnsavedChanges) {
      const shouldClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!shouldClose) return;
    }
    
    onClose();
  };

  /**
   * Handle keyboard shortcuts.
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </DialogTitle>
          <DialogDescription>
            View and edit your profile information. Changes are saved to your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Section */}
          <div className="flex items-center justify-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl} alt="User avatar" />
              <AvatarFallback className="text-lg font-medium bg-primary text-primary-foreground">
                {getUserInitials(formData.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your full name"
              className={errors.name ? 'border-destructive' : ''}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <div id="name-error" className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="h-3 w-3" />
                {errors.name}
              </div>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email address"
              className={errors.email ? 'border-destructive' : ''}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <div id="email-error" className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="h-3 w-3" />
                {errors.email}
              </div>
            )}
          </div>

          <Separator />

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Account Information</h3>
            
            {/* Credits Display */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Credit Balance</span>
              </div>
              <Badge variant="secondary" className="font-mono">
                {credits.toLocaleString()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={isLoading || !hasUnsavedChanges || Object.keys(errors).length > 0}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className="text-xs text-muted-foreground text-center pt-2">
          Press Ctrl+Enter (Cmd+Enter on Mac) to save
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;