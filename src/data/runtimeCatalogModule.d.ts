declare module 'virtual:allneeds-runtime-catalog' {
  import type { FauxFeeling, Feeling, Need, Strategy } from '../domain/models';

  export const feelings: Feeling[];
  export const needs: Need[];
  export const fauxFeelings: FauxFeeling[];
  export const strategies: Strategy[];
}
