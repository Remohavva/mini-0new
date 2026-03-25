from fastapi import APIRouter, Depends
import httpx
from app.dependencies import get_current_user
from app.supabase_client import supabase

router = APIRouter(prefix="/bikes", tags=["bikes"])

async def fetch_bike_image(model: str) -> str | None:
    """Try multiple sources to find a bike image."""
    queries = [
        model.strip(),
        model.strip() + " motorcycle",
        model.strip().split()[0] + " motorcycle",  # just brand name
    ]
    async with httpx.AsyncClient(timeout=8) as client:
        for query in queries:
            # 1. Wikipedia pageimages
            try:
                url = (
                    f"https://en.wikipedia.org/w/api.php"
                    f"?action=query&titles={query}&prop=pageimages"
                    f"&format=json&pithumbsize=800&redirects=1"
                )
                res = await client.get(url, headers={"User-Agent": "Pillion/1.0"})
                data = res.json()
                pages = data.get("query", {}).get("pages", {})
                for page in pages.values():
                    thumb = page.get("thumbnail", {}).get("source")
                    if thumb:
                        return thumb
            except Exception:
                pass

            # 2. Wikipedia search → first result → pageimage
            try:
                search_url = (
                    f"https://en.wikipedia.org/w/api.php"
                    f"?action=query&list=search&srsearch={query}"
                    f"&format=json&srlimit=1"
                )
                res = await client.get(search_url, headers={"User-Agent": "Pillion/1.0"})
                results = res.json().get("query", {}).get("search", [])
                if results:
                    title = results[0]["title"]
                    img_url = (
                        f"https://en.wikipedia.org/w/api.php"
                        f"?action=query&titles={title}&prop=pageimages"
                        f"&format=json&pithumbsize=800"
                    )
                    res2 = await client.get(img_url, headers={"User-Agent": "Pillion/1.0"})
                    pages = res2.json().get("query", {}).get("pages", {})
                    for page in pages.values():
                        thumb = page.get("thumbnail", {}).get("source")
                        if thumb:
                            return thumb
            except Exception:
                pass

    return None

@router.get("/image")
async def get_bike_image(model: str, current_user=Depends(get_current_user)):
    image_url = await fetch_bike_image(model)
    return {"image_url": image_url}

@router.post("/save-image")
async def save_bike_image(model: str, current_user=Depends(get_current_user)):
    image_url = await fetch_bike_image(model)
    if image_url:
        supabase.table("profiles").update({"bike_image_url": image_url}).eq("id", current_user["id"]).execute()
    return {"image_url": image_url}
