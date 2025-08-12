import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer } from '../use-toast';

describe('use-toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('reducer', () => {
    const initialState = { toasts: [] };

    it('should add a toast', () => {
      const newToast = {
        id: '1',
        title: 'Test Toast',
        description: 'Test Description',
        open: true,
      };

      const state = reducer(initialState, {
        type: 'ADD_TOAST',
        toast: newToast,
      });

      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0]).toEqual(newToast);
    });

    it('should limit toasts to TOAST_LIMIT (1)', () => {
      const toast1 = { id: '1', title: 'Toast 1', open: true };
      const toast2 = { id: '2', title: 'Toast 2', open: true };

      let state = reducer(initialState, {
        type: 'ADD_TOAST',
        toast: toast1,
      });

      state = reducer(state, {
        type: 'ADD_TOAST',
        toast: toast2,
      });

      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].id).toBe('2'); // Most recent toast
    });

    it('should update a toast', () => {
      const toast = { id: '1', title: 'Original', open: true };
      let state = reducer(initialState, {
        type: 'ADD_TOAST',
        toast,
      });

      state = reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'Updated' },
      });

      expect(state.toasts[0].title).toBe('Updated');
    });

    it('should dismiss a specific toast', () => {
      const toast = { id: '1', title: 'Test', open: true };
      let state = reducer(initialState, {
        type: 'ADD_TOAST',
        toast,
      });

      state = reducer(state, {
        type: 'DISMISS_TOAST',
        toastId: '1',
      });

      expect(state.toasts[0].open).toBe(false);
    });

    it('should dismiss all toasts when no toastId provided', () => {
      const toast1 = { id: '1', title: 'Toast 1', open: true };
      const toast2 = { id: '2', title: 'Toast 2', open: true };

      let state = reducer(initialState, {
        type: 'ADD_TOAST',
        toast: toast1,
      });

      state = reducer(state, {
        type: 'ADD_TOAST',
        toast: toast2,
      });

      state = reducer(state, {
        type: 'DISMISS_TOAST',
      });

      expect(state.toasts.every(t => t.open === false)).toBe(true);
    });

    it('should remove a specific toast', () => {
      const toast = { id: '1', title: 'Test', open: true };
      let state = reducer(initialState, {
        type: 'ADD_TOAST',
        toast,
      });

      state = reducer(state, {
        type: 'REMOVE_TOAST',
        toastId: '1',
      });

      expect(state.toasts).toHaveLength(0);
    });

    it('should remove all toasts when no toastId provided', () => {
      const toast1 = { id: '1', title: 'Toast 1', open: true };
      const toast2 = { id: '2', title: 'Toast 2', open: true };

      let state = reducer(initialState, {
        type: 'ADD_TOAST',
        toast: toast1,
      });

      state = reducer(state, {
        type: 'ADD_TOAST',
        toast: toast2,
      });

      state = reducer(state, {
        type: 'REMOVE_TOAST',
      });

      expect(state.toasts).toHaveLength(0);
    });
  });

  describe('useToast hook', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toasts).toEqual([]);
      expect(typeof result.current.toast).toBe('function');
      expect(typeof result.current.dismiss).toBe('function');
    });

    it('should add a toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({
          title: 'Test Toast',
          description: 'Test Description',
        });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        title: 'Test Toast',
        description: 'Test Description',
        open: true,
      });
    });

    it('should return toast controls when adding', () => {
      const { result } = renderHook(() => useToast());

      let toastControls: any;
      act(() => {
        toastControls = result.current.toast({
          title: 'Test Toast',
        });
      });

      expect(toastControls).toHaveProperty('id');
      expect(typeof toastControls.dismiss).toBe('function');
      expect(typeof toastControls.update).toBe('function');
    });

    it('should update a toast using controls', () => {
      const { result } = renderHook(() => useToast());

      let toastControls: any;
      act(() => {
        toastControls = result.current.toast({
          title: 'Original Title',
        });
      });

      act(() => {
        toastControls.update({
          id: toastControls.id,
          title: 'Updated Title',
        });
      });

      expect(result.current.toasts[0].title).toBe('Updated Title');
    });

    it('should dismiss a toast using controls', () => {
      const { result } = renderHook(() => useToast());

      let toastControls: any;
      act(() => {
        toastControls = result.current.toast({
          title: 'Test Toast',
        });
      });

      act(() => {
        toastControls.dismiss();
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it('should dismiss a toast using hook dismiss', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({
          title: 'Test Toast',
        });
      });

      const toastId = result.current.toasts[0].id;

      act(() => {
        result.current.dismiss(toastId);
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it('should dismiss all toasts when no id provided', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Toast 1' });
        result.current.toast({ title: 'Toast 2' });
      });

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.toasts.every(t => t.open === false)).toBe(true);
    });

    it('should remove toast after TOAST_REMOVE_DELAY', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        const toastControls = result.current.toast({
          title: 'Test Toast',
        });
        toastControls.dismiss();
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].open).toBe(false);

      // Fast forward past TOAST_REMOVE_DELAY (1000000ms)
      act(() => {
        vi.advanceTimersByTime(1000001);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should handle onOpenChange callback', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({
          title: 'Test Toast',
        });
      });

      const toast = result.current.toasts[0];

      act(() => {
        if (toast.onOpenChange) {
          toast.onOpenChange(false);
        }
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it('should share state between multiple hooks', () => {
      const { result: result1 } = renderHook(() => useToast());
      const { result: result2 } = renderHook(() => useToast());

      act(() => {
        result1.current.toast({
          title: 'Shared Toast',
        });
      });

      expect(result1.current.toasts).toHaveLength(1);
      expect(result2.current.toasts).toHaveLength(1);
      expect(result1.current.toasts[0]).toEqual(result2.current.toasts[0]);
    });

    it('should handle rapid toast additions', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.toast({
            title: `Toast ${i}`,
          });
        }
      });

      // Should only keep the most recent toast due to TOAST_LIMIT = 1
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Toast 4');
    });

    it('should cleanup listeners on unmount', () => {
      const { result, unmount } = renderHook(() => useToast());

      act(() => {
        result.current.toast({
          title: 'Test Toast',
        });
      });

      unmount();

      // Add another toast using the standalone function
      act(() => {
        toast({
          title: 'Another Toast',
        });
      });

      // The unmounted hook should not receive updates
      expect(result.current.toasts).toHaveLength(1);
    });
  });

  describe('toast function', () => {
    it('should work independently of hook', () => {
      const toastResult = toast({
        title: 'Standalone Toast',
        description: 'This is a standalone toast',
      });

      expect(toastResult).toHaveProperty('id');
      expect(typeof toastResult.dismiss).toBe('function');
      expect(typeof toastResult.update).toBe('function');
    });

    it('should generate unique IDs', () => {
      const toast1 = toast({ title: 'Toast 1' });
      const toast2 = toast({ title: 'Toast 2' });
      const toast3 = toast({ title: 'Toast 3' });

      expect(toast1.id).not.toBe(toast2.id);
      expect(toast2.id).not.toBe(toast3.id);
      expect(toast1.id).not.toBe(toast3.id);
    });
  });
});