import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {AppStore} from "./store";
import {HttpClientModule} from "@angular/common/http";

import {StoreModule} from "@ng-estate/store/internal";
import {AppRoutingModule} from "./app-routing.module";

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    StoreModule.forRoot({
      ...AppStore,
      config: {
        debug: true, // ... your condition
        ...AppStore.config,
      }
    }),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
