export type { KeyLayout } from './types';
export { keyball39Layout } from './keyball39';
export { keyball44Layout } from './keyball44';
export { keyball61Layout } from './keyball61';

export type ModelKey = 'keyball39' | 'keyball44' | 'keyball61';

import { keyball39Layout } from './keyball39';
import { keyball44Layout } from './keyball44';
import { keyball61Layout } from './keyball61';
import type { KeyLayout } from './types';

export const LAYOUTS: Record<ModelKey, KeyLayout[]> = {
  keyball39: keyball39Layout,
  keyball44: keyball44Layout,
  keyball61: keyball61Layout,
};
