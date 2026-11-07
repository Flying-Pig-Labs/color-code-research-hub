export function useIsAdmin(): boolean {
  try {
    const raw = sessionStorage.getItem('cognitoGroups');
    if (!raw) return false;
    const groups = JSON.parse(raw);
    return Array.isArray(groups) && groups.includes('admin');
  } catch {
    return false;
  }
}
