import {InjectionToken} from "@angular/core";
import {_BaseStoreConfig, ChildStoreConfig, RootStoreConfig} from "./models";

export const _ESTATE_CONFIG = new InjectionToken<_BaseStoreConfig<unknown>>(
  'Estate: State config'
);

export const _ESTATE_ROOT_CONFIG = new InjectionToken<RootStoreConfig<unknown>>(
  'Estate: Store root config'
);

export const _ESTATE_CHILD_CONFIG = new InjectionToken<ChildStoreConfig<unknown>>(
  'Estate: Store child config'
);
