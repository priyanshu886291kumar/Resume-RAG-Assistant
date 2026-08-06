import os
import csv
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

from modules.load_vectorstore import CHROMA_DB_PATH
from modules.query_handlers import query_chain
from modules.llm import get_llm_chain

def run_evaluation():
    csv_path = "documents/csv/test_questions.csv"
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    if not os.path.exists(CHROMA_DB_PATH):
        print("Error: ChromaDB not found. Please index documents first.")
        return

    print("Loading vectorstore and LLM...")
    from langchain_huggingface import HuggingFaceEmbeddings
    from langchain_chroma import Chroma
    embed_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vectorstore = Chroma(persist_directory=CHROMA_DB_PATH, embedding_function=embed_model)
    
    llm, prompt = get_llm_chain(chat_history="")

    questions = []
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            questions.append(row)

    print(f"Found {len(questions)} questions. Running evaluation...")
    
    report_lines = [
        "# Disaster Management RAG Evaluation Report",
        "",
        "This report is generated automatically by `evaluate.py`.",
        "It tests the hallucination guard and retrieval accuracy of the assistant.",
        ""
    ]

    total_questions = len(questions)
    correct_answers = 0
    fallback_answers = 0
    retrieval_failures = 0
    hallucinations = 0
    total_chunks_retrieved = 0

    for i, item in enumerate(questions):
        # Extract ID, fallback to i+1
        qid = item.get("question_id", str(i+1)).replace("Q", "").lstrip("0")
        if not qid:
            qid = str(i+1)
            
        q = item.get("question", "")
        answer_present = item.get("answer_present_in_documents", "Yes").strip()
        likely_source = item.get("likely_source_document", "Unknown")
        
        print(f"Processing Question {qid}: {q}")
        try:
            result = query_chain(llm, prompt, vectorstore, q, k=3)
            answer = result["response"]
            sources = result["sources"]
            
            is_fallback = (
                "Not found in the provided documents." in answer or
                "I couldn't find this information in the provided disaster management documents." in answer
            )
            
            if is_fallback:
                answer = "Not found in the provided documents."
                sources = []
                fallback_answers += 1
                
                if answer_present == "Yes":
                    retrieval_failures += 1
                else:
                    correct_answers += 1
            else:
                if answer_present == "No":
                    hallucinations += 1
                else:
                    correct_answers += 1
            
            total_chunks_retrieved += len(sources)

            report_lines.append("-" * 50)
            report_lines.append(f"Question {qid}")
            report_lines.append("-" * 50)
            report_lines.append("")
            report_lines.append(f"**Question:** {q}")
            report_lines.append("")
            
            report_lines.append("**Expected Topic:**")
            if answer_present == "Yes" and likely_source:
                report_lines.append(likely_source)
            else:
                report_lines.append("")
                
            if answer_present == "Yes" and is_fallback:
                report_lines.append("")
                report_lines.append("⚠ Retrieval Failure")

            report_lines.append("")
            report_lines.append(f"**Generated Answer:**")
            report_lines.append(f"> {answer.replace(chr(10), chr(10)+'> ')}")
            report_lines.append("")
            report_lines.append("**Retrieved Sources:**")
            
            if sources:
                for src in sources:
                    filename = src.get("filename", "Unknown")
                    chunk = src.get("chunk_index", "")
                    score = round(src.get("score", 0.0), 3)
                    report_lines.append(f"- `{filename}` ({chunk}) — *Score: {score:.3f}*")
            else:
                report_lines.append("- No sources retrieved or hallucination guard triggered.")
            report_lines.append("")
            
        except Exception as e:
            print(f"Error on Question {qid}: {e}")
            report_lines.append("-" * 50)
            report_lines.append(f"Question {qid}")
            report_lines.append("-" * 50)
            report_lines.append(f"**Error:** {str(e)}")
            report_lines.append("")

    avg_chunks = total_chunks_retrieved / total_questions if total_questions > 0 else 0

    report_lines.extend([
        "-----------------------------------",
        "Evaluation Summary",
        "",
        f"Total Questions : {total_questions}",
        f"Correct Answers : {correct_answers}",
        f"Fallback Answers : {fallback_answers}",
        f"Retrieval Failures : {retrieval_failures}",
        f"Hallucinations : {hallucinations}",
        f"Average Retrieved Chunks : {avg_chunks:.1f}",
        "-----------------------------------"
    ])

    report_path = "evaluation_report.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))

    print(f"\nEvaluation complete. Report saved to {report_path}")

if __name__ == "__main__":
    run_evaluation()
