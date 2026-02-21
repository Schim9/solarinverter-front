import { Component } from '@angular/core';
import { BarChartComponent } from './barChart/barChart.component';
import { LiveStatComponent } from './LiveStat/liveStat.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [BarChartComponent, LiveStatComponent]
})
export class AppComponent {
}
