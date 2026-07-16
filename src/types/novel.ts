// ─── Database row types (matching Supabase schema exactly) ───

export interface Author {
  author_id: number;
  username: string;
  pen_name: string;
  full_name: string | null;
  email: string | null;
  bio: string | null;
  profile_image: string | null;
  status: "pending" | "active" | "suspended";
  created_at: string;
}

export interface Category {
  category_id: number;
  category_name: string;
  description: string | null;
}

export interface Novel {
  novel_id: number;
  novel_name: string;
  author_id: number;
  category_id: number;
  synopsis: string | null;
  cover_image: string | null;
  status: "ongoing" | "completed" | "hiatus";
  view_count: number;
  created_at: string;
  updated_at: string;
}

// ─── Joined / view types used in the UI ───

export interface NovelWithDetails extends Novel {
  author: Pick<Author, "author_id" | "pen_name" | "profile_image" | "username">;
  category: Pick<Category, "category_id" | "category_name">;
}

// ─── Homepage banner (mock for now, later from promotion table) ───

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  link: string;
  gradient: string; // CSS gradient for placeholder
}

// ─── Chapter types ───

export interface Chapter {
  chapter_id: number;
  novel_id: number;
  chapter_no: number;
  chapter_title: string;
  content: string | null;
  view_count: number;
  published_at: string;
}

export interface ChapterListItem {
  chapter_id: number;
  chapter_no: number;
  chapter_title: string;
  published_at?: string;
}


// ─── Comment types ───

export interface CommentWithUser {
  comment_id: number;
  user_id: number | null;
  author_id: number | null;
  admin_id: number | null;
  commenter_type: "user" | "author" | "admin";
  chapter_id: number;
  parent_comment_id: number | null;
  comment_text: string;
  is_spoiler: boolean;
  comment_date: string;
  status: string;
  user?: {
    user_id: number;
    username: string;
    profile_image: string | null;
  } | null;
  author?: {
    author_id: number;
    username: string;
    pen_name: string;
    profile_image: string | null;
  } | null;
  admin?: {
    admin_id: number;
    username: string;
    full_name: string | null;
  } | null;
  replies: CommentWithUser[];
}

// ─── Reading Theme ───
export type ReadingTheme = "dark" | "light" | "warm";


