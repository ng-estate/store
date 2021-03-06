import {Inject, ModuleWithProviders, NgModule, Optional, Provider, SkipSelf} from "@angular/core";
import {_BaseStoreConfig, StoreConfig, StoreRootConfig} from "./models";
import {Store} from "./store";
import {_ESTATE_CONFIG} from "./tokens";
import {StoreManager} from "./store-manager";

@NgModule()
export class _StoreRootModule {
  constructor(@Optional() @SkipSelf() rootStore: Store, @Inject(_ESTATE_CONFIG) config: StoreRootConfig<unknown>) {
    if (rootStore) throw new Error(`[${(config as _BaseStoreConfig<unknown>).id}] EstateModule.forRoot() called twice. Consider to use EstateModule.forChild() instead`);
  }
}

@NgModule()
export class _StoreChildModule {}

export class StoreModule {
  public static forRoot<State>(config: StoreRootConfig<State> = {}): ModuleWithProviders<_StoreRootModule> {
    return {
      ngModule: _StoreRootModule,
      providers: [
        StoreManager,
        Store,
        {provide: _ESTATE_CONFIG, useValue: config}
      ]
    };
  }

  public static forChild<State>(config: StoreConfig<State>): ModuleWithProviders<_StoreChildModule> {
    return {
      ngModule: _StoreChildModule,
      providers: [
        Store,
        {provide: _ESTATE_CONFIG, useValue: config}
      ]
    };
  }

  public static forFeature<State>(config: StoreConfig<State>): Array<Provider> {
    return [
      Store,
      {provide: _ESTATE_CONFIG, useValue: config}
    ];
  }
}
