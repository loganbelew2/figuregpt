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
      'X-Accel-Buffering': 'no'
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

    // Create a transform stream to handle text buffering
    const textDecoder = new TextDecoder();
    let buffer = '';

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        // Decode the chunk and add to buffer
        buffer += textDecoder.decode(chunk, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          
          const data = line.slice(6);
          if (data === '[DONE]') {
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            continue;
          }
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              // Ensure proper handling of special characters and line breaks
              const formattedContent = content
                .replace(/\\n/g, '\n')
                .replace(/\\t/g, '\t')
                .replace(/\\r/g, '\r')
                .replace(/\\\\/g, '\\')
                .replace(/\\'/g, "'")
                .replace(/\\"/g, '"');
              
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ delta: { content: formattedContent } }] })}\n\n`));
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      },
      flush(controller) {
        // Process any remaining buffer
        if (buffer.trim() && buffer.startsWith('data: ')) {
          try {
            const data = buffer.slice(6);
            if (data !== '[DONE]') {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                const formattedContent = content
                  .replace(/\\n/g, '\n')
                  .replace(/\\t/g, '\t')
                  .replace(/\\r/g, '\r')
                  .replace(/\\\\/g, '\\')
                  .replace(/\\'/g, "'")
                  .replace(/\\"/g, '"');
                
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ delta: { content: formattedContent } }] })}\n\n`));
              }
            }
          } catch (e) {
            console.error('Error parsing final buffer:', e);
          }
        }
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
      }
    });

    // Handle client disconnect
    request.signal.addEventListener('abort', () => {
      controller.abort();
      console.log('Client disconnected, aborting stream');
    });

    // Pipe the response through the transform stream
    const stream = deepseekResponse.body
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(transformStream);

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