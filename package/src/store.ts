import {Inject, Injectable, Injector} from "@angular/core";
import {_BaseStoreConfig, _EffectDispatch, _EffectDispatch$} from "./models";
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

  private static dispatch$Stub(action: string): never {
    const storeId = extractStoreId(action);

    if (!storeId) throw new Error(`Can\'t extract store id from selector "${action}"`);

    throw new Error(`[${storeId}] dispatch$ can not be called on synchronous action "${action}". Consider to use .dispatch$(...) instead`);
  }

  public select<T>(selector: string, payload?: unknown): T {
    const storeId = extractStoreId(selector);

    if (!storeId) throw new Error(`Can\'t extract store id from selector "${selector}". Verify that store was initialized & selector is valid`);

    const store = this.storeManager.map[storeId];

    if (!store) throw new Error(`[${storeId}] Store does not exist`);

    if (!store.getters[selector]) throw new Error(`[${storeId}] There is no corresponding getter for selector "${selector}"`);
    if (this.storeManager.config?.freezePayload) safeDeepFreeze(payload);

    return store.getters[selector](store.state$.getValue(), payload);
  }

  public select$<T>(selector: string, payload?: unknown): Observable<T> {
    const storeId = extractStoreId(selector);

    if (!storeId) throw new Error(`Can\'t extract store id from selector "${selector}". Verify that store was initialized & selector is valid`);

    const store = this.storeManager.map[storeId];

    if (!store) throw new Error(`[${storeId}] Store does not exist`);

    if (!store.getters[selector]) throw new Error(`[${storeId}] There is no corresponding getter for selector "${selector}"`);
    if (this.storeManager.config?.freezePayload) safeDeepFreeze(payload);

    return store.state$.asObservable().pipe<T>(map((state) => store.getters[selector](state, payload)));
  }

  public dispatch(action: string, payload?: unknown): void {
    const storeId = extractStoreId(action);

    if (!storeId) throw new Error(`Can\'t extract store id from action "${action}". Verify that store was initialized & selector is valid`);

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

      this.storeManager.actionStream$.next({storeId, action, state: nextState});
    }

    const {dispatch, dispatch$} = this.dispatchFactory(storeId, this.getDispatch(storeId));

    if (store.effects?.[action]) {
      store.effects?.[action]({
        state: store.state$.getValue(),
        payload,
        injector: this.injector,
        dispatch: dispatch.bind(this),
        dispatch$: dispatch$
      });
    }
  }

  public dispatch$<T>(action: string, payload?: unknown): Observable<T> {
    const storeId = extractStoreId(action);

    if (!storeId) throw new Error(`Can\'t extract store id from action "${action}". Verify that store was initialized & selector is valid`);

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

      this.storeManager.actionStream$.next({storeId, action, state: nextState});
    }

    if (!store.effects?.[action]) throw new Error(`[${storeId}] Action "${action}" has no related effect. Consider to use dispatch if there are no asynchronous operations involved`)

    const {dispatch, dispatch$} = this.dispatchFactory(storeId, this.getDispatch(storeId), this.getDispatch$(storeId));

    return store.effects[action]({
      state: store.state$.getValue(),
      payload,
      injector: this.injector,
      dispatch: dispatch.bind(this),
      dispatch$: dispatch$.bind(this),
    }) as Observable<T>;
  }


  public destroy(storeId: string): void {
    if (!this.storeManager.map[storeId]) throw new Error(`[${storeId}] Store does not exist`);

    this.storeManager.map[storeId].state$.complete();
    delete this.storeManager.map[storeId];
  }

  private getDispatch(storeId: string): _EffectDispatch {
    let dispatchCount = 0;

    return (action: string, payload?: any): void => {
      ++dispatchCount;

      if (this.storeManager.config && 'maxEffectDispatchCalls' in this.storeManager.config && dispatchCount > (this.storeManager.config.maxEffectDispatchCalls as number)) {
        throw new Error(`[${storeId}] Effect action dispatch limit exceeded for action with value: "${action}" (maxEffectDispatchCalls: ${this.storeManager.config.maxEffectDispatchCalls})`);
      }

      this.dispatch(action, payload);
    };
  }

  private getDispatch$(storeId: string): _EffectDispatch$<unknown> {
    let dispatchCount = 0;

    return <T>(action: string, payload?: any): Observable<T> => {
      ++dispatchCount;

      if (this.storeManager.config && 'maxEffectDispatch$Calls' in this.storeManager.config && dispatchCount > (this.storeManager.config.maxEffectDispatch$Calls as number)) {
        throw new Error(`[${storeId}] Effect action dispatch$ limit exceeded for action with value: "${action}" (maxEffectDispatch$Calls: ${this.storeManager.config.maxEffectDispatch$Calls})`);
      }

      return this.dispatch$<T>(action, payload);
    };
  }

  private dispatchFactory(storeId: string, dispatch: _EffectDispatch, dispatch$?: _EffectDispatch$<unknown>): { dispatch: _EffectDispatch, dispatch$: _EffectDispatch$<unknown> } {
    let dispatchCount = 0;

    return {
      dispatch: (action: string, payload?: any): void => {
        ++dispatchCount;

        if (this.storeManager.config && 'maxEffectDispatchTotalCalls' in this.storeManager.config && dispatchCount > (this.storeManager.config.maxEffectDispatchTotalCalls as number)) {
          throw new Error(`[${storeId}] Effect action dispatch total call limit exceeded for action with value: "${action}" (maxEffectDispatchTotalCalls: ${this.storeManager.config.maxEffectDispatchTotalCalls})`);
        }

        dispatch(action, payload);
      },
      dispatch$: dispatch$ ? <T>(action: string, payload?: any): Observable<T> => {
        ++dispatchCount;

        if (this.storeManager.config && 'maxEffectDispatchTotalCalls' in this.storeManager.config && dispatchCount > (this.storeManager.config.maxEffectDispatchTotalCalls as number)) {
          throw new Error(`[${storeId}] Effect action dispatch total call limit exceeded for action with value: "${action}" (maxEffectDispatchTotalCalls: ${this.storeManager.config.maxEffectDispatchTotalCalls})`);
        }

        return dispatch$<T>(action, payload);
      } : Store.dispatch$Stub
    }
  }
}


