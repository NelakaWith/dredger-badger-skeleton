"""
Crawl4AI microservice for Ground-0 platform
Exposes Crawl4AI functionality via FastAPI for consumption by NestJS apps/api
"""
import os
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Crawl4AI Microservice (Showcase)", version="0.1.0")

class CrawlRequest(BaseModel):
    url: str
    javascript_enabled: bool = True
    wait_until: str = "networkidle"
    timeout: int = 10000

class CrawlResponse(BaseModel):
    url: str
    markdown: str
    raw_html: Optional[str] = None
    success: bool
    error: Optional[str] = None

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "crawl4ai-microservice"}

@app.post("/crawl", response_model=CrawlResponse)
async def crawl(request: CrawlRequest) -> CrawlResponse:
    # -------------------------------------------------------------------------
    # ARCHITECTURAL NOTE: The production implementation utilizes the Crawl4AI
    # library with advanced pruning strategies and JS execution handling.
    # It supports dynamic wait times, custom CSS selectors, and automated
    # markdown generation from messy HTML.
    # -------------------------------------------------------------------------
    return CrawlResponse(
        url=request.url,
        markdown="# Stubbed Content\n\nThis is a preview response from the crawler service.",
        raw_html="<html><body>Stubbed Content</body></html>",
        success=True
    )

@app.post("/crawl-batch")
async def crawl_batch(urls: List[str]):
    return [
        {
            "url": url,
            "markdown": "# Stubbed Content",
            "success": True
        } for url in urls
    ]

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("CRAWLER_PORT", 3001))
    uvicorn.run(app, host="0.0.0.0", port=port)
