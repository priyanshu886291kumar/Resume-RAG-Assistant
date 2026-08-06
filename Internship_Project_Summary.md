# Internship Project Summary: Disaster Management RAG Assistant

**Objective**
The Disaster Management RAG Assistant addresses the critical need for rapid, reliable information retrieval during emergency situations. By allowing personnel to query extensive procedural documents (SOPs, evacuation plans, and risk assessments) through a conversational interface, the system solves the problem of information bottleneck during crises, delivering immediate, verifiable answers.

**Approach**
The system employs a full-stack Retrieval-Augmented Generation (RAG) architecture. Multi-format documents (PDF, Markdown, CSV, Excel) are automatically ingested through a unified loader. The text is segmented using overlapping chunking to preserve semantic boundaries. These chunks are embedded into dense vectors and persisted in a local ChromaDB instance. When a user issues a query, it undergoes semantic similarity search to retrieve the Top-K most relevant chunks. This context, along with conversational memory, is injected into a strict prompt. The LLM generates a grounded response, appending precise metadata citations (document name, page, and section) to ensure traceability.

**Technical Decisions**
- **LangChain:** Selected for its robust orchestration capabilities, simplifying the integration of diverse document loaders and vector stores.
- **ChromaDB:** Chosen as a lightweight, serverless vector database that operates entirely locally, ensuring data privacy and fast prototyping.
- **all-MiniLM-L6-v2:** Utilized for embeddings due to its exceptional balance of speed, low memory footprint, and high semantic accuracy.
- **RecursiveCharacterTextSplitter:** Implemented to maintain contextual integrity by prioritizing natural paragraph and sentence boundaries during chunking.
- **Groq Llama 3:** Selected for generation due to its ultra-low latency inference engine, which is vital for real-time emergency response.
- **FastAPI:** Chosen for the backend to leverage asynchronous processing and high performance in Python.
- **React:** Used for the frontend to build a highly responsive, component-driven user interface.

**Hallucination Prevention**
In disaster management, AI hallucinations pose a severe risk. The system mitigates this through a dual-layered approach. First, semantic retrieval utilizes a strict L2 distance threshold; if the Top-K retrieved chunks lack high semantic similarity to the query, the LLM is bypassed, and a deterministic fallback response is triggered. Second, the system employs strict prompt grounding, explicitly instructing the LLM to formulate answers exclusively from the retrieved context and prohibiting the generation of external information.

**Challenges Faced**
Developing a unified ingestion pipeline that seamlessly handles unstructured PDFs alongside highly structured CSVs and Excels required complex metadata management. Ensuring that granular metadata (like page numbers and section headers) survived the chunking process was critical for maintaining accurate source citations. Furthermore, tuning the Top-K retrieval and similarity thresholds demanded rigorous testing to achieve an optimal balance—preventing hallucinations without overly restricting valid, helpful responses.

**Results**
The project culminated in a robust, full-stack application that successfully ingests and processes PDF, Markdown, CSV, and Excel files. The assistant reliably produces answers strictly grounded in the uploaded documents, accompanied by exact source citations for immediate verification. System reliability is further validated by a built-in automated evaluation script that processes `test_questions.csv` and outputs a comprehensive `evaluation_report.md`.
