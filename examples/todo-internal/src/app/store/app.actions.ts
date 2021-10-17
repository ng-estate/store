export const AppActions = {
  fetchAllTodos: 'Action: get a list of all todos | Reducer: set loading state | Effect: perform fetch',
  todosFetched: 'Action: notify UI about loading end | Reducer: set todoList & loading state',
} as const;
