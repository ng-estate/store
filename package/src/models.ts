import {Observable} from "rxjs";
import {Injector} from "@angular/core";

// TODO: extend string signature with symbol once https://github.com/microsoft/TypeScript/pull/44512 is live
export type _Selectors = { [key: string]: string };
export type Getters<State> = { [selector: string]: (state: Immutable<State>, payload?: any) => any };

export type _Actions = { [key: string]: string };

export type Reducers<State> = { [action: string]: (state: Immutable<State>, payload?: any) => Immutable<State> }

export type EffectDispatch<T> = (action: string, payload?: any) => T;
type _EffectResult<T = any> = void | Observable<T>;
export type Effects<State> = {
  [action: string]: (argument: {state: Immutable<State>, payload?: any, injector: Injector, dispatch: EffectDispatch<void>, dispatch$: EffectDispatch<Observable<any>>}) => _EffectResult };

interface _BaseConfig<State> {
  id: string;
  initialState: State;
  selectors: _Selectors;
  getters: Getters<State>;
  actions?: _Actions;
  reducers?: Reducers<State>;
  effects?: Effects<State>;
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

export interface ChildStoreConfig<State> extends _BaseConfig<State> {}

// https://www.npmjs.com/package/type-fest
export type Immutable<T> = T extends
  | null
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
