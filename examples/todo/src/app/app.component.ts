import {Component} from '@angular/core';
import {RootStore} from "@ng-estate/store";
import {AppSelectors} from "./store/app.selectors";
import {AppActions} from "./store/app.actions";
import {AppState} from "./store";
import {Observable} from "rxjs";
import {take} from "rxjs/operators";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  public readonly isLoading$: Observable<boolean>;
  public readonly todoList$: Observable<AppState['todoList']>;

  constructor(private readonly rootStore: RootStore<AppState>) {
    this.todoList$ = this.rootStore.select$(AppSelectors.getTodoList);
    this.isLoading$ = this.rootStore.select$(AppSelectors.getIsLoading);

    this.rootStore.select$(AppSelectors.getState).subscribe((state) => console.log('App state: ', state));
    this.rootStore.dispatch$(AppActions.fetchAllTodos).pipe(take(1)).subscribe();
    console.log('dispatch$: TodoActions.fetchAllTodos');
  }
}
