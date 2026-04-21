const BigNumber = require('bignumber.js')
const {
  Account,
  Address,
  Contract,
  Keypair,
  Networks,
  SorobanRpc,
  TransactionBuilder,
  scValToNative,
} = require('@stellar/stellar-sdk')

const SOROBAN_RPC_URL = 'https://soroban-rpc.mainnet.stellar.network'
const STAKING_CONTRACT = 'CC72BEVVKHQ57PB5FCKAZYRXCSR6DOQSTN46QR7RZMMM64YWNRPDS24S'
const AQUA_TOKEN_CONTRACT = 'CAUIKL3IYGMERDRUN6YSCLWVAKIFG5Q4YJHUKM4S4NJZQIA3BAS6OJPK'
const AQUA_DECIMALS = 7

async function getLockedAqua() {
  const server = new SorobanRpc.Server(SOROBAN_RPC_URL)
  const sourceAccount = new Account(Keypair.random().publicKey(), '0')
  const aquaContract = new Contract(AQUA_TOKEN_CONTRACT)

  const tx = new TransactionBuilder(sourceAccount, {
    fee: '100',
    networkPassphrase: Networks.PUBLIC,
  })
    .addOperation(aquaContract.call('balance', new Address(STAKING_CONTRACT).toScVal()))
    .setTimeout(60)
    .build()

  const sim = await server.simulateTransaction(tx)
  if (sim.error || !sim.result || !sim.result.retval) {
    throw new Error(`Soroban simulateTransaction failed: ${sim.error || 'no retval'}`)
  }
  return scValToNative(sim.result.retval)
}

async function tvl() {
  const balance = await getLockedAqua()
  return {
    'coingecko:aquarius': BigNumber(balance.toString()).div(10 ** AQUA_DECIMALS).toFixed(0),
  }
}

module.exports = {
  timetravel: false,
  methodology:
    'Counts AQUA tokens locked in the WhaleHub staking contract on Stellar (Soroban). Users deposit AQUA and receive BLUB at a 1:1 ratio (plus 0.1 BLUB minted for the liquidity pool). The AQUA balance held by the staking contract is read from the AQUA Stellar Asset Contract via a Soroban RPC simulated balance() call.',
  stellar: {
    tvl,
  },
}
