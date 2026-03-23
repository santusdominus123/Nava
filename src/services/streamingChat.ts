import { ChatMessage } from '../types';

const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const SYSTEM_PROMPT = `You are a Christian Bible assistant.
Your answers must be based on biblical teachings.
Explain scripture clearly and respectfully.
Do not invent theology outside the Bible.
Keep answers simple and supportive.
Always include relevant Bible verse references in your answers.
Respond in the same language the user uses.`;

export type StreamCallback = (chunk: string, fullText: string) => void;
export type StreamCompleteCallback = (fullText: string) => void;
export type StreamErrorCallback = (error: string) => void;

export async function sendStreamingChatMessage(
  message: string,
  history: ChatMessage[],
  onChunk: StreamCallback,
  onComplete: StreamCompleteCallback,
  onError: StreamErrorCallback,
): Promise<void> {
  if (!API_KEY) {
    onError('API key is not configured. Please add your OpenAI API key to the .env file.');
    return;
  }

  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...history.slice(-10).map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user' as const, content: message },
  ];

  try {
    // React Native doesn't support ReadableStream, so use non-streaming
    // but simulate typing effect for better UX
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', errorText);
      onError('Sorry, I could not process your request right now. Please try again later.');
      return;
    }

    const data = await response.json();
    const fullText = data.choices?.[0]?.message?.content?.trim();

    if (!fullText) {
      onError('I could not generate a response. Please try again.');
      return;
    }

    // Simulate streaming typing effect for smooth UX
    const words = fullText.split(' ');
    let accumulated = '';
    for (let i = 0; i < words.length; i++) {
      accumulated += (i === 0 ? '' : ' ') + words[i];
      onChunk(words[i], accumulated);
      // Small delay between words for typing effect
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    onComplete(fullText);
  } catch (error) {
    console.error('Chat error:', error);
    onError('Unable to connect to the AI service. Please check your internet connection and try again.');
  }
}

// Fallback non-streaming version (for devices that don't support ReadableStream)
export async function sendChatMessageFallback(
  message: string,
  history: ChatMessage[],
): Promise<string> {
  if (!API_KEY) {
    return 'API key is not configured.';
  }

  try {
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...history.slice(-10).map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return 'Sorry, I could not process your request. Please try again later.';
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || 'I could not generate a response.';
  } catch {
    return 'Unable to connect. Please check your internet connection.';
  }
}
