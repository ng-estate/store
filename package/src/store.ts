import {Inject, Injectable, Injector} from "@angular/core";
import {_BaseStoreConfig, _EffectDispatch} from "./models";
import {Observable} from "rxjs";
import {_ESTATE_CONFIG} from "./tokens";
import {map} from "rxjs/operators";
import {extractStoreId, safeDeepFreeze} from "./utils";
import {StoreManager} from "./store-manager";


@Injectable()
export class Store<State> {
  public constructor(@Inject(_ESTATE_CONFIG) config: _BaseStoreConfig<State>, private readonly injector: Injector, private readonly storeManager: StoreManager) {
    this.storeManager.push<State>(config);
  }

  public select<T>(selector: string, payload?: any): Observable<T> {
    const storeId = extractStoreId(selector);

    if (!storeId) throw new Error(`Can\'t extract store id from selector "${selector}". Verify that store was set & selector is valid`);

    const store = this.storeManager.map[storeId];

    if (!store) throw new Error(`[${storeId}] Store does not exist`);

    if (!store.getters[selector]) throw new Error(`[${storeId}] There is no corresponding getter for selector "${selector}"`);
    if (this.storeManager.config?.freezePayload) safeDeepFreeze(payload);

    return store.getters[selector](store.state$.getValue(), payload);
  }

  public select$<T>(selector: string, payload?: any): Observable<T> {
    const storeId = extractStoreId(selector);

    if (!storeId) throw new Error(`Can\'t extract store id from selector "${selector}". Verify that store was set & selector is valid`);

    const store = this.storeManager.map[storeId];

    if (!store) throw new Error(`[${storeId}] Store does not exist`);

    if (!store.getters[selector]) throw new Error(`[${storeId}] There is no corresponding getter for selector "${selector}"`);
    if (this.storeManager.config?.freezePayload) safeDeepFreeze(payload);

    return store.state$.asObservable().pipe<T>(map((state) => store.getters[selector](state, payload)));
  }

  public dispatch(action: string, payload?: unknown): void {
    const storeId = extractStoreId(action);

    if (!storeId) throw new Error(`Can\'t extract store id from action "${action}". Verify that store was set & selector is valid`);

    const store = this.storeManager.map[storeId];

    if (!store) throw new Error(`[${storeId}] Store does not exist`);

    if (this.storeManager.config?.freezePayload) safeDeepFreeze(payload);

    if (store.reducers?.[action]) {
      const nextState = store.reducers[action](
        store.state$.getValue(),
        payload
      );

      if (this.storeManager.config?.freezeState) safeDeepFreeze(nextState);

      store.state$.next(nextState);

      this.storeManager.eventEmitter$.emit({storeId, action, state: nextState});
    }


    if (store.effects?.[action]) {
      store.effects?.[action]({
        state: store.state$.getValue(),
        payload,
        injector: this.injector,
        dispatch: this.getDispatch(storeId).bind(this),
        dispatch$: Store.dispatch$Stub
      });
    }
  }

  public dispatch$<T>(action: string, payload?: unknown): Observable<T> {
    const storeId = extractStoreId(action);

    if (!storeId) throw new Error(`Can\'t extract store id from action "${action}". Verify that store was set & selector is valid`);

    const store = this.storeManager.map[storeId];

    if (!store) throw new Error(`[${storeId}] Store does not exist`);

    if (this.storeManager.config?.freezePayload) safeDeepFreeze(payload);

    if (store.reducers?.[action]) {
      const nextState = store.reducers[action](
        store.state$.getValue(),
        payload
      );

      if (this.storeManager.config?.freezeState) safeDeepFreeze(nextState);

      store.state$.next(nextState);

      this.storeManager.eventEmitter$.emit({storeId, action, state: nextState});
    }

    if (!store.effects?.[action]) throw new Error(`[${storeId}] Action "${action}" has no related effect. Consider to use dispatch if there are no asynchronous operations involved`)

    return store.effects[action]({
      state: store.state$.getValue(),
      payload,
      injector: this.injector,
      dispatch: this.getDispatch(storeId).bind(this),
      dispatch$: this.getDispatch$(storeId).bind(this),
    }) as Observable<T>;
  }

  private static dispatch$Stub(action: string): never {
    const storeId = extractStoreId(action);

    if (!storeId) throw new Error(`Can\'t extract store id from selector "${action}"`);

    throw new Error(`[${storeId}] dispatch$ can not be called on synchronous action "${action}". Consider to use .dispatch$(...) instead`);
  }

  private getDispatch(storeId: string): _EffectDispatch<void> {
    let dispatchCount = 0;

    return (action: string, payload?: any): void => {
      ++dispatchCount;

      if (this.storeManager.config && 'maxEffectDispatchCalls' in this.storeManager.config) {
        if (this.storeManager.config.maxEffectDispatchCalls === 0) throw new Error(`[${storeId}] Effect action dispatch is disabled (maxEffectDispatchCalls: 0)! Dispatched action: "${action}"`);
        if (dispatchCount > (this.storeManager.config.maxEffectDispatchCalls as number)) throw new Error(`[${storeId}] Effect action dispatch limit exceeded for action with value: "${action}" (maxEffectDispatchCalls: ${this.storeManager.config.maxEffectDispatchCalls})`);
      }

      this.dispatch(action, payload);
    };
  }

  private getDispatch$<T>(storeId: string): _EffectDispatch<Observable<T>> {
    let dispatchCount = 0;

    return (action: string, payload?: any): Observable<T> => {
      ++dispatchCount;

      if (this.storeManager.config && 'maxEffectDispatch$Calls' in this.storeManager.config) {
        if (this.storeManager.config.maxEffectDispatch$Calls === 0) throw new Error(`[${storeId}] Effect action dispatch$ is disabled (maxEffectDispatch$Calls: 0)! Dispatched action: "${action}"`);
        if (dispatchCount > (this.storeManager.config.maxEffectDispatch$Calls as number)) throw new Error(`[${storeId}] Effect action dispatch$ limit exceeded for action with value: "${action}" (maxEffectDispatch$Calls: ${this.storeManager.config.maxEffectDispatch$Calls})`);
      }

      return this.dispatch$<T>(action, payload);
    };
  }
}


