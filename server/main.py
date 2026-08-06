"""
main.py — FastAPI application for the Disaster Management RAG Assistant.

Endpoints:
  POST /upload_docs/      — Upload PDF, Markdown, CSV, or Excel documents
  POST /ask/              — Ask a question (RAG pipeline with hallucination protection)
  GET  /documents/        — List all uploaded documents
  DELETE /documents/{f}   — Delete a document and its embeddings
  POST /summarize/        — Generate an AI summary of uploaded documents
  POST /evaluate/         — Run the 10-question evaluation suite
"""

from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List
import os

from dotenv import load_dotenv
load_dotenv()

from modules.load_vectorstore import load_vectorstore, ingest_docs_folder, SUPPORTED_EXTENSIONS, DOCS_DIR
from modules.llm import get_llm_chain
from modules.query_handlers import query_chain
from logger import logger

app = FastAPI(title="Disaster Management RAG Assistant v2.0")

# ── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static file serving (for in-chat PDF links) ──────────────────────────────
os.makedirs(DOCS_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=DOCS_DIR), name="static")

# ── Shared ChromaDB path ─────────────────────────────────────────────────────
CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_db")


def _get_vectorstore():
    """Return a ready-to-use Chroma vectorstore instance."""
    from langchain_huggingface import HuggingFaceEmbeddings
    from langchain_chroma import Chroma

    embed_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return Chroma(persist_directory=CHROMA_DB_PATH, embedding_function=embed_model)


# ── Startup: auto-ingest any files already in docs/ ─────────────────────────
@app.on_event("startup")
async def startup_ingest():
    """
    On every server start, scan ./docs/ and embed any files that are not yet
    in ChromaDB. This allows dropping files into docs/ without using the UI.
    """
    try:
        logger.info("Startup: running auto-ingestion of docs/ folder...")
        ingest_docs_folder()
        logger.info("Startup: auto-ingestion complete.")
    except Exception:
        logger.exception("Startup auto-ingestion failed (non-fatal).")


# ── Global exception middleware ───────────────────────────────────────────────
@app.middleware("http")
async def catch_exception_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        logger.exception("UNHANDLED EXCEPTION")
        return JSONResponse(status_code=500, content={"error": str(exc)})


# ────────────────────────────────────────────────────────────────────────────
# POST /upload_docs/
# ────────────────────────────────────────────────────────────────────────────
@app.post("/upload_docs/")
async def upload_docs(files: List[UploadFile] = File(...)):
    """
    Accept one or more files of supported types:
    PDF (.pdf), Markdown (.md), CSV (.csv), Excel (.xlsx).
    Saves to ./docs/ and embeds into ChromaDB.
    """
    import time
    from pathlib import Path

    valid_files = [
        f for f in files
        if f.filename and Path(f.filename).suffix.lower() in SUPPORTED_EXTENSIONS
    ]
    rejected = [
        f.filename for f in files if f not in valid_files
    ]

    if not valid_files:
        return JSONResponse(
            status_code=400,
            content={"error": f"No supported files provided. Supported types: {list(SUPPORTED_EXTENSIONS)}"},
        )

    if rejected:
        logger.warning(f"Rejected unsupported files: {rejected}")

    logger.info(f"Received {len(valid_files)} file(s) for upload")
    t0 = time.time()
    load_vectorstore(valid_files)
    elapsed = time.time() - t0
    logger.info(f"Upload + indexing completed in {elapsed:.4f}s")

    return {
        "message": f"{len(valid_files)} file(s) processed and indexed successfully.",
        "indexed": [f.filename for f in valid_files],
        "rejected": rejected,
        "time_seconds": round(elapsed, 3),
    }


# ────────────────────────────────────────────────────────────────────────────
# POST /ask/
# ────────────────────────────────────────────────────────────────────────────
@app.post("/ask/")
async def ask_question(
    question: str = Form(...),
    chat_history: str = Form(default=""),
    top_k: int = Form(default=3),
):
    """
    RAG question-answering endpoint with hallucination protection.
    top_k controls how many chunks are retrieved (default 5, configurable).
    """
    try:
        if not question or not question.strip():
            return JSONResponse(status_code=400, content={"error": "Question cannot be empty."})

        logger.info(f"User query: {question!r} (top_k={top_k})")

        if not os.path.exists(CHROMA_DB_PATH):
            return JSONResponse(
                status_code=400,
                content={"error": "Knowledge base is empty. Please upload documents first."},
            )

        vectorstore = _get_vectorstore()
        llm, prompt = get_llm_chain(chat_history=chat_history)
        result = query_chain(llm, prompt, vectorstore, question, k=top_k)

        logger.info("Query successful.")
        return result

    except Exception as e:
        logger.exception("Error processing question")
        return JSONResponse(status_code=500, content={"error": f"Failed to generate answer: {str(e)}"})
