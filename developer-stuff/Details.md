# Iterative Implementation Plan: AI Video Generator

This plan outlines a step-by-step approach to building your AI video generation application, focusing on modularity, testing each component before proceeding, and detailing the tech stack elements introduced at each phase.

## Phase 1: Frontend Core & Mocked Workflow

**Goal:** Establish the complete user interface flow with simulated API responses and basic frontend deployment.

### Tech Stack Elements Introduced
- **Vue.js**: The frontend framework for the user interface.
- **Vercel**: Hosting for the Vue.js frontend and initial API gateway (Edge Functions).
- **GitHub**: Version control for all project code.

### Requirements to Make it Work
- Node.js (LTS version) and npm/yarn installed locally.
- Git installed and configured.
- Vercel account linked to GitHub.

### Implementation Steps

#### 1. Project Setup & Basic Deployment

1. Create a new Vue.js project using Vue CLI (`vue create my-ai-video-app`) or Vite (`npm create vue@latest`).
2. Initialize a local Git repository (`git init`).
3. Add Tailwind CSS for styling.
4. Create a basic "Hello World" Vue component.
5. Commit code to GitHub.
6. Connect your GitHub repository to Vercel and deploy.

**Testing:** Verify the basic Vue app successfully builds and loads on Vercel via its generated URL.

#### Human Checkpoint 1: Barebones Frontend Setup

**Purpose:** Confirm foundational frontend and deployment infrastructure.

**Action:** Manually navigate to the Vercel-hosted URL. Confirm the "Hello World" (or equivalent) page loads without errors.

**Decision:** Proceed to UI development if successful.

#### 2. Scenario Input UI & Mocked Script Generation

1. Develop the initial form in Vue.js for "Video Title," "Scenario Details," and "Characters & Basic Traits" (as per wireframe Step 1).
2. Implement the `handleGenerateScenario` function.
3. **Mocking:** Inside `handleGenerateScenario`, instead of an actual API call, use `setTimeout` to simulate latency. Provide a hardcoded, realistic mock script data.
4. After the simulated delay, update the component's state to transition the UI to the "Script Review" screen (wireframe Step 2).

**Testing:** Fill out the form, click "Generate Video Idea." Observe a loading state, then verify the UI transitions correctly to the Script Review screen with the mock script displayed.

#### 3. Complete Mocked Workflow & UI State

1. Implement the UI for all subsequent review steps: Image Assets (Step 3), Voiceovers (Step 4), Base Animation (Step 5), Dedicated Lip-Sync (Step 6), and Final Rendering (Step 7).
2. For each step's approval button (`handleApproveX`), use `setTimeout` and hardcoded mock data (e.g., placeholder image URLs like placehold.co, public domain MP3s/MP4s) to simulate the output of the next AI service.
3. Implement "Edit & Regenerate" and "Retry" buttons for each step, ensuring they correctly reset the state to the previous step's "pending review" state or regenerate mock data.

**Testing:** Click through the entire workflow from start to finish. Ensure all UI elements (image displays, audio players, video players) show the mock data correctly. Verify that "regenerate" options return to the previous review step.

#### Human Checkpoint 2: Full Mocked Workflow Completion

**Purpose:** Validate the entire user journey and all UI components with mock data.

**Action:** Go through the entire video generation process in the UI, from scenario input to final video display, ensuring all review steps function as expected. Test "Approve," "Edit & Regenerate," and "Retry" buttons at each stage.

**Decision:** Proceed to database integration if the end-to-end user experience and all UI components are satisfactory.

## Phase 2: Database & Storage Integration

**Goal:** Persist application state and store generated assets using Supabase, replacing in-memory state.

### Tech Stack Elements Introduced
- **Supabase**: Managed PostgreSQL database, object storage (Supabase Storage), and serverless functions (Supabase Edge Functions).
- **Supabase JavaScript Client Library**: For interacting with Supabase from Vue.js and backend services.

### Requirements to Make it Work
- Supabase account and a new project created.
- `anon` and `service_role` API keys from Supabase project settings.
- `@supabase/supabase-js` npm package installed in Vue.js project.
- Basic SQL knowledge for creating tables.

