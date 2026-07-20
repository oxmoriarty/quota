Integration Tests
Run contracts against real GenLayer environments with full consensus validation — leader execution, validator verification, and finalization.

Running Tests
gltest tests/integration/ -v -s
gltest tests/integration/ -v -s --network localnet
gltest tests/integration/ -v -s --network testnet_bradbury

Test Pattern
from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded

def test_full_flow():
    factory = get_contract_factory("MyContract")
    contract = factory.deploy(args=[])
    receipt = contract.set_data(args=["hello"]).transact()
    assert tx_execution_succeeded(receipt)
    result = contract.get_data(args=[contract.address]).call()
    assert result == "hello"

Lifecycle vs Execution
ACCEPTED and FINALIZED are transaction lifecycle states, not proof that contract execution succeeded. A transaction can be accepted and finalized with an execution error, and failed execution applies no state changes. For deploy transactions, failed execution means no contract is created.

Always assert tx_execution_succeeded(receipt) before reading state, checking schema/code, or treating a missing contract as an infrastructure issue.

Direct vs Integration
Aspect	Direct	Integration
Speed	~30ms	seconds–minutes
Server	No	Yes
Consensus	Leader only	Full + validators
Write methods	Return values	Return receipts
Mocking	Supported	Real calls

Environments
GLSim — Lightweight, Python natively
Studio local — Full GenVM, Docker required
studio.genlayer.com — Hosted, no setup, gasless, rate-limited
Testnet Bradbury — Real network, funded accounts

Studio Rate Limits
studio.genlayer.com enforces per-IP limits: 60 req/min, 1000 req/hr, 10000 req/day. Hitting the limit returns HTTP 429 / -32429; wait for the current window to reset, throttle batch tests, or use localnet for heavy suites.

-32028 means the pending queue is full: up to 32 in-flight transactions per sender, with a separate per-contract cap. Wait for receipts instead of firing deploy/write transactions in parallel.

When to Use
Validating consensus behavior
Testing real web/LLM interactions
Smoke tests before deploy to testnet