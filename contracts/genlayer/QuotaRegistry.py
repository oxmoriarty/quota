# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
import hashlib
import genlayer as gl
from genlayer import *

class QuotaRegistry(gl.Contract):
    projects: TreeMap[str, str]

    def __init__(self):
        pass

    @gl.public.write
    def create_project(self, project_id: str, vault_address: str) -> None:
        """
        Registers a new project on the platform and permanently links its EVM Vault address.
        """
        if project_id in self.projects:
            raise gl.vm.UserError("Project already exists.")

        project_data = {
            "creator": str(gl.message.sender_address),
            "vault_address": vault_address,
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
            raise gl.vm.UserError("Project does not exist.")
            
        project = json.loads(self.projects[project_id])
        
        if str(gl.message.sender_address) != project["creator"]:
            raise gl.vm.UserError("Only the project creator can close submissions.")
        
        if project["status"] != "Submissions Open":
            raise gl.vm.UserError("Submissions are not open.")
            
        project["status"] = "Submissions Closed"
        self.projects[project_id] = json.dumps(project)

    @gl.public.write
    def evaluate_contributions(self, project_id: str, evidence_url: str, expected_hash: str) -> None:
        """
        Fetches off-chain evidence and uses the LLM to determine prize allocation.
        """
        if project_id not in self.projects:
            raise gl.vm.UserError("Project does not exist.")
            
        project = json.loads(self.projects[project_id])
        
        if str(gl.message.sender_address) != project["creator"]:
            raise gl.vm.UserError("Only the project creator can evaluate contributions.")

        if project["status"] not in ["Submissions Closed", "Appeal in Progress"]:
            raise gl.vm.UserError("Project is not in a valid state for evaluation.")

        task = (
            "You are an impartial AI judge evaluating hackathon contributions. "
            "Based on the following JSON evidence of team submissions, output a strict JSON array "
            "where each object has 'wallet' (string) and 'percentage' (integer, basis points where 10000 = 100%). "
            "The sum of all percentages MUST equal exactly 10000. "
            "Do not include any Markdown formatting or extra text, just the raw JSON array.\n\n"
        )

        def run_llm() -> str:
            # Fetch off-chain evidence
            response = gl.nondet.web.get(evidence_url)
            evidence_text = response.body
            
            # Verify Integrity using the hash
            actual_hash = hashlib.sha256(evidence_text.encode('utf-8')).hexdigest()
            if actual_hash != expected_hash:
                raise gl.vm.UserError(f"Evidence tampering detected. Expected {expected_hash}, got {actual_hash}")
            
            prompt = task + f"Evidence:\n{evidence_text}"
            llm_response = gl.nondet.exec_prompt(prompt).replace("```json", "").replace("```", "")
            return llm_response

        # Use the documented gl.eq_principle.prompt_comparative signature
        final_allocation_str = gl.eq_principle.prompt_comparative(
            run_llm,
            principle="Both JSON arrays must represent a fair hackathon prize allocation. Small rounding differences are acceptable."
        )
        
        # Store allocations
        project["allocations"] = json.loads(final_allocation_str)
        project["status"] = "Allocation Finalized"
        self.projects[project_id] = json.dumps(project)

    @gl.public.write
    def start_appeal(self, project_id: str) -> None:
        if project_id not in self.projects:
            raise gl.vm.UserError("Project does not exist.")
            
        project = json.loads(self.projects[project_id])
        if project["status"] != "Allocation Finalized":
            raise gl.vm.UserError("Can only appeal a finalized allocation.")
            
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
            raise gl.vm.UserError("Project does not exist.")
        return self.projects[project_id]
