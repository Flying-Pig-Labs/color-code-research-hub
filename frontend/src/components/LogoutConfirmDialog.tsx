/**
 * @fileoverview Logout confirmation dialog component.
 * 
 * Provides a confirmation dialog to prevent accidental logouts
 * with clear messaging and accessible design.
 * 
 * @author truflr.ai Team
 * @version 1.0.0
 */

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LogOut, AlertTriangle } from "lucide-react";

/**
 * Props interface for LogoutConfirmDialog component.
 */
interface LogoutConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Function to close the dialog */
  onClose: () => void;
  /** Function to execute when logout is confirmed */
  onConfirm: () => void;
}

/**
 * Logout confirmation dialog component.
 * 
 * Features:
 * - Clear confirmation messaging
 * - Accessible keyboard navigation
 * - Visual warning indicators
 * - Cancel and confirm actions
 * - Focus management
 */
export const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10">
              <LogOut className="h-4 w-4 text-destructive" />
            </div>
            Sign Out
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            Are you sure you want to sign out? You will need to log in again to access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LogoutConfirmDialog;