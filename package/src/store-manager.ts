import {Injectable, Injector} from "@angular/core";
import {
  _Actions,
  _BaseStoreConfig,
  _Selectors,
  _StoreConfig, StoreEvent, _StoreMap, _StoreMapValue,
  Effects,
  Getters,
  Immutable,
  Reducers, _PatchedMap, _StoreAction, _NgEstate, _InjectorList,
} from "./models";
import {BehaviorSubject, Observable, ReplaySubject, take} from "rxjs";
import {castImmutable, hasOwnProperty, safeDeepFreeze, _storeLogger, extractStoreId} from "./utils";
import {Store} from "./store";

declare global {
  var ngEstate: _NgEstate;
}

@Injectable()
export class StoreManager {
  public readonly _map: _StoreMap = Object.create(null);
  public readonly _actionStream$ = new ReplaySubject<StoreEvent>(1); // Useful for manual debugging at root level component, as subscription is not set at the moment of initial push()
  private readonly patchedMap: _PatchedMap = Object.create(null); // Contains register of store id's which were already patched
  private readonly injectorList: _InjectorList = {};

  public _config: _StoreConfig['config']; // root config

  public registerStore<State>(config: _BaseStoreConfig<State>, injector?: Injector): void {
    if (config.config) {
      if (this._config) throw new Error(`${config.id ? '[' + config.id + '] ': ''}Root store config is already defined`);

      this._config = config.config;

      // As it must be the only instance across entire application, no unsubscribe logic is needed
      if (this._config.debug) this.setupDebug();
    }

    // Consider global config
    if (!config.id) return;

    // Add to injector list
    if (this._config?.debug) {
      if (!injector) throw new Error(`[${config.id}] You might want to pass Injector as well in order for ngEstate to work properly in a debug mode`)

      this.injectorList[config.id] = injector;
    }

    // Consider duplicate entry
    if (this._map[config.id]) throw new Error(`[${config.id}] Store already exists`);

    // Check value validity
    StoreManager.checkValues<State>(config, config.selectors, 'Selector');
    if (config.actions) StoreManager.checkValues<State>(config, config.actions, 'Action');

    // Prepend store id
    if (!this.patchedMap[config.id]) {
      this.patchWithId<State>(config);
      this.patchedMap[config.id] = true;

      if (this._config?.debug && config.actions) StoreManager.patchNgEstateActions(config.actions);
    }

    // Add updated config values to the map
    this._map[config.id] = {
      getters: config.getters,
      reducers: config.reducers,
      effects: config.effects,
      // Initial state
      state$: new BehaviorSubject<Immutable<State>>(
        hasOwnProperty(config, 'initialState') ?
          this._config?.freezeState
            ? safeDeepFreeze(config.initialState)
            : castImmutable(config.initialState)
          : undefined as any
      )
    } as _StoreMapValue<State>;

    this._actionStream$.next({storeId: config.id, action: _StoreAction.Push});
  }

  private patchWithId<State>(config: _BaseStoreConfig<State>): void {
    const {id, actions, reducers, effects, getters, selectors} = config;

    let patchedGetters: Getters<State> = {};
    let patchedReducers: Reducers<State> = {};
    let patchedEffects: Effects<State> = {};

    Object.keys(selectors).forEach((key: string) => {
      const patchedSelector = `[${id}] ${selectors[key]}`;
      patchedGetters[patchedSelector] = getters[selectors[key]];

      selectors[key] = patchedSelector;
    });

    if (actions) {
      Object.keys(actions).forEach((key: string) => {
        const patchedAction = `[${id}] ${actions[key]}`;

        if (reducers) {
          patchedReducers[patchedAction] = reducers[actions[key]];
        }

        if (effects) {
          patchedEffects[patchedAction] = effects[actions[key]];
        }

        actions[key] = patchedAction;
      });
    }

    // Update config references
    config.getters = patchedGetters;
    config.reducers = patchedReducers;
    config.effects = patchedEffects;
  }

  private setupDebug(): void {
    globalThis.ngEstate = {
      actions: Object.create(null),
      dispatch: (action: string, payload?: unknown): void => {
        const storeId = extractStoreId(action) as string; // Assume actions assigned programmatically, thus have correct id
        // Use of StoreManager's constructor DI will cause circular DI error
        const store = this.injectorList[storeId].get(Store);

        store.dispatch(action, payload);
      },
      dispatch$: (action: string, payload?: unknown, returnSource?: boolean): Observable<unknown> | void => {
        const storeId = extractStoreId(action) as string; // Assume actions assigned programmatically, thus have correct id
        // Use of StoreManager's constructor DI will cause circular DI error
        const store = this.injectorList[storeId].get(Store);
        const dispatch$ = store.dispatch$(action, payload);

        // Might cause memory issues if result observable doesn't have unsubscribe condition
        if (returnSource) return dispatch$;
        // Handles unsubscribe automatically; Useful for inspecting action effects
        dispatch$.pipe(take(1)).subscribe();
      },
    };

    _storeLogger(this).subscribe((event) => console.debug('%c @ng-estate/store\n', 'color: #BFFF00', event));
  }

  private static patchNgEstateActions(actions: _Actions): void {
    globalThis.ngEstate.actions = {...globalThis.ngEstate.actions, ...actions};
  }

  private static checkValues<State>(config: _BaseStoreConfig<State>, configItem: _Selectors | _Actions, configItemName: string): void {
    const values = Object.values(configItem);

    for (let i = 0; i < values.length; i++) {
      const currentValue = values[i];

      if (!currentValue) throw new Error(`[${config.id}] ${configItemName} must have a non-empty string value`);

      if (configItemName === 'Action' && !config.reducers?.[currentValue] && !config.effects?.[currentValue]) throw new Error(`[${config.id}] ${configItemName} with value "${currentValue}" does not have any related reducer nor effect, and considered unused`);

      if (configItemName === 'Selector' && !config.getters[currentValue]) throw new Error(`[${config.id}] ${configItemName} with value "${currentValue}" does not have any related getter, and considered unused`);

      for (let j = i - 1; j > -1; j--) {
        const compareToValue = values[j];

        if (currentValue === compareToValue) throw new Error(`[${config.id}] Duplicate ${configItemName.toLowerCase()} entry: "${currentValue}"`);
      }
    }
  }

  // Could be consumed by external dev tools
  public get actionStream$(): Observable<StoreEvent> {
    return this._actionStream$.asObservable();
  }
}