# GET /documents/
# ────────────────────────────────────────────────────────────────────────────
@app.get("/documents/")
async def list_documents():
    """List all documents currently in the documents/ folder (all supported types) recursively."""
    try:
        from pathlib import Path
        if not os.path.exists(DOCS_DIR):
            return {"files": []}
        
        files = []
        for root, _, filenames in os.walk(DOCS_DIR):
            for f in filenames:
                if Path(f).suffix.lower() in SUPPORTED_EXTENSIONS:
                    # Return the filename only or relative path? We'll return just the filename
                    # for compatibility with the frontend, or the relative path from DOCS_DIR
                    rel_path = os.path.relpath(os.path.join(root, f), DOCS_DIR)
                    # Use forward slashes for the frontend
                    files.append(rel_path.replace("\\", "/"))
                    
        return {"files": sorted(files)}
    except Exception as e:
        logger.exception("Error listing documents")
        return JSONResponse(status_code=500, content={"error": str(e)})


# ────────────────────────────────────────────────────────────────────────────
# DELETE /documents/{filepath}
# ────────────────────────────────────────────────────────────────────────────
@app.delete("/documents/{filepath:path}")
async def delete_document(filepath: str):
    """Delete a document from disk and remove its embeddings from ChromaDB."""
    try:
        file_path = os.path.join(DOCS_DIR, filepath)
        if not os.path.exists(file_path):
            return JSONResponse(status_code=404, content={"error": f"File '{filepath}' not found."})

        os.remove(file_path)
        logger.info(f"Deleted file: {file_path}")
        
        filename = os.path.basename(filepath)

        vectorstore = _get_vectorstore()
        collection = vectorstore._collection
        all_docs = collection.get(include=["metadatas"])

        ids_to_delete = [
            doc_id
            for doc_id, meta in zip(all_docs["ids"], all_docs["metadatas"])
            if filename in meta.get("source", "").replace("\\", "/")
            or meta.get("filename", "") == filename
        ]

        if ids_to_delete:
            collection.delete(ids=ids_to_delete)
            logger.info(f"Removed {len(ids_to_delete)} embeddings for '{filename}'")

        return {
            "message": f"'{filepath}' deleted successfully.",
            "embeddings_removed": len(ids_to_delete),
        }

    except Exception as e:
        logger.exception("Error deleting document")
        return JSONResponse(status_code=500, content={"error": str(e)})


