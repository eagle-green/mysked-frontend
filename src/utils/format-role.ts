import { roleList } from 'src/assets/data';

export function getRoleLabel(roleValue?: string): string {
  if (!roleValue) return '';
  const role = roleList.find((r) => r.value === roleValue);
  return role?.label || roleValue;
}

// Helper function to get position color
export function getPositionColor(position?: string): 'primary' | 'secondary' | 'warning' | 'default' {
  switch (position) {
    case 'lct':
      return 'primary';
    case 'tcp':
      return 'secondary';
    case 'field_supervisor':
      return 'warning';
    default:
      return 'default';
  }
}
