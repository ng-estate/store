export const AppActions = {
  fetchAllTodos: 'Action: gets a list of all todos | Reducer: sets loading state | Effect<TodoList>: performs fetch',
  todosFetched: 'Action: notify\'s UI about loading end | Reducer: sets todoList & loading state',
} as const;
