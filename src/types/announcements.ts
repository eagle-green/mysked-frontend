// ----------------------------------------------------------------------

export type IAnnouncementRecipientStatus = {
  sentAt: string | null;
  readAt: string | null;
  signedAt: string | null;
  signatureData: unknown;
};

export type IAnnouncementItem = {
  id: string;
  displayId?: number;
  title: string;
  description: string;
  content: string;
  category: string;
  /** Map of category name to hex color, e.g. { "Safety": "#00B8D9" } */
  categoryColors?: Record<string, string> | null;
  images: string[];
  requiresSignature: boolean;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  recipientStatus?: IAnnouncementRecipientStatus | null;
};

export type IAnnouncementFilters = {
  search: string;
};

export type IAnnouncementTableFilters = {
  search: string;
};

export type IAnnouncementHero = {
  title: string;
  description: string;
  createdAt?: Date;
};
