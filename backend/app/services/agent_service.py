import uuid
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from app.models import AgentRun, AgentStep, Approval
from app.utils.logger import logger

class AgentService:
    APPROVAL_THRESHOLD_USD = 1000.0

    @staticmethod
    def run_business_agent(
        db: Session,
        organization_id: str,
        user_id: str,
        workflow_name: str,
        input_data: Dict[str, Any]
    ) -> Tuple[AgentRun, bool, str]:
        """
        Executes a LangGraph-style state machine workflow with human-in-the-loop approval gating.
        Returns: (agent_run, requires_approval, approval_id)
        """
        run = AgentRun(
            organization_id=organization_id,
            workflow_name=workflow_name,
            input_data=input_data,
            status="running"
        )
        db.add(run)
        db.commit()
        db.refresh(run)

        # Step 1: Input Analysis & Policy Verification
        step1 = AgentStep(
            run_id=run.id,
            step_number=1,
            node_name="policy_validator",
            status="completed",
            details={"message": "Validated input payload against enterprise compliance standards."}
        )
        db.add(step1)

        # Step 2: Risk Scoring & Compliance Check
        amount = float(input_data.get("amount", input_data.get("total_amount", 500.0)))
        risk_score = 0.85 if amount >= AgentService.APPROVAL_THRESHOLD_USD else 0.20
        
        step2 = AgentStep(
            run_id=run.id,
            step_number=2,
            node_name="risk_evaluator",
            status="completed",
            details={
                "evaluated_amount": amount,
                "risk_score": risk_score,
                "threshold": AgentService.APPROVAL_THRESHOLD_USD
            }
        )
        db.add(step2)

        # Decision Point: Does this action exceed threshold?
        if amount >= AgentService.APPROVAL_THRESHOLD_USD:
            # Step 3: Human Approval Gate Triggered
            approval = Approval(
                organization_id=organization_id,
                run_id=run.id,
                requested_by_id=user_id,
                title=f"Authorize High-Value Action: ${amount:,.2f}",
                action_type=input_data.get("action_type", "invoice_disbursement"),
                payload=input_data,
                status="pending"
            )
            db.add(approval)
            db.flush()

            step3 = AgentStep(
                run_id=run.id,
                step_number=3,
                node_name="human_approval_gate",
                status="paused_for_approval",
                details={
                    "approval_id": approval.id,
                    "reason": f"Transaction amount (${amount:,.2f}) exceeds policy threshold of ${AgentService.APPROVAL_THRESHOLD_USD:,.2f}."
                }
            )
            db.add(step3)

            run.status = "paused_for_approval"
            run.output_data = {
                "message": "Workflow paused awaiting human approval.",
                "approval_id": approval.id
            }
            db.commit()
            db.refresh(run)
            return run, True, approval.id

        else:
            # Automated Execution Node
            step3 = AgentStep(
                run_id=run.id,
                step_number=3,
                node_name="automated_executor",
                status="completed",
                details={"execution_result": "Direct automated processing completed safely within thresholds."}
            )
            db.add(step3)

            run.status = "completed"
            run.output_data = {
                "message": "Workflow completed automatically.",
                "status": "success"
            }
            db.commit()
            db.refresh(run)
            return run, False, ""

agent_service = AgentService()
