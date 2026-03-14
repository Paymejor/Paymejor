Dashboard Tab
- Getting Method not found (balanceError)
- Wallet balance have too many zeros (0.0000000)
- Shielded Position not active; Can't decrpyt "Reveal Position"
- Quick Actions buttons not active

Borrow Tab
Error: useVesu.ts:361 Error getting user position: Error: Vesu pool not configured for sepolia
    at useVesu.useCallback[getPoolAddress] (useVesu.ts:67:13)
    at useVesu.useCallback[getUserPosition] (useVesu.ts:328:27)
    at useVesuPositionCache.useCallback[fetchPosition] (useVesuCache.ts:67:18)
    at useCache.useCallback[fetchData] (useCache.ts:80:28)
    at useCache.useEffect (useCache.ts:163:9)

useVesu.ts:405 Error getting borrowing capacity: RpcError: RPC: starknet_call with params {
  "request": {
    "contract_address": "0x3a8416bf20d036df5b1cf3447630a2e1cb04685f6b0c3a70ed7fb1473548ecf",
    "entry_point_selector": "0x3e2f80b30fcf84a3a89e5cd5c95d384a7963af849687576135d516601b2b2fd",
    "calldata": [
      "0x4bfe06230268b81615920a6d52398884b42ff286a04963d0cb6095246b338de",
      "0x3fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac",
      "0x33068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb"
    ]
  },
  "block_id": "latest"
}

      21: Requested entrypoint does not exist in the contract: undefined
    at async useVesu.useCallback[getBorrowingCapacity] (useVesu.ts:386:22)
    at async useVesuBorrowingCapacityCache.useCallback[fetchCapacity] (useVesuCache.ts:99:12)
    at async useCache.useCallback[fetchData] (useCache.ts:80:22)


Position Tab
Error: useTongo.ts:203 Error getting Tongo balance: RpcError: RPC: starknet_call with params {
  "request": {
    "contract_address": "0x2caae365e67921979a4e5c16dd70eaa5776cfc6a9592bcb903d91933aaf2552",
    "entry_point_selector": "0x39e11d48192e4333233c7eb19d10ad67c362bb28580c604d67884c85da39695",
    "calldata": [
      "0x4",
      "0x30783263616165333635653637393231393739613465356331366464373065",
      "0x61613537373663666336613935393262636239303364393139333361616632",
      "0x3535325f307830346266653036323330323638623831363135393230613664",
      "0x35323339383838346234326666323836613034393633643063623630393532",
      "0x3436623333386465",
      "0x8",
      "0x53b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080"
    ]
  },
  "block_id": "latest"
}

      -32601: Method not found: ""
    at async useTongo.useCallback[getBalance] (useTongo.ts:183:22)
    at async useTongoDecryptedBalanceCache.useCallback[fetchDecryptedBalance] (useTongoCache.ts:35:51)
    at async useCache.useCallback[fetchData] (useCache.ts:80:22)

useVesu.ts:361 Error getting user position: RpcError: RPC: starknet_call with params {
  "request": {
    "contract_address": "0x3a8416bf20d036df5b1cf3447630a2e1cb04685f6b0c3a70ed7fb1473548ecf",
    "entry_point_selector": "0x17f7f367c32d5c92b20af585a08c645410d5c6a54539b245b72c4c40603b18c",
    "calldata": [
      "0x4bfe06230268b81615920a6d52398884b42ff286a04963d0cb6095246b338de"
    ]
  },
  "block_id": "latest"
}

      21: Requested entrypoint does not exist in the contract: undefined
    at RpcChannel2.errorHandler (rpc_0_10_0.ts:170:13)
    at RpcChannel2.fetchEndpoint (rpc_0_10_0.ts:197:12)
    at async useVesu.useCallback[getUserPosition] (useVesu.ts:332:22)
    at async useVesuPositionCache.useCallback[fetchPosition] (useVesuCache.ts:67:12)
    at async useCache.useCallback[fetchData] (useCache.ts:80:22)
