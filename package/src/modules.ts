import {Inject, ModuleWithProviders, NgModule, Optional, SkipSelf} from "@angular/core";
import {_BaseStoreConfig, ChildStoreConfig, RootStoreConfig} from "./models";
import {Store} from "./store";
import {_ESTATE_CONFIG} from "./tokens";
import {StoreManager} from "./store-manager";

@NgModule()
export class RootStoreModule {
  constructor(@Optional() @SkipSelf() rootStore: Store<unknown>, @Inject(_ESTATE_CONFIG) config: RootStoreConfig<unknown>) {
    if (rootStore) throw new Error(`[${(config as _BaseStoreConfig<unknown>).id}] EstateModule.forRoot() called twice. Consider to use EstateModule.forChild() instead`);
  }
}

@NgModule()
export class ChildStoreModule {}

export class StoreModule {
  public static forRoot<State>(config: RootStoreConfig<State>): ModuleWithProviders<RootStoreModule> {
    return {
      ngModule: RootStoreModule,
      providers: [
        StoreManager,
        Store,
        {provide: _ESTATE_CONFIG, useValue: config}
      ]
    };
  }

  public static forChild<State>(config: ChildStoreConfig<State>): ModuleWithProviders<ChildStoreModule> {
    return {
      ngModule: ChildStoreModule,
      providers: [
        Store,
        {provide: _ESTATE_CONFIG, useValue: config}
      ]
    };
  }
}
