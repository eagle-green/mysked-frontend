// ----------------------------------------------------------------------

export type IUpdateItem = {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    avatarUrl: string;
  };
};

export type IUpdateFilters = {
  search: string;
};

export type IUpdateTableFilterValue = string | string[];

export type IUpdateTableFilters = {
  search: string;
};

// ----------------------------------------------------------------------

export type IUpdateHero = {
  title: string;
  description: string;
  createdAt?: Date;
};
