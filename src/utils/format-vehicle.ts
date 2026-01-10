// Vehicle type formatting utilities

export function formatVehicleType(type: string): string {
  if (!type) return '';
  
  // Normalize the type
  const normalized = type.toLowerCase().replace(/\s+/g, '_');
  
  // Map vehicle types to display labels
  const typeMap: Record<string, string> = {
    lane_closure_truck: 'Lane Closure Truck',
    highway_truck: 'Highway Truck',
    lct: 'LCT',
    hwy: 'HWY',
    pickup_truck: 'Pickup Truck',
    van: 'Van',
    suv: 'SUV',
    sedan: 'Sedan',
  };
  
  return typeMap[normalized] || type;
}

