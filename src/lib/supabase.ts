import { createClient } from '@supabase/supabase-js'

// These will be environment variables in production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types for TypeScript
export interface VideoJob {
  id?: string
  user_id?: string | null
  status: JobStatus
  input_scenario: {
    videoTitle: string
    scenarioDetails: string
    characters: string
  }
  current_outputs: {
    script?: string
    images?: string[]
    audioUrls?: string[]
    baseAnimationUrls?: string[]
    lipSyncUrls?: string[]
    finalVideoUrl?: string
  }
  error_message?: string | null
  created_at?: string
  updated_at?: string
}

export type JobStatus = 
  | 'INPUT' 
  | 'PENDING_SCRIPT_REVIEW' 
  | 'SCRIPT_READY_FOR_REVIEW'
  | 'PENDING_IMAGE_GEN' 
  | 'IMAGES_READY_FOR_REVIEW'
  | 'PENDING_VOICE_GEN' 
  | 'VOICES_READY_FOR_REVIEW'
  | 'PENDING_ANIMATION' 
  | 'ANIMATION_READY_FOR_REVIEW'
  | 'PENDING_LIP_SYNC' 
  | 'LIP_SYNC_READY_FOR_REVIEW'
  | 'PENDING_RENDERING' 
  | 'COMPLETED'
  | 'FAILED_SCRIPT_GEN'
  | 'FAILED_IMAGE_GEN'
  | 'FAILED_VOICE_GEN'
  | 'FAILED_ANIMATION'
  | 'FAILED_LIP_SYNC'
  | 'FAILED_RENDERING' 