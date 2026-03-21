import { ChatMessage } from '../types';

const SYSTEM_PROMPT = `You are a Christian Bible assistant.
Your answers must be based on biblical teachings.
Explain scripture clearly and respectfully.
Do not invent theology outside the Bible.
Keep answers simple and supportive.
Always include relevant Bible verse references in your answers.
Respond in the same language the user uses.`;

const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export async function sendChatMessage(
  message: string,
  history: ChatMessage[]
): Promise<string> {
  if (!API_KEY) {
    return 'API key is not configured. Please add your OpenAI API key to the .env file.';
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
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return 'Sorry, I could not process your request right now. Please try again later.';
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || 'I could not generate a response. Please try again.';
  } catch (error) {
    console.error('Chat error:', error);
    return 'Unable to connect to the AI service. Please check your internet connection and try again.';
  }
}
