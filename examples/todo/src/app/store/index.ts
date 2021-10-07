import {Immutable, StoreRootConfig} from "@ng-estate/store";
import {AppSelectors} from "./app.selectors";
import {AppGetters} from "./app.getters";
import {AppActions} from "./app.actions";
import {AppReducers} from "./app.reducers";
import {AppEffects} from "./app.effects";
import {Todo} from "../components/todo/store";

export type AppState = Immutable<{
  todoList: Array<Partial<Todo>>,
  isLoading: boolean
}>;

const AppInitialState: AppState = {
  todoList: [],
  isLoading: true
};

export const AppStore: StoreRootConfig<AppState> = {
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
};
