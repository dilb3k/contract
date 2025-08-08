<!-- src/components/DownloadDetailsModal.vue -->
<template>
  <a-modal
    :open="visible"
    :title="t('DownloadsView.fileDetails')"
    @cancel="onClose"
    :footer="null"
    width="600px"
  >
    <div class="modal-content">
      <a-spin :spinning="loading">
        <a-table
          :columns="modalColumns"
          :data-source="contractDetails"
          :pagination="false"
          size="middle"
          bordered
          row-key="id"
          :row-class-name="() => 'accessible-row'"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'ni'">
              {{ record.index + 1 }}
            </template>
            <template v-if="column.dataIndex === 'name'">
              {{ record.name || 'N/A' }}
            </template>
            <template v-if="column.dataIndex === 'actions'">
              <a-space>
                <a-dropdown
                  :trigger="['click']"
                  placement="bottomRight"
                  ref="dropdown"
                >
                  <a-tooltip :title="t('VIEW')">
                    <a-button
                      :loading="openingFileId === record.id"
                      :disabled="openingFileId !== null"
                      @click="handleEyeButtonClick(record)"
                      aria-label="View file options"
                      style="display: flex; justify-content: center"
                    >
                      <template #icon>
                        <icon-eye />
                      </template>
                    </a-button>
                  </a-tooltip>
                  <template #overlay>
                    <a-menu @click="({ key }) => openFile(record, key)">
                      <a-menu-item key="pdf">
                        {{ t('PDF') }}
                      </a-menu-item>
                      <a-menu-item key="docx">
                        {{ t('DOCX') }}
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-spin>
      <a-modal
        :open="modalVisible"
        :title="t('VIEW_FILE')"
        width="80%"
        :body-style="{
          height: '65vh',
          overflow: 'auto',
          background: '#fff',
          padding: '16px'
        }"
        :closable="true"
        @cancel="closeModal"
        wrap-class-name="custom-modal"
      >
        <a-spin
          v-if="isLoading"
          :tip="t('LOADING_FILE') || 'Fayl yuklanmoqda...'"
          style="display: block; text-align: center; padding: 20px"
        />
        <template v-else-if="errorMessage">
          <div class="error-container">
            <p class="error-message">{{ errorMessage }}</p>
            <a-button v-if="fileBlob" type="primary" @click="downloadFile">
              {{ t('DOWNLOAD_FILE') || 'Yuklab olish' }}
            </a-button>
          </div>
        </template>
        <iframe
          v-else-if="fileFormat === 'pdf' && fileUrl"
          :src="fileUrl"
          class="pdf-iframe"
          title="PDF Preview"
        />
        <div
          v-else-if="fileFormat === 'docx'"
          ref="docxContainer"
          class="docx-content"
        />
        <div v-else class="no-preview">
          <p>{{ t('NO_FILE_AVAILABLE') || "Oldin ko'rish mumkin emas" }}</p>
          <a-button v-if="fileBlob" type="primary" @click="downloadFile">
            {{ t('DOWNLOAD_FILE') || 'Yuklab olish' }}
          </a-button>
        </div>
      </a-modal>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, watch, onUnmounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { message } from 'ant-design-vue';
import IconEye from '@/components/icons/outline/IconEye.vue';
import { useDownload } from '@/store/download.pinia';
import { useContract } from '@/store/contract.pinia';
import { renderAsync } from 'docx-preview';
import { debounce } from 'lodash-es';

const { t } = useI18n();
const downloadStore = useDownload();
const contractStore = useContract();

const props = defineProps({
  visible: Boolean,
  downloadId: [Number, String, Array],
});

const emit = defineEmits(['update:visible']);

const loading = ref(false);
const contractDetails = ref([]);
const openingFileId = ref(null);
const modalVisible = ref(false);
const fileUrl = ref(null);
const fileFormat = ref(null);
const fileBlob = ref(null);
const isLoading = ref(false);
const errorMessage = ref(null);
const docxContainer = ref(null);
const dropdown = ref(null);

const modalColumns = [
  { title: '№', dataIndex: 'ni', width: 80, align: 'center' },
  { title: t('ContractsView.name'), dataIndex: 'name' },
  { title: '', dataIndex: 'actions', width: 200, align: 'center' },
];

watch(
  () => props.visible,
  async (newVal) => {
    if (newVal && props.downloadId) {
      loading.value = true;
      try {
        const response = await downloadStore.getDownloadContracts(props.downloadId);
        if (Array.isArray(response)) {
          contractDetails.value = response.map((item, index) => ({
            id: item.id,
            name: item.name || 'N/A',
            index,
          }));
        } else {
          console.error('Unexpected response format:', response);
          message.error(t('notification_component.error_fetch_details') || 'Failed to fetch contract details');
          contractDetails.value = [];
        }
      } catch (error) {
        console.error('Error fetching contracts:', error);
        message.error(t('notification_component.error_fetch_details') || 'Failed to fetch contract details');
        contractDetails.value = [];
      } finally {
        loading.value = false;
      }
    } else {
      contractDetails.value = [];
    }
  },
  { immediate: true }
);

