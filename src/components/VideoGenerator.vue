<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VideoJobService } from '../services/videoJobService'
import { type VideoJob, type JobStatus } from '../lib/supabase'

// Router setup
const route = useRoute()
const router = useRouter()

// Reactive state
const currentJob = ref<VideoJob | null>(null)
const currentStatus = ref<JobStatus>('INPUT')
const isLoading = ref(false)
const currentJobId = ref<string | null>(null)
const realtimeSubscription = ref<any>(null)

const scenarioData = reactive({
  videoTitle: '',
  scenarioDetails: '',
  characters: ''
})

const mockOutputs = reactive({
  script: '',
  images: [] as string[],
  audioUrls: [] as string[],
  baseAnimationUrls: [] as string[],
  lipSyncUrls: [] as string[],
  finalVideoUrl: ''
})

// Mock data
const mockScript = `Scene 1: Introduction
Character 1 enters the room, looking excited about the new project.

Character 1: "Welcome to Viducator! This AI-powered platform will revolutionize how we create educational videos."

Scene 2: Demonstration
Character 1 demonstrates the key features while maintaining eye contact with the camera.

Character 1: "With just a few inputs, we can generate professional-quality educational content in minutes!"

Scene 3: Conclusion
Character 1 concludes with enthusiasm and a call to action.

Character 1: "Ready to transform your educational content? Let's get started!"`

const mockImages = [
  'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Character+1',
  'https://via.placeholder.com/400x300/7C3AED/FFFFFF?text=Scene+Background',
  'https://via.placeholder.com/400x300/059669/FFFFFF?text=Props+%26+Items'
]

const mockAudioUrls = [
  'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
  'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
]

const mockVideoUrls = [
  'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
  'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
]

// Helper functions
function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getProgressPercentage(): number {
  const statusMap: Record<JobStatus, number> = {
    'INPUT': 0,
    'PENDING_SCRIPT_REVIEW': 10,
    'SCRIPT_READY_FOR_REVIEW': 20,
    'PENDING_IMAGE_GEN': 30,
    'IMAGES_READY_FOR_REVIEW': 40,
    'PENDING_VOICE_GEN': 50,
    'VOICES_READY_FOR_REVIEW': 60,
    'PENDING_ANIMATION': 70,
    'ANIMATION_READY_FOR_REVIEW': 80,
    'PENDING_LIP_SYNC': 85,
    'LIP_SYNC_READY_FOR_REVIEW': 90,
    'PENDING_RENDERING': 95,
    'COMPLETED': 100,
    'FAILED_SCRIPT_GEN': 20,
    'FAILED_IMAGE_GEN': 40,
    'FAILED_VOICE_GEN': 60,
    'FAILED_ANIMATION': 80,
    'FAILED_LIP_SYNC': 90,
    'FAILED_RENDERING': 95
  }
  return statusMap[currentStatus.value] || 0
}

function getLoadingMessage(): string {
  const messages: Record<string, string> = {
    'PENDING_SCRIPT_REVIEW': '🤖 Generating Script...',
    'PENDING_IMAGE_GEN': '🎨 Creating Images...',
    'PENDING_VOICE_GEN': '🎙️ Generating Voices...',
    'PENDING_ANIMATION': '🎬 Creating Animation...',
    'PENDING_LIP_SYNC': '💋 Refining Lip-Sync...',
    'PENDING_RENDERING': '🎞️ Final Rendering...'
  }
  return messages[currentStatus.value] || 'Processing...'
}

function getLoadingDescription(): string {
  const descriptions: Record<string, string> = {
    'PENDING_SCRIPT_REVIEW': 'AI is crafting your video script based on the scenario details.',
    'PENDING_IMAGE_GEN': 'Generating character and scene images using AI.',
    'PENDING_VOICE_GEN': 'Creating natural-sounding voiceovers for your characters.',
    'PENDING_ANIMATION': 'Bringing your characters to life with base animations.',
    'PENDING_LIP_SYNC': 'Fine-tuning lip synchronization for realistic speech.',
    'PENDING_RENDERING': 'Assembling all elements into your final video masterpiece.'
  }
  return descriptions[currentStatus.value] || 'Please wait while we process your request.'
}

