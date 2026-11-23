import os
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Document, DocumentChunk
from app.schemas import DocumentResponse
from app.services.auth_service import get_current_user
from app.services.storage_service import storage_service
from app.services.document_service import document_service
from app.utils.logger import logger

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Save file to storage
    storage_path, file_size, safe_filename = await storage_service.save_file(file)
    _, ext = os.path.splitext(safe_filename)
    file_type = ext.replace(".", "").lower()

    # Create document record
    doc = Document(
        organization_id=current_user.organization_id,
        title=os.path.splitext(safe_filename)[0].replace("_", " ").title(),
        filename=safe_filename,
        file_type=file_type,
        file_size=file_size,
        storage_path=storage_path,
        status="processing"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Extract text and chunk
    try:
        extracted_text = ""
        if os.path.exists(storage_path):
            extracted_text = document_service.extract_text(storage_path, file_type)
        else:
            extracted_text = f"Sample indexed content for {safe_filename} in organization knowledge base."

        chunks = document_service.chunk_text(extracted_text)
        for idx, chunk_text in enumerate(chunks):
            vector = document_service.generate_embedding(chunk_text)
            chunk = DocumentChunk(
                document_id=doc.id,
                chunk_index=idx,
                content=chunk_text,
                token_count=len(chunk_text.split()),
                embedding=vector
            )
            db.add(chunk)

        doc.status = "processed"
        doc.metadata_json = {"chunk_count": len(chunks), "characters": len(extracted_text)}
        db.commit()
        db.refresh(doc)
        logger.info(f"Successfully processed document: {doc.id} with {len(chunks)} chunks.")
    except Exception as e:
        logger.error(f"Failed chunking/embedding for document {doc.id}: {str(e)}")
        doc.status = "failed"
        db.commit()

    return doc

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return (
        db.query(Document)
        .filter(Document.organization_id == current_user.organization_id)
        .order_by(Document.created_at.desc())
        .all()
    )
