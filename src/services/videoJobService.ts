import { supabase, type VideoJob, type JobStatus } from '../lib/supabase'

export class VideoJobService {
  
  /**
   * Create a new video job in the database
   */
  static async createJob(inputScenario: VideoJob['input_scenario']): Promise<VideoJob | null> {
    try {
      const { data, error } = await supabase
        .from('video_jobs')
        .insert({
          status: 'PENDING_SCRIPT_REVIEW',
          input_scenario: inputScenario,
          current_outputs: {}
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating video job:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Exception creating video job:', error)
      return null
    }
  }

  /**
   * Get a video job by ID
   */
  static async getJob(jobId: string): Promise<VideoJob | null> {
    try {
      const { data, error } = await supabase
        .from('video_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error) {
        console.error('Error fetching video job:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Exception fetching video job:', error)
      return null
    }
  }

  /**
   * Update video job status and outputs
   */
  static async updateJob(
    jobId: string, 
    updates: Partial<Pick<VideoJob, 'status' | 'current_outputs' | 'error_message'>>
  ): Promise<VideoJob | null> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('video_jobs')
        .update(updateData)
        .eq('id', jobId)
        .select()
        .single()

      if (error) {
        console.error('Error updating video job:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Exception updating video job:', error)
      return null
    }
  }

  /**
   * Update job status only
   */
  static async updateStatus(jobId: string, status: JobStatus): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('video_jobs')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      if (error) {
        console.error('Error updating job status:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Exception updating job status:', error)
      return false
    }
  }

  /**
   * Update job outputs
   */
  static async updateOutputs(jobId: string, outputs: VideoJob['current_outputs']): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('video_jobs')
        .update({ 
          current_outputs: outputs,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      if (error) {
        console.error('Error updating job outputs:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Exception updating job outputs:', error)
      return false
    }
  }

  /**
   * Get all jobs for the current user (for job history)
   */
  static async getUserJobs(): Promise<VideoJob[]> {
    try {
      const { data, error } = await supabase
        .from('video_jobs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user jobs:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Exception fetching user jobs:', error)
      return []
    }
  }

  /**
   * Subscribe to job status changes for real-time updates
   */
  static subscribeToJob(jobId: string, callback: (job: VideoJob) => void) {
    return supabase
      .channel(`job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_jobs',
          filter: `id=eq.${jobId}`
        },
        (payload) => {
          callback(payload.new as VideoJob)
        }
      )
      .subscribe()
  }

  /**
   * Upload file to Supabase Storage
   */
  static async uploadFile(
    bucket: 'video-assets' | 'final-videos',
    filePath: string,
    file: File
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file)

      if (error) {
        console.error('Error uploading file:', error)
        return null
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (error) {
      console.error('Exception uploading file:', error)
      return null
    }
  }

  /**
   * Get public URL for a file in storage
   */
  static getPublicUrl(bucket: 'video-assets' | 'final-videos', filePath: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)
    
    return data.publicUrl
  }
} 