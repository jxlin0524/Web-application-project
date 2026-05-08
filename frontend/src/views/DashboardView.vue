<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
  PlusIcon, 
  BookOpenIcon, 
  Cog6ToothIcon,     
  PencilSquareIcon,  
  ClockIcon, 
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  BellAlertIcon,
  Squares2X2Icon,
  UserIcon 
} from '@heroicons/vue/24/outline';
import api from '../services/api';


interface Project {
  project_id: number;
  title: string;
  description: string;
  genre?: string;
  created_at: string;
  word_count?: number;
}

interface RevisionReminder {
  comment_id: number;
  project_id: number;
  project_title: string;
  chapter_title: string;
  reviewer_name: string;
  comment_content: string;
  created_at: string;
}


const router = useRouter();
const projects = ref<Project[]>([]);
const revisionReminders = ref<RevisionReminder[]>([]);
const loading = ref(true);
const showCreateModal = ref(false);
const newProject = ref({ title: '', genre: '', description: '' });

const showProfileModal = ref(false);
const profileSaving = ref(false);
const currentUser = ref({
  username: 'Novelist',
  email: 'writer@example.com',
  bio: 'A passionate story teller.'
});

const stats = computed(() => ({
  totalWords: projects.value.reduce((acc, curr) => acc + (curr.word_count || 0), 0),
  activeProjects: projects.value.length
}));


const getGenreStyle = (genre: string = '') => {
  const styles: Record<string, string> = {
    'Fantasy': 'bg-emerald-600',
    'Sci-Fi': 'bg-amber-600',
    'Romance': 'bg-rose-500',
    'Mystery': 'bg-purple-600',
    'Horror': 'bg-slate-700',
    'Literary': 'bg-indigo-500'
  };
  return styles[genre] || 'bg-blue-500';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(dateString);
};

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/auth');
};


const loadProjects = async () => {
  loading.value = true;
  try {
    const res = await api.get('/projects');
    projects.value = res.data.data.projects.map((p: Project) => ({
      ...p,
      word_count: p.word_count || 0
    }));
  } catch (e) {
    console.error("Failed to load projects", e);
  } finally {
    loading.value = false;
  }
};

const loadRevisions = async () => {
  try {
    const res = await api.get('/projects/revisions/pending');
    if (res.data.success) {
      revisionReminders.value = res.data.data;
    }
  } catch (e) {
    console.error("Failed to load real revisions", e);
  }
};

const handleCreate = async () => {
  if (!newProject.value.title) return;
  loading.value = true;
  try {
    await api.post('/projects', {
      title: newProject.value.title,
      description: newProject.value.description,
      genre: newProject.value.genre
    });
    await loadProjects();
    showCreateModal.value = false;
    newProject.value = { title: '', genre: '', description: '' };
  } catch {
    alert('Failed to create project');
  } finally {
    loading.value = false;
  }
};

const openProject = (id: number) => {
  router.push(`/editor/${id}`);
};

const openRecentProject = () => {
  if (projects.value.length === 0) {
    alert('You have no projects yet. Create one first!');
    return;
  }
  const recent = [...projects.value].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  
  if (recent && recent.project_id) {
    openProject(recent.project_id);
  }
};

const handleSaveProfile = async () => {
  profileSaving.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    const userStr = localStorage.getItem('user');
    if(userStr) {
       const userObj = JSON.parse(userStr);
       userObj.username = currentUser.value.username;
       userObj.email = currentUser.value.email;
       localStorage.setItem('user', JSON.stringify(userObj));
    }
    showProfileModal.value = false;
  } catch (e) {
    alert('Failed to save profile');
  } finally {
    profileSaving.value = false;
  }
};

const loadUserInfo = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const userObj = JSON.parse(userStr);
      currentUser.value.username = userObj.username || userObj.name || 'Novelist';
      currentUser.value.email = userObj.email || 'writer@example.com';
    } catch(e) {}
  }
};

const handleSettingsClick = () => {
  alert('System Settings coming soon!');
};

onMounted(async () => {
  loadUserInfo(); 
  await loadProjects();
  await loadRevisions(); 
});
</script>

