const { createClient } = require('genlayer-js');
const { testnetBradbury } = require('genlayer-js/chains');

async function main() {
  const client = createClient({
    chain: testnetBradbury,
  });

  const schema = await client.getContractSchema({ address: '0x3163c404Ba8626Aa863C308f83c832A5f17e9954' });
  console.log(JSON.stringify(schema, null, 2));
}

main().catch(console.error);
