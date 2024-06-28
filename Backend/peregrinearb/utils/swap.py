import requests
from web3 import Web3
import asyncio

#currently on mainnet only
class OneInchTokenSwapper:
    def __init__(self, api_key, chain_id=1, web3_rpc_url="https://mainnet.infura.io/v3/af9976bbc7e6410ba9cf6566050b1f96"):
        self.api_key = api_key
        self.chain_id = chain_id
        self.web3_rpc_url = web3_rpc_url
        self.api_base_url = f"https://api.1inch.dev/swap/v5.2/{self.chain_id}"
        self.headers = {"Authorization": f"Bearer {self.api_key}", "accept": "application/json"}
        self.web3 = Web3(Web3.HTTPProvider(web3_rpc_url))

    def api_request_url(self, method_name, query_params):
        return f"{self.api_base_url}{method_name}?{'&'.join([f'{key}={value}' for key, value in query_params.items()])}"

    def check_allowance(self, token_address, wallet_address):
        url = self.api_request_url("/approve/allowance", {"tokenAddress": token_address, "walletAddress": wallet_address})
        response = requests.get(url, headers=self.headers)

        if response.status_code == 200:
            data = response.json()
            print("Check Allowance Response Data:", data)
            return data.get("allowance")
        else:
            print("Check Allowance Error - Status Code:", response.status_code)
            print("Check Allowance Error - Response Content:", response.content)
            return None



    async def sign_and_send_transaction(self, transaction, private_key):
        signed_transaction = self.web3.eth.account.signTransaction(transaction, private_key)
        return await self.broadcast_raw_transaction(signed_transaction.rawTransaction)

    async def build_tx_for_approve_trade_with_router(self, token_address, amount=None):
        url = self.api_request_url("/approve/transaction", {"tokenAddress": token_address, "amount": amount} if amount else {"tokenAddress": token_address})
        print("Build Tx URL:", url)  #debug
        response = requests.get(url, headers=self.headers)
        print("Build Tx Response:", response.json())  #debug
        transaction = response.json()

        wallet_address = "0x81005150Eaf72A559fE018619040EfFA2E7ed64C"
        gas_limit = self.web3.eth.estimateGas(transaction, from_address=wallet_address)

        return {**transaction, "gas": gas_limit}

    def build_tx_for_swap(self, swap_params):
        url = self.api_request_url("/swap", swap_params)
        swap_transaction = requests.get(url, headers={'Authorization': f'Bearer {self.api_key}'}).json()["tx"]
        return swap_transaction

    async def broadcast_raw_transaction(self, raw_transaction):
        pass

# Example usage:
async def main_async():
    api_key = "6F4pjn2gNR9OO18T2k5htof4pHYHvm77"
    swapper = OneInchTokenSwapper(api_key)

    # Define swap parameters
    swap_params = {
        "src": "0x6B175474E89094C44Da98b954EedeAC495271d0F", #some token
        "dst": "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9​", #to a different token 
        "amount": "10000",
        "from": "0x81005150Eaf72A559fE018619040EfFA2E7ed64C",
        "slippage": 1,
        "disableEstimate": False,
        "allowPartialFill": False,
    }

    # Check allowance
    allowance = swapper.check_allowance(swap_params["src"], swap_params["from"])
    print("Allowance:", allowance)

    # Build and send approval transaction
    approve_transaction = await swapper.build_tx_for_approve_trade_with_router(swap_params["src"])
    approve_tx_hash = await swapper.sign_and_send_transaction(approve_transaction, "b5998946d49e3ed993076876d8d883e4565924f4a90efd31f6dd842d496b5b55")
    print("Approval tx hash:", approve_tx_hash)

    # Check account balance
    balance = swapper.web3.eth.getBalance(swap_params["from"])
    print("Account Balance:", balance)

    # Check if balance is enough for the swap
    if balance < int(swap_params["amount"]):
        print("Not enough balance.")
        return

    # Build and send swap transaction
    swap_transaction = swapper.build_tx_for_swap(swap_params)
    swap_tx_hash = await swapper.sign_and_send_transaction(swap_transaction, "b5998946d49e3ed993076876d8d883e4565924f4a90efd31f6dd842d496b5b55")
    print("Swap tx hash:", swap_tx_hash)

def main():
    asyncio.run(main_async())
    return

main()