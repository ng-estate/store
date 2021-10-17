import {Immutable, StoreChildConfig} from "@ng-estate/store";
import {StatusGetters} from "./status.getters";
import {StatusSelectors} from "./status.selectors";

export type StatusState = Immutable<{
  isDone: boolean;
}>;

const StatusInitialState: StatusState = {
  isDone: true
}

export const StatusStore: StoreChildConfig<StatusState> = {
  id: 'Status',
  initialState: StatusInitialState,
  selectors: StatusSelectors,
  getters: StatusGetters,
} as const;
