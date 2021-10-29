import {Injectable} from "@angular/core";
import {
  _Actions,
  _BaseStoreConfig,
  _Selectors,
  _StoreConfig, StoreEvent, _StoreMap, _StoreMapValue,
  Effects,
  Getters,
  Immutable,
  Reducers, _PatchedMap, _StoreAction,
} from "./models";
import {BehaviorSubject, Observable, ReplaySubject} from "rxjs";
import {castImmutable, hasOwnProperty, safeDeepFreeze} from "./utils";

@Injectable()
export class StoreManager {
  public readonly _map: _StoreMap = Object.create(null);
  public readonly _actionStream$ = new ReplaySubject<StoreEvent>(1); // Useful for manual debugging at root level component, as subscription is not set at the moment of initial push()
  private readonly patchedMap: _PatchedMap = Object.create(null);

  public _config: _StoreConfig['config']; // root config

  public push<State>(config: _BaseStoreConfig<State>): void {
    if (config.config) {
      if (this._config) throw new Error(`[${config.id}] Root config is already defined`);

      this._config = config.config;
    }

    // Consider global config
    if (!config.id) return;

    // Consider duplicate entry
    if (this._map[config.id]) throw new Error(`[${config.id}] Store already exists`);

    // Check value validity
    StoreManager.checkValues<State>(config, config.selectors, 'Selector');
    if (config.actions) StoreManager.checkValues<State>(config, config.actions, 'Action');

    // Prepend store id
    if (!this.patchedMap[config.id]) {
      this.patchWithId<State>(config);
      this.patchedMap[config.id] = true;
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

  public get actionStream$(): Observable<StoreEvent> {
    return this._actionStream$.asObservable();
  }
}
