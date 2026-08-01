# 🧠 RagBot Pro: AI-Powered Document Assistant

A full-stack Retrieval-Augmented Generation (RAG) application that allows you to upload PDFs and instantly chat with them. Designed with a decoupled architecture, it uses a **React/Vite** frontend and a **FastAPI** backend, powered by **LangChain**, **ChromaDB**, and **Groq's LLaMA 3**.

---

## 🚀 Key Features

- **📄 Document Management:** Upload multiple PDFs, manage them via a sidebar, and delete them when no longer needed.
- **💬 Conversational Memory:** The assistant remembers the context of the current chat, allowing for natural follow-up questions.
- **📑 Source Citations:** Every answer includes exact citations linking back to the specific PDF and chunk that provided the information.
- **✨ AI Summarization:** Generate a structured, markdown-formatted summary (Overview, Skills, Projects, Key Points) of your uploaded documents with a single click.
- **📂 Multiple Chat Sessions:** Create, rename, and switch between different chat sessions. Conversations persist locally.
- **📥 PDF Export:** Download any chat session as a beautifully formatted PDF document.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **PDF Generation:** jsPDF
- **Networking:** Axios

### Backend
- **Framework:** FastAPI
- **LLM / Inference:** ChatGroq (`llama-3.3-70b-versatile`)
- **Embeddings:** HuggingFace (`all-MiniLM-L6-v2`)
- **Vector Database:** ChromaDB (Local SQLite)
- **Orchestration:** LangChain (RetrievalQA)

---

## 🏗️ Architecture & RAG Workflow

The application uses a standard Retrieval-Augmented Generation (RAG) pipeline to prevent LLM hallucination and ground answers in your uploaded documents.

1. **Ingestion:** When a PDF is uploaded, `PyPDFLoader` extracts the text. `RecursiveCharacterTextSplitter` breaks it into overlapping 500-character chunks.
2. **Embedding:** The chunks are converted into dense vector embeddings using a local HuggingFace model (`all-MiniLM-L6-v2`) and stored in a local **ChromaDB** instance.
3. **Retrieval:** When a user asks a question, the backend embeds the question and queries ChromaDB for the Top-5 most semantically similar chunks.
4. **Generation:** The retrieved chunks, along with the user's conversational history, are injected into a strict prompt. The **Groq LLaMA 3** model reads this context and generates a precise, cited answer.

---

## 📂 Project Structure

```text
Resume-RAG-Assistant/
├── client/                     # React Frontend
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Chat, Sidebar, Upload, Summary UI
│   │   ├── hooks/              # useChatSessions (Local Storage Manager)
│   │   ├── pages/              # Main Home view
│   │   ├── services/           # Axios API integrations
│   │   ├── App.jsx             # Entry component
│   │   └── main.jsx            # React DOM render
│   ├── package.json            # Frontend dependencies
│   └── tailwind.config.js      # Tailwind configuration
│
├── server/                     # FastAPI Backend
│   ├── modules/                
│   │   ├── llm.py              # LangChain & Groq setup, strict Prompts
│   │   ├── load_vectorstore.py # PDF ingestion & ChromaDB chunking
│   │   └── query_handlers.py   # RAG pipeline execution & citation mapping
│   ├── logger.py               # Debugging & application logging
│   ├── main.py                 # FastAPI endpoints (/ask, /upload, /summarize)
│   ├── requirements.txt        # Python dependencies
│   └── .env.example            # Environment variable template
│
└── README.md                   # This documentation
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- A free API key from [Groq Console](https://console.groq.com)

### 1. Backend Setup (FastAPI)

Open a terminal and navigate to the `server` directory:

```bash
cd server

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
```

Open the `.env` file and add your Groq API key:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

Start the backend server:
```bash
uvicorn main:app --reload
```
*(The API will be available at `http://127.0.0.1:8000`)*

### 2. Frontend Setup (React)

Open a **new** terminal window and navigate to the `client` directory:

```bash
cd client

# Install dependencies
npm install

# Start the development server
npm run dev
```
*(The UI will be available at `http://localhost:5173`)*

---

## 📖 Usage Guide

1. **Upload Documents:** Click the upload area in the left sidebar to upload one or more PDFs.
2. **Generate Summary:** Once uploaded, click the ✨ **Generate AI Summary** button to get an instant breakdown of the documents.
3. **Chat:** Type a question in the main chat interface. The bot will search the PDFs and answer with citations.
4. **Manage Sessions:** Use the left sidebar to create new chats, switch between topics, or rename/delete old conversations.
5. **Export:** Click "Export PDF" in the top right of the chat window to save your conversation history.
6. **Clean Up:** Click the Trash icon next to any uploaded document in the sidebar to delete it from the vector database.

---

## 🔮 Future Improvements

- [ ] Add authentication (JWT) for multi-user support.
- [ ] Add support for parsing images and tables within PDFs using OCR.
- [ ] Implement WebSockets for streaming LLM responses token-by-token.
- [ ] Support additional file types (DOCX, TXT, CSV).

---

> Happy Building! 🚀
