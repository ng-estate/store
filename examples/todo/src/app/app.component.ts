import {Component} from '@angular/core';
import {AppSelectors} from "./store/app.selectors";
import {AppActions} from "./store/app.actions";
import {AppState} from "./store";
import {Observable} from "rxjs";
import {take} from "rxjs/operators";
import {Store, StoreManager} from "@ng-estate/store";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  public readonly isLoading$: Observable<boolean>;
  public readonly todoList$: Observable<AppState['todoList']>;

  constructor(private readonly store: Store<AppState>, private readonly storeManager: StoreManager) {
    this.storeManager.actionStream$.subscribe(console.debug);

    this.todoList$ = this.store.select$(AppSelectors.getTodoList);
    this.isLoading$ = this.store.select$(AppSelectors.getIsLoading);

    this.store.select$<AppState>(AppSelectors.getState).subscribe((state: AppState) => console.log('App state: ', state));
    this.store.dispatch$(AppActions.fetchAllTodos).pipe(take(1)).subscribe();
  }
}
