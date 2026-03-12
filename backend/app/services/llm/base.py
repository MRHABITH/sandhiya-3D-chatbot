from abc import ABC, abstractmethod
from typing import List, Dict, Any

class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, context: List[Dict[str, Any]] = None, **kwargs) -> str:
        """
        Generates a response from the LLM based on the prompt and context.
        """
        pass
