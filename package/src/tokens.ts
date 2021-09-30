import {InjectionToken} from "@angular/core";
import {_BaseStoreConfig} from "./models";

export const _ESTATE_CONFIG = new InjectionToken<_BaseStoreConfig<unknown>>(
  'Estate: State config'
);
