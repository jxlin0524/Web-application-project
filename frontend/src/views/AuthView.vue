<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  ArrowLongRightIcon
} from '@heroicons/vue/24/outline';
import api from '../services/api';
import { AxiosError } from 'axios';

type AuthMode = 'login' | 'register';
type InputMethod = 'email' | 'phone';

const router = useRouter();
const authMode = ref<AuthMode>('login'); 
const inputMethod = ref<InputMethod>('email'); 
const loading = ref(false);
const errorMsg = ref('');

const form = reactive({
  username: '', 
  account: '',  
  email: '',    
  phone: '',    
  password: '',
  agreeTerms: false
});

const showPassword = ref(false);

const isLogin = computed(() => authMode.value === 'login');
const primaryColorClass = 'bg-[#5D7AE6] hover:bg-[#4b63c2] focus:ring-[#5D7AE6]';


const toggleAuthMode = () => {
  authMode.value = authMode.value === 'login' ? 'register' : 'login';
  errorMsg.value = '';
  form.password = ''; 
};

const handleSubmit = async () => {
  errorMsg.value = '';
  
  if (!isLogin.value && !form.agreeTerms) {
    errorMsg.value = "Please agree to the Terms & Conditions.";
    return;
  }

  loading.value = true;

  try {
    if (isLogin.value) {
      const loginIdentifier = inputMethod.value === 'email' ? form.email : form.phone;
      const payload = {
        identifier: loginIdentifier,
        password: form.password
      };
      
      const res = await api.post('/users/login', payload);
      
      localStorage.setItem('token', res.data.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));
      
      router.push('/dashboard');
      
    } else {
      const payload = {
        username: form.username,
        email: inputMethod.value === 'email' ? form.email : undefined,
        phone: inputMethod.value === 'phone' ? form.phone : undefined,
        password: form.password
      };

      await api.post('/users/register', payload);
      
      alert('Account created successfully! Please sign in.');
      toggleAuthMode();
    }
  } catch (err) {
    const axiosError = err as AxiosError<{ message: string }>;
    errorMsg.value = axiosError.response?.data?.message || "Authentication failed. Please check your inputs.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen w-full flex bg-[#f3f4f6] font-sans overflow-hidden">
    
    <div class="hidden lg:flex lg:w-[40%] bg-[#0f172a] relative flex-col justify-between p-12 text-white overflow-hidden">
      <div class="absolute inset-0 z-0 pointer-events-none">
         <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#5D7AE6] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob"></div>
         <div class="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob animation-delay-2000"></div>
         <div class="absolute inset-0 bg-white/5 opacity-10"></div>
      </div>

      <div class="relative z-10">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg bg-[#5D7AE6] flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span class="font-bold text-white text-xl">P</span>
          </div>
          <span class="text-2xl font-bold tracking-wide font-serif">ProsePal</span>
        </div>
      </div>

      <div class="relative z-10 mb-12">
        <h1 class="text-5xl font-serif font-bold leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
          Craft worlds,<br/>
          word by word.
        </h1>
        <p class="text-slate-400 text-lg font-light leading-relaxed max-w-sm">
          Join thousands of authors using AI-assisted tools to organize plots, develop characters, and finish their novels.
        </p>
      </div>

      <div class="relative z-10 text-xs text-slate-500 flex justify-between border-t border-slate-800 pt-6">
        <span>© 2025 ProsePal Inc.</span>
        <div class="space-x-6">
          <a href="#" class="hover:text-white transition-colors">Privacy</a>
          <a href="#" class="hover:text-white transition-colors">Terms</a>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative bg-white lg:rounded-l-[3rem] shadow-[-20px_0_60px_rgba(0,0,0,0.05)] z-20">
      
      <div class="w-full max-w-md space-y-8">
        
        <div class="text-center space-y-6">
          <div class="lg:hidden flex justify-center mb-4">
            <div class="w-12 h-12 rounded-xl bg-[#5D7AE6] flex items-center justify-center shadow-md">
              <span class="font-bold text-white text-2xl">P</span>
            </div>
          </div>

          <div class="flex items-center justify-center bg-slate-100 p-1.5 rounded-2xl w-full max-w-[300px] mx-auto border border-slate-200">
            <button 
              @click="authMode = 'login'"
              class="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300"
              :class="authMode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            >
              Sign In
            </button>
            <button 
              @click="authMode = 'register'"
              class="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300"
              :class="authMode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            >
              Sign Up
            </button>
          </div>
          
          <div class="space-y-2">
            <h2 class="text-3xl font-bold text-slate-900 tracking-tight">
              {{ isLogin ? 'Welcome back' : 'Create an account' }}
            </h2>
            <p class="text-slate-500">
              {{ isLogin ? 'Enter your details to access your workspace.' : 'Start your 14-day free trial today.' }}
            </p>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          
          <div v-if="!isLogin" class="group relative animate-fadeIn">
            <div class="relative">
              <input 
                v-model="form.username"
                type="text" 
                required
                id="username"
                class="peer w-full px-5 pt-6 pb-2 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-[#5D7AE6] focus:bg-white transition-all placeholder-transparent"
                placeholder="Username"
              />
              <label for="username" class="absolute left-5 top-4 text-xs font-bold text-slate-400 uppercase transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-xs peer-focus:font-bold peer-focus:text-[#5D7AE6]">
                Username
              </label>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between px-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {{ inputMethod === 'email' ? 'Email' : 'Phone' }}
              </label>
              <button 
                type="button" 
                @click="inputMethod = inputMethod === 'email' ? 'phone' : 'email'"
                class="text-xs font-semibold text-[#5D7AE6] hover:text-[#4b63c2] hover:underline flex items-center transition-colors"
              >
                <component :is="inputMethod === 'email' ? DevicePhoneMobileIcon : EnvelopeIcon" class="w-3.5 h-3.5 mr-1" />
                <span>Use {{ inputMethod === 'email' ? 'Phone' : 'Email' }}</span>
              </button>
            </div>

            <div v-if="inputMethod === 'email'" class="relative">
              <input 
                v-model="form.email"
                type="email" 
                required
                class="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-[#5D7AE6]/10 focus:border-[#5D7AE6] outline-none transition-all placeholder-slate-400"
                placeholder="name@example.com"
              />
              <EnvelopeIcon class="w-5 h-5 text-slate-400 absolute left-4 top-4" />
            </div>

            <div v-else class="relative flex">
              <div class="flex items-center justify-center px-4 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-600 font-semibold text-sm">
                +86
              </div>
              <input 
                v-model="form.phone"
                type="tel" 
                class="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-r-xl focus:ring-4 focus:ring-[#5D7AE6]/10 focus:border-[#5D7AE6] outline-none transition-all placeholder-slate-400"
                placeholder="138 0000 0000"
              />
            </div>
          </div>

          <div class="space-y-2">
             <div class="flex justify-between px-1">
               <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
             </div>
            <div class="relative">
              <input 
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'" 
                required
                class="w-full pl-5 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-[#5D7AE6]/10 focus:border-[#5D7AE6] outline-none transition-all placeholder-slate-400"
                placeholder="••••••••"
              />
              <button 
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100"
              >
                <component :is="showPassword ? EyeSlashIcon : EyeIcon" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between text-sm pt-1">
            <div v-if="isLogin" class="flex items-center">
               <input type="checkbox" id="remember" class="w-4 h-4 rounded border-slate-300 text-[#5D7AE6] focus:ring-[#5D7AE6] cursor-pointer">
               <label for="remember" class="ml-2 text-slate-600 cursor-pointer select-none">Remember me</label>
            </div>
            <div v-else class="flex items-center">
               <input v-model="form.agreeTerms" type="checkbox" id="terms" class="w-4 h-4 rounded border-slate-300 text-[#5D7AE6] focus:ring-[#5D7AE6] cursor-pointer">
               <label for="terms" class="ml-2 text-slate-600 cursor-pointer select-none">I agree to <span class="text-[#5D7AE6] font-medium hover:underline">Terms</span></label>
            </div>

            <a v-if="isLogin" href="#" class="font-semibold text-[#5D7AE6] hover:text-[#4b63c2] hover:underline">Forgot Password?</a>
          </div>
          
          <div v-if="errorMsg" class="p-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-start animate-pulse border border-red-100">
             <svg class="w-5 h-5 mr-2 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             {{ errorMsg }}
          </div>

          <button 
            type="submit" 
            :disabled="loading"
            class="w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-indigo-200 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 group"
            :class="[primaryColorClass, loading ? 'opacity-70 cursor-not-allowed' : '']"
          >
            <span v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span v-else>
              {{ isLogin ? 'Sign In' : 'Create Account' }}
            </span>
            <ArrowLongRightIcon v-if="!loading" class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div class="pt-6">
          <div class="relative mb-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white text-slate-400 font-medium">Or continue with</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <button class="flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all space-x-2 group">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" class="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google">
              <span class="text-sm font-semibold text-slate-600">Google</span>
            </button>
            <button class="flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all space-x-2 group">
              <img src="https://www.svgrepo.com/show/475647/github-color.svg" class="w-5 h-5 group-hover:scale-110 transition-transform" alt="GitHub">
              <span class="text-sm font-semibold text-slate-600">GitHub</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>