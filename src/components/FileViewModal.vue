<!-- FileViewerModal.vue -->
<template>
  <div class="file-viewer-modal">
    <iframe
      :src="fileUrl"
      class="file-iframe"
      v-if="fileUrl"
    ></iframe>
    <div v-else class="error-message">
      {{ t('notification_component.error_loading_file') }}
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const props = defineProps({
  fileBlob: {
    type: Blob,
    required: true,
  },
  fileName: {
    type: String,
    default: 'document',
  },
  modalKey: {
    type: Number,
    required: true,
  },
});

const fileUrl = ref(null);

// Create blob URL for the iframe
if (props.fileBlob) {
  fileUrl.value = URL.createObjectURL(props.fileBlob);
}

// Clean up blob URL on component unmount
onUnmounted(() => {
  if (fileUrl.value) {
    URL.revokeObjectURL(fileUrl.value);
  }
});
</script>

<style scoped lang="scss">
.file-viewer-modal {
  width: 100%;
  height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.file-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.error-message {
  color: #ff4d4f;
  font-size: 16px;
  text-align: center;
}
</style>