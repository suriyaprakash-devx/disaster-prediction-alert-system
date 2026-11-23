from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, AgentRun, AgentStep
from app.schemas import AgentRunRequest, AgentRunResponse
from app.services.auth_service import get_current_user
from app.services.agent_service import agent_service

router = APIRouter(prefix="/api/agents", tags=["Agents"])

@router.post("/run", response_model=AgentRunResponse)
def run_agent(
    agent_in: AgentRunRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    run, requires_approval, approval_id = agent_service.run_business_agent(
        db=db,
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        workflow_name=agent_in.workflow_name,
        input_data=agent_in.input_data
    )

    steps = db.query(AgentStep).filter(AgentStep.run_id == run.id).order_by(AgentStep.step_number.asc()).all()

    return AgentRunResponse(
        id=run.id,
        workflow_name=run.workflow_name,
        status=run.status,
        input_data=run.input_data,
        output_data=run.output_data,
        steps=steps,
        requires_approval=requires_approval,
        approval_id=approval_id or None
    )

@router.get("/runs", response_model=List[AgentRunResponse])
def list_agent_runs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    runs = (
        db.query(AgentRun)
        .filter(AgentRun.organization_id == current_user.organization_id)
        .order_by(AgentRun.created_at.desc())
        .limit(20)
        .all()
    )
    result = []
    for r in runs:
        steps = db.query(AgentStep).filter(AgentStep.run_id == r.id).order_by(AgentStep.step_number.asc()).all()
        result.append(
            AgentRunResponse(
                id=r.id,
                workflow_name=r.workflow_name,
                status=r.status,
                input_data=r.input_data,
                output_data=r.output_data,
                steps=steps,
                requires_approval=(r.status == "paused_for_approval"),
                approval_id=None
            )
        )
    return result
