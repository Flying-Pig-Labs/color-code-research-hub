# User Profile System Documentation

## Overview

The User Profile System provides a comprehensive solution for user management within the truflr.ai application. This system includes user avatar display, profile editing, theme management, and secure logout functionality with a modern, accessible design.

## Features

### ✅ Core Features Implemented

- **User Avatar with Dropdown Menu** - Clean avatar icon in the top-right header
- **Profile Management Modal** - Full-featured profile editing interface
- **Dark/Light/System Theme Toggle** - Theme switching with persistence
- **Logout Confirmation** - Secure logout with confirmation dialog
- **Credit Balance Display** - Real-time credit balance in dropdown
- **Form Validation** - Complete input validation with error handling
- **Responsive Design** - Mobile-first responsive design
- **Accessibility Features** - Full keyboard navigation and ARIA labels

### 🔧 Technical Features

- **User Context Provider** - Centralized user state management
- **LocalStorage Persistence** - Profile data persistence across sessions
- **Loading States** - Proper loading indicators for async operations
- **Error Handling** - Comprehensive error handling with user feedback
- **TypeScript Support** - Full TypeScript type safety
- **Modern UI Components** - Built with shadcn/ui components

## Architecture

### Component Structure

```
components/
├── UserProfileDropdown.tsx     # Main dropdown component
├── UserProfileModal.tsx        # Profile editing modal
├── LogoutConfirmDialog.tsx     # Logout confirmation dialog
└── layout/
    └── AppLayout.tsx           # Updated layout with profile dropdown
```

### Context Structure

```
contexts/
├── AuthContext.tsx            # Authentication state management
├── UserContext.tsx            # User profile state management  
└── ThemeContext.tsx           # Theme state management
```

## Usage

### Basic Implementation

The user profile system is automatically integrated into the `AppLayout` component:

```tsx
import { UserProfileDropdown } from "@/components/UserProfileDropdown";

// In your layout component
<UserProfileDropdown 
  userName={user?.name} 
  avatarUrl={user?.avatarUrl} 
/>
```

### Using the User Context

```tsx
import { useUser } from "@/contexts/UserContext";

function MyComponent() {
  const { user, updateProfile, isLoading } = useUser();
  
  const handleUpdateName = async (newName: string) => {
    try {
      await updateProfile({ name: newName });
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };
  
  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <p>Credits: {user?.credits}</p>
    </div>
  );
}
```

## Component Details

### UserProfileDropdown

The main dropdown component that appears in the header.

**Features:**
- User avatar with initials fallback
- Credit balance display
- Theme toggle (light/dark/system)
- Profile settings access
- Logout functionality

**Props:**
```tsx
interface UserProfileDropdownProps {
  userName?: string;
  avatarUrl?: string;
}
```

### UserProfileModal

A comprehensive modal for editing user profile information.

**Features:**
- Name and email editing with validation
- Real-time form validation
- Credit balance display (read-only)
- Save/cancel actions
- Keyboard shortcuts (Ctrl+Enter to save)
- Unsaved changes warning

**Props:**
```tsx
interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
  credits?: number;
}
```

### LogoutConfirmDialog

A confirmation dialog to prevent accidental logouts.

**Features:**
- Clear confirmation messaging
- Accessible keyboard navigation
- Visual warning indicators
- Cancel and confirm actions

**Props:**
```tsx
interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}
```

## User Context API

### UserContext Provider

Manages user profile state throughout the application.

**Interface:**
```tsx
interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

**UserProfile Interface:**
```tsx
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### Key Features

- **Automatic Loading** - User data loads automatically on authentication
- **LocalStorage Persistence** - Profile data persists across sessions
- **Optimistic Updates** - Immediate UI updates with error rollback
- **Loading States** - Proper loading indicators for all async operations

## Theme Management

The system includes comprehensive theme management:

### Theme Options
- **Light Mode** - Clean, bright interface
- **Dark Mode** - Eye-friendly dark interface  
- **System Mode** - Follows OS preference

### Implementation
- Theme preference stored in localStorage
- Automatic system theme detection
- Smooth transitions between themes
- Theme-aware logo switching

## Validation and Error Handling

