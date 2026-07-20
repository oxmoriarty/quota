# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from genlayer import *

@gl.contract
class QuotaEvaluator:
    owner: Address
    project_id: str
    is_evaluated: bool
    evaluation_result: str

    def __init__(self, project_id: str):
        self.owner = gl.message.sender_account
        self.project_id = project_id
        self.is_evaluated = False
        self.evaluation_result = ""

    @gl.public.view
    def get_evaluation(self) -> str:
        return self.evaluation_result

    @gl.public.write
    def evaluate_contributions(self, members_json: str, evidence_json: str) -> str:
        if gl.message.sender_account != self.owner:
            raise gl.UserError("Only owner can trigger evaluation")

        if self.is_evaluated:
            raise gl.UserError("Project has already been evaluated")

        task = f"""
        You are an impartial Hackathon Prize Allocator. 
        Your task is to analyze the contributions of a hackathon team and distribute 100% of the prize pool among the members based on evidence.

        Team Members:
        {members_json}

        Evidence:
        {evidence_json}

        Rules:
        - Evaluate impact, difficulty, complexity, quality, leadership, research, design, and delivery.
        - Give fair weight to non-code work.
        - Total allocation must sum to exactly 100.
        - Output ONLY a valid JSON array of objects with keys 'address' and 'percentage'.
        - Percentage should be an integer.
        """

        def validator(leader_output: str, validator_output: str) -> bool:
            cmp_task = f"""
            Are these two hackathon prize allocations substantially equivalent in fairness?
            Leader: {leader_output}
            Validator: {validator_output}
            Answer exactly YES or NO.
            """
            res = gl.nondet.exec_prompt(cmp_task)
            return "YES" in res.upper()

        def run_llm() -> str:
            return gl.nondet.exec_prompt(task)

        result = gl.nondet.run(run_llm, consensus=gl.Consensus.Comparative(validator))
        
        self.evaluation_result = result
        self.is_evaluated = True
        return result
