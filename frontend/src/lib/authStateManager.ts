/**
 * @fileoverview Centralized authentication state manager to prevent redirect loops.
 * 
 * This module provides a single source of truth for authentication state and redirect
 * behavior across the entire application. It ensures that only one redirect can occur
 * per page load and provides safe mode functionality.
 */

// Environment configuration
const SAFE_MODE = import.meta.env.VITE_AUTH_SAFE_MODE === 'true';

// Global state management
class AuthStateManager {
  private redirectCount = 0;
  private isRedirecting = false;
  private authReady = false;
  private listeners = new Set<() => void>();

  // Instrumentation counters
  private counters = {
    redirectAttempted: 0,
    redirectExecuted: 0,
    authChecks: 0,
    safeModeTriggers: 0
  };

  constructor() {
    // Listen for navigation events to reset redirect state
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => this.handleNavigation());
      // Reset on auth page
      if (window.location.pathname.startsWith('/v2/auth')) {
        this.resetRedirectState();
      }
    }
  }

  /**
   * Check if authentication is ready (token validated, no pending redirects).
   */
  isAuthReady(): boolean {
    this.counters.authChecks++;
    return this.authReady && !this.isRedirecting;
  }

  /**
   * Set authentication readiness state.
   */
  setAuthReady(ready: boolean): void {
    const wasReady = this.authReady;
    this.authReady = ready;
    
    if (ready !== wasReady) {
      this.notifyListeners();
    }
  }

  /**
   * Attempt to redirect to auth page with safety checks.
   * Returns true if redirect was executed, false if blocked.
   */
  attemptRedirect(): boolean {
    this.counters.redirectAttempted++;

    // Safe mode - never redirect, just notify
    if (SAFE_MODE) {
      this.counters.safeModeTriggers++;
      this.showSafeModeNotification();
      return false;
    }

    // Block if already redirecting
    if (this.isRedirecting) {
      console.warn('Redirect blocked: already redirecting');
      return false;
    }

    // Block if redirect limit reached
    if (this.redirectCount >= 1) {
      console.error('Redirect blocked: limit exceeded (1 per page load)');
      this.showRedirectErrorNotification();
      return false;
    }

    // Block if on auth page
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/v2/auth')) {
      console.warn('Redirect blocked: already on auth page');
      return false;
    }

    // Execute redirect
    this.executeRedirect();
    return true;
  }

  /**
   * Execute the actual redirect with safety measures.
   */
  private executeRedirect(): void {
    this.isRedirecting = true;
    this.redirectCount++;
    this.counters.redirectExecuted++;
    this.authReady = false;

    console.log(`Auth redirect executed (${this.redirectCount}/1)`);
    
    if (typeof window !== 'undefined') {
      // Clear auth state
      sessionStorage.removeItem('isAuthenticated');
      
      // Perform redirect
      window.location.assign('/v2/auth');
    }
  }

  /**
   * Reset redirect state (called when navigating back to auth page).
   */
  resetRedirectState(): void {
    this.isRedirecting = false;
    console.log('Redirect state reset');
  }

  /**
   * Handle navigation events.
   */
  private handleNavigation(): void {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/v2/auth')) {
      this.resetRedirectState();
    }
  }

  /**
   * Show safe mode notification.
   */
  private showSafeModeNotification(): void {
    if (typeof window !== 'undefined') {
      // Create banner element
      const banner = document.createElement('div');
      banner.id = 'safe-mode-banner';
      banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #fbbf24;
        color: #92400e;
        padding: 12px;
        text-align: center;
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      `;
      banner.innerHTML = `
        <strong>Safe Mode Active:</strong> Authentication required. 
        <a href="/v2/auth" style="color: #92400e; text-decoration: underline; margin-left: 8px;">
          Click here to login
        </a>
        <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; font-size: 18px; cursor: pointer;">×</button>
      `;
      
      // Remove existing banner
      const existing = document.getElementById('safe-mode-banner');
      if (existing) existing.remove();
      
      document.body.appendChild(banner);
    }
  }

  /**
   * Show redirect error notification.
   */
  private showRedirectErrorNotification(): void {
    console.error('Multiple redirect attempts blocked - possible loop detected');
    if (typeof window !== 'undefined' && window.location.pathname !== '/v2/auth') {
      // Force navigation as last resort
      setTimeout(() => {
        window.location.assign('/v2/auth');
      }, 1000);
    }
  }

  /**
   * Add listener for auth state changes.
   */
  addListener(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of auth state changes.
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Auth state listener error:', error);
      }
    });
  }

  /**
   * Get instrumentation counters for debugging.
   */
  getCounters() {
    return { ...this.counters };
  }

  /**
   * Reset counters (useful for testing).
   */
  resetCounters(): void {
    this.counters = {
      redirectAttempted: 0,
      redirectExecuted: 0,
      authChecks: 0,
      safeModeTriggers: 0
    };
  }
}

// Global singleton instance
export const authStateManager = new AuthStateManager();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).authStateManager = authStateManager;
}