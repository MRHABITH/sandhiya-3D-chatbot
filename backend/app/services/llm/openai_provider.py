from .base import LLMProvider
from typing import List, Dict, Any
# import openai
from app.config import settings

class OpenAIProvider(LLMProvider):
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        # self.client = openai.AsyncOpenAI(api_key=self.api_key)

    async def generate(self, prompt: str, context: List[Dict[str, Any]] = None, **kwargs) -> str:
        # Placeholder for actual OpenAI call to avoid API cost during dev without key
        # In production:
        # response = await self.client.chat.completions.create(
        #     model="gpt-4-turbo-preview",
        #     messages=[{"role": "user", "content": prompt}]
        # )
        # return response.choices[0].message.content
        return f"Simulated OpenAI response for: {prompt[:50]}..."
