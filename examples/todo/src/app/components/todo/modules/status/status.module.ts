import { Injector, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusComponent } from './status.component';
import {StatusStore} from "./store";
import {StoreManager} from "@ng-estate/store";



@NgModule({
  declarations: [
    StatusComponent
  ],
  exports: [
    StatusComponent
  ],
  imports: [
    CommonModule
  ]
})
export class StatusModule {
  constructor(storeManager: StoreManager, injector: Injector) {
    storeManager.registerStore(StatusStore, injector);
  }
}
