import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
      expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'active')).toBe('base active');
      expect(cn('base', false && 'inactive')).toBe('base');
      expect(cn('base', undefined)).toBe('base');
    });

    it('should merge tailwind classes correctly', () => {
      // Should override conflicting classes
      expect(cn('px-4', 'px-2')).toBe('px-2');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
      expect(cn('bg-white', 'bg-black')).toBe('bg-black');
    });

    it('should handle arrays', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
      expect(cn(['px-4', 'py-2'], 'mt-4')).toBe('px-4 py-2 mt-4');
    });

    it('should handle objects', () => {
      expect(cn({ foo: true, bar: false })).toBe('foo');
      expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500');
      expect(cn('base', { active: true, disabled: false })).toBe('base active');
    });

    it('should filter out falsy values', () => {
      expect(cn('foo', null, 'bar', undefined, '', false, 'baz')).toBe('foo bar baz');
      expect(cn(null, undefined, false, '', 'only-this')).toBe('only-this');
    });

    it('should handle complex tailwind merging', () => {
      // Padding
      expect(cn('p-4', 'px-2')).toBe('p-4 px-2');
      expect(cn('p-4', 'p-2')).toBe('p-2');
      
      // Margin
      expect(cn('m-4', 'mx-2')).toBe('m-4 mx-2');
      expect(cn('m-4', 'm-8')).toBe('m-8');
      
      // Text
      expect(cn('text-lg', 'text-sm')).toBe('text-sm');
      expect(cn('font-bold', 'font-normal')).toBe('font-normal');
      
      // Colors
      expect(cn('text-red-500 hover:text-red-600', 'text-blue-500')).toBe('hover:text-red-600 text-blue-500');
    });

    it('should handle responsive and state modifiers', () => {
      expect(cn('sm:px-4', 'sm:px-2')).toBe('sm:px-2');
      expect(cn('hover:bg-red-500', 'hover:bg-blue-500')).toBe('hover:bg-blue-500');
      // outline-none and outline-black are not considered conflicting by tailwind-merge
      expect(cn('focus:outline-none', 'focus:outline-black')).toBe('focus:outline-none focus:outline-black');
      // But outline styles with the same specificity are merged
      expect(cn('focus:outline-2', 'focus:outline-4')).toBe('focus:outline-4');
    });

    it('should preserve non-conflicting classes', () => {
      expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
      expect(cn('px-4 py-2', 'mt-4 mb-2')).toBe('px-4 py-2 mt-4 mb-2');
      expect(cn('border rounded', 'shadow-lg')).toBe('border rounded shadow-lg');
    });

    it('should handle empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
      expect(cn('', '', '')).toBe('');
    });

    it('should handle mixed input types', () => {
      expect(cn(
        'base',
        ['array-class'],
        { 'object-class': true },
        false && 'ignored',
        true && 'included'
      )).toBe('base array-class object-class included');
    });

    it('should handle number values in objects', () => {
      expect(cn({ foo: 1, bar: 0 })).toBe('foo');
      expect(cn({ active: 1, disabled: 0 })).toBe('active');
    });

    it('should handle nested arrays', () => {
      expect(cn(['foo', ['bar', 'baz']])).toBe('foo bar baz');
      expect(cn('base', ['nested', ['deep', 'array']])).toBe('base nested deep array');
    });
  });
});