-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Drop existing tables if they exist
drop table if exists public.comments cascade;
drop table if exists public.tasks cascade;
drop table if exists public.users cascade;

-- Create users table
create table public.users (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tasks table
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  status text not null default 'inicio',
  priority text not null default 'normal',
  number integer not null default 0,
  user_id uuid references public.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create comments table
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  task_id uuid references public.tasks(id) on delete cascade,
  timestamp bigint not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for better performance
create index tasks_user_id_idx on public.tasks(user_id);
create index comments_task_id_idx on public.comments(task_id);

-- Add row level security policies
alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.comments enable row level security;

-- Create policies
create policy "Enable read access for all users"
  on public.users for select
  to anon
  using (true);

create policy "Enable insert access for all users"
  on public.users for insert
  to anon
  with check (true);

create policy "Enable read access for all tasks"
  on public.tasks for select
  to anon
  using (true);

create policy "Enable insert access for all tasks"
  on public.tasks for insert
  to anon
  with check (true);

create policy "Enable update access for all tasks"
  on public.tasks for update
  to anon
  using (true);

create policy "Enable delete access for all tasks"
  on public.tasks for delete
  to anon
  using (true);

create policy "Enable read access for all comments"
  on public.comments for select
  to anon
  using (true);

create policy "Enable insert access for all comments"
  on public.comments for insert
  to anon
  with check (true);

-- Insert initial user: José J. Ramos
insert into public.users (name)
values ('José J. Ramos')
on conflict do nothing;