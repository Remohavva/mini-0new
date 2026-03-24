# BikePool 🏍️

Bike pooling platform for college students and corporate employees.

## Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: FastAPI
- **Auth + DB**: Supabase

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor
3. Copy your project URL, anon key, service role key, and JWT secret

### 2. Backend
```bash
cd backend
cp .env.example .env   # fill in your Supabase credentials
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env.local   # fill in your Supabase credentials + API URL
npm run dev
```

## Mobile (Expo Go)

### Setup
1. Copy your Supabase anon key into `mobile/.env`
2. Set `EXPO_PUBLIC_API_URL` to your machine's local IP (e.g. `http://192.168.1.40:8000`) — not `localhost` (Android can't reach your PC's localhost)
3. Make sure backend is running: `python -m uvicorn app.main:app --reload --host 0.0.0.0`

### Run
```bash
cd mobile
npx expo start
```
Scan the QR code with the **Expo Go** app on your Android phone. Both devices must be on the same WiFi network.
- Sign up as student or corporate employee
- Offer bike rides with origin, destination, departure time, seats
- Browse and search available rides
- Request to join a ride
- Ride owner can accept/reject requests
- Cancel rides
