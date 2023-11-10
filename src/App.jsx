import React, {useState, useEffect} from 'react';
import {ParticleNetwork} from '@particle-network/auth';
import {ParticleProvider} from '@particle-network/provider';
import { EthereumGoerli } from '@particle-network/chains';
import {AAWrapProvider, SmartAccount, SendTransactionMode} from '@particle-network/aa';
import {ethers} from 'ethers';
import { Flex, Image, Text, Button, Center, Box, Stack} from '@chakra-ui/react'
import {RiTwitterXLine} from 'react-icons/ri';
import {FaGoogle} from 'react-icons/fa';



const config = {
    projectId: process.env.REACT_APP_PROJECT_ID,
    clientKey: process.env.REACT_APP_CLIENT_KEY,
    appId: process.env.REACT_APP_APP_ID
}

const particle = new ParticleNetwork({
    ...config,
    chainName: EthereumGoerli.name,
    chainId: EthereumGoerli.id,
    wallet: {displayWalletEntry: true, uiMode: 'dark'}
});

const smartAccount = new SmartAccount(new ParticleProvider(particle.auth), {
  ...config,
  aaOptions:{
    biconomy: [{
      chainId: 5,
      version: '1.0.0',
    }],
  },
  networkConfig:[
    { dappAPIKey: process.env.REACT_APP_BICONOMY_KEY, chainId: EthereumGoerli.id}
  ]
});


const customProvider = new ethers.providers.Web3Provider(new AAWrapProvider(smartAccount,
SendTransactionMode.Gasless), 'any');
particle.setERC4337(true);

const App = ()=>{
  const [userInfo, setUserInfo] = useState(null);
  const [caAddress, setCaAddress] = useState(null);
  const [eoaAddress, setEoaAddress] = useState(null);
  const [ethBalance, setEthBalance] = useState();

  useEffect(() =>{
    if (userInfo){
        fetchEthBalance();
    }
  }, [userInfo]);

  const fetchEthBalance = async () =>{
    const caAddress = await smartAccount.getAddress();
    const eoaAddress = await smartAccount.getOwner();
    const balance = await customProvider.getBalance(caAddress);
    setEthBalance(ethers.utils.formatEther(balance));
    setCaAddress(caAddress);
    setEoaAddress(eoaAddress);

  };

  const handleLogin = async (preferredAuthType) =>{
    const user = !particle.auth.isLogin()? await particle.auth.login({preferredAuthType}) : particle.auth.getUserInfo();
    setUserInfo(user);
  }

  const executeUserOp = async ()=>{
    const signer = customProvider.getSigner();
    const txs = 
      [{
      to: "0xE2c0f71ebe5F5F5E3600CA632b16c5e850183ddf",
      value : ethers.utils.parseEther('0.001'),
      }]
    ;

    // get fee quotes with tx or txs
    const feeQuotesResult = await smartAccount.getFeeQuotes(txs);
    // gasless transaction userOp, maybe null
    // const gaslessUserOp = feeQuotesResult.verifyingPaymasterGasless?.userOp;
    // const gaslessUserOpHash = feeQuotesResult.verifyingPaymasterGasless?.userOpHash;

    // pay with  Native tokens: transaction userOp
    // const paidNativeUserOp = feeQuotesResult.verifyingPaymasterNative?.userOp;
    // const paidNativeUserOpHash = feeQuotesResult.verifyingPaymasterNative?.userOpHash;

    // pay with ERC-20 tokens: fee quotes
    // const tokenPaymasterAddress = feeQuotesResult.tokenPaymaster.tokenPaymasterAddress;
    // const tokenFeeQuotes = feeQuotesResult.tokenPaymaster.feeQuotes;

    // build user operation, feeQuote and tokenPaymasterAddress is optional.
    // const userOpBundle = await smartAccount.buildUserOperation({txs, null, null});
    // const userOp = userOpBundle.userOp;
    // const userOpHash = userOpBundle.userOpHash;

    // console.log(`user op: ${userOp}`)
    // console.log(`user op hash: ${userOpHash}`)

    // const txHash = await smartAccount.sendUserOperation({userOp, userOpHash});
    // txHash.wait();
    // console.log('Transaction hash: ', txHash);


    const txResponse = await signer.sendTransaction(txs);
    const txReceipt = await txResponse.wait();
    console.log('Transaction hash: ', txReceipt.transactionHash);
  }

  return (
    
      <Stack>
        <Center>
          <Box>
              <Flex className='App'>
                <Flex className='logos-section'>
                  <Image src='https://i.imgur.com/HBfABYa.png' alt='Biconomy Logo' className='biconomy-logo' />
                  <Image src='https://i.imgur.com/2btL79J.png' alt='Particle Network Logo' className='particle-logo' />
                </Flex>
              </Flex>
          </Box>
      </Center>
      <Center>
        <Box>
          <Flex>
            {!userInfo ? (
              <Flex className='login-section'>
                <Button padding="16px" leftIcon={<FaGoogle />} bg="#F5F5F5" borderRadius="15px" variant="solid" size='lg' onClick={() => handleLogin('google')}>Sign in with Google</Button>
                <Button  padding="16px" leftIcon={<RiTwitterXLine />} bg="#F5F5F5" borderRadius="15px" size='lg' onClick={()=> handleLogin('twitter')}>Sign in wth Twitter</Button>
              </Flex>
            ): (
                <Box>
                  <Flex>
                    <Text fontSize='xl'>{userInfo.name}&nbsp;:&nbsp;&nbsp; </Text>
                    <Text fontSize='xl'>{ethBalance} ETH</Text>
                  </Flex>
                  <Flex>
                    <Text fontSize='xl' >EOA Address: </Text>
                  </Flex>
                  <Flex>
                    <Text fontSize='xl' >{eoaAddress}</Text>
                  </Flex>
                  <Flex>
                    <Text fontSize='xl' >CA Address: </Text>
                  </Flex>
                  <Flex>
                    <Text fontSize='xl' >{caAddress}</Text>
                  </Flex>
                  <Flex>
                    <Button Button  padding="16px" size={'xl'} bg="#F5F5F5" borderRadius="15px" onClick={executeUserOp}> Execute User Operation</Button>
                  </Flex>
                </Box>
            )}
          </Flex>
        </Box>
      </Center>
    </Stack>
    
  );

}

export default App;



