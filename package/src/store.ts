import {Inject, Injectable, Injector} from "@angular/core";
import {_BaseStoreConfig, _Dispatch, _Dispatch$, _StoreAction} from "./models";
import {Observable} from "rxjs";
import {_ESTATE_CONFIG} from "./tokens";
import {distinctUntilChanged, map} from "rxjs/operators";
import {extractStoreId, safeDeepFreeze} from "./utils";
import {StoreManager} from "./store-manager";

@Injectable()
export class Store<State = unknown> {
  public constructor(@Inject(_ESTATE_CONFIG) config: _BaseStoreConfig<State>, private readonly injector: Injector, private readonly storeManager: StoreManager) {
    this.storeManager.registerStore<State>(config, injector);
  }

  private static dispatch$Stub(action: string): never {
    const storeId = extractStoreId(action);

    if (!storeId) throw new Error(`Can\'t extract store id from selector "${action}"`);

    throw new Error(`[${storeId}] dispatch$ can not be called on synchronous action "${action}". Consider to use .dispatch$(...) instead`);
  }

  public select<Result, Payload = unknown>(selector: string, payload?: Payload): Result {
    const storeId = extractStoreId(selector);

    if (!storeId) throw new Error(`Can\'t extract store id from selector "${selector}". Verify that store was initialized & selector is valid`);

    const store = this.storeManager._map[storeId];

    if (!store) throw new Error(`[${storeId}] Store does not exist`);

    if (!store.getters[selector]) throw new Error(`[${storeId}] There is no corresponding getter for selector "${selector}"`);
    if (this.storeManager._config?.freezePayload) safeDeepFreeze(payload);

    return store.getters[selector](store.state$.getValue(), payload);
  }

  public select$<Result, Payload = unknown>(selector: string, payload?: Payload): Observable<Result> {
    const storeId = extractStoreId(selector);

    if (!storeId) throw new Error(`Can\'t extract store id from selector "${selector}". Verify that store was initialized & selector is valid`);

    const store = this.storeManager._map[storeId];

    if (!store) throw new Error(`[${storeId}] Store does not exist`);

    if (!store.getters[selector]) throw new Error(`[${storeId}] There is no corresponding getter for selector "${selector}"`);
    if (this.storeManager._config?.freezePayload) safeDeepFreeze(payload);

    return store.state$.asObservable().pipe(
      map((state) => store.getters[selector](state, payload)),
      distinctUntilChanged()
    );
  }

  public dispatch<Payload>(action: string, payload?: Payload): void {
    const storeId = extractStoreId(action);

    if (!storeId) throw new Error(`Can\'t extract store id from action "${action}". Verify that store was initialized & selector is valid`);

    const store = this.storeManager._map[storeId];

    if (!store) throw new Error(`[${storeId}] Store does not exist`);

    if (this.storeManager._config?.freezePayload) safeDeepFreeze(payload);

    if (store.reducers?.[action]) {
      const nextState = store.reducers[action](
        store.state$.getValue(),
        payload
      );

      if (this.storeManager._config?.freezeState) safeDeepFreeze(nextState);

      store.state$.next(nextState);

      this.storeManager._actionStream$.next({storeId, action, payload});
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

  public dispatch$<Result, Payload = unknown>(action: string, payload?: Payload): Observable<Result> {
    const storeId = extractStoreId(action);

    if (!storeId) throw new Error(`Can\'t extract store id from action "${action}". Verify that store was initialized & selector is valid`);

    const store = this.storeManager._map[storeId];

    if (!store) throw new Error(`[${storeId}] Store does not exist`);

    if (this.storeManager._config?.freezePayload) safeDeepFreeze(payload);

    if (store.reducers?.[action]) {
      const nextState = store.reducers[action](
        store.state$.getValue(),
        payload
      );

      if (this.storeManager._config?.freezeState) safeDeepFreeze(nextState);

      store.state$.next(nextState);

      this.storeManager._actionStream$.next({storeId, action, payload});
    }

    if (!store.effects?.[action]) throw new Error(`[${storeId}] Action "${action}" has no related effect. Consider to use dispatch if there are no asynchronous operations involved`)

    const {dispatch, dispatch$} = this.dispatchFactory(storeId, this.getDispatch(storeId), this.getDispatch$(storeId));

    return store.effects[action]({
      state: store.state$.getValue(),
      payload,
      injector: this.injector,
      dispatch: dispatch.bind(this),
      dispatch$: dispatch$.bind(this),
    }) as Observable<Result>;
  }


  public destroy(storeId: string): void {
    if (!this.storeManager._map[storeId]) throw new Error(`[${storeId}] Store does not exist`);

    // Cleanup
    this.storeManager._map[storeId].state$.complete();
    delete this.storeManager._map[storeId];
    delete this.storeManager._injectorList[storeId];

    this.storeManager._actionStream$.next({storeId, action: _StoreAction.Destroy});
  }

  private getDispatch(storeId: string): _Dispatch {
    let dispatchCount = 0;

    return <Payload>(action: string, payload?: Payload): void => {
      ++dispatchCount;

      if (this.storeManager._config && 'maxEffectDispatchCalls' in this.storeManager._config && dispatchCount > (this.storeManager._config.maxEffectDispatchCalls as number)) {
        throw new Error(`[${storeId}] Effect action dispatch limit exceeded for action with value: "${action}" (maxEffectDispatchCalls: ${this.storeManager._config.maxEffectDispatchCalls})`);
      }

      this.dispatch<Payload>(action, payload);
    };
  }

  private getDispatch$(storeId: string): _Dispatch$ {
    let dispatchCount = 0;

    return <Result, Payload = unknown>(action: string, payload?: Payload): Observable<Result> => {
      ++dispatchCount;

      if (this.storeManager._config && 'maxEffectDispatch$Calls' in this.storeManager._config && dispatchCount > (this.storeManager._config.maxEffectDispatch$Calls as number)) {
        throw new Error(`[${storeId}] Effect action dispatch$ limit exceeded for action with value: "${action}" (maxEffectDispatch$Calls: ${this.storeManager._config.maxEffectDispatch$Calls})`);
      }

      return this.dispatch$<Result, Payload>(action, payload);
    };
  }

  private dispatchFactory(storeId: string, dispatch: _Dispatch, dispatch$?: _Dispatch$): { dispatch: _Dispatch, dispatch$: _Dispatch$ } {
    let dispatchCount = 0;

    return {
      dispatch: <Payload>(action: string, payload?: Payload): void => {
        ++dispatchCount;

        if (this.storeManager._config && 'maxEffectDispatchTotalCalls' in this.storeManager._config && dispatchCount > (this.storeManager._config.maxEffectDispatchTotalCalls as number)) {
          throw new Error(`[${storeId}] Effect action dispatch total call limit exceeded for action with value: "${action}" (maxEffectDispatchTotalCalls: ${this.storeManager._config.maxEffectDispatchTotalCalls})`);
        }

        dispatch<Payload>(action, payload);
      },
      dispatch$: dispatch$ ? <Result, Payload = unknown>(action: string, payload?: Payload): Observable<Result> => {
        ++dispatchCount;

        if (this.storeManager._config && 'maxEffectDispatchTotalCalls' in this.storeManager._config && dispatchCount > (this.storeManager._config.maxEffectDispatchTotalCalls as number)) {
          throw new Error(`[${storeId}] Effect action dispatch total call limit exceeded for action with value: "${action}" (maxEffectDispatchTotalCalls: ${this.storeManager._config.maxEffectDispatchTotalCalls})`);
        }

        return dispatch$<Result, Payload>(action, payload);
      } : Store.dispatch$Stub
    }
  }
}


