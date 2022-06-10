import {Component} from '@angular/core';
import {Store} from "@ng-estate/store/internal";
import {MappedTodo, Todo, TodoState} from "./store";
import {ActivatedRoute, Params} from "@angular/router";
import {switchMap} from "rxjs/operators";
import {Observable} from "rxjs";
import {TodoActions} from "./store/todo.actions";
import {TodoSelectors} from "./store/todo.selectors";
import {AppSelectors} from "../../store/app.selectors";

@Component({
  selector: 'app-todo',
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css'],
})
export class TodoComponent {
  public readonly isLoading$: Observable<boolean>;
  public readonly todo$: Observable<MappedTodo>;

  constructor(private readonly store: Store<TodoState>, private readonly route: ActivatedRoute) {
    this.isLoading$ = this.store.select$<boolean>(TodoSelectors.getIsLoading);

    this.store.select$<TodoState>(TodoSelectors.getState).subscribe((state: TodoState) => console.log('Todo state: ', state));
    this.store.select$<Array<Partial<Todo>>>(AppSelectors.getTodoList).subscribe((state: Array<Partial<Todo>>) => console.log('App todo list from within TodoComponent: ', state));

    this.todo$ = this.route.params.pipe(
      switchMap((params: Params) => {
        return this.store.dispatch$<MappedTodo>(TodoActions.fetchTodo, Number(params.id))
      })
    );
  }
}
