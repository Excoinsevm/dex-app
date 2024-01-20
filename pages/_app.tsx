import CustomChain from "../const/chain";
import "@/styles/globals.css";
import { ChakraProvider } from "@chakra-ui/react";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import type { NextComponentType } from "next";

const MyApp: NextComponentType = ({ Component, pageProps }) => {
  return (
    <ThirdwebProvider
      activeChain={CustomChain}
      supportedChains={[CustomChain]}
    >
      <ChakraProvider>
        {Component && <Component {...pageProps} />}
      </ChakraProvider>
    </ThirdwebProvider>
  );
};

export default MyApp;