error @ intercept-console-error.ts:42
useVesu.useCallback[getUserPosition] @ useVesu.ts:361
await in useVesu.useCallback[getUserPosition]
useVesuPositionCache.useCallback[fetchPosition] @ useVesuCache.ts:67
useCache.useCallback[fetchData] @ useCache.ts:80
useCache.useEffect @ useCache.ts:154
useVesu.ts:448 Error getting pool parameters: RpcError: RPC: starknet_call with params {
  "request": {
    "contract_address": "0x3a8416bf20d036df5b1cf3447630a2e1cb04685f6b0c3a70ed7fb1473548ecf",
    "entry_point_selector": "0xc114c1a9bb478690dff71127b2e9b956f4e6dd0238742207d1d06d5da6a7d6",
    "calldata": []
  },
  "block_id": "latest"
}

      21: Requested entrypoint does not exist in the contract: undefined
    at RpcChannel2.errorHandler (rpc_0_10_0.ts:170:13)
    at RpcChannel2.fetchEndpoint (rpc_0_10_0.ts:197:12)
    at async useVesu.useCallback[getPoolParameters] (useVesu.ts:425:22)
    at async useCache.useCallback[fetchData] (useCache.ts:80:22)
error @ intercept-console-error.ts:42
useVesu.useCallback[getPoolParameters] @ useVesu.ts:448
await in useVesu.useCallback[getPoolParameters]
useCache.useCallback[fetchData] @ useCache.ts:80
useCache.useEffect @ useCache.ts:154
app:1 Uncaught (in promise) Error: Could not establish connection. Receiving end does not exist.
useTongo.ts:203 Error getting Tongo balance: RpcError: RPC: starknet_call with params {
  "request": {
    "contract_address": "0x6d82c8c467eac77f880a1d5a090e0e0094a557bf67d74b98ba1881200750e27",
    "entry_point_selector": "0x39e11d48192e4333233c7eb19d10ad67c362bb28580c604d67884c85da39695",
    "calldata": [
      "0x4",
      "0x30783664383263386334363765616337376638383061316435613039306530",
      "0x65303039346135353762663637643734623938626131383831323030373530",
      "0x6532375f307830346266653036323330323638623831363135393230613664",
      "0x35323339383838346234326666323836613034393633643063623630393532",
      "0x3436623333386465",
      "0x8",
      "0x3fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac"
    ]
  },
  "block_id": "latest"
}

      40: Contract error: {"revert_error":{"class_hash":"0x582609087e5aeb75dc25284cf954e2cee6974568d1b5636052a9d36eec672a","contract_address":"0x6d82c8c467eac77f880a1d5a090e0e0094a557bf67d74b98ba1881200750e27","error":"\"PubKey is not an EcPoint\"","selector":"0x39e11d48192e4333233c7eb19d10ad67c362bb28580c604d67884c85da39695"}}
    at RpcChannel2.errorHandler (rpc_0_10_0.ts:170:13)
    at RpcChannel2.fetchEndpoint (rpc_0_10_0.ts:197:12)
    at async useTongo.useCallback[getBalance] (useTongo.ts:183:22)
    at async useTongoDecryptedBalanceCache.useCallback[fetchDecryptedBalance] (useTongoCache.ts:35:51)
    at async useCache.useCallback[fetchData] (useCache.ts:80:22)
error @ intercept-console-error.ts:42
useTongo.useCallback[getBalance] @ useTongo.ts:203
await in useTongo.useCallback[getBalance]
useTongoDecryptedBalanceCache.useCallback[fetchDecryptedBalance] @ useTongoCache.ts:35
useCache.useCallback[fetchData] @ useCache.ts:80
useVesu.ts:361 Error getting user position: RpcError: RPC: starknet_call with params {
  "request": {
    "contract_address": "0x3a8416bf20d036df5b1cf3447630a2e1cb04685f6b0c3a70ed7fb1473548ecf",
    "entry_point_selector": "0x17f7f367c32d5c92b20af585a08c645410d5c6a54539b245b72c4c40603b18c",
    "calldata": [
      "0x4bfe06230268b81615920a6d52398884b42ff286a04963d0cb6095246b338de"
    ]
  },
  "block_id": "latest"
}

      21: Requested entrypoint does not exist in the contract: undefined
    at RpcChannel2.errorHandler (rpc_0_10_0.ts:170:13)
    at RpcChannel2.fetchEndpoint (rpc_0_10_0.ts:197:12)
    at async useVesu.useCallback[getUserPosition] (useVesu.ts:332:22)
    at async useVesuPositionCache.useCallback[fetchPosition] (useVesuCache.ts:67:12)
    at async useCache.useCallback[fetchData] (useCache.ts:80:22)