### Implementation Steps

#### 1. Supabase Project & Schema Setup

1. In your Supabase dashboard, create a `video_jobs` table. Define columns:
   - `id` (UUID, Primary Key, default `gen_random_uuid()`)
   - `user_id` (UUID, nullable for now)
   - `status` (text, default `PENDING_SCRIPT_REVIEW`)
   - `input_scenario` (JSONB)
   - `current_outputs` (JSONB, to store script, image URLs, etc. at each stage)
   - `created_at` (timestamp with timezone, default `now()`)
   - `updated_at` (timestamp with timezone)

2. Create storage buckets (e.g., `video-assets`, `final-videos`) in Supabase Storage.

**Testing:** Verify table creation and storage buckets are accessible in the Supabase dashboard.

#### Human Checkpoint 1: Supabase Infrastructure Setup

**Purpose:** Confirm Supabase database and storage are correctly provisioned and accessible.

**Action:** Verify that your `video_jobs` table exists and that you can manually create/read/update records using the Supabase SQL editor. Confirm you can upload/download a test file to your storage buckets.

**Decision:** Proceed to integrate Supabase with your frontend.

#### 2. Frontend (Vue.js) to Supabase Integration

1. Initialize the Supabase client in your Vue.js app.
2. Modify `handleGenerateScenario`: Instead of local state, insert a new row into the `video_jobs` table via Supabase client, setting initial status and `input_scenario`. The `job_id` will now come from Supabase.
3. Modify `handleApproveX` and `handleRegenerateX` functions: Use Supabase client to update the `status` column and the `current_outputs` JSONB column for the specific `job_id`.
4. The frontend will now read the `job_details` from Supabase (e.g., by fetching the job by `job_id` from a URL parameter or local storage on page load).

**Testing:** Play through the mocked workflow. Observe that job status and data change in your Supabase `video_jobs` table. If you refresh the page, the job state should be retained (if `job_id` is passed correctly).

#### Human Checkpoint 2: Frontend-to-Supabase Integration Completion

**Purpose:** Validate that the frontend can correctly read from and write to Supabase, persisting the workflow state.

**Action:** Initiate a new video generation. Progress through a few steps. Refresh the browser. Confirm the application resumes from the correct step with the correct data loaded from Supabase. Verify all "Approve" and "Regenerate" actions correctly update the database.

**Decision:** Proceed to backend worker setup and real API integration.

## Phase 3: Backend Workers & Real API Integration

**Goal:** Replace mocked API calls with actual calls to third-party AI services, orchestrated by Railway workers, and store real outputs in Supabase Storage.

### Tech Stack Elements Introduced
- **Railway**: Backend compute for worker services, and hosting for Redis message queue.
- **Redis**: Message queue for asynchronous task orchestration (hosted on Railway).
- **Python / Node.js**: Runtime for backend worker services.
- **Google Gemini API**: For script generation.
- **Leonardo.AI API**: For character and scene image generation.
- **Eleven Labs API**: For voice generation.
- **HeyGen API**: For base video animation.
- **Sync Labs API**: For dedicated lip-sync refinement.
- **MoviePy (Python) / FFmpeg (CLI tool)**: For video assembly and rendering.

### Requirements to Make it Work
- Railway account.
- API keys for Google Gemini, Leonardo.AI, Eleven Labs, HeyGen, Sync Labs.
- `python-dotenv` (Python) or `dotenv` (Node.js) for local environment variables.
- Specific API client libraries (e.g., `google-generativeai`, `requests`, `elevenlabs-python`, `heygen-api-client`, `synclabs-api-client`) installed in worker environments.
- `moviepy` (Python) and `ffmpeg` (CLI tool, pre-installed on Railway environments or installed via worker setup script).
- Basic knowledge of setting up environment variables on Railway.

### Implementation Steps (Iterative API Integration)

#### 1. Railway & Redis Setup

1. Create a new Railway project.
2. Add a Redis database service from the Railway Add-ons marketplace.
3. Add a new service (e.g., a Python or Node.js project for your Orchestrator Worker). Connect its GitHub repository.
4. Configure environment variables in Railway for your Supabase URL/Key and Redis connection string.

