Direct Tests
Fast, in-memory tests for intelligent contracts. No server, no Docker, no consensus — just pure logic testing at ~30ms per test.

Running Tests
pytest tests/direct/ -v
pytest tests/direct/test_specific.py::test_one -v

Basic Pattern
def test_set_and_get(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/my_contract.py")
    direct_vm.sender = direct_alice
    contract.set_data("hello")
    result = contract.get_data(direct_alice)
    assert result == "hello"

Fixtures
direct_vm	(VMContext with cheatcodes)
direct_deploy	(Deploy contract function)
direct_alice, direct_bob, direct_charlie	(Test addresses)
direct_owner	(Owner address)

Cheatcodes
direct_vm.sender = address — Set transaction sender
direct_vm.expect_revert("msg") — Expect a revert
direct_vm.prank(address) — Temporary sender change
direct_vm.snapshot() / revert(id) — State snapshots
direct_vm.warp("2024-06-01T12:00:00Z") — Time travel
direct_vm.mock_web(regex, response) — Mock HTTP calls
direct_vm.mock_llm(regex, response) — Mock LLM calls

Important
Direct mode runs the leader function only. Validator logic is not exercised. Use integration tests for consensus validation.