<template>
  <div class="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
    
    <aside class="w-64 bg-[#0f172a] text-white flex flex-col shrink-0 transition-all duration-300 z-10">
      <div class="h-20 flex items-center px-6 border-b border-slate-800">
        <div class="w-8 h-8 rounded bg-[#5D7AE6] flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
          <span class="font-bold text-white text-lg">P</span>
        </div>
        <span class="text-xl font-bold font-serif tracking-wide">ProsePal</span>
      </div>

      <nav class="flex-1 px-4 py-6 space-y-2">
        <a href="#" class="flex items-center space-x-3 px-4 py-3 bg-[#5D7AE6] text-white rounded-xl shadow-md shadow-indigo-900/20 transition-all">
          <Squares2X2Icon class="w-5 h-5" />
          <span class="font-medium">Projects</span>
        </a>
        
        <a href="#" @click.prevent="openRecentProject" class="group flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
          <PencilSquareIcon class="w-5 h-5 group-hover:text-amber-400 group-hover:scale-110 transition-all duration-300" />
          <span class="font-medium">Recent Draft</span>
        </a>

        <a href="#" @click.prevent="showProfileModal = true" class="group flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
          <UserIcon class="w-5 h-5 group-hover:text-emerald-400 transition-colors" />
          <span class="font-medium">My Profile</span>
        </a>

        <a href="#" @click.prevent="handleSettingsClick" class="group flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
          <Cog6ToothIcon class="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
          <span class="font-medium">Settings</span>
        </a>
      </nav>

      <div class="p-4 border-t border-slate-800">
        <div class="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group">
          <div class="flex items-center space-x-3 cursor-pointer flex-1" @click="showProfileModal = true">
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold shadow-md">
              {{ currentUser.username.substring(0, 2).toUpperCase() }}
            </div>
            <div class="overflow-hidden">
              <p class="text-sm font-medium text-white truncate pr-2">{{ currentUser.username }}</p>
              <p class="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Author</p>
            </div>
          </div>
          <button @click="handleLogout" class="text-slate-500 hover:text-red-400 transition-colors p-1" title="Logout">
            <ArrowRightOnRectangleIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>

    <main class="flex-1 overflow-y-auto relative scroll-smooth">
      <div class="max-w-7xl mx-auto px-8 py-10">
        
        <div class="flex items-center justify-between mb-10">
          <div class="animate-fadeIn">
            <h1 class="text-3xl font-bold text-slate-900 font-serif">Your Projects</h1>
            <p class="text-slate-500 mt-1">Manage your novels and short stories.</p>
          </div>
          <button
            @click="showCreateModal = true"
            class="flex items-center space-x-2 bg-[#0f172a] hover:bg-slate-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <PlusIcon class="w-5 h-5" />
            <span class="font-medium">New Project</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 animate-slideUp">
          <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center space-x-2 text-slate-500 mb-2">
              <DocumentTextIcon class="w-4 h-4" />
              <span class="text-xs font-bold uppercase tracking-wider">Total Words</span>
            </div>
            <div class="text-3xl font-bold text-slate-900">
              {{ stats.totalWords.toLocaleString() }}
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center space-x-2 text-slate-500 mb-2">
              <BookOpenIcon class="w-4 h-4" />
              <span class="text-xs font-bold uppercase tracking-wider">Active Projects</span>
            </div>
            <div class="text-3xl font-bold text-[#EA580C]"> {{ stats.activeProjects }}
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full overflow-hidden">
            <div class="flex items-center space-x-2 text-amber-600 mb-4 shrink-0">
              <BellAlertIcon class="w-5 h-5" />
              <span class="text-xs font-bold uppercase tracking-wider text-slate-600">Pending Revisions</span>
            </div>
            
            <div v-if="revisionReminders.length" class="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              <div
                v-for="reminder in revisionReminders"
                :key="reminder.comment_id"
                @click="openProject(reminder.project_id)"
                class="p-3 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 transition-colors cursor-pointer group"
                title="Click to open project"
              >
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-amber-700 transition-colors">
                    {{ reminder.project_title }}
                  </span>
                  <span class="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md border border-slate-200 whitespace-nowrap shrink-0 ml-2 group-hover:bg-white transition-colors">
                    {{ reminder.chapter_title }}
                  </span>
                </div>
                
                <div class="text-xs text-slate-600 line-clamp-2 leading-relaxed border-l-2 border-amber-300 pl-2">
                  <span class="font-bold text-slate-700">{{ reminder.reviewer_name }}:</span> 
                  "{{ reminder.comment_content }}"
                </div>
                
                <div class="flex items-center text-[10px] text-slate-400 mt-2">
                  <ClockIcon class="w-3 h-3 mr-1" />
                  <span>{{ formatRelativeTime(reminder.created_at) }}</span>
                </div>
              </div>
            </div>
            <div v-else class="flex-1 flex flex-col items-center justify-center text-slate-400 mt-4">
               <CheckCircleIcon class="w-8 h-8 text-emerald-400 mb-2 opacity-50" />
               <p class="text-sm">All caught up. No new comments!</p>
            </div>
          </div>
        </div>

        <div v-if="loading && projects.length === 0" class="py-20 flex justify-center text-slate-400">
           <svg class="animate-spin h-8 w-8 text-[#5D7AE6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 animate-slideUp" style="animation-delay: 100ms;">
          
          <div
            v-for="project in projects"
            :key="project.project_id"
            @click="openProject(project.project_id)"
            class="group bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 transition-all duration-300 flex flex-col h-[280px]"
          >
            <div :class="['h-32 p-6 flex flex-col justify-between relative overflow-hidden', getGenreStyle(project.genre)]">
              <div class="absolute inset-0 bg-white opacity-10 mix-blend-overlay pointer-events-none">
                 <svg width="100%" height="100%">
                   <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter>
                   <rect width="100%" height="100%" filter="url(#noise)" opacity="0.4"/>
                 </svg>
               </div>
               
               <div class="relative z-10">
                 <span class="inline-block px-2.5 py-1 bg-black/20 backdrop-blur-md rounded-md text-[10px] font-bold text-white uppercase tracking-wide border border-white/10">
                   {{ project.genre || 'General' }}
                 </span>
               </div>
            </div>

            <div class="p-6 flex-1 flex flex-col">
              <h3 class="text-xl font-bold text-slate-800 mb-2 font-serif group-hover:text-[#5D7AE6] transition-colors line-clamp-1">
                {{ project.title }}
              </h3>
              <p class="text-slate-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                {{ project.description || 'No description provided for this masterpiece.' }}
              </p>
              
              <div class="mt-auto flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-50">
                <div class="flex items-center space-x-1">
                  <DocumentTextIcon class="w-3.5 h-3.5" />
                  <span>{{ project.word_count?.toLocaleString() }} words</span>
                </div>
                <div class="flex items-center space-x-1">
                  <ClockIcon class="w-3.5 h-3.5" />
                  <span>{{ formatDate(project.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div 
            @click="showCreateModal = true"
            class="group border-2 border-dashed border-slate-300 rounded-2xl h-[280px] flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-[#5D7AE6] hover:bg-indigo-50/50 hover:text-[#5D7AE6] transition-all duration-300"
          >
            <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-white group-hover:shadow-md transition-all">
              <PlusIcon class="w-8 h-8" />
            </div>
            <span class="font-medium">Create New Project</span>
          </div>

        </div>
      </div>
    </main>

    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" @click="showCreateModal = false"></div>
      
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-scaleIn">
        <div class="p-8">
          <h3 class="text-2xl font-bold text-slate-900 font-serif mb-6">Create New Project</h3>
          
          <form @submit.prevent="handleCreate" class="space-y-6">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Title</label>
              <input v-model="newProject.title" type="text" required class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7AE6] focus:border-transparent outline-none transition-all placeholder-slate-300" placeholder="The Clockwork Dynasty" autofocus />
            </div>
            <div class="grid grid-cols-2 gap-4">
               <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Genre</label>
                  <select v-model="newProject.genre" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7AE6] outline-none transition-all appearance-none">
                    <option value="" disabled>Select</option>
                    <option value="Fantasy">Fantasy</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Romance">Romance</option>
                    <option value="Mystery">Mystery</option>
                    <option value="Horror">Horror</option>
                    <option value="Literary">Literary</option>
                  </select>
               </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
              <textarea v-model="newProject.description" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7AE6] outline-none h-32 resize-none transition-all placeholder-slate-300" placeholder="A steampunk thriller set in Neo-Victorian London..."></textarea>
            </div>
            <div class="flex items-center justify-end space-x-3 pt-2">
              <button type="button" @click="showCreateModal = false" class="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Cancel</button>
              <button type="submit" :disabled="!newProject.title || loading" class="px-6 py-2.5 bg-[#5D7AE6] text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-600 hover:shadow-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Create Project
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div v-if="showProfileModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" @click="showProfileModal = false"></div>
      
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-scaleIn">
        <div class="bg-[#0f172a] p-6 text-center relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
            <div class="absolute bottom-0 left-0 w-32 h-32 bg-purple-500 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
            
            <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white shadow-xl border-4 border-slate-800 relative z-10">
              {{ currentUser.username.substring(0, 2).toUpperCase() }}
            </div>
            <h3 class="text-xl font-bold text-white mt-3 font-serif relative z-10">Edit Profile</h3>
        </div>

        <div class="p-8">
          <form @submit.prevent="handleSaveProfile" class="space-y-5">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Author Name (Pen Name)</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon class="h-4 w-4 text-slate-400" />
                </div>
                <input v-model="currentUser.username" type="text" required class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#5D7AE6] outline-none transition-all text-slate-700" />
              </div>
            </div>
            
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
              <input v-model="currentUser.email" type="email" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#5D7AE6] outline-none transition-all text-slate-700" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Short Bio</label>
              <textarea v-model="currentUser.bio" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#5D7AE6] outline-none h-24 resize-none transition-all text-slate-700 text-sm leading-relaxed" placeholder="Tell readers about yourself..."></textarea>
            </div>

            <div class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button type="button" @click="showProfileModal = false" class="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Close</button>
              <button type="submit" :disabled="profileSaving" class="px-5 py-2 bg-[#5D7AE6] text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center">
                <svg v-if="profileSaving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {{ profileSaving ? 'Saving...' : 'Save Profile' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.animate-fadeIn { animation: fadeIn 0.5s ease-out; }
.animate-slideUp { animation: slideUp 0.5s ease-out forwards; opacity: 0; }
.animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }

main::-webkit-scrollbar { width: 8px; }
main::-webkit-scrollbar-track { background: transparent; }
main::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
main::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #cbd5e1; }
</style>