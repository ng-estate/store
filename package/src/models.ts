import {BehaviorSubject, Observable} from "rxjs";
import {Injector} from "@angular/core";

export enum _StoreAction {
  Push =  '@ng-estate/store/push',
  Destroy = '@ng-estate/store/destroy'
}

// TODO: extend string signature with symbol once https://github.com/microsoft/TypeScript/pull/44512 is live
export type _Selectors = { [key: string]: string };
export type Getter<State> = (state: Immutable<State>, payload?: any) => any;
export type Getters<State> = { [selector: string]: Getter<State> };

export type _Actions = { [key: string]: string };

export type ReducerResult<State> = Immutable<State>;
export type Reducer<State> = (state: Immutable<State>, payload?: any) => ReducerResult<State>;
export type Reducers<State> = { [action: string]: Reducer<State> };

export type _EffectDispatch = <Payload>(action: string, payload?: Payload) => void;
export type _EffectDispatch$ = <Result, Payload = any>(action: string, payload?: Payload) => Observable<Result>;
export type EffectResult<Result = unknown> = void | Observable<Result>;
export interface EffectOptions<State, Payload = unknown> {
  state: Immutable<State>;
  payload: Payload;
  injector: Injector;
  dispatch: _EffectDispatch;
  dispatch$: _EffectDispatch$;
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

export type StoreRootConfig<State> = _StoreConfig | _BaseStoreConfig<State>;

export interface StoreConfig<State> extends _BaseConfig<State> {
}

export interface _StoreMapValue<State> extends Pick<_BaseConfig<State>, 'getters' | 'reducers' | 'effects'> {
  state$: BehaviorSubject<Immutable<State>>;
}

export interface _StoreMap {
  [storeId: string]: _StoreMapValue<any>;
}

export interface _PatchedMap {
  [storeId: string]: boolean;
}

export interface _StoreStateMap {
  [storeId: string]: Immutable<unknown>;
}

export interface StoreEvent<Payload = unknown> {
  storeId: string;
  action: string;
  payload?: Payload;
}

export interface StoreLoggerEvent extends StoreEvent {
  state: Immutable<unknown>;
  states: _StoreStateMap;
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
