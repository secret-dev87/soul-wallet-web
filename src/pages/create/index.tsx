import React, { useState } from 'react';
import FullscreenContainer from '@/components/FullscreenContainer';
import { Box, useToast } from '@chakra-ui/react';
import Heading1 from '@/components/web/Heading1';
import TextBody from '@/components/web/TextBody';
import Button from '@/components/web/Button';
import TextButton from '@/components/web/TextButton';
import Steps from '@/components/web/Steps';
import PassKeyList from '@/components/web/PassKeyList';
import usePassKey from '@/hooks/usePasskey';
import { useCredentialStore } from '@/store/credential';
import useBrowser from '@/hooks/useBrowser';
import useConfig from '@/hooks/useConfig';
import useKeystore from '@/hooks/useKeystore';
import { useGuardianStore } from '@/store/guardian';
import { ethers } from 'ethers';
import { L1KeyStore } from '@soulwallet/sdk';
import { toHex } from '@/lib/tools';
import useSdk from '@/hooks/useSdk';
import { useAddressStore } from '@/store/address';
import api from '@/lib/api';
import SetWalletName from './SetWalletName'

export default function Create() {
  const { navigate } = useBrowser();
  const { register } = usePassKey();
  const { chainConfig } = useConfig();
  const { addCredential, credentials, changeCredentialName, setSelectedCredentialId, } = useCredentialStore();
  const [isCreating, setIsCreating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { calcGuardianHash } = useKeystore();
  const { setSlotInfo, setGuardiansInfo, setEditingGuardiansInfo } = useGuardianStore();
  const { setSelectedAddress, setAddressList } = useAddressStore();
  const { calcWalletAddress } = useSdk();
  const toast = useToast();
  const [step, setStep] = useState(0);

  const changeStep = (i: number) => {
    setStep(i)
  };

  const createWallet = async () => {
    try {
      setIsCreating(true);
      const walletName =  credentials[0].name.match(/(.*?)_\d+/)[1];
      const credentialKey = await register(walletName);
      addCredential(credentialKey);
      setIsCreating(false);
      // navigate('/create');
    } catch (error: any) {
      console.log('ERR', error)
      console.log('error', error);
      setIsCreating(false);
      toast({
        title: error.message,
        status: 'error',
      });
    }
  }

  const onSkip = () => {
    setIsReady(true)
  }

  const createInitialWallet = async () => {
    const newAddress = await calcWalletAddress(0);
    const walletName = `Account 1`;
    setAddressList([{ title: walletName, address: newAddress, activatedChains: []}]);
    console.log('createInitialWallet', newAddress);
    setSelectedAddress(newAddress);
    setEditingGuardiansInfo({});
    setSelectedCredentialId(credentials[0].id)
  };

  const createInitialSlotInfo = async () => {
    const keystore = chainConfig.contracts.l1Keystore;
    const initialKeys = await Promise.all(credentials.map((credential: any) => credential.publicKey))
    const initialGuardianHash = calcGuardianHash([], 0);
    const salt = ethers.ZeroHash;
    let initialGuardianSafePeriod = toHex(300);
    const initalkeysAddress = L1KeyStore.initialKeysToAddress(initialKeys);
    const initialKeyHash = L1KeyStore.getKeyHash(initalkeysAddress);
    const slot = L1KeyStore.getSlot(initialKeyHash, initialGuardianHash, initialGuardianSafePeriod);

    const slotInfo = {
      initialKeys,
      initialGuardianHash,
      initialGuardianSafePeriod,
      initalkeysAddress,
      initialKeyHash,
      slot
    };

    const walletInfo = {
      keystore,
      slot,
      slotInitInfo: {
        initialKeyHash,
        initialGuardianHash,
        initialGuardianSafePeriod
      },
      initialKeys: initalkeysAddress
    };

    const guardiansInfo = {
      keystore,
      slot,
      guardianHash: initialGuardianHash,
      guardianNames: [],
      guardianDetails: {
        guardians: [],
        threshold: 0,
        salt,
      },
    };

    const result = await api.guardian.backupSlot(walletInfo)
    setGuardiansInfo(guardiansInfo)
    setSlotInfo(slotInfo)
    console.log('createSlotInfo', slotInfo, walletInfo, guardiansInfo, result)
  };

  const onConfirm = async () => {
    try {
      setIsConfirming(true)
      await createInitialSlotInfo()
      await createInitialWallet()
      setIsConfirming(false)
      if(location.search){
        navigate({pathname: '/popup', search: location.search})
      }else{
        navigate('/wallet')
      }
    } catch (error: any) {
      setIsConfirming(false)
      console.log('error', error)
      toast({
        title: error.message,
        status: 'error',
      });
    }
  }

  if (!step) {
    return (
      <SetWalletName changeStep={changeStep} />
    )
  }

  if (isReady) {
    return (
      <FullscreenContainer>
        <Box width="480px" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
          <Box marginBottom="12px" marginRight="24px">
            <Steps
              backgroundColor="#1E1E1E"
              foregroundColor="white"
              count={3}
              activeIndex={2}
              marginTop="24px"
              showBackButton
            />
          </Box>
          <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column">
            {credentials.length > 1 && <Heading1>Great, you have multiple passkeys!</Heading1>}
            {credentials.length == 1 && <Heading1>You have only one passkey!</Heading1>}
          </Box>
        </Box>
        <Box margin="48px 0">
          <PassKeyList passKeys={credentials} setPassKeyName={changeCredentialName} />
        </Box>
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" marginTop="20px">
          <Button loading={isConfirming} disabled={isConfirming} onClick={onConfirm} _styles={{ width: '282px', borderRadius: '40px' }}>
            Confirm
          </Button>
          <TextButton onClick={createWallet}  disabled={isCreating} loading={isCreating}>Add another passkey</TextButton>
        </Box>
      </FullscreenContainer>
    );
  }

  return (
    <FullscreenContainer>
      <Box width="480px" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
        <Box marginBottom="12px">
          <Steps
            backgroundColor="#1E1E1E"
            foregroundColor="white"
            count={2}
            activeIndex={1}
            marginTop="24px"
          />
        </Box>
        <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column">
          <Heading1>Welcome! Your passkey is ready.</Heading1>
        </Box>
        <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column">
          <TextBody color="#1E1E1E" textAlign="center" fontSize="16px">
            Add a second passkey from another device — it's free now, but will cost gas fee later. More devices enhance wallet security and protect against access loss if one device is lost or damaged.
          </TextBody>
        </Box>
      </Box>
      <Box margin="48px 0">
        <PassKeyList passKeys={credentials} setPassKeyName={changeCredentialName} />
      </Box>
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" marginTop="20px">
        <Button onClick={createWallet} _styles={{ width: '300px', borderRadius: '40px', marginBottom: '12px', background: '#9648FA' }} disabled={isCreating} loading={isCreating}>
          {credentials.length ? 'Add another passkey' : 'Add passkey'}
        </Button>
        <Button loading={isConfirming} disabled={isConfirming || !credentials.length} onClick={onConfirm} _styles={{ width: '300px', borderRadius: '40px' }}>
          Done
        </Button>
      </Box>
    </FullscreenContainer>
  );
}