**Testing:** Verify the Orchestrator worker deploys and connects to Redis and Supabase. Check Railway logs for successful connection messages.

#### Human Checkpoint 1: Backend Compute & Queue Infrastructure

**Purpose:** Confirm Railway is set up to host workers and Redis, forming the backbone of your asynchronous processing.

**Action:** Deploy a minimal worker that simply consumes a message from Redis and logs it. Manually push a message to Redis from the CLI or a test script. Confirm the worker processes it.

**Decision:** Proceed to integrate specific AI APIs.

#### 2. Real Script Generation Integration

In your Orchestrator worker code, implement logic to:
1. Listen for `video_jobs` status changes (e.g., polling Supabase for `PENDING_SCRIPT_REVIEW` jobs).
2. When detected, make a real API call to Google Gemini API using the `input_scenario`.
3. Update the `video_jobs` record in Supabase with the generated script and `SCRIPT_READY_FOR_REVIEW` status.
4. Modify the Vue.js frontend's `handleGenerateScenario` to simply update Supabase status (the worker will pick it up).

**Testing:** Submit a scenario from the frontend. Observe the script being generated in real-time by the Railway worker and appearing in the frontend. Check Railway logs for Gemini API calls.

#### 3. Real Image Generation Integration

1. Add a new Railway worker service for Image Generation (or extend Orchestrator).
2. This worker listens for `PENDING_IMAGE_GEN` status.
3. Calls Leonardo.AI API based on script details.
4. Uploads generated image binary data to Supabase Storage (e.g., into `video-assets` bucket).
5. Updates `video_jobs` in Supabase with the image URLs and `IMAGES_READY_FOR_REVIEW` status.

**Testing:** Approve the script. Observe real images being generated by the worker and displayed in the frontend. Confirm images appear in Supabase Storage.

#### 4. Real Voice Generation Integration

1. Add a new Railway worker service for Voice Generation.
2. This worker listens for `PENDING_VOICE_GEN` status.
3. Calls Eleven Labs API.
4. Uploads generated audio files (e.g., MP3) to Supabase Storage.
5. Updates `video_jobs` with audio URLs and `VOICES_READY_FOR_REVIEW` status.

**Testing:** Approve images. Listen to the actual generated voices in the frontend. Confirm audio files appear in Supabase Storage.

#### 5. Real Base Animation Integration

1. Add a new Railway worker service for Base Animation.
2. This worker listens for `PENDING_ANIMATION` status.
3. Calls HeyGen API (pass image URLs from Supabase Storage, and audio URLs from Supabase Storage).
4. HeyGen returns video URLs. Upload resulting animated clips (still green-screened) to Supabase Storage.
5. Updates `video_jobs` with video URLs and `ANIMATION_READY_FOR_REVIEW` status.

**Testing:** Approve voices. See the actual base animated character clips in the frontend. Confirm video clips appear in Supabase Storage.

#### 6. Real Dedicated Lip-Sync Integration

1. Add a new Railway worker service for Dedicated Lip-Sync.
2. This worker listens for `PENDING_LIP_SYNC` status.
3. Downloads base animated clips from Supabase Storage.
4. Calls Sync Labs API (sends the base animation video and corresponding audio from Supabase Storage).
5. Uploads refined lip-synced clips to Supabase Storage.
6. Updates `video_jobs` with new video URLs and `LIP_SYNC_READY_FOR_REVIEW` status.

**Testing:** Approve base animation. Critically evaluate the refined lip-sync in the frontend. Confirm refined clips appear in Supabase Storage.

#### 7. Real Final Rendering Integration

1. Add a new Railway worker service for Final Rendering. (This worker might need more CPU/RAM on Railway).
2. This worker listens for `PENDING_RENDERING` status.
3. Downloads all approved assets (backgrounds, refined animated clips, audio) from Supabase Storage.
4. Executes MoviePy/FFmpeg commands (via Python subprocess) to perform chroma key, composite, assemble all clips/audio, apply camera movements/transitions, and export the final video.
5. Uploads the final MP4 to Supabase Storage (`final-videos` bucket).
6. Updates `video_jobs` with the final video URL and `COMPLETED` status.

