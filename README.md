# Estate

---

<p align="center">
  <img src="https://github.com/ng-estate/store/raw/master/assets/logo-with-background.png" alt="logo" />
  <br />
  Estate is a simple yet flexible state management library for Angular
</p>

---

### Advantages:

- Simple
- Intuitive
- Type-safe
- Immutable
- Scalable
- Flexible
- Light-weight

Follows [Occam's razor](https://en.wikipedia.org/wiki/Occam%27s_razor) principle

---

<h2 id="docs" style="margin-top: 0">Documentation</h2>

<p align="center">
  <img src="https://github.com/ng-estate/store/raw/master/assets/diagram.jpg" alt="flow diagram" />
  <br />
  «Brilliant» flow diagram
</p>

### Store

Store offers simplistic API methods, both synchronous and asynchronous in their nature, such as:

`select<T>(selector: string, payload?: unknown): T`

Used for taking a snapshots of a current state, i.e. synchronous data retrieval

`select$<T>(selector: string, payload?: unknown): Observable<T>`

Used for an asynchronous subscription based data retrieval

`dispatch(action: string, payload?: unknown): void`

Used for synchronous operations with state data. Asynchronous operations would be ignored for this type of dispatch

`dispatch$(action: string, payload?: unknown): Observable<T>`

Used for operations which involve asynchronous programming. Results in observable that has to be subscribed to in order to bring async instructions into action

### Actions

Used as a `dispatch(...)` and `dispatch$(...)` action identifier

```javascript
export const AppActions = {
  fetchTodo: 'Fetch individual todo',
  fetchTodos: 'Fetch todo list',
  todosFetched: 'On todos fetch success'
} as const
```

### Reducers

Synchronous state change caused by action dispatch

```javascript
export const AppReducers: Reducers<AppState> = {
  [AppActions.fetchTodo]: (state): ReducerResult<AppState> => ({...state, activeTodo: null, isLoading: true}),
  [AppActions.fetchTodos]: (state): ReducerResult<AppState> => ({...state, isLoading: true}),
  [AppActions.todoFetched]: (state, todo: Todo): ReducerResult<AppState> => ({...state, todo, isLoading: false}),
  [AppActions.todosFetched]: (state, todos: Array<Todo>): ReducerResult<AppState> => ({...state, todos, isLoading: false})
}
```

### Effects

Side effect of action dispatch

```javascript
export const AppEffects: Effects<AppState> = {
  [AppActions.fetchTodo]: ({payload, dispatch, dispatch$, injector}: EffectOptions<AppState, number>): EffectResult<MappedTodo> => {
    const todoService = injector.get(TodoService);
  
    const todo$ = todoService.getById(payload).pipe(
      tap((todo) => {
        dispatch(AppActions.todoFetched, todo);
      })
    );
  
    return todo$;
  },
  [AppActions.fetchTodos]: ({dispatch, injector}: EffectOptions<AppState>): EffectResult<Array<Todo>> => {
    const todoService = injector.get(TodoService);
    
    const todos$ = todoService.getAll().pipe(tap((todos) => {
      dispatch(AppActions.todosFetched, todos);
    }));
  
    return todos$;
  }
}
```

### Selectors

Used as a `select(...)` and `select$(...)` selector identifier

```javascript
export const AppSelectors = {
  getIsLoading: 'Get loading state',
  getActiveTodo: 'Get active todo',
  getTodos: 'Get todo list'
} as const
```

### Getters

Methods defining what state data to return

```javascript
export const AppGetters: Getters<AppState> = {
  [AppSelectors.getIsLoading]: (state) => state.isLoading,
  [AppSelectors.getActiveTodo]: (state) => state.activeTodo,
  [AppSelectors.getTodos]: (state) => state.todos
}
```

### Setup

Initialize `Store` providing dependencies in app root:

```javascript
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    StoreModule.forRoot({
      id: 'App',
      initialState: AppInitialState,
      selectors: AppSelectors,
      getters: AppGetters,
      actions: AppActions,
      reducers: AppReducers,
      effects: AppEffects,
      config: {
        maxEffectDispatchTotalCalls: 1,
      }
    } as RootStoreConfig<AppState>)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

Inject `Store` where it's used:

```javascript
@Component({
  selector: 'app-root',
  template: `
    <div *ngIf="isLoading$ | async">Loading...</div>

    <div *ngIf="todos$ | async as todos">
      <div *ngFor="let todo of todos;">
        {{ todo.title }}
      </div>
    </div>
  `
})
export class AppComponent {
  public readonly isLoading$: Observable<boolean>;
  public readonly todos$: Observable<Array<Todo>>;

  constructor(private readonly store: Store<AppState>) {
    this.isLoading$ = this.store.select$<Boolean>(AppSelectors.getIsLoading);
    this.todos$ = this.store.select$(AppSelectors.getTodos);
  }
}
```

Provide dependencies for child modules (including lazy):

```javascript
@NgModule({
  declarations: [
    TodoComponent
  ],
  imports: [
    CommonModule,
    StoreModule.forChild({
      id: 'Todo',
      initialState: TodoInitialState,
      selectors: TodoSelectors,
      getters: TodoGetters,
      actions: TodoActions,
      reducers: TodoReducers,
      effects: TodoEffects
    } as ChildStoreConfig<TodoState>)
  ],
  providers: [
    TodoMapper
  ]
})
export class TodoModule {}
```

Use within `Component`:

```javascript
@Component({
  selector: 'app-todo',
  template: `
    <div *ngIf="isLoading$ | async">Loading...</div>
  
    <div *ngIf="todo$ | async as todo">
      <p>Id: {{ todo.id }}</p>
      <p>Title: {{ todo.title }}</p>
      <p>Description: {{todo.description}}</p>
      <p>Date: {{ todo.date }}</p>
    </div>
  `
})
export class TodoComponent {
  public readonly isLoading$: Observable<boolean>;
  public readonly todo$: Observable<Todo>;

  constructor(
    private readonly store: Store<AppState>, 
    private readonly route: ActivatedRoute
  ) {
    this.isLoading$ = this.store.select$(AppSelectors.getIsLoading);

    this.todo$ = this.route.params.pipe(
      switchMap((params: Params) => {
        return this.store.dispatch$<Todo>(AppActions.fetchTodo, Number(params.id))
      })
    );
  }
}
```

### Configuration

There are 2 types of configuration interfaces: `RootStoreConfiguration<StateType>` and `ChildStoreConfiguration<StateType>`, used by `Store.forRoot(...)` and `Store.forChild(...)` respectively.
Global store configuration object is represented by internal _StoreConfig interface, which is a part of `RootStoreConfiguration<StateType>` and represented by the `config` property. This is the only difference between `RootStoreConfiguration<StateType>` and `ChildStoreConfiguration<StateType>`
Table below represents its characteristic

Property | Description
------------ | -------------
id | Defines store unique identifier that is used for prefixing Actions and Selectors. Has to be unique across whole application
initialState | State blueprint and default value
selectors | Used by getters as getter identifier. Has to be unique in a scope of its declaration object
getters | Methods which is called against state in order to retrieve state data
actions | Used by reducers and effects as trigger identifier. Acts as intermedium between reducer and effect. Has to be unique in a scope of its declaration object
reducers | Performs synchronous state update
effects | Performs synchronous & asynchronous operations on a reduced state
config.freezeState | Allows to make state data immutable programmatically using `safeDeepFreeze` util method, which is basically extended version of `Object.freeze()`. By default immutability is guaranteed only on a type level by the use of `Immutable<T>` type. If you want your data to keep its integrity and prevent accidental value override, set this property to `true`. <br/>**Note: as it's being recursive, it can impact performance dealing with complex data structures**
config.freezePayload | Allows to make payload argument immutable programmatically. The same rules are applied as for `freezeState`
config.maxEffectDispatchTotalCalls | Limits `dispatch(...)` and `dispatch$(...)` call count per effect to a specific number
config.maxEffectDispatchCalls | Limits `dispatch(...)` call count per effect to a specific number
config.maxEffectDispatch$Calls | Limits `dispatch$(...)` call count per effect to a specific number

### Debugging

For debugging purposes you can use `StoreManager` global store service, as following:

```javascript
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  constructor(private readonly storeManager: StoreManager) {
    this.storeManager.actionStream$.subscribe(console.debug);
  }
}
```

This will log action caused state changes
