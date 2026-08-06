"""
load_vectorstore.py — Unified document loader for the Disaster Management RAG Assistant.

Supports: PDF, Markdown (.md), CSV, Excel (.xlsx)

Chunking Strategy:
  - chunk_size=500: Captures ~100–120 words per chunk, matching a typical
    paragraph of a disaster management guideline or SOP. This is ideal for
    dense procedural text where each paragraph is semantically self-contained.
  - chunk_overlap=100: A ~20% overlap ensures that sentences spanning two
    adjacent chunks (e.g., an evacuation instruction split mid-sentence)
    are preserved in both chunks, preventing context loss during retrieval.
"""

import os
import io
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from tqdm.auto import tqdm

from langchain_community.document_loaders import (
    PyPDFLoader,
    CSVLoader,
    UnstructuredMarkdownLoader,
)
from langchain_community.document_loaders import UnstructuredExcelLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

from logger import logger

load_dotenv()

CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_db")
DOCS_DIR = "./documents"

# Ensure directories exist on startup
for sub in ["pdf", "markdown", "csv", "excel"]:
    os.makedirs(os.path.join(DOCS_DIR, sub), exist_ok=True)
os.makedirs(CHROMA_DB_PATH, exist_ok=True)

# Supported file extensions
SUPPORTED_EXTENSIONS = {".pdf", ".md", ".csv", ".xlsx"}


def _get_doc_type(ext: str) -> str:
    """Return a human-readable document type string based on file extension."""
    return {
        ".pdf": "PDF",
        ".md": "Markdown",
        ".csv": "CSV",
        ".xlsx": "Excel",
    }.get(ext.lower(), "Unknown")


def _get_folder_for_ext(ext: str) -> str:
    """Return the corresponding subfolder name for an extension."""
    return {
        ".pdf": "pdf",
        ".md": "markdown",
        ".csv": "csv",
        ".xlsx": "excel",
    }.get(ext.lower(), "other")


def _load_file(file_path: str) -> List[Document]:
    """
    Route a file to the correct LangChain loader based on its extension.
    Enriches each loaded document with standardised metadata:
      - filename  : basename of the file (e.g. "flood_sop.pdf")
      - doc_type  : human-readable type ("PDF", "Markdown", etc.)
      - page      : page number when available (PDF / Excel)
      - section   : section heading when available (Markdown elements mode)
    """
    path = Path(file_path)
    ext = path.suffix.lower()
    filename = path.name

    logger.info(f"Loading {_get_doc_type(ext)} file: {filename}")

    if ext == ".pdf":
        loader = PyPDFLoader(file_path)
        docs = loader.load()
        for doc in docs:
            doc.metadata["filename"] = filename
            doc.metadata["doc_type"] = "PDF"
            # PyPDFLoader already adds "page" (0-indexed); normalise to 1-indexed
            doc.metadata["page"] = doc.metadata.get("page", 0) + 1

    elif ext == ".md":
        # mode="elements" captures individual headings and body blocks,
        # enabling us to store the section heading in metadata.
        # Falls back to TextLoader if `unstructured` package is not installed.
        try:
            loader = UnstructuredMarkdownLoader(file_path, mode="elements")
            docs = loader.load()
            current_section = "Introduction"
            enriched = []
            for doc in docs:
                category = doc.metadata.get("category", "")
                if category == "Title":
                    current_section = doc.page_content.strip()
                doc.metadata["filename"] = filename
                doc.metadata["doc_type"] = "Markdown"
                doc.metadata["section"] = current_section
                doc.metadata["page"] = doc.metadata.get("page_number", 1)
                enriched.append(doc)
            docs = enriched
        except ImportError:
            logger.warning("unstructured not installed. Falling back to TextLoader for Markdown.")
            from langchain_community.document_loaders import TextLoader
            loader = TextLoader(file_path, encoding="utf-8")
            docs = loader.load()
            for doc in docs:
                doc.metadata["filename"] = filename
                doc.metadata["doc_type"] = "Markdown"
                doc.metadata["section"] = "Full Document"
                doc.metadata["page"] = 1

    elif ext == ".csv":
        # CSVLoader creates one document per row, using column headers as metadata
        loader = CSVLoader(file_path=file_path, encoding="utf-8")
        docs = loader.load()
        for i, doc in enumerate(docs):
            doc.metadata["filename"] = filename
            doc.metadata["doc_type"] = "CSV"
            doc.metadata["page"] = i + 1  # treat each row as a "page"

    elif ext == ".xlsx":
        # UnstructuredExcelLoader reads all sheets
        loader = UnstructuredExcelLoader(file_path, mode="single")
        docs = loader.load()
        for i, doc in enumerate(docs):
            doc.metadata["filename"] = filename
            doc.metadata["doc_type"] = "Excel"
            doc.metadata["page"] = doc.metadata.get("page_number", i + 1)

    else:
        logger.warning(f"Unsupported file type: {ext}. Skipping {filename}.")
        return []

    logger.info(f"  → Loaded {len(docs)} document(s) from {filename}")
    return docs


