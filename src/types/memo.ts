export interface IMemo {
  id: string;
  assignee_id: string;
  memo_title: string;
  memo_content: string;
  pendingMemos: { pendingMemo: string; status: string }[];
  memo_visibility: true;
  company: {
    id: string;
    region: string;
    name: string;
    logo_url: string | null;
    email: string;
    contact_number: string;
    unit_number: string;
    street_number: string;
    street_name: string;
    city: string;
    province: string;
    postal_code: string;
    country: string;
    status: string;
    fullAddress: string;
    phoneNumber: string;
  };
  client: {
    id: string;
    region: string;
    name: string;
    logo_url: string | null;
    email: string;
    contact_number: string;
    unit_number: string;
    street_number: string;
    street_name: string;
    city: string;
    province: string;
    postal_code: string;
    country: string;
    status: string;
    fullAddress: string;
    phoneNumber: string;
  };
  site: {
    id: string;
    company_id: string;
    name: string;
    email: string;
    contact_number: string;
    unit_number: string;
    street_number: string;
    street_name: string;
    city: string;
    province: string;
    postal_code: string;
    country: string;
    status: string;
    fullAddress: string;
    phoneNumber: string;
  };
  activity_feed?: {
    id: string;
    posted_date: string | Date;
    feed_posted: string;
    user: {
      id: string;
      name: string;
      logo: string | null;
    };
  }[];
  published_by?: {
    logo_url: string | null;
    name: string;
  };
  published_date?: string | Date;
  assigned_by?: {
    logo_url: string | null;
    name: string;
  };
}