// Database operations
async function loadJobFromDatabase(jobId: string) {
  const job = await VideoJobService.getJob(jobId)
  if (job) {
    currentJob.value = job
    currentStatus.value = job.status
    
    // Load scenario data
    scenarioData.videoTitle = job.input_scenario.videoTitle
    scenarioData.scenarioDetails = job.input_scenario.scenarioDetails
    scenarioData.characters = job.input_scenario.characters
    
    // Load outputs
    if (job.current_outputs.script) {
      mockOutputs.script = job.current_outputs.script
    }
    if (job.current_outputs.images) {
      mockOutputs.images = job.current_outputs.images
    }
    if (job.current_outputs.audioUrls) {
      mockOutputs.audioUrls = job.current_outputs.audioUrls
    }
    if (job.current_outputs.baseAnimationUrls) {
      mockOutputs.baseAnimationUrls = job.current_outputs.baseAnimationUrls
    }
    if (job.current_outputs.lipSyncUrls) {
      mockOutputs.lipSyncUrls = job.current_outputs.lipSyncUrls
    }
    if (job.current_outputs.finalVideoUrl) {
      mockOutputs.finalVideoUrl = job.current_outputs.finalVideoUrl
    }
    
    // Subscribe to real-time updates
    subscribeToJobUpdates(jobId)
  }
}

function subscribeToJobUpdates(jobId: string) {
  if (realtimeSubscription.value) {
    realtimeSubscription.value.unsubscribe()
  }
  
  realtimeSubscription.value = VideoJobService.subscribeToJob(jobId, (updatedJob) => {
    currentJob.value = updatedJob
    currentStatus.value = updatedJob.status
    
    // Update outputs based on database changes
    const outputs = updatedJob.current_outputs
    if (outputs.script && outputs.script !== mockOutputs.script) {
      mockOutputs.script = outputs.script
    }
    if (outputs.images && JSON.stringify(outputs.images) !== JSON.stringify(mockOutputs.images)) {
      mockOutputs.images = outputs.images
    }
    if (outputs.audioUrls && JSON.stringify(outputs.audioUrls) !== JSON.stringify(mockOutputs.audioUrls)) {
      mockOutputs.audioUrls = outputs.audioUrls
    }
    if (outputs.baseAnimationUrls && JSON.stringify(outputs.baseAnimationUrls) !== JSON.stringify(mockOutputs.baseAnimationUrls)) {
      mockOutputs.baseAnimationUrls = outputs.baseAnimationUrls
    }
    if (outputs.lipSyncUrls && JSON.stringify(outputs.lipSyncUrls) !== JSON.stringify(mockOutputs.lipSyncUrls)) {
      mockOutputs.lipSyncUrls = outputs.lipSyncUrls
    }
    if (outputs.finalVideoUrl && outputs.finalVideoUrl !== mockOutputs.finalVideoUrl) {
      mockOutputs.finalVideoUrl = outputs.finalVideoUrl
    }
  })
}

// Main workflow functions
async function handleGenerateScenario() {
  if (!scenarioData.videoTitle || !scenarioData.scenarioDetails) {
    alert('Please fill in all required fields')
    return
  }
  
  isLoading.value = true
  
  try {
    // Create job in database
    const job = await VideoJobService.createJob({
      videoTitle: scenarioData.videoTitle,
      scenarioDetails: scenarioData.scenarioDetails,
      characters: scenarioData.characters
    })
    
    if (job) {
      currentJob.value = job
      currentJobId.value = job.id!
      currentStatus.value = 'PENDING_SCRIPT_REVIEW'
      
      // Update URL to include job ID
      router.push({ query: { ...route.query, jobId: job.id } })
      
      // Subscribe to real-time updates
      subscribeToJobUpdates(job.id!)
      
      // Simulate API call delay
      await simulateDelay(2000)
      
      // Update job with mock script
      await VideoJobService.updateJob(job.id!, {
        status: 'SCRIPT_READY_FOR_REVIEW',
        current_outputs: { script: mockScript }
      })
      
      mockOutputs.script = mockScript
      currentStatus.value = 'SCRIPT_READY_FOR_REVIEW'
    }
  } catch (error) {
    console.error('Error creating job:', error)
    alert('Failed to create video job. Please try again.')
  } finally {
    isLoading.value = false
  }
}

async function handleApproveScript() {
  if (!currentJobId.value) return
  
  isLoading.value = true
  currentStatus.value = 'PENDING_IMAGE_GEN'
  
  await VideoJobService.updateStatus(currentJobId.value, 'PENDING_IMAGE_GEN')
  await simulateDelay(3000)
  
  const newOutputs = { ...currentJob.value?.current_outputs, images: mockImages }
  await VideoJobService.updateJob(currentJobId.value, {
    status: 'IMAGES_READY_FOR_REVIEW',
    current_outputs: newOutputs
  })
  
  mockOutputs.images = [...mockImages]
  currentStatus.value = 'IMAGES_READY_FOR_REVIEW'
  isLoading.value = false
}