# ────────────────────────────────────────────────────────────────────────────
# POST /summarize/
# ────────────────────────────────────────────────────────────────────────────
@app.post("/summarize/")
async def summarize_documents(filenames: str = Form(default="")):
    """
    Summarize one or more uploaded documents using the Groq LLM.
    Supports PDF, Markdown, CSV, and Excel.
    Pass comma-separated filenames, or leave empty to summarize ALL.
    """
    try:
        from pathlib import Path
        from langchain_groq import ChatGroq
        from langchain.prompts import PromptTemplate
        from modules.load_vectorstore import _load_file

        if not os.path.exists(DOCS_DIR):
            return JSONResponse(status_code=400, content={"error": "No documents uploaded yet."})

        all_files = []
        for root, _, files in os.walk(DOCS_DIR):
            for f in files:
                if Path(f).suffix.lower() in SUPPORTED_EXTENSIONS:
                    rel_path = os.path.relpath(os.path.join(root, f), DOCS_DIR).replace("\\", "/")
                    all_files.append(rel_path)
                    
        if not all_files:
            return JSONResponse(status_code=400, content={"error": "No supported documents found."})

        target_files = (
            [f.strip() for f in filenames.split(",") if f.strip()]
            if filenames.strip()
            else all_files
        )

        combined_text = ""
        file_labels = []
        for fname in target_files:
            path = os.path.join(DOCS_DIR, fname)
            if not os.path.exists(path):
                continue
            docs = _load_file(path)
            combined_text += f"\n\n=== Document: {fname} ===\n"
            combined_text += "\n".join(d.page_content for d in docs)
            file_labels.append(fname)

        if not combined_text.strip():
            return JSONResponse(status_code=400, content={"error": "Could not extract text from the selected files."})

        max_chars = 12000
        if len(combined_text) > max_chars:
            combined_text = combined_text[:max_chars] + "\n\n[... content truncated for summary ...]"

        groq_api_key = os.getenv("GROQ_API_KEY")
        llm = ChatGroq(groq_api_key=groq_api_key, model_name="llama-3.3-70b-versatile")

        prompt = PromptTemplate(
            input_variables=["content", "files"],
            template="""
You are an expert Disaster Management document analyst.
Analyze the following document(s) and provide a structured summary.

Documents: {files}

Content:
{content}

---

Provide a clear summary with these sections (skip if not applicable):

## 📄 Overview
High-level description of what this document covers.

## 🎯 Scope & Purpose
Who is this document intended for and what situation does it address?

## 📌 Key Procedures & Guidelines
Bullet points of the most important procedures, steps, or protocols.

## ⚠️ Critical Warnings / Risk Areas
Any high-priority warnings, risk factors, or critical safety information.

## 📊 Additional Details
Other relevant information, tables, or data worth noting.

Be concise, factual, and base your summary ONLY on the provided document content.
"""
        )

        formatted = prompt.format(content=combined_text, files=", ".join(file_labels))
        response = llm.invoke(formatted)
        summary_text = response.content

        logger.info(f"Summary generated for: {file_labels}")
        return {"summary": summary_text, "files": file_labels}

    except Exception as e:
        logger.exception("Error generating summary")
        return JSONResponse(status_code=500, content={"error": str(e)})


# ────────────────────────────────────────────────────────────────────────────
# POST /evaluate/
# ────────────────────────────────────────────────────────────────────────────
@app.post("/evaluate/")
async def evaluate():
    """
    Run the evaluation suite from test_questions.csv.
    """
    try:
        import csv

        eval_csv_path = os.path.join(DOCS_DIR, "test_questions.csv")
        if not os.path.exists(eval_csv_path):
            return JSONResponse(
                status_code=404,
                content={"error": "test_questions.csv not found in documents/ folder."},
            )

        if not os.path.exists(CHROMA_DB_PATH):
            return JSONResponse(
                status_code=400,
                content={"error": "Knowledge base is empty. Please upload documents first."},
            )

        # Load evaluation questions
        questions = []
        with open(eval_csv_path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                questions.append({
                    "id": row.get("id", ""),
                    "question": row.get("question", ""),
                    "expected_topic": row.get("likely_source_document", ""),
                })

        vectorstore = _get_vectorstore()
        llm, prompt = get_llm_chain(chat_history="")

        results = []
        for item in questions:
            q = item["question"]
            logger.info(f"Evaluating Q{item['id']}: {q!r}")

            try:
                result = query_chain(llm, prompt, vectorstore, q, k=3)

                # Pull the retrieved raw chunks for display
                raw_chunks = vectorstore.similarity_search_with_score(q, k=3)
                chunks_for_display = [
                    {
                        "content": doc.page_content[:400],  # truncate for UI
                        "filename": doc.metadata.get("filename", "Unknown"),
                        "chunk_index": doc.metadata.get("chunk_index", ""),
                        "doc_type": doc.metadata.get("doc_type", ""),
                        "score": round(float(score), 4),
                    }
                    for doc, score in raw_chunks
                ]

                results.append({
                    "id": item["id"],
                    "question": q,
                    "expected_topic": item["expected_topic"],
                    "answer": result["response"],
                    "sources": result["sources"],
                    "chunks": chunks_for_display,
                    "best_score": min(result["scores"]) if result["scores"] else None,
                    "hallucination_protected": result["response"].startswith(
                        "Not found in the provided"
                    ),
                })
            except Exception as e:
                logger.exception(f"Error evaluating question {item['id']}")
                results.append({
                    "id": item["id"],
                    "question": q,
                    "expected_topic": item["expected_topic"],
                    "answer": f"Error: {str(e)}",
                    "sources": [],
                    "chunks": [],
                    "best_score": None,
                    "hallucination_protected": False,
                })

        logger.info(f"Evaluation complete: {len(results)} questions processed.")
        return {"results": results, "total": len(results)}

    except Exception as e:
        logger.exception("Error running evaluation")
        return JSONResponse(status_code=500, content={"error": str(e)})
