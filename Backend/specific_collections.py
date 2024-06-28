from peregrinearb import build_specific_collections
import asyncio
# all exchanges (supported by ccxt) which are traded on in the US
us_collections = asyncio.run(build_specific_collections(countries=['US']))
print(us_collections)

# all exchanges (supported by ccxt) which have BTC/USD and ETH/BTC markets
eth_btc_exchanges = asyncio.run(build_specific_collections(symbols=['BTC/USD', 'ETH/BTC']))
print(eth_btc_exchanges)