### Form Validation

**Name Validation:**
- Required field
- 2-50 character length
- Valid characters only (letters, spaces, hyphens, apostrophes)

**Email Validation:**
- Required field
- Valid email format
- Real-time validation feedback

### Error Handling

- **Network Errors** - Graceful handling with user-friendly messages
- **Validation Errors** - Real-time field validation with clear error messages
- **Loading States** - Visual feedback during async operations
- **Fallback Data** - Default user data when API calls fail

## Accessibility Features

### Keyboard Navigation
- Full keyboard support for all interactions
- Logical tab order through all components
- Escape key to close modals/dropdowns
- Enter key to submit forms

### Screen Reader Support
- Comprehensive ARIA labels
- Semantic HTML structure
- Descriptive error messages
- Focus management for modals

### Visual Accessibility
- High contrast ratios in both themes
- Clear visual hierarchy
- Consistent iconography
- Responsive text sizing

## Responsive Design

The user profile system is fully responsive across all device sizes:

### Desktop (1024px+)
- Full dropdown menu with all options
- Large avatar and clear text
- Hover states and transitions

### Tablet (768px-1023px)
- Optimized dropdown positioning
- Touch-friendly interaction areas
- Readable text sizing

### Mobile (320px-767px)
- Compact dropdown layout
- Touch-optimized buttons
- Modal adapts to screen size

## Integration Points

### Authentication Integration
- Seamless integration with existing AuthContext
- Automatic user loading on authentication
- Secure logout with session cleanup

### API Integration
- Ready for backend API integration
- Structured for REST or GraphQL APIs
- Error handling for network issues

### State Management
- Compatible with existing React Query setup
- Optimistic updates for better UX
- Proper cache invalidation

## Security Considerations

### Data Protection
- No sensitive data in localStorage
- Secure logout with session cleanup
- Input sanitization for all user data

### Access Control
- Profile updates require authentication
- Proper validation of all user inputs
- Protection against XSS attacks

## Future Enhancements

### Planned Features
- **Avatar Upload** - Allow users to upload custom avatars
- **Email Verification** - Verify email addresses during updates
- **Profile Pictures** - Integration with image hosting service
- **Advanced Preferences** - Additional user preference options
- **Two-Factor Authentication** - Enhanced security options

### API Integration
- **Backend Integration** - Connect to actual user management API
- **Real-time Updates** - WebSocket integration for live updates
- **Audit Logging** - Track profile changes for security

## Troubleshooting

### Common Issues

**Theme not persisting:**
- Check localStorage permissions
- Verify ThemeProvider is properly wrapped

**Profile updates not saving:**
- Check UserProvider integration
- Verify updateProfile function implementation

**Avatar not displaying:**
- Check image URL validity
- Verify avatar fallback logic

**Dropdown positioning issues:**
- Check container overflow settings
- Verify dropdown menu positioning props

## Development Guide

### Adding New Profile Fields

1. Update the `UserProfile` interface in `UserContext.tsx`
2. Add form fields to `UserProfileModal.tsx`
3. Update validation logic
4. Update the display components

### Customizing Themes

1. Modify theme values in `ThemeContext.tsx`
2. Update CSS custom properties
3. Test in both light and dark modes

### Testing

The system includes comprehensive testing considerations:

- **Unit Tests** - Test individual components
- **Integration Tests** - Test context interactions
- **E2E Tests** - Test complete user workflows
- **Accessibility Tests** - Verify ARIA compliance

## Performance Considerations

### Optimization Features
- **Lazy Loading** - Profile modal loads only when needed
- **Memoization** - Expensive calculations are memoized
- **Efficient Updates** - Only update changed fields
- **Minimal Re-renders** - Optimized React rendering

### Bundle Size
- **Tree Shaking** - Unused code eliminated
- **Code Splitting** - Modal loaded separately
- **Optimized Dependencies** - Minimal external dependencies

## Conclusion

The User Profile System provides a complete, production-ready solution for user management in the truflr.ai application. It combines modern design principles, comprehensive accessibility features, and robust technical implementation to deliver an excellent user experience.

The system is fully integrated with the existing application architecture and ready for backend API integration when available.