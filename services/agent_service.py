import json
from typing import AsyncGenerator, Dict, Any
from services.llm_client import stream_chat
from services.tool_service import execute_tools
from config import SYSTEM_PROMPT, MAX_AGENT_ITERATIONS
from datetime import datetime

async def run_agent_loop(user_query: str) -> AsyncGenerator[Dict[str, Any], None]:
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT+f"当前时间是{current_time}。"},
        {"role": "user", "content": f"用户当前查询是：{user_query}"}
    ]

    iteration = 0

    while iteration < MAX_AGENT_ITERATIONS:
        iteration += 1

        full_text_content = ""
        tool_calls_data = {}
        has_tool_calls = False

        async for chunk in stream_chat(messages):
            if chunk["type"] == "error":
                yield {
                    "type": "error",
                    "error": chunk["error"]
                }
                return

            elif chunk["type"] == "content":
                full_text_content += chunk["content"]
                yield {
                    "type": "content",
                    "content": chunk["content"]
                }

            elif chunk["type"] == "finish":
                tool_calls_data = chunk["tool_calls"]
                if tool_calls_data:
                    has_tool_calls = True

        if not has_tool_calls:
            yield {
                "type": "done"
            }
            break

        assistant_msg = {
            "role": "assistant",
            "content": full_text_content,
            "tool_calls": []
        }

        tool_calls_list = []
        for idx in sorted(tool_calls_data.keys()):
            tc = tool_calls_data[idx]
            tool_call = {
                "id": tc["id"],
                "type": "function",
                "function": {
                    "name": tc["name"],
                    "arguments": tc["arguments_chunks"]
                }
            }
            tool_calls_list.append(tool_call)
            assistant_msg["tool_calls"].append(tool_call)

            yield {
                "type": "tool_call",
                "tool_name": tc["name"],
                "arguments": tc["arguments_chunks"]
            }

        messages.append(assistant_msg)

        tool_results = await execute_tools(tool_calls_list)

        for tool_id, tool_result in tool_results.items():
            messages.append({
                "role": "tool",
                "tool_call_id": tool_id,
                "content": json.dumps(tool_result, ensure_ascii=False),
            })

            if tool_result.get("result"):
                yield {
                    "type": "tool_result",
                    "data": tool_result["result"]
                }