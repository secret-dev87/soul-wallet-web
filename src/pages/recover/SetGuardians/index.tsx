import { useState, useEffect } from 'react';
import FullscreenContainer from '@/components/FullscreenContainer';
import { RecoverStepEn, StepActionTypeEn, useStepDispatchContext } from '@/context/StepContext';
import useTools from '@/hooks/useTools';
import { useGlobalStore } from '@/store/global';
import { RecoveryActionTypeEn, useRecoveryDispatchContext } from '@/context/RecoveryContext';
import { nanoid } from 'nanoid';
import Button from '@/components/web/Button';
import TextButton from '@/components/web/TextButton';
import { Box, Input, Text, Image, useToast, Select, Menu, MenuList, MenuButton, MenuItem } from '@chakra-ui/react';
// import { TriangleDownIcon } from "@chakra-ui/icons"
import FormInput from '@/components/web/Form/FormInput';
import SmallFormInput from '@/components/web/Form/SmallFormInput';
import Heading1 from '@/components/web/Heading1';
import Heading2 from '@/components/web/Heading2';
import TextBody from '@/components/web/TextBody';
import useForm from '@/hooks/useForm';
import Icon from '@/components/Icon';
import { nextRandomId, validateEmail } from '@/lib/tools';
import MinusIcon from '@/assets/icons/minus.svg';
import useKeystore from '@/hooks/useKeystore';
import { useGuardianStore } from '@/store/guardian';
import ArrowRightIcon from '@/components/Icons/ArrowRight';
import ArrowDownIcon from '@/components/Icons/ArrowDown';
import DropDownIcon from '@/components/Icons/DropDown';
import PlusIcon from '@/components/Icons/Plus';
import api from '@/lib/api';
import Steps from '@/components/web/Steps';
import { ethers } from 'ethers';
import config from '@/config';
import useConfig from '@/hooks/useConfig';
import { useCredentialStore } from '@/store/credential';
import usePassKey from '@/hooks/usePasskey';
import { L1KeyStore } from '@soulwallet/sdk';
import { useAddressStore } from '@/store/address';
import { useSettingStore } from '@/store/setting';

const defaultGuardianIds = [nextRandomId(), nextRandomId(), nextRandomId()];

const getFieldsByGuardianIds = (ids: any) => {
  const fields = [];

  for (const id of ids) {
    const addressField = `address_${id}`;
    const nameField = `name_${id}`;
    fields.push(addressField);
    fields.push(nameField);
  }

  return fields;
};

const getNumberArray = (count: number) => {
  const arr = [];

  for (let i = 1; i <= count; i++) {
    arr.push(i);
  }

  return arr;
};

const getRecommandCount = (c: number) => {
  if (!c) {
    return 0;
  }

  return Math.ceil(c / 2);
};

const getInitialValues = (ids: string[], guardians: string[]) => {
  const idCount = ids.length;
  const guardianCount = guardians.length;
  const count = idCount > guardianCount ? idCount : guardianCount;
  const values: any = {};

  for (let i = 0; i < count; i++) {
    values[`address_${ids[i]}`] = guardians[i];
  }

  return values;
};

const validate = (values: any) => {
  const errors: any = {};
  const addressKeys = Object.keys(values).filter((key) => key.indexOf('address') === 0);
  const nameKeys = Object.keys(values).filter((key) => key.indexOf('name') === 0);
  const existedAddress = [];

  for (const addressKey of addressKeys) {
    const address = values[addressKey];

    if (address && address.length && !ethers.isAddress(address)) {
      errors[addressKey] = 'Invalid Address';
    } else if (existedAddress.indexOf(address) !== -1) {
      errors[addressKey] = 'Duplicated Address';
    } else if (address && address.length) {
      existedAddress.push(address);
    }
  }

  return errors;
};

const amountValidate = (values: any, props: any) => {
  const errors: any = {};

  if (
    !values.amount ||
    !Number.isInteger(Number(values.amount)) ||
    Number(values.amount) < 1 ||
    Number(values.amount) > Number(props.guardiansCount)
  ) {
    errors.amount = 'Invalid Amount';
  }

  return errors;
};

