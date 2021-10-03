import {Immutable} from "./models";

export const castImmutable = <T>(value: T): Immutable<T> => value as Immutable<T>;

export const hasOwnProperty = (value: unknown, property: string | number): boolean => Object.prototype.hasOwnProperty.call(value, property);

export const safeDeepFreeze = <T>(value: T): Immutable<T> => {
  if (value === null || value === undefined) return value as any;

  Object.keys(value).forEach((key) => {
    // @ts-ignore
    if (typeof value[key] === 'object' && !Object.isFrozen(value[key])) safeDeepFreeze(value[key]);
  });

  return Object.freeze(value) as any;
};

export const extractStoreId = (value: string): string | undefined => {
  return value.match(/(?<=\[)[^\]]*/)?.[0];
};
