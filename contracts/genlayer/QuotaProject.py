import genlayer as gl
import json
import hashlib

class QuotaProject(gl.Contract):
    def __init__(self, project_id: str, creator: str):
        self.project_id = project_id
        self.creator = creator
        self.status = "Submissions Open"
        self.final_allocations = {}
        self.appeals_active = False

    def close_submissions(self) -> None:
        """
        Transitions the project state to 'Submissions Closed'.
        Only the creator should be able to call this (authentication via msg_sender in future SDKs).
        """
        if gl.message.sender != self.creator:
            raise ValueError("Only the project creator can close submissions.")
        
        if self.status != "Submissions Open":
            raise ValueError("Submissions are not open.")
        
        self.status = "Submissions Closed"

    def evaluate_contributions(self, evidence_url: str, expected_hash: str) -> None:
        """
        Fetches the aggregated off-chain evidence from Supabase, verifies the hash,
        and uses the LLM to determine the prize allocation.
        """
        if self.status not in ["Submissions Closed", "Appeal in Progress"]:
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

        # Store allocations mapping wallet to percentage
        for item in allocations:
            self.final_allocations[item["wallet"]] = item["percentage"]

        self.status = "Allocation Finalized"

    def start_appeal(self) -> None:
        if self.status != "Allocation Finalized":
            raise ValueError("Can only appeal a finalized allocation.")
        self.status = "Appeal in Progress"

    def get_allocation(self, wallet: str) -> int:
        return self.final_allocations.get(wallet, 0)
