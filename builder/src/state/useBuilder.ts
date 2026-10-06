import { useStore } from 'zustand';
import { createBuilderStore, type BuilderState } from './store';

// 앱 전체가 함께 쓰는 저장소 하나
export const builderStore = createBuilderStore();
export const useBuilder = <T,>(selector: (state: BuilderState) => T): T => useStore(builderStore, selector);