async function handleApproveImages() {
  if (!currentJobId.value) return
  
  isLoading.value = true
  currentStatus.value = 'PENDING_VOICE_GEN'
  
  await VideoJobService.updateStatus(currentJobId.value, 'PENDING_VOICE_GEN')
  await simulateDelay(2500)
  
  const newOutputs = { ...currentJob.value?.current_outputs, audioUrls: mockAudioUrls }
  await VideoJobService.updateJob(currentJobId.value, {
    status: 'VOICES_READY_FOR_REVIEW',
    current_outputs: newOutputs
  })
  
  mockOutputs.audioUrls = [...mockAudioUrls]
  currentStatus.value = 'VOICES_READY_FOR_REVIEW'
  isLoading.value = false
}

async function handleApproveVoices() {
  if (!currentJobId.value) return
  
  isLoading.value = true
  currentStatus.value = 'PENDING_ANIMATION'
  
  await VideoJobService.updateStatus(currentJobId.value, 'PENDING_ANIMATION')
  await simulateDelay(4000)
  
  const newOutputs = { ...currentJob.value?.current_outputs, baseAnimationUrls: mockVideoUrls }
  await VideoJobService.updateJob(currentJobId.value, {
    status: 'ANIMATION_READY_FOR_REVIEW',
    current_outputs: newOutputs
  })
  
  mockOutputs.baseAnimationUrls = [...mockVideoUrls]
  currentStatus.value = 'ANIMATION_READY_FOR_REVIEW'
  isLoading.value = false
}

async function handleApproveAnimation() {
  if (!currentJobId.value) return
  
  isLoading.value = true
  currentStatus.value = 'PENDING_LIP_SYNC'
  
  await VideoJobService.updateStatus(currentJobId.value, 'PENDING_LIP_SYNC')
  await simulateDelay(3500)
  
  const newOutputs = { ...currentJob.value?.current_outputs, lipSyncUrls: mockVideoUrls }
  await VideoJobService.updateJob(currentJobId.value, {
    status: 'LIP_SYNC_READY_FOR_REVIEW',
    current_outputs: newOutputs
  })
  
  mockOutputs.lipSyncUrls = [...mockVideoUrls]
  currentStatus.value = 'LIP_SYNC_READY_FOR_REVIEW'
  isLoading.value = false
}

async function handleApproveLipSync() {
  if (!currentJobId.value) return
  
  isLoading.value = true
  currentStatus.value = 'PENDING_RENDERING'
  
  await VideoJobService.updateStatus(currentJobId.value, 'PENDING_RENDERING')
  await simulateDelay(5000)
  
  const finalVideoUrl = 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4'
  const newOutputs = { ...currentJob.value?.current_outputs, finalVideoUrl }
  await VideoJobService.updateJob(currentJobId.value, {
    status: 'COMPLETED',
    current_outputs: newOutputs
  })
  
  mockOutputs.finalVideoUrl = finalVideoUrl
  currentStatus.value = 'COMPLETED'
  isLoading.value = false
}

function handleRetry() {
  // Reset to previous step for retry (keep database sync)
  switch(currentStatus.value) {
    case 'SCRIPT_READY_FOR_REVIEW':
      currentStatus.value = 'PENDING_SCRIPT_REVIEW'
      break
    case 'IMAGES_READY_FOR_REVIEW':
      currentStatus.value = 'PENDING_IMAGE_GEN'
      break
    case 'VOICES_READY_FOR_REVIEW':
      currentStatus.value = 'PENDING_VOICE_GEN'
      break
    case 'ANIMATION_READY_FOR_REVIEW':
      currentStatus.value = 'PENDING_ANIMATION'
      break
    case 'LIP_SYNC_READY_FOR_REVIEW':
      currentStatus.value = 'PENDING_LIP_SYNC'
      break
    case 'COMPLETED':
      currentStatus.value = 'PENDING_RENDERING'
      break
  }
}

function handleEdit() {
  // Return to input for editing
  currentStatus.value = 'INPUT'
  mockOutputs.script = ''
  mockOutputs.images = []
  mockOutputs.audioUrls = []
  mockOutputs.baseAnimationUrls = []
  mockOutputs.lipSyncUrls = []
  mockOutputs.finalVideoUrl = ''
}

