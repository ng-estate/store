import {Observable} from "rxjs";
import {Injector, StaticProvider} from "@angular/core";

// TODO: extend string signature with symbol once https://github.com/microsoft/TypeScript/pull/44512 is live
export type _Selectors = { [key: string]: string };
export type Getter<State> = (state: Immutable<State>, payload?: any) => any;
export type Getters<State> = { [selector: string]: Getter<State> };

export type _Actions = { [key: string]: string };

export type ReducerResult<State> = Immutable<State>;
export type Reducer<State> = (state: Immutable<State>, payload?: any) => ReducerResult<State>;
export type Reducers<State> = { [action: string]: Reducer<State> };

export type _EffectDispatch<T> = (action: string, payload?: any) => T;
export type EffectResult<T = any> = void | Observable<T>;
export interface EffectOptions<State, Payload, DispatchResult = any> {
  state: Immutable<State>;
  payload?: Payload;
  injector: Injector;
  dispatch: _EffectDispatch<void>;
  dispatch$: _EffectDispatch<Observable<DispatchResult>>
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
  providers?: StaticProvider[];
}

interface _StoreConfig {
  config?: {
    freezeState?: boolean;
    freezePayload?: boolean;
    maxEffectDispatchCalls?: number;
    maxEffectDispatch$Calls?: number;
  }
}

export type _BaseStoreConfig<State> = _BaseConfig<State> & _StoreConfig;

export type RootStoreConfig<State> = _StoreConfig | _BaseStoreConfig<State>;

export interface ChildStoreConfig<State> extends _BaseConfig<State> {
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
