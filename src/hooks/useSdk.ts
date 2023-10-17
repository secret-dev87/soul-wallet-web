import { useMemo } from 'react';
import { L1KeyStore, SoulWallet } from '@soulwallet_test/sdk';
import { useChainStore } from '@/store/chain';
import { useGuardianStore } from '@/store/guardian';

export default function useSdk() {
  const { getSelectedChainItem, selectedChainId } = useChainStore();
  const { getSlotInitInfo } = useGuardianStore();
  const selectedChainItem = getSelectedChainItem();

  const soulWallet = useMemo(() => {
    return new SoulWallet(
      selectedChainItem.provider,
      selectedChainItem.bundlerUrl,
      selectedChainItem.contracts.soulWalletFactory,
      selectedChainItem.contracts.defaultCallbackHandler,
      selectedChainItem.contracts.keyStoreModuleProxy,
      selectedChainItem.contracts.securityControlModule,
    );
  }, [selectedChainId]);

  /**
   * Calculate wallet address
   * @param index, index of wallet address to calculate
   * @param initialKey, initial signer key address
   * @param initialGuardians, initial guardian address list
   * @param threshold, initial guardian threshold
   * @returns
   */
  const calcWalletAddress = async (index: number) => {
    console.log('calcWalletAddress', getSlotInitInfo());
    const { initialKeys, initialGuardianHash, initialGuardianSafePeriod } = getSlotInitInfo();
    const wAddress = await soulWallet.calcWalletAddress(
      index,
      initialKeys,
      initialGuardianHash,
      Number(initialGuardianSafePeriod),
    );
    return wAddress.OK;
  };

  return { soulWallet, calcWalletAddress };
}
