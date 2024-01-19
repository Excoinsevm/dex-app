import { Chain } from "@thirdweb-dev/chains";

const CustomChain: Chain = {
  chain: "bitrock",
  name: "bitrock",
  chainId: 7171,
  rpc: ["https://connect.bit-rock.io"],
  nativeCurrency: {
    name: "BROCK",
    symbol: "BROCK",
    decimals: 18,
  },
  shortName: "custom",
  testnet: false,
  slug: "bitrock",
};

export default CustomChain;
