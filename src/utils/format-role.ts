import { roleList } from 'src/assets/data';

export function getRoleLabel(roleValue?: string): string {
  if (!roleValue) return '';
  const role = roleList.find((r) => r.value === roleValue);
  return role?.label || roleValue;
} 