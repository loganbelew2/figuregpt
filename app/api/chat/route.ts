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
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
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
        max_tokens: 1000,
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

    let buffer = '';
    const encoder = new TextEncoder();

    // Create readable stream from the response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = deepseekResponse.body!.getReader();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // Flush any remaining buffered content
              if (buffer) {
                controller.enqueue(encoder.encode(`data: ${buffer}\n\n`));
              }
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              break;
            }

            // Decode the chunk and process it
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.trim() === '') continue;
              if (!line.startsWith('data: ')) continue;

              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  buffer += content;
                  // Only send complete sentences or phrases
                  if (content.match(/[.!?](\s|$)/) || buffer.length > 100) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      choices: [{
                        delta: { content: buffer }
                      }]
                    })}\n\n`));
                    buffer = '';
                  }
                }
              } catch (e) {
                console.error('Error parsing chunk:', e);
              }
            }
            
            // If we have buffered content but haven't received a new chunk in a while
            if (buffer) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                choices: [{
                  delta: { content: buffer }
                }]
              })}\n\n`));
              buffer = '';
            }
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