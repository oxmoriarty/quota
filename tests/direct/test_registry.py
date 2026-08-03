import pytest
import json

def test_create_and_close_project(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/genlayer/QuotaRegistry.py")
    
    # Alice creates a project
    direct_vm.sender = direct_alice
    contract.create_project("proj-001")
    
    status = contract.get_project_status("proj-001")
    assert status == "Submissions Open"
    
    project_data = json.loads(contract.get_project("proj-001"))
    assert project_data["creator"] == str(direct_alice)
    
    # Bob tries to close submissions, should fail
    direct_vm.sender = direct_bob
    with pytest.raises(Exception, match="Only the project creator can close submissions."):
        contract.close_submissions("proj-001")
        
    # Alice closes submissions
    direct_vm.sender = direct_alice
    contract.close_submissions("proj-001")
    
    status = contract.get_project_status("proj-001")
    assert status == "Submissions Closed"

def test_evaluate_contributions(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/genlayer/QuotaRegistry.py")
    
    direct_vm.sender = direct_alice
    contract.create_project("proj-002")
    contract.close_submissions("proj-002")
    
    evidence_url = "https://quota.example.com/api/evidence/proj-002"
    
    # Mock the web request for off-chain evidence
    evidence_payload = '{"0xabc": "Did the frontend", "0xdef": "Did the backend"}'
    direct_vm.mock_web(".*quota.example.com.*", evidence_payload)
    
    # Mock the LLM call that decides the allocation
    allocations = [
        {"wallet": "0xabc", "percentage": 5000},
        {"wallet": "0xdef", "percentage": 5000}
    ]
    direct_vm.mock_llm(".*impartial AI judge.*", json.dumps(allocations))
    
    # Evaluate
    contract.evaluate_contributions("proj-002", evidence_url, "hash_dummy")
    
    status = contract.get_project_status("proj-002")
    assert status == "Allocation Finalized"
    
    project_data = json.loads(contract.get_project("proj-002"))
    assert project_data["allocations"][0]["wallet"] == "0xabc"
    assert project_data["allocations"][1]["percentage"] == 5000

def test_start_appeal(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/genlayer/QuotaRegistry.py")
    
    direct_vm.sender = direct_alice
    contract.create_project("proj-003")
    contract.close_submissions("proj-003")
    
    direct_vm.mock_web(".*", "{}")
    direct_vm.mock_llm(".*", '[{"wallet": "0x123", "percentage": 10000}]')
    
    contract.evaluate_contributions("proj-003", "dummy", "hash")
    
    contract.start_appeal("proj-003")
    assert contract.get_project_status("proj-003") == "Appeal in Progress"
