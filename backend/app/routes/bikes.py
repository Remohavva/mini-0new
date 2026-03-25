from fastapi import APIRouter, Depends
import httpx
from app.dependencies import get_current_user
from app.supabase_client import supabase

router = APIRouter(prefix="/bikes", tags=["bikes"])

async def fetch_bike_image(model: str) -> str | None:
    """Search Wikimedia Commons for a bike image."""
    try:
        query = model.strip()
        url = f"https://en.wikipedia.org/w/api.php?action=query&titles={query}&prop=pageimages&format=json&pithumbsize=600"
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.get(url, headers={"User-Agent": "Pillion/1.0"})
            data = res.json()
            pages = data.get("query", {}).get("pages", {})
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
    """Fetch and save bike image to user profile."""
    image_url = await fetch_bike_image(model)
    if image_url:
        supabase.table("profiles").update({"bike_image_url": image_url}).eq("id", current_user["id"]).execute()
    return {"image_url": image_url}
