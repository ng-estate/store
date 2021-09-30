import {EventEmitter, Injectable} from "@angular/core";
import {
  _Actions,
  _BaseStoreConfig,
  _Selectors,
  _StoreConfig, StoreEvent, _StoreMap, _StoreMapValue,
  Effects,
  Getters,
  Immutable,
  Reducers,
} from "./models";
import {BehaviorSubject} from "rxjs";
import {castImmutable, safeDeepFreeze} from "./utils";

@Injectable()
export class StoreManager {
  public readonly map: _StoreMap = {};
  public readonly actionStream$ = new EventEmitter<StoreEvent<unknown>>();
  public config: _StoreConfig['config']; // root config

  public push<State>(config: _BaseStoreConfig<State>): void {
    if (config.config) {
      if (this.config) throw new Error(`[${config.id}] Root config is already defined`);

      this.config = config.config;
    }

    // Consider root store config
    if (!config.id) return;

    // Consider duplicate entry
    if (config.id in this.map) throw new Error(`[${config.id}] Store already exists`);

    // Check value validity
    StoreManager.checkValues<State>(config, config.selectors, 'Selector');
    if (config.actions) StoreManager.checkValues<State>(config, config.actions, 'Action');

    // Prepend store id
    this.patchWithId<State>(config);

    // Initial state
    const state$ = new BehaviorSubject<Immutable<State>>(
      'initialState' in config ?
        this.config?.freezeState
          ? safeDeepFreeze(config.initialState)
          : castImmutable(config.initialState)
        : undefined as any
    );

    // Add updated config values to the map
    this.map[config.id] = {
      getters: config.getters,
      reducers: config.reducers,
      effects: config.effects,
      state$
    } as _StoreMapValue<State>;

    this.actionStream$.emit({storeId: config.id, action: '@ng-estate/store/push', state: state$.getValue()});
  }

  private patchWithId<State>(config: _BaseStoreConfig<State>): void {
    const {id, actions, reducers, effects, getters, selectors} = config;

    let patchedGetters: Getters<State> = {};
    let patchedReducers: Reducers<State> = {};
    let patchedEffects: Effects<State> = {};

    Object.keys(selectors).forEach((key: string) => {
      const patchedSelector = `[${id}] ${selectors[key]}`;
      patchedGetters[patchedSelector] = getters[selectors[key]];

      // delete getters[selectors[key]]; // Delete used getters in order to populate patchedGetters with that which is left, if config.noTreeShakableComponents is falsy

      selectors[key] = patchedSelector;
    });

    if (actions) {
      Object.keys(actions).forEach((key: string) => {
        const patchedAction = `[${id}] ${actions[key]}`;

        if (reducers) {
          reducers[patchedAction] = reducers[actions[key]];

          // delete reducers[actions[key]];
        }

        if (effects) {
          effects[patchedAction] = effects[actions[key]];

          // delete effects[actions[key]];
        }

        actions[key] = patchedAction;
      });
    }

    // if (this.config?.noTreeShakableComponents) {
    //   patchedGetters = {
    //     ...patchedGetters,
    //     ...getters
    //   }
    //
    //   if (reducers) {
    //     patchedReducers = {
    //       ...patchedReducers,
    //       ...reducers
    //     }
    //   }
    //
    //   if (effects) {
    //     patchedEffects = {
    //       ...patchedEffects,
    //       ...effects
    //     }
    //   }
    // }

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
}
