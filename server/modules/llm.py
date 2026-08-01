from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain_groq import ChatGroq
import os
from dotenv import load_dotenv

load_dotenv()

# Load Groq API key — get a free key at https://console.groq.com
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("Missing mandatory environment variable: GROQ_API_KEY")

print("GROQ KEY:", GROQ_API_KEY[:12])

def get_llm_chain(retriever, chat_history: str = ""):
    # Using Groq's free LLaMA3 model — fast and no billing required
    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY,
        model_name="llama-3.3-70b-versatile"
    )

    # chat_history is injected via partial_variables so RetrievalQA
    # only sees "context" and "question" as required inputs
    prompt = PromptTemplate(
        input_variables=["context", "question"],
        partial_variables={"chat_history": chat_history},
        template="""
You are an **AI Resume Assistant**, trained to help users understand documents and resumes.

Your job is to provide clear, accurate, and helpful responses based **ONLY on the provided context**.
You should also use the previous chat history to understand the context of the user's question if necessary.

---
🕒 **Chat History**:
{chat_history}

🔍 **Context**:
{context}

🙋 **User Question**:
{question}

---

💬 **Answer Rules**:
- Answer ONLY from retrieved documents.
- Never use your own knowledge or hallucinate information.
- If the information is missing from the context, reply exactly: "I couldn't find this information in the uploaded documents."
- Quote document facts accurately.
- Mention sources after every answer.
"""
    )

    return RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        chain_type_kwargs={"prompt": prompt},
        return_source_documents=True
    )
