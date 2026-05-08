<script setup lang="ts">
  import { ref, onMounted, watch, computed, nextTick } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { debounce } from 'lodash';
  import { 
    ChevronLeftIcon, 
    PlusIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    ClockIcon,       
    SparklesIcon,                 
    XMarkIcon,       
    TrashIcon,
    PencilSquareIcon,
    ClipboardDocumentIcon,
    UserIcon,
    ShareIcon,            
    ChatBubbleLeftRightIcon,
    GlobeAltIcon, 
    ChatBubbleBottomCenterTextIcon,
    MagnifyingGlassIcon,
    PhotoIcon
  } from '@heroicons/vue/24/outline';
  import api from '../services/api';
  import RichTextToolbar from '../components/RichTextToolbar.vue';
  import { LockClosedIcon } from '@heroicons/vue/24/outline';
  
  const props = defineProps<{ isReadOnly?: boolean }>();

  
  interface Project {
    project_id: number;
    title: string;
  }
  
  interface Document {
    document_id: number;
    title: string;
    content: string;
    updated_at: string;
    isDirty?: boolean; 
  }
  
  interface TimelineEvent {
    id: string | number;
    year: string;
    title: string;
    description: string;
    chapterId: number;
    color?: string;
  }

  interface Comment {
    comment_id: number;
    document_id: number; 
    document_title?: string;
    selected_text: string;
    content: string;
    author_name: string;
    created_at: string;
    quote_match_index?: number;
  }

  interface WorldEntry {
    id: number;
    name: string;
    content: string;
    image_url?: string; 
  }
  
  const route = useRoute();
  const router = useRouter();
  const projectId = computed(() => props.isReadOnly ? null : route.params.id as string);
  
  const project = ref<Project | null>(null);
  const documents = ref<Document[]>([]);
  const activeDocId = ref<number | null>(null);
  
  const editorRef = ref<HTMLDivElement | null>(null);
  const scrollContainerRef = ref<HTMLDivElement | null>(null);

  const saveStatus = ref<'saved' | 'saving' | 'error'>('saved');
  const lastSavedTime = ref<Date | null>(null);
  
  const showDrawer = ref(false);
  const activeDrawerTab = ref<'timeline' | 'polish' | 'comments' | 'world'>('world');
  
  const isGeneratingAI = ref(false);
  const isLoadingTimeline = ref(false);
  const timelineEvents = ref<TimelineEvent[]>([]);
  const targetCharacter = ref(''); 
  
  const polishInput = ref('');
  const polishInstruction = ref('');
  const polishResult = ref('');
  const isPolishing = ref(false);

  const showShareModal = ref(false);
  const shareAccessCode = ref('');
  const shareLink = ref('');
  const comments = ref<Comment[]>([]);
  const showCommentBtn = ref(false);
  const commentBtnPos = ref({ x: 0, y: 0 });
  const currentSelection = ref('');
  const commentContent = ref('');
  const savedRange = ref<Range | null>(null);
  const lostCommentIds = ref<Set<number>>(new Set());
  const guestName = ref(localStorage.getItem('guest_name') || '');
  const currentMatchIndex = ref(0);
  
  const fontFamilies = [
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Arial', value: 'Arial' },
    { label: '宋体', value: 'SimSun' },
    { label: '楷体', value: 'KaiTi' },
    { label: '微软雅黑', value: 'Microsoft YaHei' }
  ];
  const fontSizes = [
    { label: '小五', value: '2' },
    { label: '五号', value: '3' },
    { label: '小四', value: '4' },
    { label: '四号', value: '5' },
    { label: '三号', value: '6' }
  ];
  const colorOptions = ['#1f2937', '#be123c', '#b45309', '#0f766e', '#1d4ed8', '#6b21a8'];
  const highlightOptions = ['#ffffff', '#fef3c7', '#fee2e2', '#dbeafe', '#dcfce7', '#f3e8ff'];
  
  const selectedFontFamily = ref(fontFamilies[0]?.value ?? 'Times New Roman');
  const selectedFontSize = ref(fontSizes[2]?.value ?? '4');
  const selectedColor = ref(colorOptions[0] ?? '#1f2937');
  const selectedHighlight = ref(highlightOptions[0] ?? '#ffffff');
  
  const activeDocument = computed(() => documents.value.find(d => d.document_id === activeDocId.value));
  
  const activeWordCount = computed(() => {
    if (!activeDocument.value?.content) return 0;
    const text = activeDocument.value.content.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
    if (!text) return 0;
    return text.split(/\s+/).length;
  });

  const showPasswordModal = ref(false);
  const accessPassword = ref('');
  const passwordError = ref('');

  const worldEntries = ref<WorldEntry[]>([]);
  const newEntry = ref({ name: '', content: '' });
  const showAddEntryForm = ref(false);
  const editingEntryId = ref<number | null>(null);
  const searchQuery = ref('');
  const filteredEntries = computed(() => {
    if (!searchQuery.value.trim()) {
      return worldEntries.value;
    }
    const query = searchQuery.value.toLowerCase();
    return worldEntries.value.filter(entry => 
      entry.name.toLowerCase().includes(query) || 
      entry.content.toLowerCase().includes(query)
    );
  });

  const consultingEntryId = ref<number | null>(null);
  const consultQuery = ref('');
  const aiConsultResults = ref<Record<number, string>>({});
  const isConsulting = ref(false);
  const aiResponse = ref('');

  const selectedEntryIds = ref<Set<number>>(new Set());
  
  const selectedImageFile = ref<File | null>(null);
  const imagePreviewUrl = ref<string | null>(null);
  const viewingImage = ref<string | null>(null);

  const handleImageSelect = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
          selectedImageFile.value = file;
          imagePreviewUrl.value = URL.createObjectURL(file);
      }
  };

  const removeSelectedImage = () => {
      selectedImageFile.value = null;
      imagePreviewUrl.value = null;
  };
  
  const loadData = async () => {
    try {
      if (props.isReadOnly) {
        const shareId = route.params.shareId as string;
        const res = await api.getSharedProject(shareId, accessPassword.value);
        
        if (res.data.success) {
          project.value = res.data.data.project;
          documents.value = res.data.data.documents;
          showPasswordModal.value = false;
          
          if (documents.value.length > 0) {
            activeDocId.value = documents.value[0]?.document_id ?? null;
          }
          
          if (!guestName.value) {
             setTimeout(() => {
               const name = prompt("Welcome! Please enter your name for comments:", "Guest");
               guestName.value = name || 'Guest';
               localStorage.setItem('guest_name', guestName.value);
             }, 500);
          }
        }
      } else {
        if (!projectId.value) return;
        const [projRes, docRes] = await Promise.all([
          api.get(`/projects/${projectId.value}`),
          api.get(`/projects/${projectId.value}/documents`)
        ]);
        project.value = projRes.data.data.project;
        documents.value = docRes.data.data.documents;
        if (documents.value.length > 0 && !activeDocId.value) {
          activeDocId.value = documents.value[0]?.document_id ?? null;
        }
      }

      await synchronizeEditorContent();
      
    } catch (e: any) {
      if (e.response && e.response.status === 403 && e.response.data.code === 'PASSWORD_REQUIRED') {
          showPasswordModal.value = true;
          passwordError.value = '';
      } else {
          console.error("Failed to load", e);
          if (props.isReadOnly) alert('Invalid link or server error.');
      }
    }
  };
  
  const fetchTimeline = async () => {
    if (props.isReadOnly) return;
    if (!projectId.value) return;
    isLoadingTimeline.value = true;
    try {
      const res = await api.get(`/projects/${projectId.value}/timeline`);
      if (res.data.success) {
        timelineEvents.value = res.data.data;
      }
    } catch (e) {
      console.error('Failed to load timeline', e);
    } finally {
      isLoadingTimeline.value = false;
    }
  };
  
  const saveTimelineToBackend = async (events: TimelineEvent[]) => {
    if (props.isReadOnly || !projectId.value) return;
    try {
      await api.put(`/projects/${projectId.value}/timeline`, { events });
    } catch (e) {
      console.error('Failed to save timeline', e);
    }
  };
  
  const handleTimelineUpdate = () => {
    saveTimelineToBackend(timelineEvents.value);
  };
  
  const openPolishMode = () => {
    showDrawer.value = true;
    activeDrawerTab.value = 'polish';
    
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';
    if (text) {
      polishInput.value = text;
    }
  };
  
  const handlePolishText = async () => {
    if (!polishInput.value.trim()) return;
    isPolishing.value = true;
    polishResult.value = ''; 
    
    try {
      const res = await api.post('/ai/polish', {
        content: polishInput.value,
        instruction: polishInstruction.value
      });
      
      if (res.data.success) {
        polishResult.value = res.data.data;
      }
    } catch (e) {
      alert('Polish failed, please try again.');
    } finally {
      isPolishing.value = false;
    }
  };
  
  const copyPolishResult = () => {
    navigator.clipboard.writeText(polishResult.value);
    alert('Copied result to clipboard!');
  };
  
  const handleCreateChapter = async () => {
    if (props.isReadOnly) return;
    const title = `Chapter ${documents.value.length + 1}`;
    try {
      const res = await api.post(`/projects/${projectId.value}/documents`, { title, content: '' });
      const newDoc = res.data.data.document;
      documents.value.push(newDoc);
      activeDocId.value = newDoc.document_id;
    } catch { alert("Failed to create chapter"); }
  };
  
  const switchChapter = (id: number) => { activeDocId.value = id; };
  
  const performSave = async (doc: Document) => {
    if (!doc || props.isReadOnly) return;
    saveStatus.value = 'saving';
    try {
      await api.put(`/documents/${doc.document_id}`, { title: doc.title, content: doc.content });
      saveStatus.value = 'saved';
      lastSavedTime.value = new Date();
      doc.isDirty = false;
    } catch (e) { saveStatus.value = 'error'; }
  };
  const debouncedSave = debounce(performSave, 2000);
  const handleManualSave = () => { if (activeDocument.value) { debouncedSave.cancel(); performSave(activeDocument.value); }};
  
  const handleEditorInput = () => {
    if (props.isReadOnly) return;
    if (!activeDocument.value || !editorRef.value) return;
    
    activeDocument.value.content = editorRef.value.innerHTML;
    activeDocument.value.isDirty = true;
    saveStatus.value = 'saving';
    debouncedSave(activeDocument.value);
    
    validateCommentsAvailability(); 
  };
  
  const handleTitleInput = () => {
    if (props.isReadOnly) return;
    if (!activeDocument.value) return;
    activeDocument.value.isDirty = true;
    saveStatus.value = 'saving';
    debouncedSave(activeDocument.value);
  };
  
  const focusEditor = () => { editorRef.value?.focus(); };
  const applyFormat = (command: string, value?: string) => {
    if (props.isReadOnly) return;
    focusEditor();
    document.execCommand(command, false, value);
    handleEditorInput();
  };
  
  const handleFontFamilyChange = (font: string) => { selectedFontFamily.value = font; applyFormat('fontName', font); };
  const handleFontSizeChange = (size: string) => { selectedFontSize.value = size; applyFormat('fontSize', size); };
  const handleColorChange = (color: string) => { selectedColor.value = color; applyFormat('foreColor', color); };
  const handleHighlightChange = (color: string) => { selectedHighlight.value = color; applyFormat('hiliteColor', color); };
  const handleToolbarCommand = (payload: { command: string; value?: string }) => applyFormat(payload.command, payload.value);
  
  const synchronizeEditorContent = async () => {
    await nextTick();
    if (editorRef.value) {
        editorRef.value.innerHTML = activeDocument.value?.content || '';
        validateCommentsAvailability(); 
    }
  };
  
  const handleGenerateTimeline = async () => {
    if (props.isReadOnly) return;
    
    const chaptersPayload = documents.value.map(doc => ({
      document_id: doc.document_id,
      title: doc.title,
      content: doc.content.replace(/<[^>]+>/g, '')
    }));
  
    if (chaptersPayload.length === 0) {
      alert("No chapters to analyze.");
      return;
    }
  
    isGeneratingAI.value = true;
    
    try {
      const res = await api.post('/ai/generate-timeline', {
        mode: 'full',
        data: chaptersPayload,
        characterName: targetCharacter.value.trim() 
      });
  
      if (res.data.success) {
        const newEvents = res.data.data.map((evt: any, idx: number): TimelineEvent => {
          let linkedChapterId = Number(evt.chapterId);
          if (isNaN(linkedChapterId)) {
              linkedChapterId = activeDocId.value || 0; 
          }

          return {
            id: Date.now() + idx, 
            year: evt.year || 'Unknown',
            title: evt.title || 'Untitled',
            description: evt.description || '',
            chapterId: linkedChapterId, 
            color: evt.color || 'bg-[#5D7AE6]'
          };
        });
        
        timelineEvents.value = [...timelineEvents.value, ...newEvents];
        showDrawer.value = true;
        activeDrawerTab.value = 'timeline'; 
  
        await saveTimelineToBackend(timelineEvents.value);
  
      } else {
        alert('Generation failed: ' + res.data.message);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to connect to AI service.');
    } finally {
      isGeneratingAI.value = false;
    }
  };
  
  const jumpToChapter = (id: number) => { if (id) switchChapter(id); };
  
  const deleteEvent = async (index: number) => { 
    timelineEvents.value.splice(index, 1);
    await saveTimelineToBackend(timelineEvents.value);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0 && selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        const editorText = editorRef.value?.innerText || '';
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editorRef.value!);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        const preText = preCaretRange.toString();

        const matchIndex = (preText.match(new RegExp(escapeRegExp(text), "g")) || []).length;

        if (rect) {
            showCommentBtn.value = true;
            currentSelection.value = text;
            currentMatchIndex.value = matchIndex; 
            
            commentBtnPos.value = { 
                x: rect.left + (rect.width / 2) - 20, 
                y: rect.top - 50 
            };
        }
    } else {
        setTimeout(() => {
            if (!document.activeElement?.closest('.comment-popup')) {
                 showCommentBtn.value = false;
            }
        }, 200);
    }
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const submitComment = async () => {
      if (!commentContent.value.trim()) return;
      const shareId = route.params.shareId as string;
      if (!activeDocId.value) return;

      try {
        let res;
        let finalAuthorName = '';
        let highlightClass = '';

        if (props.isReadOnly) {
            const shareId = route.params.shareId as string;
            res = await api.addShareComment(shareId, {
                docId: activeDocId.value,
                selectedText: currentSelection.value,
                content: commentContent.value,
                authorName: guestName.value,
                quoteMatchIndex: currentMatchIndex.value
            });
            finalAuthorName = guestName.value;
            highlightClass = 'comment-highlight'; 
        } else {
            res = await api.addAuthorComment(activeDocId.value, {
                selectedText: currentSelection.value,
                content: commentContent.value,
                quoteMatchIndex: currentMatchIndex.value
            });
            finalAuthorName = res.data.authorName; 
            highlightClass = 'author-highlight'; 
        }

        if (res.data.success) {
            const newCommentId = res.data.commentId;

            if (savedRange.value && newCommentId) {
                const span = document.createElement('span');
                span.className = highlightClass; 
                span.setAttribute('data-comment-id', newCommentId.toString());
                span.textContent = savedRange.value.toString();
                
                savedRange.value.deleteContents();
                savedRange.value.insertNode(span);
                
                if (!props.isReadOnly) {
                    handleEditorInput(); 
                }
            }

            commentContent.value = '';
            showCommentBtn.value = false;
            await loadComments();
            showDrawer.value = true;
            activeDrawerTab.value = 'comments';
        }
    } catch (e) {
        alert('Failed to post comment');
    }
  };

  const loadComments = async () => {
      const idToUse = props.isReadOnly ? route.params.shareId : projectId.value;
      if (!idToUse) return;

      try {
          const res = await api.getAllProjectComments(
              idToUse as string, 
              props.isReadOnly, 
              accessPassword.value 
          );
          if (res.data.success) {
              comments.value = res.data.data;
          }
      } catch (e) { 
          console.error('Load comments failed', e); 
      }
  };

  const orphanedCommentIds = ref<Set<number>>(new Set());

  const validateCommentsAvailability = () => {
      if (!editorRef.value || !comments.value.length) return;
      
      const editorText = editorRef.value.innerText || "";
      const newOrphans = new Set<number>();

      comments.value.forEach(comment => {
          if (comment.document_id !== activeDocId.value) return;

          const searchText = comment.selected_text;
          const escapedText = escapeRegExp(searchText);
          const regex = new RegExp(escapedText, "g");
          const matches = (editorText.match(regex) || []).length;

          if (matches === 0 || (comment.quote_match_index !== undefined && matches <= comment.quote_match_index)) {
              newOrphans.add(comment.comment_id);
          }
      });

      orphanedCommentIds.value = newOrphans;
  };

  const handlePasswordSubmit = async () => {
    if (!accessPassword.value) return;
    passwordError.value = ''; 
    try {
      await loadData();
      if (project.value) {
          console.log("🔓 Unlocked! Loading comments...");
          await loadComments();
      }
    } catch (e: any) {
      if (e.response && e.response.status === 403) {
        passwordError.value = 'Invalid access code. Please try again.';
      } else {
        passwordError.value = 'Failed to load project. Please try again.';
      }
    }
  };

  watch(projectId, (newVal) => {
      if (newVal && !props.isReadOnly) {
          loadComments();
      }
  }, { immediate: true });

  watch(activeDocId, async (newId) => {
      if (newId) {
          await synchronizeEditorContent();
          await loadComments();
      }
  });

  watch(activeDrawerTab, (newTab) => {
      if (newTab === 'world' && !props.isReadOnly && projectId.value) {
          loadWorldEntries();
      }
  });

  const generateShareLink = async () => {
      if (!project.value) return;
      try {
          const res = await api.createShareLink(project.value.project_id);
          if (res.data.success) {
              shareLink.value = `${window.location.origin}/share/${res.data.shareId}`;
              shareAccessCode.value = res.data.accessCode;
              showShareModal.value = true;
          }
      } catch (e) {
          alert('Failed to create share link');
      }
  };

  const copyShareLink = () => {
      navigator.clipboard.writeText(shareLink.value);
      alert('Link copied!');
      showShareModal.value = false;
  };

  const jumpToComment = async (comment: Comment) => {
      if (orphanedCommentIds.value.has(comment.comment_id)) {
          alert("⚠️ Cannot locate position: The original text has been modified or deleted by the author.");
          return; 
      }

      if (!comment.document_id) return;

      if (comment.document_id !== activeDocId.value) {
          activeDocId.value = comment.document_id;
          await nextTick();
          await new Promise(resolve => setTimeout(resolve, 100));
          validateCommentsAvailability(); 
          
          if (orphanedCommentIds.value.has(comment.comment_id)) {
              alert("⚠️ The original text in that chapter has been modified.");
              return;
          }
      }

      scrollToCommentPosition(comment);
  };

  const scrollToCommentPosition = (comment: Comment) => {
      if (!editorRef.value || !scrollContainerRef.value || !comment.selected_text) return;

      const targetText = comment.selected_text;
      const targetIndex = comment.quote_match_index || 0;

      const walker = document.createTreeWalker(editorRef.value, NodeFilter.SHOW_TEXT, null);
      let currentNode: Node | null = walker.nextNode();
      let foundCount = 0;

      while (currentNode) {
          const nodeValue = currentNode.nodeValue || '';
          let searchPos = 0;
          
          while (true) {
              const index = nodeValue.indexOf(targetText, searchPos);
              if (index === -1) break;

              if (foundCount === targetIndex) {
                  const range = document.createRange();
                  range.setStart(currentNode, index);
                  range.setEnd(currentNode, index + targetText.length);
                  const selection = window.getSelection();
                  selection?.removeAllRanges();
                  selection?.addRange(range);

                  const rangeRect = range.getBoundingClientRect();
                  const containerRect = scrollContainerRef.value.getBoundingClientRect();
                  const relativeTop = rangeRect.top - containerRect.top;
                  const targetScrollTop = scrollContainerRef.value.scrollTop + relativeTop - (scrollContainerRef.value.clientHeight / 2) + (rangeRect.height / 2);

                  scrollContainerRef.value.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
                  
                  if (!showDrawer.value) {
                      showDrawer.value = true;
                      activeDrawerTab.value = 'comments';
                  }
                  return;
              }
              foundCount++;
              searchPos = index + 1;
          }
          currentNode = walker.nextNode();
      }
      console.warn('Comment target not found.');
  };

  const handleDeleteComment = async (commentId: number, author: string) => {
    if (!confirm('Delete this comment?')) return;
    
    if (author !== guestName.value) {
        alert("You can only delete your own comments.");
        return;
    }

    try {
        const res = await api.deleteShareComment(commentId, guestName.value);
        if (res.data.success) {
            comments.value = comments.value.filter(c => c.comment_id !== commentId);
        }
    } catch (e) {
        alert('Failed to delete. verify you are the author.');
    }
  };

  const toggleDrawer = () => {
    if (showDrawer.value) {
      showDrawer.value = false;
    } else {
      showDrawer.value = true;
      if (props.isReadOnly) {
        activeDrawerTab.value = 'comments';
      }
    }
  };

  const loadWorldEntries = async () => {
      if (props.isReadOnly || !projectId.value) return;
      try {
          const res = await api.get(`/projects/${projectId.value}/world-entries`); 
          if (res.data.success) {
              worldEntries.value = res.data.data;
          }
      } catch (e) { console.error("Failed to load world entries", e); }
  };

  const handleDeleteEntry = async (id: number) => {
      if(!confirm("Delete this entry?")) return;
      try {
          await api.delete(`/projects/world-entries/${id}`);
          worldEntries.value = worldEntries.value.filter(e => e.id !== id);
      } catch(e) { alert("Delete failed"); }
  };

  const toggleSelection = (id: number) => {
      if (selectedEntryIds.value.has(id)) {
          selectedEntryIds.value.delete(id);
      } else {
          selectedEntryIds.value.add(id);
      }
      selectedEntryIds.value = new Set(selectedEntryIds.value);
  };

  const handleGlobalConsultAI = async () => {
      if (!consultQuery.value.trim()) return;
      
      let targetEntries: { name: string, content: string }[] = [];

      if (selectedEntryIds.value.size > 0) {
          targetEntries = worldEntries.value
              .filter(e => selectedEntryIds.value.has(e.id))
              .map(e => ({ name: e.name, content: e.content }));
      } else if (editingEntryId.value) {
          targetEntries = [{ name: newEntry.value.name, content: newEntry.value.content }];
      } else {
          alert("Please select at least one entry (checkbox) to ask AI.");
          return;
      }

      isConsulting.value = true;
      
      const fullContext = documents.value
          .map(doc => `【${doc.title || 'Untitled Chapter'}】\n${doc.content.replace(/<[^>]+>/g, ' ')}`)
          .join('\n\n');

      try {
          const res = await api.post('/ai/consult-entry', {
              entries: targetEntries, 
              userQuery: consultQuery.value,
              currentContext: fullContext 
          });
          
          if (res.data.success) {
              aiResponse.value = res.data.data;
          }
      } catch (e) {
          alert("AI is busy.");
      } finally {
          isConsulting.value = false;
      }
  };

  const selectedCount = computed(() => selectedEntryIds.value.size);

  const getFullImageUrl = (path?: string) => {
      if (!path) return null;
      const env = (import.meta as any).env;
      const apiBaseUrl = env?.VITE_API_BASE_URL || env?.VITE_API_URL || 'http://localhost:3000/api';
      const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
      return `http://localhost:3000${path}`;
  };

  const resetForm = () => {
      newEntry.value = { name: '', content: '' };
      editingEntryId.value = null;
      showAddEntryForm.value = false;
      aiResponse.value = '';
      removeSelectedImage(); 
  };

  const handleEditEntry = (entry: WorldEntry) => {
      newEntry.value = { name: entry.name, content: entry.content }; 
      editingEntryId.value = entry.id; 
      showAddEntryForm.value = true; 
      aiResponse.value = ''; 
      
      selectedImageFile.value = null;
      imagePreviewUrl.value = getFullImageUrl(entry.image_url); 
  };

  const handleSaveEntry = async () => {
      if (!newEntry.value.name) return alert("Name is required");
      if (!projectId.value) return;

      const formData = new FormData();
      formData.append('name', newEntry.value.name);
      formData.append('content', newEntry.value.content);
      if (selectedImageFile.value) {
          formData.append('image', selectedImageFile.value);
      }

      const config = {
          headers: {
              'Content-Type': 'multipart/form-data'
          }
      };

      try {
          if (editingEntryId.value) {
              await api.put(`/projects/world-entries/${editingEntryId.value}`, formData, config);
          } else {
              await api.post(`/projects/${projectId.value}/world-entries`, formData, config);
          }
          
          await loadWorldEntries(); 
          resetForm();
          
      } catch (e: any) { 
          alert("Failed to save entry"); 
          console.error(e.response || e);
      }
  };
    
  onMounted(async () => {
      await loadData();
      await fetchTimeline();
      await loadWorldEntries(); 
  });
  </script>
  
  <template>
    <div 
      class="flex h-screen bg-[#f9fafb] overflow-hidden font-sans relative"
      @mouseup="handleTextSelection"
    >
      
      <aside class="w-72 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 z-20">
        <div class="p-6 pb-2">
          <button v-if="!isReadOnly" @click="router.push('/dashboard')" class="flex items-center text-xs text-slate-400 hover:text-[#5D7AE6] transition-colors mb-4 group">
            <ChevronLeftIcon class="w-3 h-3 mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Projects
          </button>
          
          <h1 class="text-xl font-bold text-slate-800 font-serif leading-tight truncate">
              {{ project?.title || 'Loading...' }}
              <span v-if="isReadOnly" class="text-xs font-sans font-normal text-slate-400 block mt-1">(Read Only Mode)</span>
          </h1>
          <p class="text-xs text-slate-400 mt-1">{{ documents.length }} Chapters</p>
        </div>
        
        <div class="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          <div v-for="(doc, index) in documents" :key="doc.document_id" @click="switchChapter(doc.document_id)" class="group cursor-pointer rounded-lg transition-all duration-200 p-3 border" :class="[activeDocId === doc.document_id ? 'bg-white border-slate-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-100']">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-bold uppercase tracking-wider" :class="activeDocId === doc.document_id ? 'text-[#5D7AE6]' : 'text-slate-400'">Chapter {{ index + 1 }}</span>
              <span v-if="activeDocId === doc.document_id" class="w-1.5 h-1.5 rounded-full bg-[#5D7AE6]"></span>
            </div>
            <div class="text-sm font-medium truncate" :class="activeDocId === doc.document_id ? 'text-slate-800' : 'text-slate-600'">{{ doc.title || 'Untitled Chapter' }}</div>
          </div>
        </div>
        
        <div v-if="!isReadOnly" class="p-4 border-t border-slate-200 bg-slate-50">
          <button @click="handleCreateChapter" class="w-full flex items-center justify-center py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-[#5D7AE6] hover:text-[#5D7AE6] hover:bg-indigo-50/50 transition-all font-medium text-sm">
            <PlusIcon class="w-4 h-4 mr-2" /> New Chapter
          </button>
        </div>
      </aside>
  
      <main class="flex-1 flex flex-col relative min-w-0 bg-[#f9fafb] transition-all duration-300" :class="{'mr-96': showDrawer}">
        
        <header class="h-16 px-8 flex items-center justify-between shrink-0 bg-[#f9fafb]">
          <div class="flex items-center space-x-2">
            <div v-if="isReadOnly" class="flex items-center text-slate-500 text-sm">
                <UserIcon class="w-4 h-4 mr-1.5"/> Hello, {{ guestName }}
            </div>
            <template v-else>
                <div v-if="saveStatus === 'saved'" class="flex items-center text-emerald-600 text-sm animate-fadeIn">
                <CheckCircleIcon class="w-4 h-4 mr-1.5" /> <span>Saved</span>
                </div>
                <div v-else-if="saveStatus === 'saving'" class="flex items-center text-slate-400 text-sm">
                <ArrowPathIcon class="w-4 h-4 mr-1.5 animate-spin" /> <span>Saving...</span>
                </div>
                <div v-else class="flex items-center text-red-500 text-sm"><span>Unsaved Changes</span></div>
            </template>
          </div>
  
          <div class="flex items-center space-x-3">
            
            <button v-if="!isReadOnly" @click="generateShareLink" class="p-2 text-slate-400 hover:text-[#5D7AE6] transition-colors rounded-lg hover:bg-indigo-50" title="Share Project">
               <ShareIcon class="w-5 h-5" />
            </button>

            <button v-if="!isReadOnly" @click="handleManualSave" class="p-2 text-slate-400 hover:text-[#5D7AE6] transition-colors rounded-lg hover:bg-indigo-50" title="Save Now">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 21h-15a2.25 2.25 0 01-2.25-2.25v-13.5A2.25 2.25 0 014.5 3h11.25l4.5 4.5v11.25a2.25 2.25 0 01-2.25 2.25z" /><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 21v-6a2.25 2.25 0 00-2.25-2.25H9.75A2.25 2.25 0 007.5 15v6" /><path stroke-linecap="round" stroke-linejoin="round" d="M9 3v4.5a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75V3" /></svg>
            </button>
            
            <div v-if="!isReadOnly" class="h-5 w-px bg-slate-200"></div>
  
            <button v-if="!isReadOnly" @click="() => { showDrawer = true; activeDrawerTab = 'world'; }" class="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-slate-500 hover:text-[#5D7AE6] hover:bg-indigo-50 transition-colors text-sm font-medium" title="World Bible">
                <GlobeAltIcon class="w-5 h-5" />
                <span class="hidden xl:inline">World Bible</span>
            </button>
  
            <button 
              @click="toggleDrawer"
              :class="showDrawer ? 'bg-[#5D7AE6] text-white shadow-md' : 'text-slate-500 hover:text-[#5D7AE6] hover:bg-indigo-50'"
              class="flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all text-sm font-medium"
            >
              <ClockIcon v-if="!isReadOnly" class="w-5 h-5" />
              <ChatBubbleLeftRightIcon v-else class="w-5 h-5" />
              <span>{{ isReadOnly ? 'Comments' : 'AI Assistant' }}</span>
            </button>
          </div>
        </header>
  
        <div v-if="activeDocument && !isReadOnly" class="shrink-0 bg-[#f9fafb] border-b border-slate-200">
          <div class="px-8 py-3">
            <div class="max-w-[900px] mx-auto">
              <RichTextToolbar
                :font-families="fontFamilies"
                :font-sizes="fontSizes"
                :selected-font-family="selectedFontFamily"
                :selected-font-size="selectedFontSize"
                :selected-color="selectedColor"
                :selected-highlight="selectedHighlight"
                @font-family-change="handleFontFamilyChange"
                @font-size-change="handleFontSizeChange"
                @color-change="handleColorChange"
                @highlight-change="handleHighlightChange"
                @command="handleToolbarCommand"
              />
            </div>
          </div>
        </div>
  
        <div 
          ref="scrollContainerRef"
          class="flex-1 overflow-y-auto px-8 pb-20 scroll-smooth"
        >
          <div v-if="activeDocument">
            <div class="max-w-[900px] mx-auto mt-8">
              <div class="bg-white shadow-sm border border-slate-100 rounded-lg transition-all duration-300 relative">
                
                <div class="px-12 pt-12 pb-4">
                  <input 
                    v-model="activeDocument.title" 
                    @input="handleTitleInput" 
                    :disabled="isReadOnly"
                    type="text" 
                    class="w-full text-4xl font-serif font-bold text-slate-800 placeholder-slate-300 border-none outline-none focus:ring-0 bg-transparent disabled:cursor-default" 
                    placeholder="Chapter Title" 
                  />
                </div>
  
                <div 
                  ref="editorRef"
                  class="px-12 py-8 min-h-[60vh] text-lg leading-relaxed text-slate-700 font-serif focus:outline-none"
                  :contenteditable="!isReadOnly"
                  spellcheck="false"
                  @input="handleEditorInput"
                ></div>

                <div 
                    v-if="showCommentBtn"
                    :style="{ top: commentBtnPos.y + 'px', left: commentBtnPos.x + 'px' }"
                    class="fixed z-50 bg-white shadow-xl rounded-lg border border-slate-200 p-3 w-64 comment-popup animate-fadeIn"
                >
                    <div class="text-[10px] text-slate-400 uppercase font-bold mb-1">Add Comment</div>
                    <div class="text-xs text-slate-500 italic mb-2 border-l-2 border-slate-200 pl-2 truncate">"{{ currentSelection }}"</div>
                    <textarea 
                        v-model="commentContent"
                        class="w-full text-xs p-2 border border-slate-200 rounded mb-2 outline-none focus:border-[#5D7AE6]"
                        rows="2"
                        placeholder="What's your suggestion?"
                    ></textarea>
                    <div class="flex justify-end">
                        <button @click="submitComment" class="bg-[#5D7AE6] text-white text-xs px-3 py-1.5 rounded hover:bg-indigo-600">Post</button>
                    </div>
                </div>

              </div>
              <div class="mt-4 text-center text-xs text-slate-400 font-medium uppercase tracking-widest">{{ activeWordCount }} words</div>
            </div>
          </div>
          <div v-else class="h-full flex flex-col items-center justify-center text-slate-400">
             <p v-if="isReadOnly">No chapter selected.</p>
             <div v-else>
                <p class="mb-4">Select a chapter to start writing</p>
                <button @click="handleCreateChapter" class="text-[#5D7AE6] hover:underline">Create your first chapter</button>
             </div>
          </div>
        </div>
      </main>
  
      <div 
        class="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 z-50 flex flex-col border-l border-slate-100"
        :class="showDrawer ? 'translate-x-0' : 'translate-x-full'"
      >
        <div class="border-b border-slate-100 bg-white shrink-0">
          <div class="flex items-center justify-between p-4 pb-0">
            <h3 class="font-serif font-bold text-lg text-slate-800 flex items-center">
              {{ isReadOnly ? 'Comments' : 'AI Assistant' }}
            </h3>
            <button @click="showDrawer = false" class="text-slate-400 hover:bg-slate-100 rounded-full p-1 hover:bg-slate-100">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
  
          <div class="flex mt-3 px-4 space-x-6">
            <button v-if="!isReadOnly" @click="activeDrawerTab = 'timeline'" class="pb-3 text-sm font-medium border-b-2 transition-colors" :class="activeDrawerTab === 'timeline' ? 'border-[#5D7AE6] text-[#5D7AE6]' : 'border-transparent text-slate-500 hover:text-slate-700'">Timeline</button>
            <button v-if="!isReadOnly" @click="activeDrawerTab = 'polish'" class="pb-3 text-sm font-medium border-b-2 transition-colors" :class="activeDrawerTab === 'polish' ? 'border-[#5D7AE6] text-[#5D7AE6]' : 'border-transparent text-slate-500 hover:text-slate-700'">Polish</button>
            <button v-if="!isReadOnly" @click="activeDrawerTab = 'world'" class="pb-3 text-sm font-medium border-b-2 transition-colors" :class="activeDrawerTab === 'world' ? 'border-[#5D7AE6] text-[#5D7AE6]' : 'border-transparent text-slate-500 hover:text-slate-700'">World</button>
            <button @click="activeDrawerTab = 'comments'" class="pb-3 text-sm font-medium border-b-2 transition-colors" :class="activeDrawerTab === 'comments' ? 'border-[#5D7AE6] text-[#5D7AE6]' : 'border-transparent text-slate-500 hover:text-slate-700'">Comments</button>
          </div>
        </div>
  
        <div class="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
          
          <div v-if="activeDrawerTab === 'timeline'" class="flex flex-col h-full">
            <div class="p-4 bg-white border-b border-slate-100 flex flex-col space-y-3 shrink-0">
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserIcon class="h-4 w-4 text-slate-400" /></div>
                <input v-model="targetCharacter" type="text" class="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#5D7AE6] focus:border-[#5D7AE6] sm:text-xs transition-colors" placeholder="Filter by Character (Optional)" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <button @click="handleGenerateTimeline" :disabled="isGeneratingAI" class="flex items-center justify-center space-x-1 bg-[#5D7AE6] text-white py-2 rounded-lg text-sm hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-sm">
                  <SparklesIcon v-if="!isGeneratingAI" class="w-4 h-4" /><ArrowPathIcon v-else class="w-4 h-4 animate-spin" /><span>{{ isGeneratingAI ? 'Thinking...' : (targetCharacter ? 'Character Arc' : 'Generate') }}</span>
                </button>
                <button @click="openPolishMode" class="flex items-center justify-center space-x-1 bg-white border border-slate-200 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-50 transition-all"><PencilSquareIcon class="w-4 h-4" /><span>Go Polish</span></button>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto p-4 space-y-4">
               <div v-if="isLoadingTimeline" class="flex flex-col items-center justify-center pt-20 space-y-3 text-slate-400"><ArrowPathIcon class="w-6 h-6 animate-spin text-[#5D7AE6]" /><span class="text-sm">Loading timeline...</span></div>
               <div v-else-if="timelineEvents.length === 0" class="text-center p-8 text-slate-400 text-sm">No events yet. Use "Generate" or "Mark Event".</div>
               <div v-for="(evt, idx) in timelineEvents" :key="evt.id" class="bg-white p-3 rounded-lg shadow-sm border border-slate-100 group hover:border-indigo-200 transition-all">
                  <input v-model="evt.year" @change="handleTimelineUpdate" class="text-xs font-bold text-[#5D7AE6] w-full outline-none mb-1 uppercase tracking-wider bg-transparent" placeholder="TIME" />
                  <input v-model="evt.title" @change="handleTimelineUpdate" class="font-bold text-slate-800 w-full outline-none text-sm bg-transparent" placeholder="Event Title" />
                  <textarea v-model="evt.description" @change="handleTimelineUpdate" class="text-xs text-slate-500 w-full outline-none resize-none bg-transparent mt-1 leading-relaxed" rows="2" placeholder="Description..."></textarea>
                  <div class="flex justify-between items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span class="text-[10px] text-slate-300 cursor-pointer hover:text-[#5D7AE6]" @click="jumpToChapter(evt.chapterId)">Jump to chapter</span>
                      <button @click="deleteEvent(idx)" class="text-slate-300 hover:text-red-500 p-1 rounded hover:bg-red-50"><TrashIcon class="w-3.5 h-3.5"/></button>
                  </div>
               </div>
            </div>
          </div>
  
          <div v-else-if="activeDrawerTab === 'polish'" class="flex flex-col h-full p-4 space-y-4">
             <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col shrink-0">
              <label class="text-xs font-bold text-slate-400 uppercase mb-2">Original Text</label>
              <textarea v-model="polishInput" class="w-full text-sm text-slate-700 placeholder-slate-300 outline-none resize-none h-32 bg-slate-50 p-2 rounded-lg border-transparent focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" placeholder="Paste content here or select text in editor..."></textarea>
              <label class="text-xs font-bold text-slate-400 uppercase mt-4 mb-2">Requirement (Optional)</label>
              <input v-model="polishInstruction" type="text" class="w-full text-sm text-slate-700 placeholder-slate-300 outline-none bg-slate-50 p-2 rounded-lg border-transparent focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" placeholder="e.g. Make it sad, Translate to English, Fix grammar..." />
              <div class="mt-3 flex justify-end">
                <button @click="handlePolishText" :disabled="isPolishing || !polishInput" class="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50 transition-all">
                  <SparklesIcon v-if="!isPolishing" class="w-4 h-4" /><ArrowPathIcon v-else class="w-4 h-4 animate-spin" /><span>{{ isPolishing ? 'Polishing...' : 'Polish Now' }}</span>
                </button>
              </div>
            </div>
            <div class="flex-1 bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-0 overflow-hidden">
              <div class="flex justify-between items-center mb-2">
                <label class="text-xs font-bold text-slate-400 uppercase">Polished Result</label>
                <button v-if="polishResult" @click="copyPolishResult" class="text-xs flex items-center text-blue-500 hover:text-blue-700 font-medium"><ClipboardDocumentIcon class="w-3 h-3 mr-1"/> Copy</button>
              </div>
              <div class="flex-1 overflow-y-auto bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                <span v-if="!polishResult && !isPolishing" class="text-slate-400 italic">Result will appear here...</span>
                <span v-else-if="isPolishing" class="text-slate-400 flex items-center"><ArrowPathIcon class="w-4 h-4 animate-spin mr-2"/>AI is writing...</span>
                <span v-else>{{ polishResult }}</span>
              </div>
            </div>
          </div>

          <div v-if="activeDrawerTab === 'world'" class="flex flex-col h-full bg-slate-50 relative">
              <div class="p-4 bg-white border-b border-slate-100 shrink-0 space-y-3 shadow-sm z-10">
                
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-xs font-bold uppercase tracking-wider" :class="editingEntryId ? 'text-indigo-600' : 'text-slate-400'">
                      {{ editingEntryId ? '✏️ Editing Entry' : '✨ Create New Entry' }}
                  </h3>
                  <button v-if="editingEntryId || showAddEntryForm" @click="resetForm" class="text-[10px] text-slate-400 hover:text-slate-600 underline">
                      Cancel / Clear
                  </button>
                </div>

                <div v-if="showAddEntryForm || editingEntryId" class="space-y-3 animate-fadeIn">
                  <input 
                    v-model="newEntry.name" 
                    type="text" 
                    class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2 outline-none focus:border-[#5D7AE6] focus:bg-white font-bold transition-all"
                    placeholder="Title (e.g. The Magic Sword)"
                  />
                  <textarea 
                    v-model="newEntry.content" 
                    rows="5"
                    class="w-full bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-lg px-3 py-2 outline-none focus:border-[#5D7AE6] focus:bg-white resize-none leading-relaxed transition-all"
                    placeholder="Details, history, rules..."
                  ></textarea>

                  <div class="flex items-center space-x-4">
                      <div v-if="imagePreviewUrl" class="relative w-16 h-16 rounded-lg border border-slate-200 overflow-hidden shrink-0 group">
                          <img :src="imagePreviewUrl" class="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" @click="viewingImage = imagePreviewUrl" title="Click to view full size" />
                          <button @click="removeSelectedImage" class="absolute top-0 right-0 bg-black/60 hover:bg-red-500 text-white p-1 rounded-bl-lg transition-colors" title="Remove Image">
                              <XMarkIcon class="w-3 h-3" />
                          </button>
                      </div>
                      
                      <label class="flex items-center justify-center px-4 py-2 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-500 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all w-full">
                          <PhotoIcon class="w-4 h-4 mr-2" />
                          {{ imagePreviewUrl ? 'Change Image' : 'Upload Image' }}
                          <input type="file" accept="image/*" class="hidden" @change="handleImageSelect" />
                      </label>
                  </div>
                  
                  <button 
                      @click="handleSaveEntry" 
                      class="w-full py-2 text-white rounded-lg text-xs font-bold shadow-md transition-all flex justify-center items-center"
                      :class="editingEntryId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#5D7AE6] hover:bg-blue-600'"
                  >
                      <span v-if="editingEntryId">Update Entry</span>
                      <span v-else>Save New Entry</span>
                  </button>
                </div>

                <button 
                  v-else 
                  @click="showAddEntryForm = true"
                  class="w-full py-2.5 bg-white border border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-[#5D7AE6] hover:text-[#5D7AE6] transition-all text-sm font-medium"
                >
                  + Add New Entry
                </button>

                <div class="relative mt-2">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon class="h-4 w-4 text-slate-400" />
                  </div>
                  <input 
                      v-model="searchQuery" 
                      type="text" 
                      class="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#5D7AE6] sm:text-xs transition-colors" 
                      placeholder="Search your world..." 
                  />
                </div>
              </div>
              
              <div class="flex-1 overflow-y-auto p-4 space-y-3 pb-32"> 
                
                <div v-if="filteredEntries.length === 0" class="text-center text-slate-400 text-sm py-10">
                    <span v-if="searchQuery">No results.</span>
                    <span v-else>List is empty.</span>
                </div>

                <div 
                  v-for="entry in filteredEntries" 
                  :key="entry.id"
                  class="p-4 rounded-xl border shadow-sm transition-all relative flex gap-3 group"
                  :class="[
                      selectedEntryIds.has(entry.id) ? 'border-indigo-400 bg-indigo-50/50' : 'bg-white border-slate-200',
                      editingEntryId === entry.id ? 'ring-2 ring-indigo-500 ring-offset-2' : 'hover:border-indigo-300'
                  ]"
                >
                    <div class="flex flex-col justify-start pt-1">
                      <input 
                          type="checkbox" 
                          :checked="selectedEntryIds.has(entry.id)"
                          @change="toggleSelection(entry.id)"
                          @click.stop 
                          class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    <div class="flex-1 cursor-pointer min-w-0" @click="handleEditEntry(entry)">
                        <div class="flex items-center justify-between mb-2">
                          <h4 class="font-bold text-base flex items-center truncate" :class="editingEntryId === entry.id ? 'text-indigo-700' : 'text-slate-800'">
                              <GlobeAltIcon class="w-4 h-4 mr-1.5 shrink-0" :class="editingEntryId === entry.id ? 'text-indigo-500' : 'text-slate-400'"/> 
                              {{ entry.name }}
                          </h4>
                          <button @click.stop="handleDeleteEntry(entry.id)" class="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 p-1 transition-opacity">
                              <TrashIcon class="w-4 h-4"/>
                          </button>
                        </div>

                        <div v-if="entry.image_url" class="mb-2 rounded-lg overflow-hidden border border-slate-100 max-h-32 relative group/img">
                           <img :src="getFullImageUrl(entry.image_url)!" class="w-full object-cover cursor-pointer" />
                           <div class="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors cursor-pointer" @click.stop="viewingImage = getFullImageUrl(entry.image_url)" title="Click to view full size"></div>
                        </div>
                        
                        <div class="text-xs text-slate-500 leading-relaxed line-clamp-2 font-serif">
                          {{ entry.content }}
                        </div>
                    </div>
                </div>
              </div>

              <div class="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                  <div v-if="aiResponse" class="mb-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100 max-h-40 overflow-y-auto text-xs text-slate-700 leading-relaxed relative animate-slideUp">
                      <button @click="aiResponse = ''" class="absolute top-1 right-2 text-slate-400 hover:text-slate-600">×</button>
                      <span class="font-bold text-indigo-500 block mb-1">AI Suggestion:</span>
                      {{ aiResponse }}
                  </div>

                  <div class="flex items-end gap-2">
                      <div class="flex-1 relative">
                          <textarea 
                              v-model="consultQuery"
                              :placeholder="selectedCount > 0 
                                  ? `Ask AI about ${selectedCount} selected entries (e.g. How do they interact?)...` 
                                  : (editingEntryId ? `Ask AI about '${newEntry.name}'...` : 'Select entries (checkbox) to combine them in AI...')"
                              class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs focus:outline-none focus:border-[#5D7AE6] focus:bg-white transition-all resize-none leading-relaxed"
                              rows="3"
                              @keydown.enter.prevent="handleGlobalConsultAI"
                          ></textarea>
                          <SparklesIcon class="w-4 h-4 text-slate-400 absolute right-2 top-2.5" />
                      </div>
                      
                      <button 
                          @click="handleGlobalConsultAI"
                          :disabled="isConsulting"
                          class="bg-[#5D7AE6] text-white p-3 rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm mb-[1px]"
                          title="Send to AI"
                      >
                          <ArrowPathIcon v-if="isConsulting" class="w-5 h-5 animate-spin" />
                          <ChatBubbleBottomCenterTextIcon v-else class="w-5 h-5" />
                      </button>
                  </div>
              </div>

          </div>

          <div v-else-if="activeDrawerTab === 'comments'" class="flex flex-col h-full p-4 space-y-3">
             <div v-if="comments.length === 0" class="text-center text-slate-400 text-sm py-10">
                No comments yet. 
                <span v-if="isReadOnly">Select text to add one.</span>
             </div>
             
             <div v-for="comment in comments" :key="comment.comment_id" @click="jumpToComment(comment)" 
                class="p-3 rounded-lg border shadow-sm flex flex-col group relative cursor-pointer transition-all duration-200"
                :class="{
                      'bg-gray-100 border-gray-200 text-gray-400 grayscale': orphanedCommentIds.has(comment.comment_id),
                      'border-red-300 bg-red-50': !orphanedCommentIds.has(comment.comment_id) && lostCommentIds.has(comment.comment_id), 
                      'bg-green-50 border-green-200 hover:border-green-400': !orphanedCommentIds.has(comment.comment_id) && !lostCommentIds.has(comment.comment_id) && comment.author_name !== guestName && !props.isReadOnly, 
                      'bg-white border-slate-200 hover:border-[#5D7AE6]': !orphanedCommentIds.has(comment.comment_id) && !lostCommentIds.has(comment.comment_id) && (comment.author_name === guestName || props.isReadOnly)
                  }">
                
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold flex items-center" :class="orphanedCommentIds.has(comment.comment_id) ? 'text-gray-400' : 'text-slate-700'">
                        {{ comment.author_name }}
                        <span v-if="comment.author_name === guestName" class="ml-2 text-[10px] px-1 rounded" :class="orphanedCommentIds.has(comment.comment_id) ? 'bg-gray-200 text-gray-500' : 'bg-slate-100 text-slate-400'">YOU</span>
                    </span>
                    <span class="text-[10px] px-1.5 py-0.5 rounded border" :class="orphanedCommentIds.has(comment.comment_id) ? 'bg-gray-200 text-gray-400 border-gray-200' : 'text-slate-400 bg-slate-50 border-slate-100'">
                        {{ comment.document_title || 'Chapter ' + comment.document_id }}
                    </span>
                </div>

                <div v-if="orphanedCommentIds.has(comment.comment_id)" class="text-[10px] text-gray-400 font-medium mb-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 mr-1">
                      <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                    </svg>
                    Original text modified
                </div>

                <button 
                    v-if="comment.author_name === guestName"
                    @click.stop="handleDeleteComment(comment.comment_id, comment.author_name)"
                    class="absolute top-3 right-3 transition-colors opacity-0 group-hover:opacity-100"
                    :class="orphanedCommentIds.has(comment.comment_id) ? 'text-gray-400 hover:text-gray-600' : 'text-slate-300 hover:text-red-500'"
                    title="Delete Comment"
                >
                    <TrashIcon class="w-4 h-4" />
                </button>

                <div 
                    class="text-xs p-2 rounded mb-2 border-l-2 italic truncate transition-colors duration-200"
                    :class="[
                        orphanedCommentIds.has(comment.comment_id) 
                            ? 'bg-gray-50 text-gray-400 border-gray-300 decoration-line-through' 
                            : (comment.author_name === guestName ? 'bg-yellow-50 text-slate-600 border-yellow-300' : 'bg-green-50 text-green-700 border-green-300')
                    ]"
                >
                    "{{ comment.selected_text }}"
                </div>

                <div class="text-sm leading-relaxed whitespace-pre-wrap" :class="orphanedCommentIds.has(comment.comment_id) ? 'text-gray-400' : 'text-slate-800'">
                    {{ comment.content }}
                </div>
            </div>
          </div>
  
        </div>
      </div>

      <div 
        v-if="viewingImage" 
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm cursor-zoom-out animate-fadeIn"
        @click="viewingImage = null"
        title="Click anywhere to close"
      >
          <img :src="viewingImage" class="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default" @click.stop />
          <button 
              @click="viewingImage = null" 
              class="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-all"
          >
              <XMarkIcon class="w-6 h-6" />
          </button>
      </div>

      <div 
        v-if="showShareModal" 
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm"
        @click.self="showShareModal = false"
      >
         <div class="bg-white rounded-xl shadow-2xl p-6 w-96 border border-slate-100" @click.stop>
             <h3 class="text-lg font-bold text-slate-800 mb-2">Share Project</h3>
             <p class="text-sm text-slate-500 mb-4">Anyone with this link can view and comment on this project.</p>
             <div class="flex items-center space-x-2 bg-slate-50 p-2 rounded border border-slate-200 mb-4">
                 <div class="flex-1 text-xs text-slate-600 truncate">{{ shareLink }}</div>
                 <button @click="copyShareLink" class="text-[#5D7AE6] hover:text-indigo-700 font-bold text-xs whitespace-nowrap">Copy Link</button>
             </div>
             <div v-if="shareAccessCode" class="mb-4 text-center">
                <p class="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Access Code</p>
                <div class="text-3xl font-mono font-bold text-slate-800 tracking-[0.2em] bg-yellow-50 border border-yellow-200 rounded-lg py-2 select-all">{{ shareAccessCode }}</div>
                <p class="text-xs text-slate-400 mt-1">Don't forget to send this code to your editor!</p>
            </div>
             <button @click="showShareModal = false" class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors">Close</button>
         </div>
      </div>

      <div 
        v-if="showPasswordModal" 
        class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-md"
        @click.self="showPasswordModal = false"
      >
        <div class="bg-white rounded-xl shadow-2xl p-8 w-96 text-center" @click.stop>
            <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LockClosedIcon class="w-6 h-6 text-slate-500" />
            </div>
            <h2 class="text-xl font-bold text-slate-800 mb-2">Private Project</h2>
            <p class="text-sm text-slate-500 mb-6">This document is password protected. Please enter the access code.</p>
            <div v-if="passwordError" class="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-600">{{ passwordError }}</p>
            </div>
            <input 
                v-model="accessPassword" 
                type="text" 
                maxlength="6"
                class="w-full text-center text-2xl font-mono tracking-widest border-2 border-slate-200 rounded-lg py-3 mb-4 focus:border-[#5D7AE6] outline-none"
                placeholder="0000"
                @keyup.enter="handlePasswordSubmit"
            />
            <div class="flex space-x-3">
                <button @click="showPasswordModal = false" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-colors">Cancel</button>
                <button @click="handlePasswordSubmit" class="flex-1 py-3 bg-[#5D7AE6] hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors shadow-lg shadow-indigo-200">Unlock Access</button>
            </div>
        </div>
      </div>

    </div>
  </template>
  
  <style scoped>
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; opacity: 0; }
  
  input:focus, textarea:focus { box-shadow: none; }
  aside::-webkit-scrollbar, div::-webkit-scrollbar { width: 4px; }
  div::-webkit-scrollbar-track { background: transparent; }
  div::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 4px; }

  :deep(.comment-highlight) {
    background-color: #fef08a; 
    border-bottom: 2px solid #eab308;
    cursor: pointer;
  }

  :deep(.author-highlight) {
    background-color: #bbf7d0; 
    border-bottom: 2px solid #22c55e; 
    cursor: pointer;
  }

  :deep(.active-highlight) {
    filter: brightness(0.9); 
    outline: 2px solid #5D7AE6; 
  }
  </style>