**Testing:** Approve lip-sync. Wait for the final render, then play and download the complete video. Confirm the final video appears in Supabase Storage.

#### Human Checkpoint 2: Real API Integration Completion

**Purpose:** Validate the entire end-to-end automated process with real AI outputs.

**Action:** Run a full video generation from start to finish, approving each step. Verify that all AI service calls are successful and that the final video is correctly assembled with real, high-quality assets.

**Decision:** Proceed to refinement and production readiness if all core functionality is working reliably with real data.

## Phase 4: Refinement & Production Readiness

**Goal:** Ensure the app is robust, user-friendly, and ready for deployment.

### Tech Stack Elements Introduced
(Primarily leveraging existing stack's advanced features)
- **Supabase Auth**: For user management.
- **Supabase Realtime**: For instant UI updates.
- **Railway Logging/Monitoring**.

### Requirements to Make it Work
- Familiarity with Supabase Auth setup.
- Error handling strategies.

### Implementation Steps

#### 1. Robust Error Handling & Retries

1. In every Railway worker, implement try-catch blocks for API calls and Supabase interactions.
2. If an error occurs, update the `video_jobs` status to `FAILED_X_STEP` (e.g., `FAILED_IMAGE_GEN`) and store a detailed `error_message` in Supabase DB.
3. On the frontend, display appropriate error messages and allow the user to "Retry" the failed step (which would set the status back to `PENDING_X_STEP`).
4. Implement basic retry logic in Railway workers for transient API errors (e.g., rate limits).

**Testing:** Deliberately break API keys or provide bad prompts to test error handling and retry mechanisms.

#### Human Checkpoint 1: Error Handling Validation

**Purpose:** Confirm the system's ability to gracefully handle errors and allow user recovery.

**Action:** Introduce controlled errors (e.g., temporary invalid API key, malformed input to a specific API). Observe if the system catches the error, updates status to `FAILED_X_STEP`, and allows the user to retry successfully after correcting the issue.

**Decision:** Proceed to authentication and real-time updates if error handling is robust.

#### 2. User Authentication & Job History

1. Implement user authentication using Supabase Auth in your Vue.js frontend.
2. Modify the `video_jobs` table to associate jobs with authenticated `user_id`.
3. Create a "My Videos" dashboard in Vue.js where users can see all their past and ongoing video generation jobs, along with their statuses.

**Testing:** Users can sign up/log in, create multiple videos, and see their job history.

#### 3. Real-time Status Updates

1. Utilize Supabase Realtime subscriptions in your Vue.js frontend. Instead of polling, subscribe to changes in the `video_jobs` table for the user's active job. This provides instant UI updates as the backend progresses.

**Testing:** Changes in job status from the backend should reflect immediately in the frontend.

#### 4. Performance Optimization & Monitoring

1. Optimize API calls (e.g., batching image requests if API supports it).
2. Review Railway worker resource usage (CPU/RAM) and adjust instance sizes as needed.
3. Monitor Railway logs for errors and performance bottlenecks.
4. Consider optimizing video rendering with higher-performance FFmpeg configurations if needed.

**Testing:** Monitor resource usage and video generation times under typical load.

#### 5. Final Polish

1. Add comprehensive loading indicators and helpful tooltips.
2. Improve responsiveness and accessibility of the Vue.js UI.
3. Clean up code, add comments, and ensure proper documentation.

#### Human Checkpoint 2: Production Readiness & UX Finalization

**Purpose:** Conduct a final, comprehensive review of the application's functionality, user experience, and readiness for production.

**Action:** Perform extensive end-to-end testing, including edge cases. Verify all UI elements, data persistence, real-time updates, and authentication features work flawlessly. Assess the overall user experience, performance, and stability.

**Decision:** Application is ready for broader testing or deployment.

---

By meticulously following this plan, you will build a sophisticated, scalable, and user-friendly AI video generation application that meets your requirements. 