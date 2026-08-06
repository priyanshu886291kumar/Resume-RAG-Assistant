import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
});

// ── Document Upload ──────────────────────────────────────────────────────────
export const uploadDocs = async (files) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append('files', file));
  const response = await api.post('/upload_docs/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// ── Question Answering ───────────────────────────────────────────────────────
export const askQuestion = async (question, chatHistory = '', topK = 5) => {
  const formData = new FormData();
  formData.append('question', question);
  if (chatHistory) formData.append('chat_history', chatHistory);
  formData.append('top_k', topK);
  const response = await api.post('/ask/', formData);
  return response.data;
};

// ── Document Management ──────────────────────────────────────────────────────
export const listDocuments = async () => {
  const response = await api.get('/documents/');
  return response.data;
};

export const deleteDocument = async (filename) => {
  const response = await api.delete(`/documents/${encodeURIComponent(filename)}`);
  return response.data;
};

// ── AI Summary ───────────────────────────────────────────────────────────────
export const generateSummary = async (filenames = []) => {
  const formData = new FormData();
  if (filenames.length > 0) formData.append('filenames', filenames.join(','));
  const response = await api.post('/summarize/', formData);
  return response.data;
};

// ── Evaluation Suite ─────────────────────────────────────────────────────────
export const runEvaluation = async () => {
  const response = await api.post('/evaluate/');
  return response.data; // { results: [...], total: 10 }
};
