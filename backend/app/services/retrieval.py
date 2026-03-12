from typing import List, Dict

async def retrieve_context(query: str, filters: dict = None) -> List[Dict]:
    # TODO: Implement RAG retrieval from Vector DB
    # For MVP, return mock context
    return [
        {
            "text": "Our return policy allows returns within 30 days of purchase.",
            "source": "https://acme.com/returns",
            "score": 0.95
        }
    ]