function restartWorkflow() {
  currentStatus.value = 'INPUT'
  currentJob.value = null
  currentJobId.value = null
  scenarioData.videoTitle = ''
  scenarioData.scenarioDetails = ''
  scenarioData.characters = ''
  mockOutputs.script = ''
  mockOutputs.images = []
  mockOutputs.audioUrls = []
  mockOutputs.baseAnimationUrls = []
  mockOutputs.lipSyncUrls = []
  mockOutputs.finalVideoUrl = ''
  isLoading.value = false
  
  // Clear URL parameters
  router.push({ query: {} })
  
  // Unsubscribe from real-time updates
  if (realtimeSubscription.value) {
    realtimeSubscription.value.unsubscribe()
    realtimeSubscription.value = null
  }
}

// Lifecycle hooks
onMounted(() => {
  // Check if there's a job ID in the URL
  const jobId = route.query.jobId as string
  if (jobId) {
    currentJobId.value = jobId
    loadJobFromDatabase(jobId)
  }
})

onUnmounted(() => {
  // Cleanup real-time subscription
  if (realtimeSubscription.value) {
    realtimeSubscription.value.unsubscribe()
  }
})

// Watch for URL changes
watch(() => route.query.jobId, (newJobId) => {
  if (newJobId && newJobId !== currentJobId.value) {
    currentJobId.value = newJobId as string
    loadJobFromDatabase(newJobId as string)
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <!-- Database Status Indicator -->
    <div v-if="currentJob" class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
      <div class="flex items-center space-x-2">
        <span class="h-2 w-2 bg-green-500 rounded-full"></span>
        <span class="text-green-700 text-sm font-medium">
          Connected to Database - Job ID: {{ currentJob.id?.slice(0, 8) }}...
        </span>
        <span class="text-green-600 text-xs">
          Status synced with Supabase
        </span>
      </div>
    </div>

    <!-- Progress Indicator -->
    <div class="mb-8">
      <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span :class="currentStatus === 'INPUT' ? 'text-blue-600 font-medium' : ''">Input</span>
        <span :class="currentStatus.includes('SCRIPT') ? 'text-blue-600 font-medium' : ''">Script</span>
        <span :class="currentStatus.includes('IMAGE') ? 'text-blue-600 font-medium' : ''">Images</span>
        <span :class="currentStatus.includes('VOICE') ? 'text-blue-600 font-medium' : ''">Voices</span>
        <span :class="currentStatus.includes('ANIMATION') ? 'text-blue-600 font-medium' : ''">Animation</span>
        <span :class="currentStatus.includes('LIP_SYNC') ? 'text-blue-600 font-medium' : ''">Lip Sync</span>
        <span :class="currentStatus === 'COMPLETED' ? 'text-green-600 font-medium' : ''">Complete</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="bg-blue-600 h-2 rounded-full transition-all duration-500"
          :style="{ width: `${getProgressPercentage()}%` }"
        ></div>
      </div>
    </div>

    <!-- Step 1: Scenario Input -->
    <div v-if="currentStatus === 'INPUT'" class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">📝 Step 1: Video Scenario</h2>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Video Title *</label>
          <input 
            v-model="scenarioData.videoTitle"
            type="text" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your video title"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Scenario Details *</label>
          <textarea 
            v-model="scenarioData.scenarioDetails"
            rows="4" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your video scenario in detail..."
          ></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Characters & Basic Traits</label>
          <input 
            v-model="scenarioData.characters"
            type="text" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Professional teacher, friendly demeanor, business attire"
          />
        </div>
        <button 
          @click="handleGenerateScenario"
          :disabled="isLoading"
          class="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {{ isLoading ? 'Creating Job...' : '🚀 Generate Video Idea' }}
        </button>
      </div>
    </div>

    <!-- Loading States -->
    <div v-if="isLoading" class="bg-white rounded-lg shadow-lg p-6 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h3 class="text-xl font-semibold text-gray-800 mb-2">{{ getLoadingMessage() }}</h3>
      <p class="text-gray-600">{{ getLoadingDescription() }}</p>
    </div>

    <!-- Step 2: Script Review -->
    <div v-if="currentStatus === 'SCRIPT_READY_FOR_REVIEW'" class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">📜 Step 2: Script Review</h2>
      <div class="bg-gray-50 p-4 rounded-md mb-6">
        <pre class="whitespace-pre-wrap text-gray-800">{{ mockOutputs.script }}</pre>
      </div>
      <div class="flex space-x-3">
        <button @click="handleApproveScript" class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">
          ✅ Approve
        </button>
        <button @click="handleEdit" class="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700">
          ✏️ Edit & Regenerate
        </button>
        <button @click="handleRetry" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
          🔄 Retry
        </button>
      </div>
    </div>

    <!-- Step 3: Image Review -->
    <div v-if="currentStatus === 'IMAGES_READY_FOR_REVIEW'" class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">🖼️ Step 3: Image Assets</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div v-for="(image, index) in mockOutputs.images" :key="index" class="relative">
          <img :src="image" :alt="`Generated image ${index + 1}`" class="w-full h-48 object-cover rounded-md shadow-md" />
          <span class="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
            Image {{ index + 1 }}
          </span>
        </div>
      </div>
      <div class="flex space-x-3">
        <button @click="handleApproveImages" class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">
          ✅ Approve
        </button>
        <button @click="handleEdit" class="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700">
          ✏️ Edit & Regenerate
        </button>
        <button @click="handleRetry" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
          🔄 Retry
        </button>
      </div>
    </div>

    <!-- Step 4: Voice Review -->
    <div v-if="currentStatus === 'VOICES_READY_FOR_REVIEW'" class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">🎙️ Step 4: Voiceovers</h2>
      <div class="space-y-4 mb-6">
        <div v-for="(audio, index) in mockOutputs.audioUrls" :key="index" class="bg-gray-50 p-4 rounded-md">
          <div class="flex items-center justify-between">
            <span class="font-medium text-gray-800">Voice {{ index + 1 }}</span>
            <audio controls class="w-64">
              <source :src="audio" type="audio/mpeg">
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      </div>
      <div class="flex space-x-3">
        <button @click="handleApproveVoices" class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">
          ✅ Approve
        </button>
        <button @click="handleEdit" class="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700">
          ✏️ Edit & Regenerate
        </button>
        <button @click="handleRetry" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
          🔄 Retry
        </button>
      </div>
    </div>

    <!-- Step 5: Base Animation Review -->
    <div v-if="currentStatus === 'ANIMATION_READY_FOR_REVIEW'" class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">🎬 Step 5: Base Animation</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div v-for="(video, index) in mockOutputs.baseAnimationUrls" :key="index" class="relative">
          <video controls class="w-full h-48 rounded-md shadow-md">
            <source :src="video" type="video/mp4">
            Your browser does not support the video tag.
          </video>
          <span class="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
            Animation {{ index + 1 }}
          </span>
        </div>
      </div>
      <div class="flex space-x-3">
        <button @click="handleApproveAnimation" class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">
          ✅ Approve
        </button>
        <button @click="handleEdit" class="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700">
          ✏️ Edit & Regenerate
        </button>
        <button @click="handleRetry" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
          🔄 Retry
        </button>
      </div>
    </div>

    <!-- Step 6: Lip-Sync Review -->
    <div v-if="currentStatus === 'LIP_SYNC_READY_FOR_REVIEW'" class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">💋 Step 6: Lip-Sync Refinement</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div v-for="(video, index) in mockOutputs.lipSyncUrls" :key="index" class="relative">
          <video controls class="w-full h-48 rounded-md shadow-md">
            <source :src="video" type="video/mp4">
            Your browser does not support the video tag.
          </video>
          <span class="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
            Refined {{ index + 1 }}
          </span>
        </div>
      </div>
      <div class="flex space-x-3">
        <button @click="handleApproveLipSync" class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">
          ✅ Approve
        </button>
        <button @click="handleEdit" class="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700">
          ✏️ Edit & Regenerate
        </button>
        <button @click="handleRetry" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
          🔄 Retry
        </button>
      </div>
    </div>

    <!-- Step 7: Final Render -->
    <div v-if="currentStatus === 'COMPLETED'" class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">🎉 Step 7: Final Video</h2>
      <div class="text-center mb-6">
        <video controls class="w-full max-w-2xl mx-auto rounded-md shadow-lg">
          <source :src="mockOutputs.finalVideoUrl" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>
      <div class="flex justify-center space-x-3">
        <a 
          :href="mockOutputs.finalVideoUrl" 
          download="viducator-video.mp4"
          class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 inline-block"
        >
          💾 Download Video
        </a>
        <button @click="restartWorkflow" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
          🔄 Create New Video
        </button>
      </div>
    </div>
  </div>
</template> 