watch(modalVisible, async (val) => {
  if (!val) {
    closeModal();
    return;
  }
  if (val && fileFormat.value === 'docx' && fileBlob.value && docxContainer.value) {
    await nextTick();
    try {
      isLoading.value = true;
      if (!docxContainer.value) {
        throw new Error('DOCX container not found');
      }
      const buffer = await fileBlob.value.arrayBuffer();
      if (buffer.byteLength === 0) {
        throw new Error('File is empty');
      }
      docxContainer.value.innerHTML = '';
      console.log('Rendering DOCX, Blob size:', buffer.byteLength, 'Container:', docxContainer.value);
      await renderAsync(buffer, docxContainer.value, null, {
        className: 'docx-wrapper',
        inWrapper: true,
        breakPages: true,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
      });
      message.success(t('notification_component.file_opened_successfully') || 'File opened successfully');
    } catch (error) {
      console.error('DOCX render error:', error);
      errorMessage.value = t(
        error.message?.includes('container')
          ? 'CONTAINER_ERROR'
          : error.message?.includes('empty')
            ? 'EMPTY_FILE_ERROR'
            : 'DOCX_RENDER_ERROR'
      ) || 'Error rendering DOCX file';
      message.error(errorMessage.value);
    } finally {
      isLoading.value = false;
    }
  }
});

const handleEyeButtonClick = debounce((record) => {}, 300);

const openFile = async (record, format) => {
  if (!record?.id || !['pdf', 'docx'].includes(format)) {
    message.error(t('notification_component.invalid_file_format') || 'Invalid file format');
    return;
  }
  if (openingFileId.value !== null) {
    message.warning(t('notification_component.operation_in_progress') || 'Operation in progress');
    return;
  }
  openingFileId.value = record.id;
  isLoading.value = true;
  errorMessage.value = null;
  fileFormat.value = format;
  fileBlob.value = null;
  fileUrl.value = null;

  try {
    console.log('Fetching file for ID:', record.id, 'Format:', format);
    const { blob, mimeType } = await contractStore.openContractFile(record.id, format);
    if (!(blob instanceof Blob)) {
      throw new Error('Invalid file blob received');
    }
    if (blob.size === 0) {
      throw new Error('Received empty file blob');
    }
    console.log('Blob received:', blob, 'Type:', blob.type, 'Size:', blob.size);
    fileBlob.value = blob;
    fileFormat.value = mimeType?.includes('wordprocessingml')
      ? 'docx'
      : mimeType?.includes('pdf')
        ? 'pdf'
        : format;
    if (fileFormat.value === 'pdf') {
      fileUrl.value = URL.createObjectURL(blob);
    }
    modalVisible.value = true;
    message.success(t('notification_component.file_opened_successfully') || 'File opened successfully');
  } catch (error) {
    console.error('Open file error:', error);
    errorMessage.value = t(
      error.response?.status === 404
        ? 'FILE_NOT_FOUND'
        : error.response?.status === 403
          ? 'ACCESS_DENIED'
          : error.response?.status === 500
            ? 'SERVER_ERROR'
            : error.message?.includes('empty')
              ? 'EMPTY_FILE'
              : error.message?.includes('blob')
                ? 'FILE_DATA_ERROR'
                : 'FILE_OPEN_ERROR'
    ) || 'Failed to open file';
    message.error(errorMessage.value);
    modalVisible.value = true;
  } finally {
    isLoading.value = false;
    openingFileId.value = null;
    if (dropdown.value && dropdown.value.hide) {
      dropdown.value.hide();
    }
  }
};

const closeModal = () => {
  modalVisible.value = false;
  if (fileUrl.value) {
    URL.revokeObjectURL(fileUrl.value);
  }
  fileUrl.value = null;
  fileFormat.value = null;
  fileBlob.value = null;
  errorMessage.value = null;
  if (docxContainer.value) {
    docxContainer.value.innerHTML = '';
  }
};

const downloadFile = () => {
  if (!fileBlob.value || !fileFormat.value) {
    message.error(t('notification_component.no_file_to_download') || 'No file to download');
    return;
  }
  try {
    const url = URL.createObjectURL(fileBlob.value);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contract_${Date.now()}.${fileFormat.value}`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    message.success(t('notification_component.download_started') || 'Download started');
  } catch (error) {
    message.error(t('notification_component.download_failed') || 'Download failed');
    console.error('Download error:', error);
  }
};

const onClose = () => {
  emit('update:visible', false);
  contractDetails.value = [];
  closeModal();
};

onUnmounted(() => {
  if (fileUrl.value) {
    URL.revokeObjectURL(fileUrl.value);
  }
});
</script>

<style scoped lang="scss">
.modal-content {
  padding: 16px 0;
}

:deep(.ant-table-thead > tr > th) {
  background: #f8fafc;
  font-weight: 600;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.docx-content {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background: #fff;
  display: block;
}

.error-container,
.no-preview {
  text-align: center;
  padding: 20px;
}

.error-message {
  color: #ff4d4f;
  margin-bottom: 16px;
}

.accessible-row {
  cursor: pointer;
}

:deep(.docx-wrapper) {
  font-family: 'Times New Roman', serif;
  line-height: 1.4;
  background: #fff;
  max-width: 100%;
  word-wrap: break-word;
  padding: 16px;
}

:deep(.docx-wrapper p) {
  margin: 8px 0;
  text-align: justify;
}

:deep(.docx-wrapper table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}

:deep(.docx-wrapper table td, .docx-wrapper table th) {
  border: 1px solid #333;
  padding: 4px 8px;
}

:deep(.docx-wrapper h1, .docx-wrapper h2, .docx-wrapper h3) {
  margin: 16px 0 8px 0;
  font-weight: bold;
}

:deep(.docx-wrapper ul, .docx-wrapper ol) {
  margin: 8px 0;
  padding-left: 20px;
}
</style>