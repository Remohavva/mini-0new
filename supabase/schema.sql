-- Run this in your Supabase SQL editor

-- Profiles table (auto-populated via trigger on auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  user_type text check (user_type in ('student', 'corporate')) not null,
  college_or_company text not null,
  phone text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Rides table
create table public.rides (
  id uuid default gen_random_uuid() primary key,
  rider_id uuid references public.profiles(id) on delete cascade not null,
  origin text not null,
  destination text not null,
  departure_time timestamptz not null,
  available_seats int not null check (available_seats >= 0),
  bike_model text,
  notes text,
  status text default 'open' check (status in ('open', 'full', 'completed', 'cancelled')),
  suggested_fare int default 0,   -- auto-calculated fare in INR
  origin_lat float,
  origin_lon float,
  destination_lat float,
  destination_lon float,
  created_at timestamptz default now()
);

-- Ride requests table
create table public.ride_requests (
  id uuid default gen_random_uuid() primary key,
  ride_id uuid references public.rides(id) on delete cascade not null,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  message text,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  suggested_fare int,        -- rider's suggested fare
  offered_fare int,          -- passenger's counter-offer
  agreed_fare int,           -- final agreed fare
  created_at timestamptz default now(),
  unique(ride_id, requester_id)
);

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, user_type, college_or_company, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Unknown'),
    coalesce(new.raw_user_meta_data->>'user_type', 'student'),
    coalesce(new.raw_user_meta_data->>'college_or_company', ''),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.rides enable row level security;
alter table public.ride_requests enable row level security;

-- Profiles: anyone can read, only owner can update
create policy "Public profiles are viewable" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Rides: anyone can read open rides, only owner can insert/update
create policy "Anyone can view rides" on public.rides for select using (true);
create policy "Authenticated users can create rides" on public.rides for insert with check (auth.uid() = rider_id);
create policy "Riders can update own rides" on public.rides for update using (auth.uid() = rider_id);

-- Ride requests: riders see requests for their rides, requesters see their own
create policy "Riders see requests for their rides" on public.ride_requests for select
  using (auth.uid() = requester_id or auth.uid() = (select rider_id from public.rides where id = ride_id));
create policy "Authenticated users can create requests" on public.ride_requests for insert with check (auth.uid() = requester_id);
create policy "Riders can update request status" on public.ride_requests for update
  using (auth.uid() = (select rider_id from public.rides where id = ride_id));
