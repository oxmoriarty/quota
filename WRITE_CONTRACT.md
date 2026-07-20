Write Contract
The core skill for building GenLayer intelligent contracts — Python classes that run on GenVM with built-in AI capabilities.

Critical: Pin the Runner Version
All GenLayer networks reject py-genlayer:test, py-genlayer:latest, and unversioned runner aliases. Every generated contract must start with a pinned runner dependency header:

# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
test and latest are local-development aliases for GenLayer runtime developers. They may work only in a specially configured local Studio environment with a GenLayer developer environment variable, but they do not work on GenLayer networks and must not appear in generated user contracts.

Before returning any contract code, verify:

The first line is a pinned Depends runner version hash
There is no py-genlayer:test
There is no py-genlayer:latest
There is no unversioned py-genlayer
What It Covers
Architecture Fit — Decide whether GenLayer should own the consensus/settlement step or whether the work belongs in a frontend/backend/off-chain LLM
Runner Header — Pinned py-genlayer version hashes are mandatory for GenLayer networks
Equivalence Principle — The critical decision: strict_eq for deterministic calls, independent verification for LLM/web operations
Validator Consensus — Schema-only validators are rejected as an anti-pattern; validators must rerun, derive, compare, or verify against source data
Runner Dependencies — Pin py-genlayer version hashes instead of using test, latest, or unversioned aliases
Storage Rules — TreeMap instead of dict, DynArray instead of list, u256 for money
LLM Resilience — Defensive parsing, key variation handling, aggressive coercion, JSON response format
Cross-Contract Calls — Synchronous reads, async writes with emit(), factory patterns
Error Classification — [EXPECTED], [EXTERNAL], [TRANSIENT], [LLM_ERROR] each with distinct validator behavior
Contract Skeleton
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *

@gl.contract
class MyContract:
    owner: Address
    items: TreeMap[str, Item]

    def __init__(self):
        self.owner = gl.message.sender_account

    @gl.public.view
    def get_item(self, item_id: str) -> dict:
        return {"id": item_id}

    @gl.public.write
    def set_item(self, item_id: str, value: str):
        if gl.message.sender_account != self.owner:
            raise gl.UserError("Only owner")
Runner Dependencies
Always pin a specific runner version hash in the contract's first line. All GenLayer networks reject test, latest, and unversioned runner aliases.

Contract Type	Dependency
Single-file Python	py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6
Multi-file Python package	py-genlayer-multi:06zyvrlivjga0d5jlpdbprksc0pa6jmllxvp8s20hq1l512vh5yk
Embeddings / semantic search	Add py-lib-genlayer-embeddings:0bmbm3cyfwxsyh454z53vxqjf47wz2q7smcqp1q4g4a6k2kidnyk before py-genlayer in a Seq block
Anti-Patterns
py-genlayer:test, py-genlayer:latest, or unversioned py-genlayer — All GenLayer networks reject runner aliases; pin the documented runner version hash
strict_eq() for LLM calls — LLM outputs are non-deterministic
Schema-only validators for LLM/web output — format checks do not verify the leader's answer
prompt_non_comparative for classification/scoring/extraction decisions — use comparative validation because decisions need substantive agreement
dict / list for storage — use TreeMap / DynArray
float for money — use atto-scale u256
Inserting fields in middle of dataclass — always append at END
Part of the genlayer-dev plugin. Install with /plugin install genlayer-dev@genlayerlabs