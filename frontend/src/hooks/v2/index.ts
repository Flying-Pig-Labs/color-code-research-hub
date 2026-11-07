import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v2Api, BalanceResponse, Project, ReportStatus, IdeationStatus, DoubleStatus } from '@/services/v2/api';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { isJwtValid } from '@/lib/jwt.ts';

// Balance
export function useBalance() {
  const { isAuthenticated } = useAuth();
  const hasValidToken = isJwtValid(sessionStorage.getItem('id_token'));
  const [authStabilized, setAuthStabilized] = useState(false);
  
  // Wait for auth to stabilize after login
  useEffect(() => {
    if (isAuthenticated && hasValidToken) {
      const timer = setTimeout(() => setAuthStabilized(true), 2000);
      return () => clearTimeout(timer);
    } else {
      setAuthStabilized(false);
    }
  }, [isAuthenticated, hasValidToken]);
  
  return useQuery<BalanceResponse>({
    queryKey: ['balance'],
    queryFn: v2Api.getBalance,
    enabled: isAuthenticated && hasValidToken && authStabilized,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

// Projects list
export function useProjects() {
  const { isAuthenticated } = useAuth();
  const hasValidToken = isJwtValid(sessionStorage.getItem('id_token'));
  const [authStabilized, setAuthStabilized] = useState(false);
  
  // Wait for auth to stabilize after login
  useEffect(() => {
    if (isAuthenticated && hasValidToken) {
      const timer = setTimeout(() => setAuthStabilized(true), 2000);
      return () => clearTimeout(timer);
    } else {
      setAuthStabilized(false);
    }
  }, [isAuthenticated, hasValidToken]);
  
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: v2Api.listProjects,
    enabled: isAuthenticated && hasValidToken && authStabilized,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: v2Api.createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useProject(projectId: string) {
  return useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => v2Api.getProject(projectId),
    enabled: !!projectId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

// Actions
export function useStartReport(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => v2Api.startReport(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });
}

export function useReport(reportId?: string) {
  return useQuery<ReportStatus>({
    queryKey: ['report', reportId],
    queryFn: () => v2Api.getReport(reportId!),
    enabled: !!reportId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useStartIdeation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { reportId: string }) => v2Api.startIdeation(projectId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });
}

export function useIdeation(ideationId?: string) {
  return useQuery<IdeationStatus>({
    queryKey: ['ideation', ideationId],
    queryFn: () => v2Api.getIdeation(ideationId!),
    enabled: !!ideationId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useStartDouble(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { ideationId: string; ideaId: string; feedback?: string }) => v2Api.startDouble(projectId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });
}

export function useDouble(doubleId?: string) {
  return useQuery<DoubleStatus>({
    queryKey: ['double', doubleId],
    queryFn: () => v2Api.getDouble(doubleId!),
    enabled: !!doubleId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

// Admin
export function useAdminMetrics() {
  return useQuery({
    queryKey: ['adminMetrics'],
    queryFn: v2Api.adminMetrics,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['adminUsers'],
    queryFn: v2Api.adminUsers,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: ['adminUser', userId],
    queryFn: () => v2Api.adminUserDetail(userId),
    enabled: !!userId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useAdminAdjustCredits(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { amount: number; reason: string }) => v2Api.adminAdjustCredits(userId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminUser', userId] });
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}
