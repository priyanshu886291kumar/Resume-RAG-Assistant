"""
query_handlers.py — Retrieval, hallucination protection, and generation
                    for the Disaster Management RAG Assistant.

Hallucination Protection:
  ChromaDB with all-MiniLM-L6-v2 uses L2 (Euclidean) distance by default.
  Lower distance = more similar. A document with distance > SIMILARITY_THRESHOLD
  is considered semantically unrelated to the query. If ALL retrieved chunks
  exceed this threshold, the LLM is bypassed entirely and the user receives
  a safe fallback message.
  
  Threshold of 1.2 was chosen because:
    - Well-matched disaster management content typically scores 0.3–0.8
    - Marginally related content scores 0.9–1.2
    - Clearly off-topic queries (e.g. "recipe for pasta") score > 1.4
"""

import time
from logger import logger

# L2 distance threshold — queries where the best chunk exceeds this are
# considered "out of knowledge base" and receive the fallback response.
SIMILARITY_THRESHOLD = 1.2

FALLBACK_RESPONSE = (
    "Not found in the provided documents."
)


def query_chain(llm, prompt, vectorstore, user_input: str, k: int = 5):
    """
    Full RAG pipeline:
      1. Retrieve top-k chunks from ChromaDB with similarity scores.
      2. Apply hallucination-protection threshold.
      3. Pass context to the LLM and generate a grounded response.
      4. Return response + sources (with scores) for the frontend.

    Args:
        llm       : ChatGroq LLM instance from get_llm_chain()
        prompt    : PromptTemplate from get_llm_chain()
        vectorstore: Chroma vectorstore instance (not the retriever)
        user_input: The user's question string
        k         : Number of top chunks to retrieve (configurable)

    Returns:
        dict with keys: response, sources (list), scores (list)
    """
    try:
        logger.info(f"Running query: {user_input!r}")

        # ── 1. Retrieval with scores ──────────────────────────────────────────
        t0 = time.time()
        results_with_scores = vectorstore.similarity_search_with_score(
            user_input, k=k
        )
        retrieval_time = time.time() - t0
        logger.info(f"Retrieval time: {retrieval_time:.4f}s | {len(results_with_scores)} chunks returned")

        if not results_with_scores:
            logger.warning("No chunks retrieved from ChromaDB.")
            return {"response": FALLBACK_RESPONSE, "sources": [], "scores": []}

        # ── 2. Hallucination-protection threshold ─────────────────────────────
        # results_with_scores is a list of (Document, float) tuples.
        # Lower float = higher similarity (L2 distance).
        best_score = min(score for _, score in results_with_scores)
        logger.info(f"Best similarity score (L2 distance): {best_score:.4f}")

        if best_score > SIMILARITY_THRESHOLD:
            logger.warning(
                f"All retrieved chunks exceed similarity threshold "
                f"({best_score:.4f} > {SIMILARITY_THRESHOLD}). Returning fallback."
            )
            return {"response": FALLBACK_RESPONSE, "sources": [], "scores": []}

        # ── 3. Prepare context for the LLM ───────────────────────────────────
        docs = [doc for doc, _ in results_with_scores]
        scores = [float(score) for _, score in results_with_scores]

        context_str = "\n\n".join(
            f"[Source: {doc.metadata.get('filename', 'Unknown')} | "
            f"{doc.metadata.get('chunk_index', '')}]\n{doc.page_content}"
            for doc in docs
        )

        # ── 4. LLM Generation ─────────────────────────────────────────────────
        chain = prompt | llm
        t1 = time.time()
        result = chain.invoke({"context": context_str, "question": user_input})
        generation_time = time.time() - t1
        logger.info(f"Generation time: {generation_time:.4f}s")
        logger.info(f"Total query time: {retrieval_time + generation_time:.4f}s")

        # ── 5. Build source metadata for frontend citations ───────────────────
        sources = []
        for doc, score in results_with_scores:
            meta = doc.metadata
            source_path = meta.get("source", "")
            filename = (
                meta.get("filename")
                or (source_path.split("\\")[-1].split("/")[-1] if source_path else "Unknown")
            )
            sources.append({
                "filename": filename,
                "chunk_index": meta.get("chunk_index", ""),
                "doc_type": meta.get("doc_type", ""),
                "section": meta.get("section", ""),
                "score": round(score, 4),
            })

        response_text = result.content
        if "Not found in the provided documents." in response_text:
            response_text = "Not found in the provided documents."
            sources = []
            scores = []

        logger.debug(f"Response: {response_text[:120]}...")
        return {
            "response": response_text,
            "sources": sources,
            "scores": scores,
        }

    except Exception:
        logger.exception("Error in query_chain")
        raise