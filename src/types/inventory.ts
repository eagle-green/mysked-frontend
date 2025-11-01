export type IInventoryItem = {
  id: string;
  type: string;
  name: string;
  sku?: string;
  code?: string;
  description?: string;
  category?: string;
  status: string;
  width_mm?: number;
  height_mm?: number;
  reflectivity_astm_type?: string;
  mot_approval?: string;
  typical_application?: string;
  cover_url?: string;
  coverUrl?: string;
  quantity: number;
  available?: number;
  reorder_point?: number;
  required_quantity?: number;
  lct?: boolean;
  hwy?: boolean;
  lct_required_qty?: number;
  hwy_required_qty?: number;
  price?: number;
  unit?: string;
  createdAt?: string;
  created_at?: string;
};

export type IInventoryTableFilters = {
  query: string;
  status: string[];
  category: string[];
};
