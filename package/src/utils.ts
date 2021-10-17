import {_StoreAction, _StoreStateMap, Immutable, StoreLoggerEvent} from "./models";
import {StoreManager} from "./store-manager";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";

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

const extractStoreState = (storeManager: StoreManager): _StoreStateMap => {
  const storeState: _StoreStateMap = {};

  Object.keys(storeManager.map).forEach((storeId) => {
    storeState[storeId] = storeManager.map[storeId].state$.getValue();
  });

  return storeState;
};

export const storeLogger = (storeManager: StoreManager): Observable<StoreLoggerEvent> => {
  const date = new Date();
  const extendedLocaleTime = date.toLocaleTimeString().replace(' ', `:${date.getMilliseconds()} `);

  return storeManager.actionStream$.pipe(map(({storeId, action}) => ({
    storeId,
    action,
    state: action === _StoreAction.Destroy ? null : storeManager.map[storeId].state$.getValue(),
    states: extractStoreState(storeManager),
    timestamp: extendedLocaleTime
  })))
};
