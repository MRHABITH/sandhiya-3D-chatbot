async def classify_intent(message: str) -> str:
    # TODO: Implement actual intent classification using LLM or weak classifier
    # For MVP, simple keyword matching or a default
    message_lower = message.lower()
    if "order" in message_lower:
        return "ORDER_STATUS"
    elif "refund" in message_lower:
        return "REFUND_REQUEST"
    else:
        return "GENERAL_QUERY"
