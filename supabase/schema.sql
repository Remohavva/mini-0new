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
  completed_rides int default 0,
  co2_saved_kg float default 0,
  rating float default 5.0,
  ratings_count int default 0,
  credits int default 0,
  referral_code text unique,
  referred_by uuid references public.profiles(id),
  upi_id text,
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
  status text default 'open' check (status in ('open', 'full', 'started', 'completed', 'cancelled')),
  suggested_fare int default 0,   -- auto-calculated fare in INR
  -- Recurring rides (daily commuter pattern)
  is_recurring boolean default false,
  recurrence_days int[] default '{}',
  origin_lat float,
  origin_lon float,
  destination_lat float,
  destination_lon float,
  started_at timestamptz,
  completed_at timestamptz,
  current_lat float,
  current_lon float,
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

-- Ride messages table (chat between rider and accepted passenger)
create table public.ride_messages (
  id uuid default gen_random_uuid() primary key,
  ride_id uuid references public.rides(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  created_at timestamptz default now()
);

alter table public.ride_messages enable row level security;

-- Users can view messages if they are the rider OR an accepted passenger on that ride.
create policy "Users can view ride messages" on public.ride_messages for select
  using (
    auth.uid() = (select rider_id from public.rides where id = ride_messages.ride_id)
    OR auth.uid() in (
      select requester_id
      from public.ride_requests
      where ride_id = ride_messages.ride_id and status = 'accepted'
    )
  );

-- Users can send messages only if they're the rider or an accepted passenger on that ride.
create policy "Users can send ride messages" on public.ride_messages for insert
  with check (
    sender_id = auth.uid()
    AND (
      auth.uid() = (select rider_id from public.rides where id = ride_messages.ride_id)
      OR auth.uid() in (
        select requester_id
        from public.ride_requests
        where ride_id = ride_messages.ride_id and status = 'accepted'
      )
    )
  );

-- Saved Locations table for Home, Office, College, etc.
create table public.saved_locations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null check (name in ('Home', 'Office', 'College', 'Other')),
  address text not null,
  lat float not null,
  lon float not null,
  created_at timestamptz default now()
);

alter table public.saved_locations enable row level security;
create policy "Users can manage own saved locations" on public.saved_locations
  for all using (auth.uid() = user_id);
