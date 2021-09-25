import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoComponent } from './todo.component';
import {RouterModule} from "@angular/router";
import {StoreModule} from "@ng-estate/store";
import {TodoStore} from "./store";

@NgModule({
  declarations: [
    TodoComponent
  ],
  imports: [
    CommonModule,
    StoreModule.forChild(TodoStore),
    RouterModule.forChild([{path: '', component: TodoComponent}]),
  ]
})
export class TodoModule { }
