from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Conversation, Message, DocumentChunk, Document
from app.schemas import ChatRequest, ChatResponse, Citation
from app.services.auth_service import get_current_user
from app.services.document_service import document_service
from app.services.groq_service import groq_service

router = APIRouter(prefix="/api/knowledge", tags=["Knowledge Base & RAG"])

@router.post("/chat", response_model=ChatResponse)
async def chat_rag(
    chat_in: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find or create conversation
    conv = None
    if chat_in.conversation_id:
        conv = (
            db.query(Conversation)
            .filter(
                Conversation.id == chat_in.conversation_id,
                Conversation.organization_id == current_user.organization_id
            )
            .first()
        )
    if not conv:
        conv = Conversation(
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            title=chat_in.message[:50]
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # Save user message
    user_msg = Message(
        conversation_id=conv.id,
        sender="user",
        content=chat_in.message
    )
    db.add(user_msg)
    db.commit()

    # RAG Retrieval: compute query embedding and find nearest document chunks
    query_vector = document_service.generate_embedding(chat_in.message)
    chunks_with_doc = (
        db.query(DocumentChunk, Document)
        .join(Document, DocumentChunk.document_id == Document.id)
        .filter(Document.organization_id == current_user.organization_id)
        .all()
    )

    scored_chunks = []
    for chunk, doc in chunks_with_doc:
        score = document_service.cosine_similarity(query_vector, chunk.embedding or [])
        scored_chunks.append((score, chunk, doc))

    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    top_chunks = scored_chunks[:3]

    citations: List[Citation] = []
    context_text = ""
    for score, chunk, doc in top_chunks:
        if score > 0.05:  # threshold
            snippet = chunk.content[:200] + ("..." if len(chunk.content) > 200 else "")
            citations.append(
                Citation(
                    document_id=doc.id,
                    title=doc.title,
                    chunk_index=chunk.chunk_index,
                    snippet=snippet
                )
            )
            context_text += f"\n[Source: {doc.title}]\n{chunk.content}\n"

    # Call Groq LLM
    system_prompt = (
        "You are DesignOps AI, an institutional enterprise knowledge copilot. "
        "Answer the user's inquiry accurately based on the provided enterprise context. "
        "Cite the document references where relevant. If the context does not contain the answer, "
        "rely on best practices while explicitly noting the scope."
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Enterprise Context:\n{context_text}\n\nQuestion: {chat_in.message}"}
    ]

    answer = await groq_service.chat_completion(messages)

    # Save assistant response
    assistant_msg = Message(
        conversation_id=conv.id,
        sender="assistant",
        content=answer,
        citations=[c.dict() for c in citations]
    )
    db.add(assistant_msg)
    db.commit()

    return ChatResponse(
        conversation_id=conv.id,
        answer=answer,
        citations=citations
    )
