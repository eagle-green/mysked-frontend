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
  // Normalize the position value (lowercase, handle underscores)
  const normalizedValue = positionValue.toLowerCase().replace(/\s+/g, '_');
  const position = JOB_POSITION_OPTIONS.find((p) => p.value === normalizedValue);
  return position?.label || positionValue;
}

// Helper function to format position for display (handles uppercase variants)
export function formatPositionDisplay(position?: string): string {
  if (!position) return '';
  // Normalize the position value (lowercase, handle underscores)
  const normalizedValue = position.toLowerCase().replace(/\s+/g, '_');
  const positionOption = JOB_POSITION_OPTIONS.find((p) => p.value === normalizedValue);
  
  if (positionOption) {
    // For LCT and TCP, return uppercase
    if (normalizedValue === 'lct' || normalizedValue === 'tcp') {
      return positionOption.label.toUpperCase();
    }
    // For others, return the label as is (e.g., "Field Supervisor")
    return positionOption.label;
  }
  
  // Fallback: if it looks like field_supervisor, format it
  if (normalizedValue === 'field_supervisor' || normalizedValue === 'fieldsupervisor') {
    return 'Field Supervisor';
  }
  
  // If it's already uppercase and short (like LCT, TCP), return as is
  if (position.length <= 3 && position === position.toUpperCase()) {
    return position;
  }
  
  // Otherwise, return the original value
  return position;
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
    case 'no_show':
      return 'error';
    case 'called_in_sick':
      return 'warning';
    default:
      return 'default';
  }
}

// Helper function to get worker status label - unified across all pages
export function getWorkerStatusLabel(status?: string): string {
  switch (status?.toLowerCase()) {
    case 'draft':
      return 'Draft';
    case 'pending':
      return 'Pending';
    case 'accepted':
      return 'Accepted';
    case 'confirmed':
      return 'Confirmed';
    case 'ready':
      return 'Ready';
    case 'completed':
      return 'Completed';
    case 'rejected':
      return 'Rejected';
    case 'declined':
      return 'Declined';
    case 'cancelled':
      return 'Cancelled';
    case 'no_show':
      return 'No Show';
    case 'called_in_sick':
      return 'Called in Sick';
    default:
      return status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
  }
}

