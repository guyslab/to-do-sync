import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { reducers } from './store/app.state';
import { TasksEffects } from './store/tasks/tasks.effects';
import { CoreModule } from './core/core.module';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    importProvidersFrom(
      HttpClientModule,
      CoreModule,
      StoreModule.forRoot(reducers),
      EffectsModule.forRoot([TasksEffects]),
      StoreDevtoolsModule.instrument({
        maxAge: 25,
        logOnly: false
      })
    )
  ]
};
