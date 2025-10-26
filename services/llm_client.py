import asyncio
import json
from typing import AsyncGenerator, List, Dict, Any
from openai import OpenAI, AsyncOpenAI
from config import QWEN_API_KEY, QWEN_BASE_URL, QWEN_MODEL, SEARCH_TOOL_SCHEMA, LLM_TIMEOUT

client = AsyncOpenAI(
    api_key=QWEN_API_KEY,
    base_url=QWEN_BASE_URL,
)


async def stream_chat(messages: List[Dict[str, Any]]) -> AsyncGenerator[Dict[str, Any], None]:
    try:
        stream = await client.chat.completions.create(
            model=QWEN_MODEL,
            messages=messages,
            tools=[SEARCH_TOOL_SCHEMA],
            stream=True,
            timeout=LLM_TIMEOUT,
        )

        full_text_content = ""
        tool_calls_data = {}

        async for chunk in stream:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full_text_content += content
                yield {
                    "type": "content",
                    "content": content
                }

            if chunk.choices[0].delta.tool_calls:
                for tool_call_delta in chunk.choices[0].delta.tool_calls:
                    idx = tool_call_delta.index

                    if idx not in tool_calls_data:
                        tool_calls_data[idx] = {
                            "name": tool_call_delta.function.name if tool_call_delta.function else None,
                            "arguments_chunks": "",
                            "id": tool_call_delta.id if hasattr(tool_call_delta, 'id') else None,
                        }

                    if tool_call_delta.function and tool_call_delta.function.arguments:
                        tool_calls_data[idx]["arguments_chunks"] += tool_call_delta.function.arguments

        yield {
            "type": "finish",
            "full_text": full_text_content,
            "tool_calls": tool_calls_data
        }

    except asyncio.TimeoutError:
        yield {
            "type": "error",
            "error": "LLM request timeout"
        }
    except Exception as e:
        yield {
            "type": "error",
            "error": str(e)
        }