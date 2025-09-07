import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v2Api, BalanceResponse, Project, ReportStatus, IdeationStatus, DoubleStatus } from '@/services/v2/api';

// Balance
export function useBalance() {
  return useQuery<BalanceResponse>({ queryKey: ['balance'], queryFn: v2Api.getBalance });
}

// Projects list
export function useProjects() {
  return useQuery<Project[]>({ queryKey: ['projects'], queryFn: v2Api.listProjects });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: v2Api.createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useProject(projectId: string) {
  return useQuery<Project>({ queryKey: ['project', projectId], queryFn: () => v2Api.getProject(projectId), enabled: !!projectId });
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
  return useQuery<ReportStatus>({ queryKey: ['report', reportId], queryFn: () => v2Api.getReport(reportId!), enabled: !!reportId });
}

export function useStartIdeation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { reportId: string }) => v2Api.startIdeation(projectId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });
}

export function useIdeation(ideationId?: string) {
  return useQuery<IdeationStatus>({ queryKey: ['ideation', ideationId], queryFn: () => v2Api.getIdeation(ideationId!), enabled: !!ideationId });
}

export function useStartDouble(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { ideationId: string; ideaId: string; feedback?: string }) => v2Api.startDouble(projectId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });
}

export function useDouble(doubleId?: string) {
  return useQuery<DoubleStatus>({ queryKey: ['double', doubleId], queryFn: () => v2Api.getDouble(doubleId!), enabled: !!doubleId });
}

// Admin
export function useAdminMetrics() {
  return useQuery({ queryKey: ['adminMetrics'], queryFn: v2Api.adminMetrics });
}

export function useAdminUsers() {
  return useQuery({ queryKey: ['adminUsers'], queryFn: v2Api.adminUsers });
}

export function useAdminUser(userId: string) {
  return useQuery({ queryKey: ['adminUser', userId], queryFn: () => v2Api.adminUserDetail(userId), enabled: !!userId });
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