const isGuardiansListFilled = (list: any) => {
  if (!list.length) return false

  let isFilled = true

  for (const item of list) {
    isFilled = isFilled && item
  }

  return isFilled
}

const UploadGuardians = ({ onStepChange, changeStep }: any) => {
  const { getJsonFromFile } = useTools();
  const { calcGuardianHash } = useKeystore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [guardianIds, setGuardianIds] = useState(defaultGuardianIds);
  const [fields, setFields] = useState(getFieldsByGuardianIds(defaultGuardianIds));
  const [guardiansList, setGuardiansList] = useState([]);
  const { setFinishedSteps } = useSettingStore();
  const {
    recoveringGuardiansInfo,
    updateRecoveringGuardiansInfo,
  } = useGuardianStore();
  const credentials = recoveringGuardiansInfo.credentials
  const guardianDetails =  {
    guardians: [],
    threshold: 0
  }

  const [amountData, setAmountData] = useState<any>({});
  const [showMannualInput, setShowMannualInput] = useState(false);
  const toast = useToast();
  const { chainConfig } = useConfig();

  const { values, errors, invalid, onChange, onBlur, showErrors, addFields, removeFields } = useForm({
    fields,
    validate,
    initialValues: getInitialValues(defaultGuardianIds, guardianDetails.guardians),
  });

  const amountForm = useForm({
    fields: ['amount'],
    validate: amountValidate,
    restProps: amountData,
    initialValues: {
      amount: guardianDetails.threshold || getRecommandCount(amountData.guardiansCount),
    },
  });

  const disabled = invalid || !guardiansList.length || amountForm.invalid || loading || !isGuardiansListFilled(guardiansList);

  useEffect(() => {
    setAmountData({ guardiansCount: guardiansList.length });
  }, [guardiansList]);

  useEffect(() => {
    setGuardiansList(
      Object.keys(values)
            .filter((key) => key.indexOf('address') === 0)
            .map((key) => values[key]) as any
            // .filter((address) => !!String(address).trim().length) as any,
    );
  }, [values]);

  useEffect(() => {
    setAmountData({ guardiansCount: guardiansList.length });
  }, [guardiansList]);

  const handleNextStep = async () => {
    await handleSubmit()
    // changeStep(3)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const guardiansList = guardianIds
        .map((id) => {
          const addressKey = `address_${id}`;
          const nameKey = `name_${id}`;
          let address = values[addressKey];

          if (address && address.length) {
            return { address, name: values[nameKey] };
          }

          return null;
        })
        .filter((i) => !!i);
      console.log('guardiansList', guardiansList);

      const keystore = chainConfig.contracts.l1Keystore;
      const initialKeys = await Promise.all(credentials.map((credential: any) => credential.publicKey))
      const newOwners = L1KeyStore.initialKeysToAddress(initialKeys);
      const guardianAddresses = guardiansList.map((item: any) => item.address);
      const threshold = amountForm.values.amount || 0;
      const slot = recoveringGuardiansInfo.slot
      const slotInitInfo = recoveringGuardiansInfo.slotInitInfo
      const guardianDetails = {
        guardians: guardianAddresses,
        threshold: threshold,
        salt: ethers.ZeroHash,
      }

      const params = {
        guardianDetails,
        slot,
        slotInitInfo,
        keystore,
        newOwners
      }

      const res = await api.guardian.createRecoverRecord(params)
      const recoveryRecordID = res.data.recoveryRecordID
      const guardians = guardianDetails.guardians
      const guardianHash = calcGuardianHash(guardians, threshold);
      updateRecoveringGuardiansInfo({
        recoveryRecordID,
        guardianDetails,
        guardianHash
      });
      changeStep(4)
      setLoading(false);
      const resSteps = await api.operation.finishStep({
        slot,
        steps: [5],
      })
      setFinishedSteps(resSteps.data.finishedSteps);
    } catch (e: any) {
      setLoading(false);
      toast({
        title: e.message,
        status: 'error',
      });
    }
  };

  const handleFileChange = async (event: any) => {
    try {
      setUploading(true);
      const file = event.target.files[0];

      if (!file) {
        return;
      }

      const data: any = await getJsonFromFile(file);

      const keystore = chainConfig.contracts.l1Keystore;
      const initialKeys = await Promise.all(credentials.map((credential: any) => credential.publicKey))
      const newOwners = L1KeyStore.initialKeysToAddress(initialKeys);
      const slot = recoveringGuardiansInfo.slot
      const slotInitInfo = recoveringGuardiansInfo.slotInitInfo
      const guardianDetails = data.guardianDetails
      const guardianNames = data.guardianNames

      const params = {
        guardianDetails,
        slot,
        slotInitInfo,
        keystore,
        newOwners
      }

      console.log('createRecoverRecord', params);

      const res = await api.guardian.createRecoverRecord(params)
      const recoveryRecordID = res.data.recoveryRecordID
      const guardians = guardianDetails.guardians
      const threshold = guardianDetails.threshold
      const guardianHash = calcGuardianHash(guardians, threshold);

      updateRecoveringGuardiansInfo({
        recoveryRecordID,
        guardianDetails,
        guardianHash,
        guardianNames
      });

      setUploading(false);
      setUploaded(true);

      setTimeout(() => {
        changeStep(4)
      }, 1000);
    } catch (e: any) {
      setUploading(false);
      toast({
        title: e.message,
        status: 'error',
      });
    }
  };

  const addGuardian = () => {
    const id = nextRandomId();
    const newGuardianIds = [...guardianIds, id];
    const newFields = getFieldsByGuardianIds(newGuardianIds);
    setGuardianIds(newGuardianIds);
    setFields(newFields);
    addFields(getFieldsByGuardianIds([id]));
  };

  const removeGuardian = (deleteId: string) => {
    if (guardianIds.length > 1) {
      const newGuardianIds = guardianIds.filter((id) => id !== deleteId);
      const newFields = getFieldsByGuardianIds(newGuardianIds);
      setGuardianIds(newGuardianIds);
      setFields(newFields);
      removeFields(getFieldsByGuardianIds([deleteId]));

      if (amountForm.values.amount && newGuardianIds.length && +amountForm.values.amount > newGuardianIds.length) {
        amountForm.onChange('amount')(1);
      }
    }
  };

  const selectAmount = (amount: any) => () => {
    amountForm.onChange('amount')(amount);
  };

  useEffect(() => {
    if (!amountForm.values.amount || Number(amountForm.values.amount) > amountData.guardiansCount) {
      amountForm.onChange('amount')(getRecommandCount(amountData.guardiansCount));
    }
  }, [amountData.guardiansCount, amountForm.values.amount]);

  console.log('getNumberArray', getNumberArray(amountData.guardiansCount || 0));

  return (
    <FullscreenContainer>
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" paddingBottom="20px">
        <Box marginBottom="12px" paddingRight="24px">
          <Steps
            backgroundColor="#1E1E1E"
            foregroundColor="white"
            count={4}
            activeIndex={2}
            marginTop="24px"
            onStepChange={onStepChange}
            showBackButton
          />
        </Box>
        <Heading1 marginBottom="24px">Upload guardians file</Heading1>
        <Box marginBottom="12px">
          <TextBody fontSize="16px" textAlign="center" maxWidth="500px">
            Please upload the guardians file you saved during setup or enter Ethereum wallets addresses you set as guardians.
          </TextBody>
        </Box>
        <Button
          disabled={uploading}
          loading={uploading}
          _styles={{
            width: '320px',
            marginTop: '12px',
            position: 'relative',
            background: uploaded ? '#9648FA' : undefined,
            _hover: { background: uploaded ? '#9648FA' : undefined },
          }}
        >
          {!uploaded ? 'Upload file' : 'Upload successful!'}
          <Input
            type="file"
            id="file"
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="100%"
            background="red"
            opacity="0"
            cursor="pointer"
            onChange={handleFileChange}
          />
        </Button>
        <Box display="flex" flexDirection="column" alignItems="center" marginTop="20px">
          <TextBody>Or</TextBody>
        </Box>
        {!showMannualInput && (
          <Box display="flex" flexDirection="column" alignItems="center">
            <TextButton
              color="rgb(137, 137, 137)"
              onClick={() => setShowMannualInput(true)}
              _styles={{
                width: '455px',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: '800',
              }}
            >
              Enter guardians info manually
              <Text marginLeft="5px">
                <ArrowRightIcon color="rgb(137, 137, 137)" />
              </Text>
            </TextButton>
          </Box>
        )}
        {!!showMannualInput && (
          <>
            <TextBody
              fontSize="20px"
              lineHeight="48px"
              fontWeight="800"
              cursor="pointer"
              marginBottom="10px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              onClick={() => setShowMannualInput(false)}
            >
              Enter guardians info manually
              <Text marginLeft="5px">
                <ArrowDownIcon color="rgb(137, 137, 137)" />
              </Text>
            </TextBody>
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" width="100%">
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                gap="12px"
                width="100%"
              >
                {guardianIds.map((id: any, i: number) => (
                  <Box position="relative" width="100%" key={id}>
                    <FormInput
                      placeholder="Enter guardian address"
                      value={values[`address_${id}`]}
                      onChange={onChange(`address_${id}`)}
                      onBlur={onBlur(`address_${id}`)}
                      errorMsg={showErrors[`address_${id}`] && errors[`address_${id}`]}
                      leftComponent={
                        <Text color="#898989" fontWeight="600">
                          eth:
                        </Text>
                      }
                      _styles={{ width: '100%', minWidth: '520px' }}
                      _inputStyles={
                      !!values[`address_${id}`]
                      ? {
                        fontFamily: 'Martian',
                        fontWeight: 600,
                        fontSize: '14px',
                        height: '48px',
                      }
                      : {}
                      }
                    />
                    {i > 0 && (
                      <Box
                        onClick={() => removeGuardian(id)}
                        position="absolute"
                        width="40px"
                        right="-40px"
                        top="0"
                        height="100%"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        cursor="pointer"
                      >
                        <Icon src={MinusIcon} />
                      </Box>
                    )}
                  </Box>
                ))}
                <TextButton onClick={() => addGuardian()} color="#EC588D" _hover={{ color: '#EC588D' }}>
                  <PlusIcon color="#EC588D" />
                  <Text marginLeft="5px">Add more guardians</Text>
                </TextButton>
              </Box>
              <Box display="flex" alignItems="center">
                <TextBody>Wallet recovery requires</TextBody>
                <Box width="80px" margin="0 10px">
                  <Menu>
                    <MenuButton
                      px={2}
                      py={2}
                      width="80px"
                      transition="all 0.2s"
                      borderRadius="16px"
                      borderWidth="1px"
                      padding="12px"
                      _hover={{
                        borderColor: '#3182ce',
                        boxShadow: '0 0 0 1px #3182ce',
                      }}
                      _expanded={{
                        borderColor: '#3182ce',
                        boxShadow: '0 0 0 1px #3182ce',
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        {amountForm.values.amount}
                        <DropDownIcon />
                      </Box>
                    </MenuButton>
                    <MenuList>
                      {!amountData.guardiansCount && (
                        <MenuItem key={nanoid(4)} onClick={selectAmount(0)}>
                          0
                        </MenuItem>
                      )}
                      {!!amountData.guardiansCount &&
                       getNumberArray(amountData.guardiansCount || 0).map((i: any) => (
                         <MenuItem key={nanoid(4)} onClick={selectAmount(i)}>
                           {i}
                         </MenuItem>
                      ))}
                    </MenuList>
                  </Menu>
                </Box>
                <TextBody>out of {guardiansList.length || 0} guardian(s) confirmation. </TextBody>
              </Box>
            </Box>
            <Box display="flex" flexDirection="column" alignItems="center" marginTop="12px" width="100%">
              <Button loading={loading} disabled={disabled || loading} onClick={handleNextStep} _styles={{ width: '320px' }}>
                Next
              </Button>
            </Box>
          </>
        )}
      </Box>
    </FullscreenContainer>
  );
};

export default UploadGuardians;
