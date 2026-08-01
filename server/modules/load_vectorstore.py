import os
from pathlib import Path
from dotenv import load_dotenv
from tqdm.auto import tqdm
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

# Load environment variables
load_dotenv()

# No API key needed — embeddings use local HuggingFace model

CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_db")

UPLOAD_DIR = "./uploaded_pdfs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CHROMA_DB_PATH, exist_ok=True)

# Load, split, embed and upsert PDF content
def load_vectorstore(uploaded_files):
    embed_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    file_paths = []

    for file in uploaded_files:
        save_path = Path(UPLOAD_DIR) / file.filename
        with open(save_path, "wb") as f:
            f.write(file.file.read())
        file_paths.append(str(save_path))

    for file_path in file_paths:
        loader = PyPDFLoader(file_path)
        documents = loader.load()

        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
        chunks = splitter.split_documents(documents)
        
        for i, chunk in enumerate(chunks):
            page_num = chunk.metadata.get("page", 0) + 1
            chunk.metadata["chunk_index"] = f"Page {page_num}, Chunk {i+1}"

        print(f"🔍 Embedding and uploading {len(chunks)} chunks to ChromaDB...")
        
        # Chroma.from_documents automatically embeds and persists to the given directory
        Chroma.from_documents(
            documents=chunks,
            embedding=embed_model,
            persist_directory=CHROMA_DB_PATH
        )

        print(f"✅ Upload complete for {file_path}")
