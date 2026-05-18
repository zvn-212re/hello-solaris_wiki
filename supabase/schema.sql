create extension if not exists pgcrypto;

create table if not exists public.guestbook_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 24),
  message text not null check (char_length(message) between 1 and 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists guestbook_messages_status_created_at_idx
  on public.guestbook_messages (status, created_at desc);

alter table public.guestbook_messages enable row level security;

create table if not exists public.content_submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'post',
  title text not null check (char_length(title) between 1 and 120),
  author text not null default '匿名投稿人' check (char_length(author) between 1 and 40),
  contact text check (contact is null or char_length(contact) <= 120),
  summary text check (summary is null or char_length(summary) <= 280),
  content text not null check (char_length(content) between 1 and 6000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists content_submissions_status_created_at_idx
  on public.content_submissions (status, created_at desc);

alter table public.content_submissions enable row level security;