error @ intercept-console-error.ts:42
useVesu.useCallback[getUserPosition] @ useVesu.ts:361
await in useVesu.useCallback[getUserPosition]
useVesuPositionCache.useCallback[fetchPosition] @ useVesuCache.ts:67
useCache.useCallback[fetchData] @ useCache.ts:80
useCache.useEffect @ useCache.ts:154
react_stack_bottom_frame @ react-dom-client.development.js:28123
runWithFiberInDEV @ react-dom-client.development.js:986
commitHookEffectListMount @ react-dom-client.development.js:13692
commitHookPassiveMountEffects @ react-dom-client.development.js:13779
reconnectPassiveEffects @ react-dom-client.development.js:17124
doubleInvokeEffectsOnFiber @ react-dom-client.development.js:20130
runWithFiberInDEV @ react-dom-client.development.js:986
useTongo.ts:203 Error getting Tongo balance: RpcError: RPC: starknet_call with params {
  "request": {
    "contract_address": "0x6d82c8c467eac77f880a1d5a090e0e0094a557bf67d74b98ba1881200750e27",
    "entry_point_selector": "0x39e11d48192e4333233c7eb19d10ad67c362bb28580c604d67884c85da39695",
    "calldata": [
      "0x4",
      "0x30783664383263386334363765616337376638383061316435613039306530",
      "0x65303039346135353762663637643734623938626131383831323030373530",
      "0x6532375f307830346266653036323330323638623831363135393230613664",
      "0x35323339383838346234326666323836613034393633643063623630393532",
      "0x3436623333386465",
      "0x8",
      "0x33068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb"
    ]
  },
  "block_id": "latest"
}

      40: Contract error: {"revert_error":{"class_hash":"0x582609087e5aeb75dc25284cf954e2cee6974568d1b5636052a9d36eec672a","contract_address":"0x6d82c8c467eac77f880a1d5a090e0e0094a557bf67d74b98ba1881200750e27","error":"\"PubKey is not an EcPoint\"","selector":"0x39e11d48192e4333233c7eb19d10ad67c362bb28580c604d67884c85da39695"}}
    at RpcChannel2.errorHandler (rpc_0_10_0.ts:170:13)
    at RpcChannel2.fetchEndpoint (rpc_0_10_0.ts:197:12)
    at async useTongo.useCallback[getBalance] (useTongo.ts:183:22)
    at async useTongoDecryptedBalanceCache.useCallback[fetchDecryptedBalance] (useTongoCache.ts:35:51)
    at async useCache.useCallback[fetchData] (useCache.ts:80:22)
error @ intercept-console-error.ts:42
useTongo.useCallback[getBalance] @ useTongo.ts:203
await in useTongo.useCallback[getBalance]
useTongoDecryptedBalanceCache.useCallback[fetchDecryptedBalance] @ useTongoCache.ts:35
useCache.useCallback[fetchData] @ useCache.ts:80
useCache.useEffect @ useCache.ts:154 
useVesu.ts:448 Error getting pool parameters: RpcError: RPC: starknet_call with params {
  "request": {
    "contract_address": "0x3a8416bf20d036df5b1cf3447630a2e1cb04685f6b0c3a70ed7fb1473548ecf",
    "entry_point_selector": "0xc114c1a9bb478690dff71127b2e9b956f4e6dd0238742207d1d06d5da6a7d6",
    "calldata": []
  },
  "block_id": "latest"
}

      21: Requested entrypoint does not exist in the contract: undefined
    at RpcChannel2.errorHandler (rpc_0_10_0.ts:170:13)
    at RpcChannel2.fetchEndpoint (rpc_0_10_0.ts:197:12)
    at async useVesu.useCallback[getPoolParameters] (useVesu.ts:425:22)
    at async useCache.useCallback[fetch

  - Missing required environment variable: NEXT_PUBLIC_MAINNET_RPC_URL
lib/env-validation.ts (197:44) @ <unknown>


  195 |   if (result.errors.length > 0) {
  196 |     console.error('❌ Environment validation failed:');
> 197 |     result.errors.forEach(error => console.error(`  - ${error}`));
      |                                            ^
  198 |   }
  199 |
  200 |   if (result.warnings.length > 0) {

    Console Error



  - Missing required environment variable: NEXT_PUBLIC_SEPOLIA_RPC_URL
lib/env-validation.ts (197:44) @ <unknown>


  195 |   if (result.errors.length > 0) {
  196 |     console.error('❌ Environment validation failed:');
> 197 |     result.errors.forEach(error => console.error(`  - ${error}`));
      |                                            ^
  198 |   }
  199 |
  200 |   if (result.warnings.length > 0) {
    Console Error



❌ Environment validation failed:
lib/env-validation.ts (196:13) @ logValidationResults


  194 | export function logValidationResults(result: ValidationResult): void {
  195 |   if (result.errors.length > 0) {
> 196 |     console.error('❌ Environment validation failed:');
      |             ^
  197 |     result.errors.forEach(error => console.error(`  - ${error}`));
  198 |   }
  199 |