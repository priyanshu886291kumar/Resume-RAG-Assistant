from fastapi import FastAPI,UploadFile,File,Form,Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from modules.load_vectorstore import load_vectorstore
from modules.llm import get_llm_chain
from modules.query_handlers import query_chain
from logger import logger
import os

from dotenv import load_dotenv
load_dotenv()

app=FastAPI(title="RagBot2.0")

# allow frontend

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

from fastapi.staticfiles import StaticFiles
os.makedirs("./uploaded_pdfs", exist_ok=True)
app.mount("/static", StaticFiles(directory="./uploaded_pdfs"), name="static")

@app.middleware("http")
async def catch_exception_middleware(request:Request,call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        logger.exception("UNHANDLED EXCEPTION")
        return JSONResponse(status_code=500,content={"error":str(exc)})
    
@app.post("/upload_pdfs/")
async def upload_pdfs(files:List[UploadFile]=File(...)):
    try:
        # Validate empty upload
        valid_files = [f for f in files if f.filename and f.filename.strip()]
        if not valid_files:
            return JSONResponse(status_code=400, content={"error": "No valid PDF files provided."})

        logger.info(f"recieved {len(valid_files)} files")
        load_vectorstore(valid_files)
        logger.info("documents added to chroma")
        return {"message":"Files processed and vectorstore updated"}
    except Exception as e:
        logger.exception("Error during pdf upload")
        return JSONResponse(status_code=500,content={"error": f"Failed to upload PDFs: {str(e)}"})


@app.post("/ask/")
async def ask_question(question: str = Form(...), chat_history: str = Form(default="")):
    try:
        # Validate empty question
        if not question or not question.strip():
            return JSONResponse(status_code=400, content={"error": "Question cannot be empty."})

        logger.info(f"user query: {question}")

        from langchain_huggingface import HuggingFaceEmbeddings
        from langchain_chroma import Chroma
        from modules.llm import get_llm_chain
        from modules.query_handlers import query_chain
        import os

        # 1. Chroma + Embedding setup
        chroma_db_path = os.getenv("CHROMA_DB_PATH", "./chroma_db")
        if not os.path.exists(chroma_db_path):
            return JSONResponse(status_code=400, content={"error": "Knowledge base is empty. Please upload a PDF first."})

        embed_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        
        vectorstore = Chroma(
            persist_directory=chroma_db_path, 
            embedding_function=embed_model
        )

        # 2. Native LangChain Retriever
        retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

        # 3. LLM + RetrievalQA chain
        chain = get_llm_chain(retriever, chat_history=chat_history)
        result = query_chain(chain, question)

        logger.info("query successful")
        return result

    except Exception as e:
        logger.exception("Error processing question")
        return JSONResponse(status_code=500, content={"error": f"Failed to generate answer: {str(e)}"})


@app.get("/documents/")
async def list_documents():
    """Return all PDF filenames currently stored on disk."""
    try:
        upload_dir = "./uploaded_pdfs"
        if not os.path.exists(upload_dir):
            return {"files": []}
        files = [f for f in os.listdir(upload_dir) if f.endswith(".pdf")]
        return {"files": files}
    except Exception as e:
        logger.exception("Error listing documents")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.delete("/documents/{filename}")
async def delete_document(filename: str):
    """Delete a PDF from disk and remove its embeddings from ChromaDB."""
    try:
        from langchain_huggingface import HuggingFaceEmbeddings
        from langchain_chroma import Chroma

        upload_dir = "./uploaded_pdfs"
        file_path = os.path.join(upload_dir, filename)

        # 1. Remove from disk
        if not os.path.exists(file_path):
            return JSONResponse(status_code=404, content={"error": f"File '{filename}' not found."})
        os.remove(file_path)
        logger.info(f"Deleted file: {file_path}")

        # 2. Remove embeddings from ChromaDB by matching source metadata
        chroma_db_path = os.getenv("CHROMA_DB_PATH", "./chroma_db")
        embed_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        vectorstore = Chroma(
            persist_directory=chroma_db_path,
            embedding_function=embed_model
        )
        collection = vectorstore._collection
        all_docs = collection.get(include=["metadatas"])

        ids_to_delete = [
            doc_id
            for doc_id, meta in zip(all_docs["ids"], all_docs["metadatas"])
            if filename in meta.get("source", "").replace("\\", "/")
        ]

        if ids_to_delete:
            collection.delete(ids=ids_to_delete)
            logger.info(f"Removed {len(ids_to_delete)} embeddings for '{filename}'")

        return {"message": f"'{filename}' deleted successfully.", "embeddings_removed": len(ids_to_delete)}

    except Exception as e:
        logger.exception("Error deleting document")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/summarize/")
async def summarize_documents(filenames: str = Form(default="")):
    """
    Summarize one or more uploaded PDFs using the existing LLM.
    Pass comma-separated filenames, or leave empty to summarize ALL uploaded PDFs.
    """
    try:
        from langchain_community.document_loaders import PyPDFLoader
        from langchain_groq import ChatGroq
        from langchain.prompts import PromptTemplate

        upload_dir = "./uploaded_pdfs"
        if not os.path.exists(upload_dir):
            return JSONResponse(status_code=400, content={"error": "No documents uploaded yet."})

        # Determine which files to summarize
        all_files = [f for f in os.listdir(upload_dir) if f.endswith(".pdf")]
        if not all_files:
            return JSONResponse(status_code=400, content={"error": "No PDF files found."})

        target_files = (
            [f.strip() for f in filenames.split(",") if f.strip()]
            if filenames.strip()
            else all_files
        )

        # Load and concatenate text from selected PDFs
        combined_text = ""
        file_labels = []
        for fname in target_files:
            path = os.path.join(upload_dir, fname)
            if not os.path.exists(path):
                continue
            loader = PyPDFLoader(path)
            pages = loader.load()
            combined_text += f"\n\n=== Document: {fname} ===\n"
            combined_text += "\n".join(p.page_content for p in pages)
            file_labels.append(fname)

        if not combined_text.strip():
            return JSONResponse(status_code=400, content={"error": "Could not extract text from the selected files."})

        # Truncate to avoid token limits (~12000 chars ≈ 3000 tokens, well within 8192)
        max_chars = 12000
        if len(combined_text) > max_chars:
            combined_text = combined_text[:max_chars] + "\n\n[... content truncated for summary ...]"

        # Build prompt
        groq_api_key = os.getenv("GROQ_API_KEY")
        llm = ChatGroq(groq_api_key=groq_api_key, model_name="llama-3.3-70b-versatile")

        prompt = PromptTemplate(
            input_variables=["content", "files"],
            template="""
You are an expert document analyst. Analyze the following document(s) and provide a structured summary.

Documents: {files}

Content:
{content}

---

Provide a detailed summary with the following sections (skip any section that is not applicable):

## 📄 Overview
A 2-3 sentence high-level description of what this document is about.

## 🔑 Key Skills / Technologies
List the main skills, tools, technologies, or concepts mentioned.

## 📌 Important Points
Bullet points of the most important facts, highlights, or takeaways.

## 💼 Projects / Experience
Describe any projects, work experience, or case studies mentioned.

## 📊 Additional Details
Any other relevant information worth noting.

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
