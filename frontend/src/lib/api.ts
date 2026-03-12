export interface ChatResponse {
    reply: string;
    text_response?: string;
    visualization_type?: string;
    scene?: string;
    asset_id?: string;
    animation?: boolean;
    dynamic_objects?: any[];
    sources?: Source[];
    escalated: boolean;
    ticket_id?: string;
}

export interface Source {
    title: string;
    url: string;
    snippet: string;
    score: number;
}

export interface ApiKeysResponse {
    success: boolean;
    message: string;
}

// Use environment variable for production, fallback to your deployed Vercel backend URL
// Use environment variable for production, fallback to local development URL
const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

export async function sendMessage(message: string, sessionId: string, userId: string = 'user-1'): Promise<ChatResponse> {
    console.log(`Attempting to fetch: ${API_BASE_URL}/chat`);
    const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            session_id: sessionId,
            user_id: userId,
            message: message,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server Error (${response.status}): ${errorText || response.statusText}`);
    }

    return response.json();
}

export async function saveApiKeys(groqApiKey: string, tripoApiKey: string, userId: string = 'user-1'): Promise<ApiKeysResponse> {
    console.log(`Attempting to save API keys to: ${API_BASE_URL}/config/api-keys`);
    const response = await fetch(`${API_BASE_URL}/config/api-keys`, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            groq_api_key: groqApiKey,
            tripo_api_key: tripoApiKey,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save API keys (${response.status}): ${errorText || response.statusText}`);
    }

    return response.json();
}