def _split_and_tag(docs: List[Document]) -> List[Document]:
    """
    Split documents into chunks and add a human-readable chunk_index metadata
    field that combines page number and chunk number for use in citations.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100,
        separators=["\n\n", "\n", " ", ""],
    )
    chunks = splitter.split_documents(docs)

    for i, chunk in enumerate(chunks):
        page = chunk.metadata.get("page", 1)
        section = chunk.metadata.get("section", "")
        if section:
            chunk.metadata["chunk_index"] = f"Page {page} — {section}"
        else:
            chunk.metadata["chunk_index"] = f"Page {page}, Chunk {i + 1}"
        chunk.metadata["chunk_id"] = i + 1

    logger.info(f"  → Split into {len(chunks)} chunks")
    return chunks


def load_vectorstore(uploaded_files) -> None:
    """
    Save uploaded files to ./documents/{type}/, then embed and upsert to ChromaDB.
    Accepts a list of FastAPI UploadFile objects.
    """
    import time

    embed_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    for file in uploaded_files:
        ext = Path(file.filename).suffix.lower()
        if ext not in SUPPORTED_EXTENSIONS:
            logger.warning(f"Unsupported extension '{ext}' for file '{file.filename}'. Skipping.")
            continue

        folder = _get_folder_for_ext(ext)
        target_dir = Path(DOCS_DIR) / folder
        os.makedirs(target_dir, exist_ok=True)
        
        save_path = target_dir / file.filename
        content = file.file.read()
        with open(save_path, "wb") as f:
            f.write(content)
        logger.info(f"Saved uploaded file: {save_path}")

        t0 = time.time()
        docs = _load_file(str(save_path))
        if not docs:
            continue

        chunks = _split_and_tag(docs)

        Chroma.from_documents(
            documents=chunks,
            embedding=embed_model,
            persist_directory=CHROMA_DB_PATH,
        )

        upload_time = time.time() - t0
        logger.info(f"  → Embedded & persisted {len(chunks)} chunks in {upload_time:.4f}s")


def ingest_docs_folder() -> None:
    """
    Auto-ingestion: recursively scan ./documents/ and embed any file not yet in ChromaDB.
    Called on FastAPI startup so documents placed in documents/ are always indexed.
    """
    if not os.path.exists(DOCS_DIR):
        return

    import shutil
    if os.path.exists(CHROMA_DB_PATH):
        shutil.rmtree(CHROMA_DB_PATH)
        os.makedirs(CHROMA_DB_PATH, exist_ok=True)
        logger.info("Cleared existing ChromaDB collection for clean rebuilding.")

    embed_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vectorstore = Chroma(persist_directory=CHROMA_DB_PATH, embedding_function=embed_model)

    # Collect filenames already in ChromaDB
    try:
        existing = vectorstore._collection.get(include=["metadatas"])
        indexed_files = {
            meta.get("filename", "")
            for meta in existing.get("metadatas", [])
        }
    except Exception:
        indexed_files = set()

    # Recursively find all supported files
    files_in_docs = []
    for root, _, files in os.walk(DOCS_DIR):
        for f in files:
            if Path(f).suffix.lower() in SUPPORTED_EXTENSIONS:
                files_in_docs.append(os.path.join(root, f))

    # Filter out files that are already indexed (by filename)
    new_files = [f for f in files_in_docs if Path(f).name not in indexed_files]
    if not new_files:
        logger.info("Auto-ingestion: all documents/ files are already indexed.")
        return

    logger.info(f"Auto-ingestion: indexing {len(new_files)} new file(s)")
    for file_path in tqdm(new_files, desc="Ingesting documents/"):
        docs = _load_file(file_path)
        if not docs:
            continue
        chunks = _split_and_tag(docs)
        Chroma.from_documents(
            documents=chunks,
            embedding=embed_model,
            persist_directory=CHROMA_DB_PATH,
        )
        logger.info(f"  → Ingested: {Path(file_path).name}")
