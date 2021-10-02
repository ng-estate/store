import {BehaviorSubject, Observable} from "rxjs";
import {Injector} from "@angular/core";

// TODO: extend string signature with symbol once https://github.com/microsoft/TypeScript/pull/44512 is live
export type _Selectors = { [key: string]: string };
export type Getter<State> = (state: Immutable<State>, payload: unknown) => any;
export type Getters<State> = { [selector: string]: Getter<State> };

export type _Actions = { [key: string]: string };

export type ReducerResult<State> = Immutable<State>;
export type Reducer<State> = (state: Immutable<State>, payload?: any) => ReducerResult<State>;
export type Reducers<State> = { [action: string]: Reducer<State> };

export type _EffectDispatch = (action: string, payload?: any) => void;
export type _EffectDispatch$<T> = <T>(action: string, payload?: any) => Observable<T>;
export type EffectResult<T = unknown> = void | Observable<T>;
export interface EffectOptions<State, Payload = unknown, Dispatch$Result = unknown> {
  state: Immutable<State>;
  payload: Payload;
  injector: Injector;
  dispatch: _EffectDispatch;
  dispatch$: _EffectDispatch$<Dispatch$Result>
}
export type Effect<State> = (options: EffectOptions<State, any>) => EffectResult;
export type Effects<State> = {
  [action: string]: Effect<State>
};

interface _BaseConfig<State> {
  id: string;
  initialState: State;
  selectors: _Selectors;
  getters: Getters<State>;
  actions?: _Actions;
  reducers?: Reducers<State>;
  effects?: Effects<State>;
}

export interface _StoreConfig {
  config?: {
    freezeState?: boolean;
    freezePayload?: boolean;
    maxEffectDispatchTotalCalls?: number;
    maxEffectDispatchCalls?: number;
    maxEffectDispatch$Calls?: number;
  }
}

export type _BaseStoreConfig<State> = _BaseConfig<State> & _StoreConfig;

export type RootStoreConfig<State> = _StoreConfig | _BaseStoreConfig<State>;

export interface ChildStoreConfig<State> extends _BaseConfig<State> {
}

export interface _StoreMapValue<State> extends Pick<_BaseConfig<State>, 'getters' | 'reducers' | 'effects'> {
  state$: BehaviorSubject<Immutable<State>>;
}

export interface _StoreMap {
  [storeId: string]: _StoreMapValue<any>
}

export interface StoreEvent<State> {
  storeId: string;
  action: string;
  state: Immutable<State>;
}

// https://www.npmjs.com/package/type-fest
export type Immutable<T> = T extends | null
  | undefined
  | string
  | number
  | boolean
  | symbol
  | bigint | ((...args: any[]) => unknown)
  ? T
  : T extends ReadonlyMap<infer KeyType, infer ValueType>
    ? ReadonlyMap<Immutable<KeyType>, Immutable<ValueType>>
    : T extends ReadonlySet<infer ItemType>
      ? ReadonlySet<Immutable<ItemType>>
      : T extends object
        ? { readonly [KeyType in keyof T]: Immutable<T[KeyType]> }
        : unknown;

// https://github.com/Microsoft/TypeScript/issues/13923#issuecomment-653675557
// export type Immutable<T> =
//   T extends Function | boolean | number | string | null | undefined ? T :
//     T extends Array<infer U> ? ReadonlyArray<Immutable<U>> :
//       T extends Map<infer K, infer V> ? ReadonlyMap<Immutable<K>, Immutable<V>> :
//         T extends Set<infer S> ? ReadonlySet<Immutable<S>> :
//           {readonly [P in keyof T]: Immutable<T[P]>}
