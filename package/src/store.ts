import {Inject, Injectable, Injector, Optional, SkipSelf} from "@angular/core";
import {
  _BaseStoreConfig,
  _Actions,
  ChildStoreConfig,
  EffectResult,
  Effects,
  Immutable,
  Reducers,
  RootStoreConfig,
  _Selectors
} from "./models";
import {BehaviorSubject, Observable} from "rxjs";
import {_ESTATE_CHILD_CONFIG, _ESTATE_CONFIG, _ESTATE_ROOT_CONFIG} from "./tokens";
import {map} from "rxjs/operators";
import {castImmutable, isString, safeDeepFreeze} from "./utils";

abstract class Store<State> {
  private state$ = new BehaviorSubject<Immutable<State>>(undefined as Immutable<any>);

  protected constructor(@Inject(_ESTATE_CONFIG) private readonly config: _BaseStoreConfig<State>, private readonly injector: Injector) {
    if (this.config.selectors) this.checkValueUniqueness(this.config.selectors, 'Selector');

    if (this.config.actions) this.checkValueUniqueness(this.config.actions, 'Action');

    if (this.config.reducers) this.config.reducers = this.resolvePointers(this.config.reducers);

    if (this.config.effects) this.config.effects = this.resolvePointers(this.config.effects);

    if ('initialState' in this.config) this.setState();
  }

  public dispatch(action: string, payload?: unknown): void {
    if (this.config.config?.freezePayload) safeDeepFreeze(payload);

    if (this.config.reducers?.[action]) {
      const nextState = this.config.reducers[action](
        this.state$.getValue(),
        payload
      );

      if (this.config.config?.freezeState) safeDeepFreeze(nextState);

      this.state$.next(nextState);
    }


    if (this.config.effects?.[action]) {
      return this.config.effects?.[action]({
        state: this.state$.getValue(),
        payload,
        injector: this.injector,
        dispatch: this.getDispatchAction(false).bind(this)
      }) as any;
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

      this.state$.next(nextState);
    }

    if (!this.config.effects?.[action]) throw new Error(`[${this.config.id}] Action "${action}" has no related effect. Consider to use dispatch if there is no observable as a result of effect`)

    return this.config.effects[action]({
      state: this.state$.getValue(),
      payload,
      injector: this.injector,
      dispatch: this.getDispatchAction(true).bind(this)
    }) as Observable<T>;
  }

  public select<T>(selector: string, payload?: any): Observable<T> {
    return this.state$.asObservable().pipe<T>(map((state) => this.config.getters[selector](state, payload)));
  }

  public snapshot<T>(selector: string, payload?: any): Observable<T> {
    return this.config.getters[selector](this.state$.getValue(), payload);
  }

  private checkValueUniqueness(configItem: _Selectors | _Actions, configItemName: string): void {
    const values = Object.values(configItem);

    for (let i = 0; i < values.length; i++) {
      const currentValue = values[i];

      if (!currentValue) throw new Error(`[${this.config.id}] ${configItemName} must have a non-empty string value`);

      for (let j = i - 1; j > -1; j--) {
        const compareToValue = values[j];

        if (currentValue === compareToValue) throw new Error(`[${this.config.id}] Duplicate ${configItemName.toLowerCase()} entry: "${currentValue}"`);
      }
    }
  }

  private resolvePointers(configItem: Reducers<State> | Effects<State>): any {
    const nextConfigItem: any = {};

    for (const [key, value] of Object.entries<any>(configItem)) {
      if (!isString(value)) {
        nextConfigItem[key] = value;

        continue;
      }

      if (!configItem[value]) throw new Error(`[${this.config.id}] Unknown pointer "${value}" of property "${key}"`);

      if (isString(configItem[value])) throw new Error(`[${this.config.id}] Pointer "${value}" of property "${key}" can not point to another pointer "${configItem[value]}"`);

      nextConfigItem[key] = configItem[value];
    }

    return nextConfigItem;
  }

  private getDispatchAction<T>(hasReturnValue: boolean): (action: string, payload: any) => EffectResult<T> {
    let dispatchCount = 0;

    return (action: string, payload: any): EffectResult<T> => {
      ++dispatchCount;

      if (this.config.config && 'maxEffectDispatchCalls' in this.config.config) {
        if (this.config.config.maxEffectDispatchCalls === 0) throw new Error(`[${this.config.id}] Effect action dispatch is disabled (maxEffectDispatchCalls: 0)! Dispatched action: "${action}"`);
        if (dispatchCount > (this.config.config.maxEffectDispatchCalls as number)) throw new Error(`[${this.config.id}] Effect action dispatch limit exceeded for action with value: "${action}" (maxEffectDispatchCalls: ${this.config.config.maxEffectDispatchCalls})`);
      }

      if (hasReturnValue && this.config.config?.returnEffectDispatchResult !== false) return this.dispatch(action, payload);

      this.dispatch(action, payload);
    };
  }

  private setState(): void {
    this.state$ = new BehaviorSubject<Immutable<State>>(this.config.config?.freezeState ? safeDeepFreeze(this.config.initialState) : castImmutable(this.config.initialState));
  }
}

@Injectable()
export class RootStore<State> extends Store<State> {
  constructor(@Optional() @SkipSelf() rootStore: RootStore<State>, @Inject(_ESTATE_ROOT_CONFIG) config: RootStoreConfig<State>, injector: Injector) {
    if (rootStore) throw new Error('EstateModule.forRoot() called twice. Consider to use EstateModule.forChild() instead');

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


