import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
});

export const uploadPdfs = async (files) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append('files', file);
  });
  const response = await api.post('/upload_pdfs/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const askQuestion = async (question, chatHistory = "") => {
  const formData = new FormData();
  formData.append('question', question);
  if (chatHistory) {
    formData.append('chat_history', chatHistory);
  }
  const response = await api.post('/ask/', formData);
  return response.data;
};

export const listDocuments = async () => {
  const response = await api.get('/documents/');
  return response.data; // { files: ['a.pdf', 'b.pdf'] }
};

export const deleteDocument = async (filename) => {
  const response = await api.delete(`/documents/${encodeURIComponent(filename)}`);
  return response.data;
};

export const generateSummary = async (filenames = []) => {
  const formData = new FormData();
  if (filenames.length > 0) {
    formData.append('filenames', filenames.join(','));
  }
  const response = await api.post('/summarize/', formData);
  return response.data; // { summary: "...", files: [...] }
};
