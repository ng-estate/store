import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusComponent } from './status.component';
import {StatusStore} from "./store";
import {StoreModule} from "@ng-estate/store";



@NgModule({
  declarations: [
    StatusComponent
  ],
  exports: [
    StatusComponent
  ],
  imports: [
    CommonModule,
    StoreModule.forChild(StatusStore)
  ]
})
export class StatusModule { }
