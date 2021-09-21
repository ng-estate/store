import {NgModule, ModuleWithProviders} from "@angular/core";
import {ChildStoreConfig, RootStoreConfig} from "./models";
import {ChildStore, RootStore} from "./store";
import {_ESTATE_CHILD_CONFIG, _ESTATE_ROOT_CONFIG} from "./tokens";

@NgModule()
class StoreRootModule {}

@NgModule()
class StoreChildModule {}

export class StoreModule {
  public static forRoot<State>(config: RootStoreConfig<State>): ModuleWithProviders<any> {
    return {
      ngModule: StoreRootModule,
      providers: [
        RootStore,
        {provide: _ESTATE_ROOT_CONFIG, useValue: config}
      ]
    };
  }

  public static forChild<State>(config: ChildStoreConfig<State>): ModuleWithProviders<any> {
    return {
      ngModule: StoreChildModule,
      providers: [
        ChildStore,
        {provide: _ESTATE_CHILD_CONFIG, useValue: config}
      ]
    };
  }
}
