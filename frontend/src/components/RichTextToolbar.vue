<script setup lang="ts">
import type { PropType } from 'vue';

interface Option {
  label: string;
  value: string;
}

const props = defineProps({
  fontFamilies: {
    type: Array as PropType<Option[]>,
    default: () => []
  },
  fontSizes: {
    type: Array as PropType<Option[]>,
    default: () => []
  },
  selectedFontFamily: {
    type: String,
    default: ''
  },
  selectedFontSize: {
    type: String,
    default: ''
  },
  selectedColor: {
    type: String,
    default: '#000000'
  },
  selectedHighlight: {
    type: String,
    default: '#ffffff'
  }
});

const emit = defineEmits<{
  (e: 'font-family-change', value: string): void;
  (e: 'font-size-change', value: string): void;
  (e: 'command', payload: { command: string; value?: string }): void;
  (e: 'color-change', value: string): void;
  (e: 'highlight-change', value: string): void;
}>();

const triggerCommand = (command: string, value?: string) => {
  emit('command', { command, value });
};
</script>

<template>
  <div class="toolbar">
    <div class="toolbar__group">
      <select
        class="toolbar__select"
        :value="selectedFontFamily"
        @change="emit('font-family-change', ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="font in fontFamilies" :key="font.value" :value="font.value">
          {{ font.label }}
        </option>
      </select>

      <select
        class="toolbar__select"
        :value="selectedFontSize"
        @change="emit('font-size-change', ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="size in fontSizes" :key="size.value" :value="size.value">
          {{ size.label }}
        </option>
      </select>
    </div>

    <div class="toolbar__group toolbar__divider">
      <button class="toolbar__btn" @click="triggerCommand('bold')">B</button>
      <button class="toolbar__btn toolbar__italic" @click="triggerCommand('italic')">I</button>
      <button class="toolbar__btn toolbar__underline" @click="triggerCommand('underline')">U</button>
      <button class="toolbar__btn toolbar__strike" @click="triggerCommand('strikeThrough')">S</button>
    </div>

    <div class="toolbar__group toolbar__divider">
      <label class="toolbar__color">
        <span>A</span>
        <input
          type="color"
          :value="selectedColor"
          @input="emit('color-change', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label class="toolbar__color toolbar__color--highlight">
        <span>A</span>
        <input
          type="color"
          :value="selectedHighlight"
          @input="emit('highlight-change', ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>

    <div class="toolbar__group toolbar__divider">
      <button class="toolbar__btn" @click="triggerCommand('justifyLeft')">justifyLeft</button>
      <button class="toolbar__btn" @click="triggerCommand('justifyCenter')">justifyCenter</button>
      <button class="toolbar__btn" @click="triggerCommand('justifyRight')">justifyRight</button>
    </div>

    <div class="toolbar__group">
      <button class="toolbar__btn" @click="triggerCommand('insertUnorderedList')">•</button>
      <button class="toolbar__btn" @click="triggerCommand('insertOrderedList')">1.</button>
      <button class="toolbar__btn" @click="triggerCommand('removeFormat')">removeFormat</button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0.75rem 3rem 1rem;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
  font-size: 0.875rem;
  color: #475569;
}

.toolbar__group {
  display: flex;
  gap: 6px;
  align-items: center;
}

.toolbar__divider {
  border-right: 1px solid #e2e8f0;
  padding-right: 8px;
  margin-right: 4px;
}

.toolbar__select {
  padding: 0.35rem 0.9rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  font-size: 0.85rem;
  color: #1e293b;
}

.toolbar__btn {
  padding: 0.25rem 0.55rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-weight: 600;
  cursor: pointer;
  color: inherit;
  transition: background 0.2s;
}

.toolbar__btn:hover {
  background: #f1f5f9;
}

.toolbar__italic {
  font-style: italic;
}

.toolbar__underline {
  text-decoration: underline;
}

.toolbar__strike {
  text-decoration: line-through;
}

.toolbar__color {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  padding: 0.2rem 0.4rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.toolbar__color input {
  width: 26px;
  height: 26px;
  border: none;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.toolbar__color--highlight span {
  background: #fef3c7;
  padding: 0 0.25rem;
  border-radius: 4px;
}
</style>









