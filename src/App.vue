<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="container mx-auto px-4 py-8">
      <header class="text-center mb-12">
        <h1 class="text-5xl font-bold text-indigo-900 mb-4">
          ✨ Viducator ✨
        </h1>
        <p class="text-xl text-gray-600 mb-8">
          AI-Powered Video Generation Platform
        </p>
        
        <!-- Navigation -->
        <nav class="mb-8">
          <div class="flex justify-center space-x-4">
            <RouterLink 
              to="/" 
              class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              🎬 Create Video
            </RouterLink>
            <RouterLink 
              to="/about" 
              class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              📖 About
            </RouterLink>
          </div>
        </nav>

        <!-- Status indicator for different pages -->
        <div v-if="$route.path === '/'" class="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">
            🚀 Phase 1: Frontend Core Setup
          </h2>
          <p class="text-gray-600 mb-4">
            Complete mocked workflow with all 6 video generation steps!
          </p>
          <div class="flex items-center justify-center space-x-2">
            <span class="h-3 w-3 bg-green-500 rounded-full animate-pulse"></span>
            <span class="text-green-600 font-medium">Ready for Testing</span>
          </div>
        </div>
      </header>
      
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
/* Custom animations and styles can go here */
</style>
