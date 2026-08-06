"""
llm.py — LLM configuration and prompt template for the
          Disaster Management RAG Assistant.

Uses ChatGroq (LLaMA 3.3 70B) as the generation backend.
The prompt is strictly grounded — the LLM may ONLY answer from
the provided context and must cite source documents and sections.
"""

from langchain.prompts import PromptTemplate
from langchain_groq import ChatGroq
import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("Missing mandatory environment variable: GROQ_API_KEY")


def get_llm_chain(chat_history: str = ""):
    """
    Build and return the (llm, prompt) tuple used by query_handlers.py.

    The retriever is handled separately in query_handlers so that we can
    measure retrieval time and apply hallucination-protection thresholding
    before the LLM is ever called.
    """
    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY,
        model_name="llama-3.3-70b-versatile",
    )

    prompt = PromptTemplate(
        input_variables=["context", "question"],
        partial_variables={"chat_history": chat_history},
        template="""
You are an **expert Disaster Management AI Assistant**, trained exclusively on
official disaster management documents, SOPs, guidelines, and field reports.

Your role is to provide accurate, actionable, and clearly sourced answers to
questions about disaster preparedness, response, recovery, and mitigation.

---
🕒 **Conversation History** (for understanding follow-up questions only):
{chat_history}

📄 **Retrieved Context from Disaster Management Documents**:
{context}

🙋 **User Question**:
{question}

---

💬 **Strict Answer Rules**:
1. Answer ONLY using information present in the retrieved context above.
2. NEVER fabricate, invent, or infer facts not explicitly stated in the context.
3. If the context does not contain enough information, respond EXACTLY:
   "I couldn't find this information in the provided disaster management documents."
4. Always cite your source at the end of your answer using this format:
   📌 Source: [document name] | [Page / Section]
5. If multiple sources are used, list each on a separate line.
6. Be concise, professional, and actionable in your language.
7. Use bullet points or numbered lists for procedural steps when appropriate.
"""
    )

    return llm, prompt
