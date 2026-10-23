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
            "allocations": [],
            "allocation_hash": ""
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
        Fetches off-chain evidence, verifies linked contribution sources (code diffs/content),
        and uses the LLM to determine prize allocation.
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
            "Based on the following Project Context and VERIFIED LINKED CONTRIBUTION SOURCES, output a strict JSON array "
            "where each object has 'wallet' (string) and 'percentage' (integer, basis points where 10000 = 100%). "
            "CRITICAL RULE 1: Do NOT judge solely on self-reported descriptions. You MUST inspect and verify the actual linked contribution sources (code diffs, commits, technical documentation). "
            "CRITICAL RULE 2: If a submission link failed to fetch, is broken, points to generic/unrelated pages, or lacks authentic contribution artifacts, assign that submission 0 weight. "
            "CRITICAL RULE 3: Reward each wallet based strictly on their verified contributions that align with the Project Context. "
            "CRITICAL RULE 4: To guarantee mathematical consensus across nodes, divide the 10000 basis points proportionally among all VALID verified contributions, sum them per wallet, and ensure the sum equals exactly 10000. If a wallet has 0 valid contributions, assign 0. "
            "The sum of all percentages MUST equal exactly 10000. "
            "Output ONLY a valid JSON array of objects with keys 'wallet' and 'percentage'. Do not include any Markdown formatting or extra text.\n\n"
        )

        def run_llm() -> str:
            # Fetch off-chain evidence bundle
            response = gl.nondet.web.get(evidence_url)
            evidence_bytes = response.body
            
            # Verify Integrity using the hash
            actual_hash = hashlib.sha256(evidence_bytes).hexdigest()
            if actual_hash != expected_hash:
                raise gl.vm.UserError(f"Evidence tampering detected. Expected {expected_hash}, got {actual_hash}")
            
            evidence_str = evidence_bytes.decode('utf-8')
            
            # Parse the JSON and verify each linked contribution source
            try:
                payload = json.loads(evidence_str)
                project_name = payload.get("project_name", "Unknown")
                project_desc = payload.get("project_description", "Unknown")
                submissions = payload.get("submissions", [])
                
                enriched_evidence = f"PROJECT NAME: {project_name}\nPROJECT DESCRIPTION: {project_desc}\n\nSUBMISSIONS AND VERIFIED SOURCES:\n"
                
                for sub in submissions:
                    wallet = sub.get('wallet')
                    role = sub.get('contribution_type')
                    desc = sub.get('description')
                    enriched_evidence += f"\n--- Contributor: {wallet} ({role}) ---\nClaimed: {desc}\n"
                    
                    links = sub.get("links", [])
                    if links and len(links) > 0:
                        for link in links[:3]:
                            if link and link.startswith("http"):
                                crawl_url = link
                                # For GitHub PR and commit URLs, fetch raw unified diffs for deep code inspection
                                if ("github.com" in link) and ("/pull/" in link or "/commit/" in link) and not (link.endswith(".diff") or link.endswith(".patch")):
                                    crawl_url = link + ".diff"
                                
                                try:
                                    content_bytes = gl.nondet.web.get(crawl_url).body
                                    content_str = content_bytes.decode('utf-8')
                                    enriched_evidence += f"Verified Source Content ({link}):\n{content_str[:2500]}\n"
                                except Exception:
                                    enriched_evidence += f"Source verification failed for {link}\n"
                    else:
                        enriched_evidence += "No linked contribution source provided.\n"
            except Exception:
                enriched_evidence = evidence_str
                
            prompt = task + f"Enriched Evidence:\n{enriched_evidence}"
            llm_response = gl.nondet.exec_prompt(prompt).replace("```json", "").replace("```", "").strip()
            return llm_response

        final_allocation_str = gl.eq_principle.prompt_comparative(
            run_llm,
            principle="Both JSON arrays must be identical in their allocation percentages, allowing for at most a 10 basis point variance."
        )
        
        # Store allocations and compute cryptographic allocation hash
        parsed_allocations = json.loads(final_allocation_str)
        project["allocations"] = parsed_allocations
        
        # Canonical string for vault payout binding: vault_address:wallet=pct,wallet=pct
        canonical_payout = f"{project.get('vault_address', '').lower()}:" + ",".join(
            f"{str(a.get('wallet', '')).lower()}={int(a.get('percentage', 0))}" for a in parsed_allocations
        )
        project["allocation_hash"] = hashlib.sha256(canonical_payout.encode('utf-8')).hexdigest()
        project["status"] = "Allocation Finalized"
        self.projects[project_id] = json.dumps(project)

    @gl.public.write
    def evaluate_appeal(self, project_id: str, evidence_url: str, expected_hash: str) -> None:
        """
        Fetches off-chain evidence again to re-verify contribution sources on appeal.
        """
        if project_id not in self.projects:
            raise gl.vm.UserError("Project does not exist.")
            
        project = json.loads(self.projects[project_id])
        
        if project["status"] != "Allocation Finalized":
            raise gl.vm.UserError("Can only appeal a finalized allocation.")

        task = (
            "You are an impartial AI judge evaluating hackathon contributions. "
            "Based on the following Project Context and VERIFIED LINKED CONTRIBUTION SOURCES, output a strict JSON array "
            "where each object has 'wallet' (string) and 'percentage' (integer, basis points where 10000 = 100%). "
            "CRITICAL RULE 1: Do NOT judge solely on self-reported descriptions. You MUST inspect and verify the actual linked contribution sources (code diffs, commits, technical documentation). "
            "CRITICAL RULE 2: If a submission link failed to fetch, is broken, points to generic/unrelated pages, or lacks authentic contribution artifacts, assign that submission 0 weight. "
            "CRITICAL RULE 3: Reward each wallet based strictly on their verified contributions that align with the Project Context. "
            "CRITICAL RULE 4: To guarantee mathematical consensus across nodes, divide the 10000 basis points proportionally among all VALID verified contributions, sum them per wallet, and ensure the sum equals exactly 10000. If a wallet has 0 valid contributions, assign 0. "
            "The sum of all percentages MUST equal exactly 10000. "
            "Output ONLY a valid JSON array of objects with keys 'wallet' and 'percentage'. Do not include any Markdown formatting or extra text.\n\n"
        )

        def run_llm() -> str:
            response = gl.nondet.web.get(evidence_url)
            evidence_bytes = response.body
            
            actual_hash = hashlib.sha256(evidence_bytes).hexdigest()
            if actual_hash != expected_hash:
                raise gl.vm.UserError(f"Evidence tampering detected. Expected {expected_hash}, got {actual_hash}")
            
            evidence_str = evidence_bytes.decode('utf-8')
            
            try:
                payload = json.loads(evidence_str)
                project_name = payload.get("project_name", "Unknown")
                project_desc = payload.get("project_description", "Unknown")
                submissions = payload.get("submissions", [])
                
                enriched_evidence = f"PROJECT NAME: {project_name}\nPROJECT DESCRIPTION: {project_desc}\n\nSUBMISSIONS AND VERIFIED SOURCES:\n"
                
                for sub in submissions:
                    wallet = sub.get('wallet')
                    role = sub.get('contribution_type')
                    desc = sub.get('description')
                    enriched_evidence += f"\n--- Contributor: {wallet} ({role}) ---\nClaimed: {desc}\n"
                    
                    links = sub.get("links", [])
                    if links and len(links) > 0:
                        for link in links[:3]:
                            if link and link.startswith("http"):
                                crawl_url = link
                                if ("github.com" in link) and ("/pull/" in link or "/commit/" in link) and not (link.endswith(".diff") or link.endswith(".patch")):
                                    crawl_url = link + ".diff"
                                try:
                                    content_bytes = gl.nondet.web.get(crawl_url).body
                                    content_str = content_bytes.decode('utf-8')
                                    enriched_evidence += f"Verified Source Content ({link}):\n{content_str[:2500]}\n"
                                except Exception:
                                    enriched_evidence += f"Source verification failed for {link}\n"
                    else:
                        enriched_evidence += "No linked contribution source provided.\n"
            except Exception:
                enriched_evidence = evidence_str
                
            prompt = task + f"Enriched Evidence:\n{enriched_evidence}"
            llm_response = gl.nondet.exec_prompt(prompt).replace("```json", "").replace("```", "").strip()
            return llm_response

        final_allocation_str = gl.eq_principle.prompt_comparative(
            run_llm,
            principle="Both JSON arrays must be identical in their allocation percentages, allowing for at most a 10 basis point variance."
        )
        
        parsed_allocations = json.loads(final_allocation_str)
        project["allocations"] = parsed_allocations
        
        canonical_payout = f"{project.get('vault_address', '').lower()}:" + ",".join(
            f"{str(a.get('wallet', '')).lower()}={int(a.get('percentage', 0))}" for a in parsed_allocations
        )
        project["allocation_hash"] = hashlib.sha256(canonical_payout.encode('utf-8')).hexdigest()
        project["status"] = "Appeal Resolved"
        self.projects[project_id] = json.dumps(project)

    @gl.public.view
    def get_payout_data(self, project_id: str) -> str:
        """
        Returns the finalized payout data including the cryptographic allocation hash.
        """
        if project_id not in self.projects:
            raise gl.vm.UserError("Project does not exist.")
        proj = json.loads(self.projects[project_id])
        data = {
            "status": proj.get("status"),
            "vault_address": proj.get("vault_address"),
            "allocations": proj.get("allocations", []),
            "allocation_hash": proj.get("allocation_hash", "")
        }
        return json.dumps(data)

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
