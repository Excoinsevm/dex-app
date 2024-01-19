import Head from "next/head";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import {
  Box,
  Button,
  Flex,
  HStack,
  Image,
  Input,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { DEX_ADDRESS, TOKEN_ADDRESS } from "@/const/details";
import CustomChain from "../const/chain";
import {
  ConnectWallet,
  resolveIpfsUri,
  toEther,
  toWei,
  useAddress,
  useBalance,
  useContract,
  useContractMetadata,
  useContractRead,
  useContractWrite,
  useNetworkMismatch,
  useSDK,
  useSwitchChain,
  useTokenBalance,
} from "@thirdweb-dev/react";
import { useEffect, useState } from "react";
import SwapInput from "@/components/SwapInput";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const toast = useToast();
  const address = useAddress();
  const { contract: tokenContract } = useContract(TOKEN_ADDRESS, "token");
  const { contract: dexContract } = useContract(DEX_ADDRESS, "custom");
  const { data: symbol } = useContractRead(tokenContract, "symbol");
  const { data: tokenMetadata } = useContractMetadata(tokenContract);
  const { data: tokenBalance } = useTokenBalance(tokenContract, address);
  const { data: nativeBalance } = useBalance();
  const { data: contractTokenBalance } = useTokenBalance(
    tokenContract,
    DEX_ADDRESS
  );

  const isMismatched = useNetworkMismatch();
  const switchChain = useSwitchChain();

  const sdk = useSDK();
  const [contractBalance, setContractBalance] = useState<string>("0");

  const [nativeValue, setNativeValue] = useState<string>("0");
  const [tokenValue, setTokenValue] = useState<string>("0");
  const [currentFrom, setCurrentFrom] = useState<string>("native");
  const [loading, setLoading] = useState<boolean>(false);

  const { mutateAsync: swapNativeToToken } = useContractWrite(
    dexContract,
    "swapEthTotoken"
  );
  const { mutateAsync: swapTokenToNative } = useContractWrite(
    dexContract,
    "swapTokenToEth"
  );
  const { mutateAsync: approveTokenSpending } = useContractWrite(
    tokenContract,
    "approve"
  );

  const { data: amountToGet } = useContractRead(
    dexContract,
    "getAmountOfTokens",
    currentFrom === "native"
      ? [
          toWei(nativeValue || "0"),
          toWei(contractBalance || "0"),
          contractTokenBalance?.value,
        ]
      : [
          toWei(tokenValue || "0"),
          contractTokenBalance?.value,
          toWei(contractBalance || "0"),
        ]
  );

  const fetchContractBalance = async () => {
    try {
      const balance = await sdk?.getBalance(DEX_ADDRESS);
      setContractBalance(balance?.displayValue || "0");
    } catch (err) {
      console.error(err);
    }
  };

  const executeSwap = async () => {
    setLoading(true);
    if (isMismatched) {
      switchChain(CustomChain.chainId);
      setLoading(false);
      return;
    }
    try {
      if (currentFrom === "native") {
        await swapNativeToToken({ overrides: { value: toWei(nativeValue) } });
        toast({
          status: "success",
          title: "Swap Successful",
          description: `You have successfully swapped your ${
            CustomChain.nativeCurrency.symbol
          } to ${symbol || "tokens"}.`,
        });
      } else {
        // Approve token spending
        await approveTokenSpending({ args: [DEX_ADDRESS, toWei(tokenValue)] });
        // Swap!
        await swapTokenToNative({ args: [toWei(tokenValue)] });
        toast({
          status: "success",
          title: "Swap Successful",
          description: `You have successfully swapped your ${
            symbol || "tokens"
          } to ${CustomChain.nativeCurrency.symbol}.`,
        });
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast({
        status: "error",
        title: "Swap Failed",
        description:
          "There was an error performing the swap. Please try again.",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractBalance();
    setInterval(fetchContractBalance, 10000);
  }, []);

  useEffect(() => {
    if (!amountToGet) return;
    if (currentFrom === "native") {
      setTokenValue(toEther(amountToGet));
    } else {
      setNativeValue(toEther(amountToGet));
    }
  }, [amountToGet]);

  return (
    <>
      <Head>
        <title>Decentralised Exchange</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <Flex
        direction="column"
        gap="5"
        mt="40"
        p="5"
        mx="auto"
        maxW={{ base: "sm", md: "xl" }}
        w="full"
        rounded="2xl"
        borderWidth="1px"
        borderColor="gray.300"
      >
        <Flex
          direction={currentFrom === "native" ? "column" : "column-reverse"}
          gap="3"
        >
          <SwapInput
            current={currentFrom}
            type="native"
            max={nativeBalance?.displayValue}
            value={nativeValue}
            setValue={setNativeValue}
            tokenImage="https://imgur.com/mWUjMun.png"
          />

          <Button
            onClick={() =>
              currentFrom === "native"
                ? setCurrentFrom("token")
                : setCurrentFrom("native")
            }
            maxW="5"
            mx="auto"
          >
            ↓
          </Button>

          <SwapInput
            current={currentFrom}
            type="token"
            max={tokenBalance?.displayValue}
            value={tokenValue}
            setValue={setTokenValue}
            tokenImage={tokenMetadata?.image}
          />
        </Flex>

        {address ? (
          <Button
            onClick={executeSwap}
            py="7"
            fontSize="2xl"
            colorScheme="twitter"
            rounded="xl"
            isDisabled={loading}
          >
            {loading ? <Spinner /> : "Execute Swap"}
          </Button>
        ) : (
          <ConnectWallet
            style={{ padding: "20px 0px", fontSize: "18px" }}
            theme="light"
          />
        )}
      </Flex>
    </>
  );
}
