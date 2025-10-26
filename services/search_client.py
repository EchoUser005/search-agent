
import json
import aiohttp
import asyncio
from typing import Dict, List, Any
from config import BOCHA_API_KEY, BOCHA_URL, TOOL_TIMEOUT


async def search_keyword(session: aiohttp.ClientSession, keyword: str) -> Dict[str, Any]:
    try:
        payload = {"query": keyword, "summary": True, "count": 5}
        headers = {
            "Authorization": f"Bearer {BOCHA_API_KEY}",
            "Content-Type": "application/json"
        }

        async with session.post(BOCHA_URL, json=payload, headers=headers,
                                timeout=aiohttp.ClientTimeout(total=TOOL_TIMEOUT)) as resp:
            if resp.status == 200:
                data = await resp.json()
                if data.get("data") and data["data"].get("webPages"):
                    return {
                        keyword: [
                            {
                                "title": page.get("name"),
                                "url": page.get("url"),
                                "snippet": page.get("snippet")
                            }
                            for page in data["data"]["webPages"].get("value", [])[:3]
                        ]
                    }
            return {keyword: []}
    except Exception as e:
        return {keyword: [{"title": "错误", "snippet": str(e)}]}


async def search_keywords(keywords: List[str]) -> Dict[str, List[Dict[str, str]]]:
    async with aiohttp.ClientSession() as session:
        tasks = [search_keyword(session, kw) for kw in keywords]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        combined = {}
        for result in results:
            if isinstance(result, dict):
                combined.update(result)

        return combined