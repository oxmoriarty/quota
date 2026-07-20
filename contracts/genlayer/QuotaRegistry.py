import genlayer as gl
import json
import hashlib

class QuotaRegistry(gl.Contract):
    def __init__(self):
        # Dictionary mapping project_id (str) -> project data (dict)
        self.projects = {}

    def create_project(self, project_id: str) -> None:
        """
        Registers a new project on the platform.
        The caller (gl.message.sender) is automatically recorded as the creator.
        """
        if project_id in self.projects:
            raise ValueError("Project already exists.")

        self.projects[project_id] = {
            "creator": gl.message.sender,
            "status": "Submissions Open",
            "allocations": {}
        }

    def close_submissions(self, project_id: str) -> None:
        """
        Transitions the project state to 'Submissions Closed'.
        Only the project's creator can call this.
        """
        if project_id not in self.projects:
            raise ValueError("Project does not exist.")
            
        project = self.projects[project_id]
        
        if gl.message.sender != project["creator"]:
            raise ValueError("Only the project creator can close submissions.")
        
        if project["status"] != "Submissions Open":
            raise ValueError("Submissions are not open.")
        
        project["status"] = "Submissions Closed"
        self.projects[project_id] = project

    def evaluate_contributions(self, project_id: str, evidence_url: str, expected_hash: str) -> None:
        """
        Fetches off-chain evidence, verifies the hash, and uses the LLM to determine prize allocation.
        """
        if project_id not in self.projects:
            raise ValueError("Project does not exist.")
            
        project = self.projects[project_id]
        
        if gl.message.sender != project["creator"]:
            raise ValueError("Only the project creator can evaluate contributions.")

        if project["status"] not in ["Submissions Closed", "Appeal in Progress"]:
            raise ValueError("Project is not in a valid state for evaluation.")

        # Non-deterministic block to process the external evidence and run the LLM
        def process_evidence() -> str:
            # 1. Fetch off-chain evidence (JSON containing member contributions)
            response = gl.nondet.web.get(evidence_url)
            evidence_data = response.body

            # 2. Verify Integrity using the hash
            actual_hash = hashlib.sha256(evidence_data).hexdigest()
            if actual_hash != expected_hash:
                raise ValueError(f"[EXTERNAL] Evidence tampering detected. Expected {expected_hash}, got {actual_hash}")

            evidence_text = evidence_data.decode("utf-8")

            # 3. AI Reasoning
            prompt = (
                "You are an impartial AI judge evaluating hackathon contributions. "
                "Based on the following JSON evidence of team submissions, output a strict JSON array "
                "where each object has 'wallet' (string) and 'percentage' (integer, basis points where 10000 = 100%). "
                "The sum of all percentages MUST equal exactly 10000. "
                "Do not include any Markdown formatting or extra text, just the raw JSON array.\n\n"
                f"Evidence:\n{evidence_text}"
            )
            
            llm_response = gl.nondet.exec_prompt(prompt)
            return llm_response

        # Use the strict equivalence principle to ensure all validators agree on the resulting JSON allocation
        final_allocation_json = gl.eq_principle.strict_eq(process_evidence)

        # Parse and store the final allocation
        allocations = json.loads(final_allocation_json)
        
        # Validate that the sum is 10000
        total = sum(item["percentage"] for item in allocations)
        if total != 10000:
            raise ValueError("Total percentage allocation does not equal 10000 basis points.")

        # Store allocations
        project["allocations"] = allocations
        project["status"] = "Allocation Finalized"
        self.projects[project_id] = project

    def start_appeal(self, project_id: str) -> None:
        if project_id not in self.projects:
            raise ValueError("Project does not exist.")
            
        project = self.projects[project_id]
        if project["status"] != "Allocation Finalized":
            raise ValueError("Can only appeal a finalized allocation.")
            
        project["status"] = "Appeal in Progress"
        self.projects[project_id] = project

    def get_project_status(self, project_id: str) -> str:
        if project_id not in self.projects:
            return "Not Found"
        return self.projects[project_id]["status"]

    def get_project(self, project_id: str) -> str:
        """
        Returns the project data as a JSON string.
        """
        if project_id not in self.projects:
            raise ValueError("Project does not exist.")
        return json.dumps(self.projects[project_id])
