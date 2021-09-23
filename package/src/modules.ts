import {NgModule, ModuleWithProviders} from "@angular/core";
import {ChildStoreConfig, RootStoreConfig} from "./models";
import {ChildStore, RootStore} from "./store";
import {_ESTATE_CHILD_CONFIG, _ESTATE_ROOT_CONFIG} from "./tokens";

@NgModule()
export class RootStoreModule {}

@NgModule()
export class ChildStoreModule {}

export class StoreModule {
  public static forRoot<State>(config: RootStoreConfig<State>): ModuleWithProviders<RootStoreModule> {
    return {
      ngModule: RootStoreModule,
      providers: [
        RootStore,
        {provide: _ESTATE_ROOT_CONFIG, useValue: config}
      ]
    };
  }

  public static forChild<State>(config: ChildStoreConfig<State>): ModuleWithProviders<ChildStoreModule> {
    return {
      ngModule: ChildStoreModule,
      providers: [
        ChildStore,
        {provide: _ESTATE_CHILD_CONFIG, useValue: config}
      ]
    };
  }
}
