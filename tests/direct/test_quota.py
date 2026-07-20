import pytest

def test_evaluate_contributions(direct_vm, direct_deploy, direct_alice, direct_bob):
    # Set the sender to direct_alice so she becomes the owner
    direct_vm.sender = direct_alice
    
    # Deploy the QuotaEvaluator contract
    contract = direct_deploy("contracts/genlayer/QuotaEvaluator.py", "project-001")
    
    members = '[{"address":"0x123", "role":"dev"}, {"address":"0x456", "role":"designer"}]'
    evidence = '{"0x123": "Built the entire backend and smart contracts", "0x456": "Created the design system"}'
    
    # Mock the LLM calls
    direct_vm.mock_llm(".*Hackathon Prize Allocator.*", '[{"address":"0x123", "percentage": 50}, {"address":"0x456", "percentage": 50}]')
    direct_vm.mock_llm(".*equivalent.*", "YES")
    
    # Execute the evaluation
    result = contract.evaluate_contributions(members, evidence)
    
    assert "50" in result
    assert contract.get_evaluation() == result

def test_evaluate_not_owner(direct_vm, direct_deploy, direct_alice, direct_bob):
    direct_vm.sender = direct_alice
    contract = direct_deploy("contracts/genlayer/QuotaEvaluator.py", "project-001")
    
    # Change sender to bob
    direct_vm.sender = direct_bob
    
    members = '[]'
    evidence = '{}'
    
    with pytest.raises(Exception, match="Only owner can trigger evaluation"):
        contract.evaluate_contributions(members, evidence)
