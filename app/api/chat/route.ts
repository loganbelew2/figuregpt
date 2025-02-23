import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Ensure CORS headers are set
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}

export async function POST(request: Request) {
  const controller = new AbortController();
  const { signal } = controller;

  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    };

    const json = await request.json();
    const { messages } = json;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400, headers }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500, headers }
      );
    }

    const deepseekResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': process.env.NEXT_PUBLIC_APP_NAME || 'Figure Gpt',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages,
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!deepseekResponse.ok) {
      const error = await deepseekResponse.json().catch(() => ({}));
      console.error('OpenRouter API Error:', {
        status: deepseekResponse.status,
        statusText: deepseekResponse.statusText,
        error,
      });
      return NextResponse.json(
        { error: 'OpenRouter API error', details: error },
        { status: deepseekResponse.status, headers }
      );
    }

    if (!deepseekResponse.body) {
      throw new Error('No response body available');
    }

    // Handle client disconnect
    request.signal.addEventListener('abort', () => {
      controller.abort();
      console.log('Client disconnected, aborting stream');
    });

    // Create readable stream from the response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = deepseekResponse.body!.getReader();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.close();
              break;
            }
            
            controller.enqueue(value);
          }
        } catch (error: any) {
          if (error?.name === 'AbortError') {
            console.log('Stream aborted');
            controller.close();
          } else {
            console.error('Stream error:', error);
            controller.error(error);
          }
        } finally {
          reader.releaseLock();
        }
      },
      cancel() {
        controller.abort();
      },
    });

    return new NextResponse(stream, { headers });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { 
        status: 500, 
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        } 
      }
    );
  }
} 