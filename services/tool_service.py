import json
from typing import Dict, List, Any
from services.search_client import search_keywords


async def execute_tool(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    if tool_name == "search":
        keywords = arguments.get("keywords", [])
        if not keywords:
            return {"error": "No keywords provided"}

        return await search_keywords(keywords)

    return {"error": f"Unknown tool: {tool_name}"}


async def execute_tools(tool_calls: List[Dict[str, Any]]) -> Dict[str, Any]:
    results = {}

    for tool_call in tool_calls:
        tool_id = tool_call["id"]
        tool_name = tool_call["function"]["name"]
        arguments_str = tool_call["function"]["arguments"]

        try:
            arguments = json.loads(arguments_str)
            result = await execute_tool(tool_name, arguments)
            results[tool_id] = {
                "tool_name": tool_name,
                "result": result
            }
        except json.JSONDecodeError as e:
            results[tool_id] = {
                "tool_name": tool_name,
                "error": f"Failed to parse arguments: {str(e)}"
            }
        except Exception as e:
            results[tool_id] = {
                "tool_name": tool_name,
                "error": str(e)
            }

    return results