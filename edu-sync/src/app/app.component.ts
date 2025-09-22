import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotFoundComponent } from './shared/not-found/not-found.component';
import { NavigationComponent } from './navigation/navigation.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavigationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'edu-sync';
}
