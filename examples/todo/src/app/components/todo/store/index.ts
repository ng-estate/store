import {ChildStoreConfig} from "@ng-estate/store";
import {TodoSelectors} from "./todo.selectors";
import {TodoGetters} from "./todo.getters";
import {TodoActions} from "./todo.actions";
import {TodoReducers} from "./todo.reducers";
import {TodoEffects} from "./todo.effects";

export interface Todo {
  id: number;
  title: string;
  description: string;
  timestamp: number;
}

export interface MappedTodo extends Omit<Todo, 'timestamp'>{
  date: Date;
}

export interface TodoState {
  todo: MappedTodo;
  isLoading: boolean;
}

const TodoInitialState: TodoState = {
  todo: {
    id: -1,
    title: '',
    description: '',
    date: new Date()
  },
  isLoading: true
};

export const TodoStore: ChildStoreConfig<TodoState> = {
  id: 'Todo',
  initialState: TodoInitialState,
  selectors: TodoSelectors,
  getters: TodoGetters,
  actions: TodoActions,
  reducers: TodoReducers,
  effects: TodoEffects
};
