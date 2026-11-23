import os
import uuid
import mimetypes
from typing import Tuple
from fastapi import UploadFile, HTTPException
from app.config import settings
from app.utils.logger import logger

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".csv", ".png", ".jpg", ".jpeg"}
ALLOWED_MIMETYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/csv",
    "image/png",
    "image/jpeg",
    "image/jpg",
}

class StorageService:
    def __init__(self):
        self.provider = settings.STORAGE_PROVIDER
        self.s3_client = None

        if self.provider == "s3" and settings.S3_BUCKET_NAME:
            try:
                import boto3
                kwargs = {
                    "aws_access_key_id": settings.S3_ACCESS_KEY,
                    "aws_secret_access_key": settings.S3_SECRET_KEY,
                    "region_name": settings.S3_REGION,
                }
                if settings.S3_ENDPOINT_URL:
                    kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
                self.s3_client = boto3.client("s3", **kwargs)
                logger.info(f"Initialized S3 storage client for bucket: {settings.S3_BUCKET_NAME}")
            except Exception as e:
                logger.error(f"Failed to initialize S3 storage client: {str(e)}")
                self.s3_client = None
        else:
            logger.warning(
                "Persistent S3 object storage is not configured. "
                "Uploaded files will be stored in local volume. "
                "In production on Render, configure S3/R2 environment variables for durability."
            )
            os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    def validate_file(self, file: UploadFile, content: bytes) -> str:
        # Check size
        if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB."
            )

        # Check filename & extension
        filename = file.filename or "uploaded_file"
        _, ext = os.path.splitext(filename.lower())
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file extension '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )

        # Basic path traversal guard
        clean_name = os.path.basename(filename)
        return clean_name

    async def save_file(self, file: UploadFile) -> Tuple[str, int, str]:
        content = await file.read()
        safe_filename = self.validate_file(file, content)
        file_size = len(content)
        file_id = str(uuid.uuid4())
        ext = os.path.splitext(safe_filename)[1]
        unique_name = f"{file_id}{ext}"

        if self.provider == "s3" and self.s3_client:
            try:
                self.s3_client.put_object(
                    Bucket=settings.S3_BUCKET_NAME,
                    Key=unique_name,
                    Body=content,
                    ContentType=file.content_type or "application/octet-stream"
                )
                storage_path = f"s3://{settings.S3_BUCKET_NAME}/{unique_name}"
                return storage_path, file_size, safe_filename
            except Exception as e:
                logger.error(f"S3 upload failed: {str(e)}")
                raise HTTPException(status_code=500, detail="Failed to upload file to cloud object storage.")

        # Local storage fallback
        dest_path = os.path.join(settings.UPLOAD_DIR, unique_name)
        with open(dest_path, "wb") as f:
            f.write(content)
        return dest_path, file_size, safe_filename

storage_service = StorageService()
