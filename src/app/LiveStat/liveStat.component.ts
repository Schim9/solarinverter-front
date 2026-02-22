import {Component, OnInit} from '@angular/core';
import {CallApi, HTTP_COMMAND} from '../services/callApi';
import {ToolsBoxService} from '../services/toolbox';
import {catchError, map} from 'rxjs/operators';
import {of} from 'rxjs';
import {MatIcon} from '@angular/material/icon';

@Component({
    selector: 'app-live-stat',
    templateUrl: './liveStat.component.html',
    styleUrls: ['./liveStat.component.scss'],
    imports: [MatIcon]
})
export class LiveStatComponent implements OnInit {

  isLoading = true;

  runtimeProd:      number | null = null;
  contractProd:     number | null = null;
  contractStartDate: string | null = null;
  weekProd:         number | null = null;
  monthProd:        number | null = null;
  yearProd:         number | null = null;

  constructor(private callAPI: CallApi, private toolsBox: ToolsBoxService) {}

  ngOnInit() {
    this.getInverterStat().subscribe();
    this.toolsBox.getRefreshTrigger().subscribe(() => this.getInverterStat().subscribe());
  }

  getInverterStat = () => {
    this.isLoading = true;
    return this.callAPI.call(HTTP_COMMAND.GET, '/livedata').pipe(
      map((element: any) => {
        this.runtimeProd  = element.dayProd     ?? null;
        this.contractProd = element.contractProd ?? null;
        this.weekProd     = element.weekProd     ?? null;
        this.monthProd    = element.monthProd    ?? null;
        this.yearProd     = element.yearProd     ?? null;

        const rawDate = element.contractStartDate as string | null | undefined;
        if (rawDate) {
          const [y, m, d]    = rawDate.split('-').map(Number);
          this.contractStartDate = new Date(y, m - 1, d)
            .toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'});
        } else {
          this.contractStartDate = null;
        }

        this.isLoading = false;
        return this.runtimeProd;
      }),
      map(dayprod => this.toolsBox.getReceiveUpdateTrigger().emit(dayprod)),
      catchError(err => {
        console.log('Error during getting live data', err);
        this.isLoading = false;
        return of(null);
      })
    );
  }
}
