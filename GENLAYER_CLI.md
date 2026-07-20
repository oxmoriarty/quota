GenLayer CLI
The command-line interface for deploying, calling, and debugging intelligent contracts across all GenLayer networks.

Setup
npm install -g genlayer

Core Commands
Command	Purpose
genlayer deploy --contract file.py	Deploy a contract
genlayer call	Read (view) call
genlayer write	Write transaction
genlayer receipt	Get transaction receipt
genlayer schema	View contract ABI
genlayer code	View deployed source

Network Management
genlayer network set testnet-bradbury
genlayer network info
genlayer network list

Networks: localnet, testnet-asimov, testnet-bradbury, mainnet

Studio Rate Limits
studionet is gasless but rate-limited per IP: 60 req/min, 1000 req/hr, 10000 req/day. Batch deploy/write scripts can trip HTTP 429 / -32429; wait for the window to reset, throttle submissions, or use localnet for heavy batches.

-32028 indicates the pending-queue cap: up to 32 in-flight transactions per sender, plus a separate per-contract cap. Wait for receipts between batches.

Debugging Workflow
1. Get receipt:  genlayer receipt <txHash> --stdout --stderr
2. Check execution result; ACCEPTED/FINALIZED can still contain execution errors
3. Check schema: genlayer schema <address>
4. Read source:  genlayer code <address>
5. Try read:     genlayer call <address> <view_method>
6. Appeal:       genlayer appeal <txHash>

Lifecycle vs Execution
ACCEPTED and FINALIZED mean the network accepted or finalized the transaction outcome. They do not mean contract code executed successfully. If deploy execution fails, no contract is created, so missing code/schema is expected until the receipt shows execution success.

Account Management
genlayer account create --name dev1
genlayer account use dev1
genlayer account list
genlayer account send 0x123...abc 10gen