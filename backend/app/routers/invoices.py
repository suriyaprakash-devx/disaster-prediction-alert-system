import os
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Invoice, InvoiceItem
from app.schemas import InvoiceResponse
from app.services.auth_service import get_current_user
from app.services.invoice_service import invoice_service
from app.services.document_service import document_service
from app.services.storage_service import storage_service

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])

@router.post("/extract", response_model=InvoiceResponse)
async def extract_invoice(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    text_content = ""
    if file:
        storage_path, _, safe_filename = await storage_service.save_file(file)
        _, ext = os.path.splitext(safe_filename)
        file_type = ext.replace(".", "").lower()
        text_content = document_service.extract_text(storage_path, file_type)
    elif raw_text:
        text_content = raw_text
    else:
        raise HTTPException(status_code=400, detail="Provide an invoice file or raw_text string.")

    extracted = await invoice_service.extract_invoice_data(text_content)

    invoice = Invoice(
        organization_id=current_user.organization_id,
        invoice_number=extracted.get("invoice_number", "INV-UNKNOWN"),
        vendor_name=extracted.get("vendor_name", "Unknown Vendor"),
        invoice_date=extracted.get("invoice_date"),
        due_date=extracted.get("due_date"),
        subtotal=float(extracted.get("subtotal", 0.0)),
        tax_amount=float(extracted.get("tax_amount", 0.0)),
        total_amount=float(extracted.get("total_amount", 0.0)),
        currency=extracted.get("currency", "USD"),
        confidence_score=float(extracted.get("confidence_score", 0.95)),
        status="extracted",
        raw_text=text_content[:2000]
    )
    db.add(invoice)
    db.flush()

    for item_data in extracted.get("items", []):
        item = InvoiceItem(
            invoice_id=invoice.id,
            description=item_data.get("description", "Service / Goods"),
            quantity=float(item_data.get("quantity", 1.0)),
            unit_price=float(item_data.get("unit_price", 0.0)),
            total_price=float(item_data.get("total_price", 0.0))
        )
        db.add(item)

    db.commit()
    db.refresh(invoice)
    return invoice

@router.get("", response_model=List[InvoiceResponse])
def list_invoices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return (
        db.query(Invoice)
        .filter(Invoice.organization_id == current_user.organization_id)
        .order_by(Invoice.created_at.desc())
        .all()
    )
