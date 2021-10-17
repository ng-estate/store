import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoComponent } from './todo.component';
import {RouterModule} from "@angular/router";
import {StoreModule} from "@ng-estate/store/internal";
import {TodoStore} from "./store";
import {TodoMapper} from "./mapper/todo.mapper";
import {StatusModule} from "./modules/status/status.module";

@NgModule({
  declarations: [
    TodoComponent
  ],
  imports: [
    CommonModule,
    StoreModule.forChild(TodoStore),
    RouterModule.forChild([{path: '', component: TodoComponent}]),
    StatusModule
  ],
  providers: [
    TodoMapper
  ]
})
export class TodoModule { }
