import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {AppStore} from "./store";
import {HttpClientModule} from "@angular/common/http";

// import {StoreModule} from "../../../../package/dist/@ng-estate/store";
import {StoreModule} from "@ng-estate/store";
//
//
//
//
//
//
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    StoreModule.forRoot(AppStore)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
