/**
 * Stores in this file should always persist
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

export interface ISettingStore {
  ignoreWebauthnOverride: boolean;
  setIgnoreWebauthnOverride: (val: boolean) => void;
  setFinishedSteps: (steps: number[]) => void;
  finishedSteps: number[];
  // 1. guardian address -> name 2. slot address -> name
  addressName: Map<string, string>;
  saveAddressName: (address: string, name: string) => void;
  removeAddressName: (address: string) => void;
  getAddressName: (address: string) => string;
}

const createSettingSlice = immer<ISettingStore>((set, get) => ({
  finishedSteps: [],
  addressName: new Map(),
  ignoreWebauthnOverride: false,
  setIgnoreWebauthnOverride: (val: boolean) => {
    set({
      ignoreWebauthnOverride: val,
    });
  },
  setFinishedSteps: (steps: number[]) => {
    set((state) => {
      state.finishedSteps = steps;
    });
  },
  getAddressName: (address) => {
    // const s = get();
    // console.log('sssss', s);
    return ''
    return get().addressName.get(address) || '';
  },
  saveAddressName: (address, name) => {
    set((state) => {
      state.addressName.set(address, name);
    });
  },
  removeAddressName: (address) => {
    set((state) => {
      const newMap = new Map(state.addressName);
      newMap.delete(address);
      state.addressName = newMap;
    });
  },
}));

export const useSettingStore = create<ISettingStore>()(
  persist((...set) => ({ ...createSettingSlice(...set) }), {
    name: 'setting-storage',
  }),
);
