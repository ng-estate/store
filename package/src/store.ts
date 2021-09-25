import {Inject, Injectable, Injector, Optional, SkipSelf} from "@angular/core";
import {
  _BaseStoreConfig,
  _Actions,
  ChildStoreConfig,
  Immutable,
  RootStoreConfig,
  _Selectors, _EffectDispatch
} from "./models";
import {BehaviorSubject, Observable} from "rxjs";
import {_ESTATE_CHILD_CONFIG, _ESTATE_CONFIG, _ESTATE_ROOT_CONFIG} from "./tokens";
import {map} from "rxjs/operators";
import {castImmutable, safeDeepFreeze} from "./utils";

abstract class Store<State> {
  private state$ = new BehaviorSubject<Immutable<State>>(undefined as Immutable<any>);

  protected constructor(@Inject(_ESTATE_CONFIG) private readonly config: _BaseStoreConfig<State>, private readonly injector: Injector) {
    if (this.config.providers) this.injector = Injector.create({providers: this.config.providers, parent: this.injector});

    if (this.config.selectors) this.checkValues(this.config.selectors, 'Selector');

    if (this.config.actions) this.checkValues(this.config.actions, 'Action');

    if ('initialState' in this.config) this.setState();
  }

  public select<T>(selector: string, payload?: any): Observable<T> {
    if (!this.config.getters[selector]) throw new Error(`[${this.config.id}] There is no corresponding getter for selector "${selector}"`);
    if (this.config.config?.freezePayload) safeDeepFreeze(payload);

    return this.config.getters[selector](this.state$.getValue(), payload);
  }

  public select$<T>(selector: string, payload?: any): Observable<T> {
    if (!this.config.getters[selector]) throw new Error(`[${this.config.id}] There is no corresponding getter for selector "${selector}"`);
    if (this.config.config?.freezePayload) safeDeepFreeze(payload);

    return this.state$.asObservable().pipe<T>(map((state) => this.config.getters[selector](state, payload)));
  }

  public dispatch(action: string, payload?: unknown): void {
    if (this.config.config?.freezePayload) safeDeepFreeze(payload);

    if (this.config.reducers?.[action]) {
      const nextState = this.config.reducers[action](
        this.state$.getValue(),
        payload
      );

      if (this.config.config?.freezeState) safeDeepFreeze(nextState);

      // @ts-ignore
      this.state$.next(nextState);
    }


    if (this.config.effects?.[action]) {
      this.config.effects?.[action]({
        state: this.state$.getValue(),
        payload,
        injector: this.injector,
        dispatch: this.getDispatch().bind(this),
        dispatch$: this.dispatch$Stub.bind(this)
      });
    }
  }

  public dispatch$<T>(action: string, payload?: unknown): Observable<T> {
    if (this.config.config?.freezePayload) safeDeepFreeze(payload);

    if (this.config.reducers?.[action]) {
      const nextState = this.config.reducers[action](
        this.state$.getValue(),
        payload
      );

      if (this.config.config?.freezeState) safeDeepFreeze(nextState);

      // @ts-ignore
      this.state$.next(nextState);
    }

    if (!this.config.effects?.[action]) throw new Error(`[${this.config.id}] Action "${action}" has no related effect. Consider to use dispatch if there are no asynchronous operations involved`)

    return this.config.effects[action]({
      state: this.state$.getValue(),
      payload,
      injector: this.injector,
      dispatch: this.getDispatch().bind(this),
      dispatch$: this.getDispatch$().bind(this),
    }) as Observable<T>;
  }

  private dispatch$Stub(action: string): never {
    throw new Error(`[${this.config.id}] dispatch$ can not be called on synchronous action "${action}". Consider to use .dispatch$(...) instead`);
  }

  private checkValues(configItem: _Selectors | _Actions, configItemName: string): void {
    const values = Object.values(configItem);

    for (let i = 0; i < values.length; i++) {
      const currentValue = values[i];

      if (!currentValue) throw new Error(`[${this.config.id}] ${configItemName} must have a non-empty string value`);

      if (configItemName === 'Action' && !this.config.reducers?.[currentValue] && !this.config.effects?.[currentValue]) throw new Error(`[${this.config.id}] ${configItemName} with value "${currentValue}" does not have any related reducer nor effect, and considered unused`);

      if (configItemName === 'Selector' && !this.config.getters[currentValue]) throw new Error(`[${this.config.id}] ${configItemName} with value "${currentValue}" does not have any related getter, and considered unused`);

      for (let j = i - 1; j > -1; j--) {
        const compareToValue = values[j];

        if (currentValue === compareToValue) throw new Error(`[${this.config.id}] Duplicate ${configItemName.toLowerCase()} entry: "${currentValue}"`);
      }
    }
  }

  private getDispatch(): _EffectDispatch<void> {
    let dispatchCount = 0;

    return (action: string, payload?: any): void => {
      ++dispatchCount;

      if (this.config.config && 'maxEffectDispatchCalls' in this.config.config) {
        if (this.config.config.maxEffectDispatchCalls === 0) throw new Error(`[${this.config.id}] Effect action dispatch is disabled (maxEffectDispatchCalls: 0)! Dispatched action: "${action}"`);
        if (dispatchCount > (this.config.config.maxEffectDispatchCalls as number)) throw new Error(`[${this.config.id}] Effect action dispatch limit exceeded for action with value: "${action}" (maxEffectDispatchCalls: ${this.config.config.maxEffectDispatchCalls})`);
      }

      this.dispatch(action, payload);
    };
  }

  private getDispatch$<T>(): _EffectDispatch<Observable<T>> {
    let dispatchCount = 0;

    return (action: string, payload?: any): Observable<T> => {
      ++dispatchCount;

      if (this.config.config && 'maxEffectDispatch$Calls' in this.config.config) {
        if (this.config.config.maxEffectDispatch$Calls === 0) throw new Error(`[${this.config.id}] Effect action dispatch$ is disabled (maxEffectDispatch$Calls: 0)! Dispatched action: "${action}"`);
        if (dispatchCount > (this.config.config.maxEffectDispatch$Calls as number)) throw new Error(`[${this.config.id}] Effect action dispatch$ limit exceeded for action with value: "${action}" (maxEffectDispatch$Calls: ${this.config.config.maxEffectDispatch$Calls})`);
      }

      return this.dispatch$<T>(action, payload);
    };
  }

  private setState(): void {
    this.state$ = new BehaviorSubject<Immutable<State>>(this.config.config?.freezeState ? safeDeepFreeze(this.config.initialState) : castImmutable(this.config.initialState));
  }
}

@Injectable()
export class RootStore<State> extends Store<State> {
  constructor(@Optional() @SkipSelf() rootStore: RootStore<State>, @Inject(_ESTATE_ROOT_CONFIG) config: RootStoreConfig<State>, injector: Injector) {
    if (rootStore) throw new Error(`[${(config as _BaseStoreConfig<State>).id}] EstateModule.forRoot() called twice. Consider to use EstateModule.forChild() instead`);

    super(config as _BaseStoreConfig<State>, injector);
  }
}

@Injectable()
export class ChildStore<State> extends Store<State> {
  constructor(@Optional() @Inject(_ESTATE_ROOT_CONFIG) rootConfig: RootStoreConfig<State>, @Inject(_ESTATE_CHILD_CONFIG) childConfig: ChildStoreConfig<State>, injector: Injector) {
    const config: ChildStoreConfig<State> | _BaseStoreConfig<State> = rootConfig?.config ? {
      ...childConfig,
      config: rootConfig.config
    } : childConfig;

    super(config, injector);
  }
}


