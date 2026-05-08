// src/services/api.ts
import axios from 'axios';


const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.startsWith('/share')) {
        console.warn('Token expired or invalid');
      }
    }
    return Promise.reject(error);
  }
);

const api = {
  get: apiClient.get,
  post: apiClient.post,
  put: apiClient.put,
  delete: apiClient.delete,
  patch: apiClient.patch,

  createShareLink(projectId: number) {
    return apiClient.post('/share/create', { projectId });
  },

  getSharedProject(shareId: string, password?: string) {
    const url = password 
        ? `/share/view/${shareId}?password=${password}` 
        : `/share/view/${shareId}`;
    return apiClient.get(url);
  },

  addShareComment(shareId: string, payload: { docId: number; selectedText: string; content: string; authorName: string; quoteMatchIndex?: number;}) {
    return apiClient.post(`/share/${shareId}/comment`, payload);
  },

  getDocumentComments(docId: number) {
    return apiClient.get(`/share/documents/${docId}/comments`);
  },

  getAllProjectComments(id: string, isVisitor: boolean, password?: string) {
    if (!isVisitor) {
        return apiClient.get(`/share/comments-global?projectId=${id}`);
    } else {
        const url = password 
            ? `/share/${id}/comments?password=${password}` 
            : `/share/${id}/comments`;
        return apiClient.get(url);
    }
  },

  deleteShareComment(commentId: number, authorName: string) {
    return apiClient.delete(`/share/comments/${commentId}`, {
      data: { authorName }
    });
  },

  addAuthorComment(docId: number, data: any) {
      return apiClient.post(`/documents/${docId}/comments`, data);
    },
  
  getCharacters(projectId: string | number) {
      return apiClient.get(`/projects/${projectId}/characters`);
    },
  createCharacter(projectId: string | number, data: any) {
      return apiClient.post(`/projects/${projectId}/characters`, data);
    },
  deleteCharacter(characterId: number) {
      return apiClient.delete(`/projects/characters/${characterId}`);
    },
  
  predictCharacterBehavior(data: any) {
      return apiClient.post('/ai/predict', data);
    }
  };



export default api;