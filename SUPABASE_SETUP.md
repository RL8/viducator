# 🗄️ Supabase Setup Instructions

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose organization and provide:
   - **Project Name**: `viducator-ai`
   - **Database Password**: (create a strong password)
   - **Region**: Choose closest to your location
5. Click "Create new project"

## Step 2: Get Project Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://abcdefghijk.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 3: Create Environment File

Create a `.env` file in the `viducator-frontend` directory:

```env
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your actual Supabase credentials.

## Step 4: Create Database Schema

In your Supabase dashboard, go to **SQL Editor** and run this script:

```sql
-- Create video_jobs table
CREATE TABLE video_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'INPUT',
  input_scenario JSONB NOT NULL,
  current_outputs JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE video_jobs ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own jobs
CREATE POLICY "Users can access their own jobs" ON video_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('video-assets', 'video-assets', true),
  ('final-videos', 'final-videos', true);

-- Create storage policies
CREATE POLICY "Anyone can view video assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'video-assets');

CREATE POLICY "Users can upload video assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'video-assets');

CREATE POLICY "Anyone can view final videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'final-videos');

CREATE POLICY "Users can upload final videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'final-videos');
```

## Step 5: Test Connection

After completing the setup, the app will automatically connect to Supabase when you restart the development server.

## Verification Checklist

- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Database schema created
- [ ] Storage buckets created
- [ ] Policies configured
- [ ] Development server restarted 