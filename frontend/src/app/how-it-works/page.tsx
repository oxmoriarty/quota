export default function HowItWorksPage() {
  return (
    <div className="container main-content" style={{ maxWidth: '800px' }}>
      <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 600, letterSpacing: '-0.04em', marginBottom: '1rem' }}>How Quota Works</h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--muted-foreground)' }}>
          Fair prize distribution powered by GenLayer's AI Consensus.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>1. Deploy a Vault</h2>
          <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
            When a team registers on Quota, the creator deploys an EVM-compatible Vault on the Base Sepolia network. 
            This smart contract is designed to hold the prize pool securely. Because we use an EIP-1167 Clone Factory, deploying a vault costs almost no gas.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>2. Submit Evidence</h2>
          <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
            As the hackathon progresses, team members submit evidence of their work directly to the project dashboard. 
            This can include GitHub PR links, Figma design files, research documents, or summaries of leadership tasks. 
            Everything is visible to all members to ensure complete transparency.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>3. GenLayer AI Evaluation</h2>
          <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
            Once the project ends, the vault is locked. Our backend Relayer submits all gathered evidence to the 
            GenLayer Intelligent Contract. Using GenVM's native LLM capabilities and the Equivalence Principle (Comparative Validators), 
            the AI impartially evaluates the exact proportional value of everyone's contribution and outputs an optimal percentage split.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>4. Review & Automatic Payout</h2>
          <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
            The AI's reasoning and percentage allocation are displayed on the dashboard. If the team agrees, the backend Relayer signs the payload. 
            Anyone can trigger the EVM Vault with this signature to automatically disburse the funds directly to everyone's wallets.
          </p>
        </section>
      </div>
    </div>
  );
}
