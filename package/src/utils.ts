import {_StoreAction, StoreEvent, _StoreStateMap, Immutable, StoreLoggerEvent, _Object} from "./models";
import {StoreManager} from "./store-manager";
import {Observable, OperatorFunction} from "rxjs";
import {filter, map} from "rxjs/operators";

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

export const ofAction = (value: string | Array<string>): OperatorFunction<StoreEvent, StoreEvent> => {
  return filter((event: StoreEvent) => typeof value === 'string' ? value === event.action : value.includes(event.action));
};

export const _storeLogger = (storeManager: StoreManager): Observable<StoreLoggerEvent> => {
  const date = new Date();
  const milliseconds = date.getMilliseconds();
  const formattedMilliseconds = milliseconds < 100 ? `0${milliseconds < 10 ? '0' : ''}${milliseconds}` : milliseconds;
  const extendedLocaleTime = date.toLocaleTimeString().replace(' ', `:${formattedMilliseconds} `);

  const extractStoreState = (storeManager: StoreManager): _StoreStateMap => {
    const storeState: _StoreStateMap = {};

    Object.keys(storeManager._map).forEach((storeId) => {
      storeState[storeId] = storeManager._map[storeId].state$.getValue();
    });

    return storeState;
  };

  return storeManager.actionStream$.pipe(map(({storeId, action}) => ({
    storeId,
    action,
    state: action === _StoreAction.Destroy ? null : storeManager._map[storeId].state$.getValue(),
    states: extractStoreState(storeManager),
    timestamp: extendedLocaleTime
  })))
};

export const _cleanObject = <T = _Object>(value?: _Object): T => {
  return value ? Object.assign(Object.create(null), value) : Object.create(null);
}
