from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Product, ProductEmbedding
from app.schemas import ProductResponse, VisualSearchResult
from app.services.auth_service import get_current_user
from app.services.visual_search_service import visual_search_service

router = APIRouter(prefix="/api/products", tags=["Visual Product Search"])

@router.post("/visual-search", response_model=VisualSearchResult)
async def visual_search(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image uploaded.")

    # Generate query embedding
    query_vector = visual_search_service.compute_image_features(image_bytes)

    # Search against catalog
    matches = visual_search_service.search_similar_products(
        db=db,
        organization_id=current_user.organization_id,
        query_vector=query_vector,
        top_k=6
    )

    return VisualSearchResult(
        query_description=f"Visual search matching for '{file.filename}'",
        matches=[ProductResponse(**m) for m in matches]
    )

@router.get("", response_model=List[ProductResponse])
def list_products(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    products = (
        db.query(Product)
        .filter(Product.organization_id == current_user.organization_id)
        .order_by(Product.name.asc())
        .all()
    )
    return products
