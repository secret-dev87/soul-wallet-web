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
import FormInput from '@/components/web/Form/FormInput';
import useForm from '@/hooks/useForm';
import WalletCard from '@/components/web/WalletCard';
import ArrowLeftIcon from '@/components/Icons/ArrowLeft';
import api from '@/lib/api';

const validate = (values: any) => {
  const errors: any = {};
  const { address } = values;

  if (!ethers.isAddress(address)) {
    errors.address = 'Invalid Address';
  }

  return errors;
};

export default function Recover({ changeStep }: any) {
  const { navigate } = useBrowser();
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { values, errors, invalid, onChange, onBlur, showErrors } = useForm({
    fields: ['address'],
    validate,
  });
  const disabled = loading || invalid;

  const handleNext = async () => {
    if (disabled) return;

    try {
      setLoading(true);
      const result = await api.guardian.getSlotInfo({ walletAddress: values.address });
      console.log('getSlotInfo', result)
      const data = result.data;
      const slot = data.slot;
      const slotInitInfo = data.slotInitInfo;
      /* setRecoverRecordId(null);
       * setRecoveringSlot(slot); */
      /* setRecoveringSlotInitInfo(slotInitInfo); */
      const guardianDetails = data.guardianDetails;

      if (guardianDetails && guardianDetails.guardians) {
        const guardians = guardianDetails.guardians;
        const threshold = guardianDetails.threshold;
        /* setRecoveringGuardians(guardians);
         * setRecoveringThreshold(threshold); */
        setLoading(false);

        /* dispatch({
         *   type: StepActionTypeEn.JumpToTargetStep,
         *   payload: RecoverStepEn.ResetPassword,
         * }); */
      } else {
        setLoading(false);
        /* dispatch({
         *   type: StepActionTypeEn.JumpToTargetStep,
         *   payload: RecoverStepEn.UploadGuardians,
         * }); */
      }
    } catch (e: any) {
      setLoading(false);
      toast({
        title: e.message,
        status: 'error',
      });
    }
  };

  const goBack = () => {
    navigate('launch');
  };

  const onStepChange = () => {

  }

  return (
    <FullscreenContainer>
      <Box width="400px" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
        <WalletCard
          statusText="RECOVERING..."
          steps={
            <Steps
              backgroundColor="#29510A"
              foregroundColor="#E2FC89"
              count={4}
              activeIndex={0}
              marginTop="24px"
              onStepChange={onStepChange}
            />
          }
        />
        <Box width="320px" display="flex" alignItems="center" justifyContent="flex-start" marginBottom="32px">
          <TextButton
            color="#1E1E1E"
            fontSize="16px"
            fontWeight="800"
            width="57px"
            padding="0"
            alignItems="center"
            justifyContent="center"
            onClick={goBack}
          >
            <ArrowLeftIcon />
            <Box marginLeft="2px" fontSize="16px">Back</Box>
          </TextButton>
        </Box>
        <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column">
          <Heading1>Recover wallet</Heading1>
        </Box>
        <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column" width="320px" marginBottom="20px">
          <TextBody color="#1E1E1E" fontSize="16px" textAlign="center">
            Enter the address you want to recover.(Recommend activated wallet.)
          </TextBody>
        </Box>
        <FormInput
          label=""
          placeholder="Enter wallet address"
          value={values.address}
          onChange={onChange('address')}
          onBlur={onBlur('address')}
          errorMsg={showErrors.address && errors.address}
          _styles={{  width: '320px' }}
          autoFocus={true}
          onEnter={handleNext}
        />
        <Button
          onClick={handleNext}
          _styles={{ width: '320px', marginTop: '12px' }}
          loading={loading}
        >
          Continue
        </Button>
      </Box>
    </FullscreenContainer>
  )
}
