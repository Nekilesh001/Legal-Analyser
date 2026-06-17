import sys
import os
sys.path.insert(0, ".")

from app.services.rag_chat_service import answer_legal_question

questions = [
    # --- 5 In-Scope Questions ---
    "What is the penalty under the Minimum Wages Act 1948 for paying less than the minimum wage?",
    "Under the Payment of Gratuity Act 1972, how many years of continuous service are required to be eligible for gratuity?",
    "What notice period is required for employee termination under Section 25F of the Industrial Disputes Act 1947?",
    "What are the rules regarding maternity leave duration under the Maternity Benefit Act 1961?",
    "Can an employer deduct wages arbitrarily under the Payment of Wages Act 1936?",

    # --- 3 Out-of-Scope Questions ---
    "How do I bake a chocolate chip cookie?",
    "What is the capital of France?",
    "What was the score of the last cricket match between India and Australia?",

    # --- 2 Trick/Ambiguous Questions ---
    "Can you tell me the current minimum wage rate for software engineers in California?",
    "Does the Indian Penal Code have sections governing employee termination notice periods?"
]

output_file = "audit_qa_results.txt"
print(f"Starting Legal Chat Q&A Audit, outputting to {output_file}...")

with open(output_file, "w", encoding="utf-8") as f:
    for idx, q in enumerate(questions):
        print(f"Running question {idx+1}/{len(questions)}...")
        f.write(f"\n==================================================\n")
        f.write(f"QUESTION {idx+1}: {q}\n")
        
        # Call service
        try:
            res = answer_legal_question(q)
            f.write(f"LOW CONFIDENCE: {res.get('low_confidence')}\n")
            f.write(f"RETRIEVED CHUNKS: {res.get('retrieved_chunks')}\n")
            f.write(f"SOURCES: {res.get('sources')}\n")
            f.write(f"ANSWER:\n{res.get('answer')}\n")
        except Exception as err:
            f.write(f"ERROR: {err}\n")

print("Done! Audit results saved to audit_qa_results.txt.")
