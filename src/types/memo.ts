export enum MemoStatus {
  pending = 'pending',
  in_progress = 'in_progress',
  done = 'done',
}

export interface ReplyComment {
  id: string;
  description: string;
  posted_date: string;
  tag_user: string;
}
export interface IWideMemo {
  id: string;
  memo_title: string;
  memo_content: string;
  published_date: string;
  due_date: string;
  pending_items: Array<{
    memo_title: string;
    assignee_id: string;
    status: MemoStatus;
    user?: {
      id: string;
      name: string;
      photo_logo_url: string | null;
    };
    createdAt?: string;
  }>;
  activity_feed?: Array<{
    id: string;
    description: string;
    posted_date: string;
    replies?: Array<ReplyComment>;
    user: {
      id: string;
      name: string;
      photo_logo_url: string | null;
    };
  }>;
}
