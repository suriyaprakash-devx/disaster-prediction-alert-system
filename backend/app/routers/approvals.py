from typing import List
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Approval, AgentRun, AgentStep
from app.schemas import ApprovalResponse, ApprovalActionRequest
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/approvals", tags=["Human Approvals"])

@router.get("", response_model=List[ApprovalResponse])
def list_approvals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return (
        db.query(Approval)
        .filter(Approval.organization_id == current_user.organization_id)
        .order_by(Approval.created_at.desc())
        .all()
    )

@router.post("/{approval_id}/action", response_model=ApprovalResponse)
def handle_approval_action(
    approval_id: str = Path(...),
    action_in: ApprovalActionRequest = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    approval = (
        db.query(Approval)
        .filter(
            Approval.id == approval_id,
            Approval.organization_id == current_user.organization_id
        )
        .first()
    )
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found.")

    if approval.status != "pending":
        raise HTTPException(status_code=400, detail=f"Approval has already been {approval.status}.")

    approval.status = "approved" if action_in.action == "approve" else "rejected"
    approval.decision_reason = action_in.reason or f"Action {action_in.action}d by {current_user.email}"
    approval.reviewed_by_id = current_user.id

    # Update associated AgentRun if present
    if approval.run_id:
        run = db.query(AgentRun).filter(AgentRun.id == approval.run_id).first()
        if run:
            run.status = "completed" if action_in.action == "approve" else "failed"
            step = AgentStep(
                run_id=run.id,
                step_number=4,
                node_name="human_decision_applied",
                status="completed",
                details={
                    "decision": approval.status,
                    "reviewer": current_user.email,
                    "reason": approval.decision_reason
                }
            )
            db.add(step)

    db.commit()
    db.refresh(approval)
    return approval
