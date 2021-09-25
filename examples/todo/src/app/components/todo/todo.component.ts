import {Component} from '@angular/core';
import {ChildStore} from "@ng-estate/store";
import {MappedTodo, TodoState} from "./store";
import {ActivatedRoute} from "@angular/router";
import {switchMap} from "rxjs/operators";
import {Observable} from "rxjs";
import {TodoActions} from "./store/todo.actions";
import {TodoSelectors} from "./store/todo.selectors";

@Component({
  selector: 'app-todo',
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css'],
})
export class TodoComponent {
  public readonly isLoading$: Observable<boolean>;
  public readonly todo$: Observable<MappedTodo>;

  constructor(private readonly childStore: ChildStore<TodoState>, private readonly route: ActivatedRoute) {
    this.isLoading$ = this.childStore.select$<boolean>(TodoSelectors.getIsLoading);

    this.childStore.select$<TodoState>(TodoSelectors.getState).subscribe((state) => console.log('Todo state: ', state));

    this.todo$ = this.route.params.pipe(
      switchMap((params) => {
        console.log('dispatch$: TodoActions.fetchTodo');
        return this.childStore.dispatch$<MappedTodo>(TodoActions.fetchTodo, Number(params.id))
      })
    );
  }
}
