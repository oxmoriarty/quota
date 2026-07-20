# { "Depends": "py-genlayer:0.1.0" }

import json
import genlayer as gl
from genlayer import TreeMap

class QuotaRegistry(gl.Contract):
    projects: TreeMap[str, str]

    def __init__(self):
        pass

    @gl.public.write
    def create_project(self, project_id: str) -> None:
        """
        Registers a new project on the platform.
        """
        if project_id in self.projects:
            raise ValueError("Project already exists.")

        project_data = {
            "creator": gl.message.sender_address.as_hex,
            "status": "Submissions Open",
            "allocations": []
        }
        self.projects[project_id] = json.dumps(project_data)

    @gl.public.write
    def close_submissions(self, project_id: str) -> None:
        """
        Transitions the project state to 'Submissions Closed'.
        """
        if project_id not in self.projects:
            raise ValueError("Project does not exist.")
            
        project = json.loads(self.projects[project_id])
        
        if gl.message.sender_address.as_hex != project["creator"]:
            raise ValueError("Only the project creator can close submissions.")
        
        if project["status"] != "Submissions Open":
            raise ValueError("Submissions are not open.")
        
        project["status"] = "Submissions Closed"
        self.projects[project_id] = json.dumps(project)

    @gl.public.write
    def evaluate_contributions(self, project_id: str, evidence_url: str, expected_hash: str) -> None:
        """
        Fetches off-chain evidence and uses the LLM to determine prize allocation.
        """
        if project_id not in self.projects:
            raise ValueError("Project does not exist.")
            
        project = json.loads(self.projects[project_id])
        
        if gl.message.sender_address.as_hex != project["creator"]:
            raise ValueError("Only the project creator can evaluate contributions.")

        if project["status"] not in ["Submissions Closed", "Appeal in Progress"]:
            raise ValueError("Project is not in a valid state for evaluation.")

        # Non-deterministic block to process the external evidence and run the LLM
        def process_evidence() -> str:
            # 1. Fetch off-chain evidence (JSON containing member contributions)
            evidence_text = gl.get_webpage(evidence_url, mode="text")

            # 2. AI Reasoning
            prompt = (
                "You are an impartial AI judge evaluating hackathon contributions. "
                "Based on the following JSON evidence of team submissions, output a strict JSON array "
                "where each object has 'wallet' (string) and 'percentage' (integer, basis points where 10000 = 100%). "
                "The sum of all percentages MUST equal exactly 10000. "
                "Do not include any Markdown formatting or extra text, just the raw JSON array.\n\n"
                f"Evidence:\n{evidence_text}"
            )
            
            llm_response = gl.exec_prompt(prompt).replace("```json", "").replace("```", "")
            return json.dumps(json.loads(llm_response), sort_keys=True)

        # Use the strict equivalence principle to ensure all validators agree
        final_allocation_json = json.loads(gl.eq_principle_strict_eq(process_evidence))
        
        # Store allocations
        project["allocations"] = final_allocation_json
        project["status"] = "Allocation Finalized"
        self.projects[project_id] = json.dumps(project)

    @gl.public.write
    def start_appeal(self, project_id: str) -> None:
        if project_id not in self.projects:
            raise ValueError("Project does not exist.")
            
        project = json.loads(self.projects[project_id])
        if project["status"] != "Allocation Finalized":
            raise ValueError("Can only appeal a finalized allocation.")
            
        project["status"] = "Appeal in Progress"
        self.projects[project_id] = json.dumps(project)

    @gl.public.view
    def get_project_status(self, project_id: str) -> str:
        if project_id not in self.projects:
            return "Not Found"
        project = json.loads(self.projects[project_id])
        return project["status"]

    @gl.public.view
    def get_project(self, project_id: str) -> str:
        """
        Returns the project data as a JSON string.
        """
        if project_id not in self.projects:
            raise ValueError("Project does not exist.")
        return self.projects[project_id]
