import {NgModule, ModuleWithProviders} from "@angular/core";
import {ChildStoreConfig, RootStoreConfig} from "./models";
import {ChildStore, RootStore} from "./store";
import {_ESTATE_CHILD_CONFIG, _ESTATE_ROOT_CONFIG} from "./tokens";

@NgModule()
class RootStoreModule {}

@NgModule()
class ChildStoreModule {}

export class StoreModule {
  public static forRoot(config: RootStoreConfig<unknown>): ModuleWithProviders<RootStoreModule> {
    return {
      ngModule: RootStoreModule,
      providers: [
        RootStore,
        {provide: _ESTATE_ROOT_CONFIG, useValue: config}
      ]
    };
  }

  public static forChild(config: ChildStoreConfig<unknown>): ModuleWithProviders<ChildStoreModule> {
    return {
      ngModule: ChildStoreModule,
      providers: [
        ChildStore,
        {provide: _ESTATE_CHILD_CONFIG, useValue: config}
      ]
    };
  }
}
