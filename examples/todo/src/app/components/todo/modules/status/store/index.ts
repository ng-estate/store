import {Immutable, StoreConfig} from "@ng-estate/store/internal";
import {StatusGetters} from "./status.getters";
import {StatusSelectors} from "./status.selectors";

export type StatusState = Immutable<{
  isDone: boolean;
}>;

const StatusInitialState: StatusState = {
  isDone: true
}

export const StatusStore: StoreConfig<StatusState> = {
  id: 'Status',
  initialState: StatusInitialState,
  selectors: StatusSelectors,
  getters: StatusGetters,
} as const;
