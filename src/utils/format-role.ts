import { roleList } from 'src/assets/data';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';

export function getRoleLabel(roleValue?: string): string {
  if (!roleValue) return '';
  const role = roleList.find((r) => r.value === roleValue);
  return role?.label || roleValue;
}

// Helper function to get position label from value
export function getPositionLabel(positionValue?: string): string {
  if (!positionValue) return '';
  const position = JOB_POSITION_OPTIONS.find((p) => p.value === positionValue);
  return position?.label || positionValue;
}

// Helper function to get position color - unified across all pages
export function getPositionColor(position?: string): 'primary' | 'secondary' | 'warning' | 'info' | 'success' | 'default' | 'error' {
  switch (position?.toLowerCase()) {
    case 'lct':
      return 'primary';
    case 'tcp':
      return 'secondary';
    case 'hwy':
      return 'error';
    case 'field_supervisor':
      return 'warning';
    default:
      return 'default';
  }
}
// Helper function to format position with vehicle info
export function getPositionWithVehicle(
  position: string,
  vehicle?: { unit_number?: string; license_plate?: string } | null
): string {
  const baseLabel = getPositionLabel(position);
  
  if (vehicle) {
    const vehicleInfo = vehicle.unit_number || vehicle.license_plate;
    return vehicleInfo ? `${baseLabel} (${vehicleInfo})` : baseLabel;
  }
  
  return baseLabel;
}

// Helper function to get worker status color - unified across all pages
export function getWorkerStatusColor(status?: string): 'success' | 'warning' | 'error' | 'info' | 'primary' | 'default' {
  switch (status?.toLowerCase()) {
    case 'draft':
      return 'info';
    case 'pending':
      return 'warning';
    case 'accepted':
    case 'confirmed':
      return 'success';
    case 'ready':
      return 'primary';
    case 'completed':
      return 'success';
    case 'rejected':
    case 'declined':
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
}

