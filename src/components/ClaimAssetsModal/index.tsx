import { useState, forwardRef, useImperativeHandle, useEffect, Ref } from 'react';
import { useToast, Text, Image, Box } from '@chakra-ui/react';
import Button from '../Button';
import TxModal from '../TxModal';
import api from '@/lib/api';
import { useAddressStore } from '@/store/address';
import { useChainStore } from '@/store/chain';
import IconDollar from '@/assets/icons/dollar-white.svg';

const ClaimAssetsModal = (_: unknown, ref: Ref<any>) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [promiseInfo, setPromiseInfo] = useState<any>({});
  const { selectedAddress } = useAddressStore();
  const { selectedChainId } = useChainStore();

  useImperativeHandle(ref, () => ({
    async show() {
      setVisible(true);
      return new Promise((resolve, reject) => {
        setPromiseInfo({
          resolve,
          reject,
        });
      });
    },
  }));

  const doClaim = async () => {
    setLoading(true);
    try {
      const res: any = await api.operation.requestTestToken({
        address: selectedAddress,
        chainID: selectedChainId,
      });
      if (res.code === 200) {
        toast({
          title: 'Claimed',
          status: 'success',
        });
        setVisible(false);
      } else {
        toast({
          title: res.msg,
          status: 'error',
        });
      }
      console.log('claim result', res);
    } catch (err) {
      toast({
        title: 'Reached claim limit',
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const onClose = async () => {
    setVisible(false);
    setLoading(false);
    promiseInfo.reject('User close');
  };

  const claimAmount = selectedChainId === '0x5' ? '0.002' : '0.001';

  return (
    <div ref={ref}>
      <TxModal visible={visible} width={{ base: '90%', lg: '500px' }} onClose={onClose} title="Today's claim left: 1">
        <Box textAlign="center">
          <Text fontSize={'16px'} fontWeight={'600'} mt="8" color="#000">
            Each wallet address can claim test tokens
            <br /> ({claimAmount}ETH) twice per day.
          </Text>
          <Button loading={loading} mt="6" mx="auto" py="3" px="4" onClick={doClaim} gap="2" display={'flex'}>
            <Image src={IconDollar} />
            <Text fontSize={'18px'} fontWeight={'800'} color="#fff">
              Receive test token
            </Text>
          </Button>
        </Box>
      </TxModal>
    </div>
  );
};

export default forwardRef(ClaimAssetsModal);