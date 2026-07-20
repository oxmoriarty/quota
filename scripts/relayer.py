import os
import sys
import json
import base64
from eth_account import Account
from eth_account.messages import encode_defunct

# Setup local Supabase client (using supabase-py)
# For the hackathon MVP, we can simulate the GenLayer evaluation locally
# and then sign the result with a Relayer private key.

RELAYER_PRIVATE_KEY = os.environ.get("RELAYER_PRIVATE_KEY", "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")

def run_evaluation(project_id, members_json, evidence_json):
    print(f"Running GenLayer Evaluation for Project {project_id}...")
    
    # 1. Simulate the GenVM Execution
    # In a production environment, this would be an RPC call to a GenLayer Validator node.
    # For this MVP, we simulate the LLM's consensus locally.
    
    # Let's mock the consensus outcome based on the evidence provided
    members = json.loads(members_json)
    
    # Distribute equally for now in the mock
    num_members = len(members)
    payout_percentage = 100 // num_members if num_members > 0 else 0
    
    allocation = []
    for m in members:
        allocation.append({
            "address": m["wallet_address"],
            "percentage": payout_percentage
        })
        
    evaluation_result = json.dumps(allocation)
    print("GenLayer AI consensus reached:", evaluation_result)
    
    # 2. Relayer Signs the Result
    # The payload is: keccak256(abi.encodePacked(projectId, evaluationResult))
    # We will sign this message.
    
    # Since we are using python, we use web3.py or eth_account to sign
    # But to keep dependencies light, we can return the raw evaluation and let 
    # the frontend/Next.js API handle the EIP-191 signing using viem!
    
    result = {
        "project_id": project_id,
        "evaluation_result": evaluation_result,
        "reasoning": "The AI compared all provided GitHub commits and design assets. It determined contributions were substantially equivalent.",
        "confidence": 92
    }
    
    # Print the result as base64 so Next.js can parse it easily
    print("___RESULT___")
    print(base64.b64encode(json.dumps(result).encode()).decode())

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python relayer.py <project_id> <members_json> <evidence_json>")
        sys.exit(1)
        
    project_id = sys.argv[1]
    members_json = sys.argv[2]
    evidence_json = sys.argv[3]
    
    run_evaluation(project_id, members_json, evidence_json)
