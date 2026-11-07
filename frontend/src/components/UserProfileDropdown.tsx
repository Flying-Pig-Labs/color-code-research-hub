/**
 * @fileoverview User profile dropdown component for the header navigation.
 * 
 * Provides a clean dropdown interface with user avatar, profile management,
 * theme toggle, and logout functionality. Includes accessibility features
 * and responsive design.
 * 
 * @author truflr.ai Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, LogOut, Moon, Sun, Monitor, Settings, FolderOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUser } from "@/contexts/UserContext";
import { useBalance } from "@/hooks/v2";
import { UserProfileModal } from "./UserProfileModal";
import { LogoutConfirmDialog } from "./LogoutConfirmDialog";
import { useNavigate } from "react-router-dom";

/**
 * Props interface for UserProfileDropdown component.
 */
interface UserProfileDropdownProps {
  /** Optional custom user name/email to display */
  userName?: string;
  /** Optional custom avatar image URL */
  avatarUrl?: string;
}

/**
 * Get user initials from username for avatar fallback.
 * 
 * @param userName - The username to extract initials from
 * @returns Two-letter initials string
 */
const getUserInitials = (userName?: string): string => {
  if (!userName) return 'US'; // Default user initials
  
  const parts = userName.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return 'US';
};

/**
 * Get theme icon based on current theme setting.
 */
const getThemeIcon = (theme: 'light' | 'dark' | 'system') => {
  switch (theme) {
    case 'light':
      return <Sun className="h-4 w-4 mr-2" />;
    case 'dark':
      return <Moon className="h-4 w-4 mr-2" />;
    case 'system':
      return <Monitor className="h-4 w-4 mr-2" />;
    default:
      return <Monitor className="h-4 w-4 mr-2" />;
  }
};

/**
 * Get next theme in cycle (light -> dark -> system -> light).
 */
const getNextTheme = (currentTheme: 'light' | 'dark' | 'system'): 'light' | 'dark' | 'system' => {
  switch (currentTheme) {
    case 'light':
      return 'dark';
    case 'dark':
      return 'system';
    case 'system':
      return 'light';
    default:
      return 'light';
  }
};

/**
 * User profile dropdown component for header navigation.
 * 
 * Features:
 * - User avatar with initials fallback
 * - Profile editing modal
 * - Theme toggle (light/dark/system)
 * - Credit balance display
 * - Logout with confirmation
 * - Keyboard navigation support
 * - Mobile responsive
 */
export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  userName: propUserName,
  avatarUrl: propAvatarUrl
}) => {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const { data: balance } = useBalance();
  const navigate = useNavigate();

  // Use user context data if available, fallback to props
  const userName = user?.name || propUserName || 'User';
  const avatarUrl = user?.avatarUrl || propAvatarUrl;
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const userInitials = getUserInitials(userName);

  /**
   * Handle theme toggle - cycles through light, dark, system.
   */
  const handleThemeToggle = () => {
    const nextTheme = getNextTheme(theme);
    setTheme(nextTheme);
    setIsDropdownOpen(false);
  };

  /**
   * Handle projects navigation.
   */
  const handleProjectsClick = () => {
    navigate('/v2/projects');
    setIsDropdownOpen(false);
  };

  /**
   * Handle profile modal open.
   */
  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
    setIsDropdownOpen(false);
  };

  /**
   * Handle logout confirmation dialog open.
   */
  const handleLogoutClick = () => {
    setIsLogoutDialogOpen(true);
    setIsDropdownOpen(false);
  };

  /**
   * Handle confirmed logout.
   */
  const handleConfirmedLogout = () => {
    logout();
    setIsLogoutDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="User profile menu"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatarUrl} alt={`${userName} avatar`} />
              <AvatarFallback className="text-sm font-medium bg-primary text-primary-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          className="w-64 p-2" 
          align="end" 
          sideOffset={8}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* User Info Header */}
          <DropdownMenuLabel className="px-2 py-2">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={`${userName} avatar`} />
                <AvatarFallback className="text-xs font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs text-muted-foreground">
                  Credits: {balance?.credits ?? 0}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Projects */}
          <DropdownMenuItem 
            onClick={handleProjectsClick}
            className="cursor-pointer px-2 py-2.5 focus:bg-muted"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            My Projects
          </DropdownMenuItem>

          {/* Profile Settings */}
          <DropdownMenuItem 
            onClick={handleProfileClick}
            className="cursor-pointer px-2 py-2.5 focus:bg-muted"
          >
            <User className="h-4 w-4 mr-2" />
            Profile Settings
          </DropdownMenuItem>

          {/* Theme Toggle */}
          <DropdownMenuItem 
            onClick={handleThemeToggle}
            className="cursor-pointer px-2 py-2.5 focus:bg-muted"
          >
            {getThemeIcon(theme)}
            Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Logout */}
          <DropdownMenuItem 
            onClick={handleLogoutClick}
            className="cursor-pointer px-2 py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userName={userName}
        credits={balance?.credits ?? 0}
      />

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleConfirmedLogout}
      />
    </>
  );
};

export default UserProfileDropdown;