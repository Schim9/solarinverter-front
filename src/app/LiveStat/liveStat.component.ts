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

  currentDate: string;
  runtimeProd: number;
  contractProd: number;
  weekProd: number;
  monthProd: number;
  yearProd: number;

  constructor(private callAPI: CallApi, private toolsBox: ToolsBoxService) {}

  ngOnInit() {
    this.getInverterStat().subscribe();
    this.toolsBox.getRefreshTrigger().subscribe(() => this.getInverterStat().subscribe());
  }

  getInverterStat = () => {
    return this.callAPI.call(HTTP_COMMAND.GET, '/livedata/').pipe(
      map((element: any) => {
        this.currentDate   = element.date;
        this.runtimeProd   = element.dayProd;
        this.contractProd  = element.contractProd;
        this.weekProd      = element.weekProd;
        this.monthProd     = element.monthProd;
        this.yearProd      = element.yearProd;
        return element.dayProd;
      }),
      map(dayprod => this.toolsBox.getReceiveUpdateTrigger().emit(dayprod)),
      catchError(err => {
        console.log('Error during getting live data', err);
        return of(null);
      })
    );
  }
}
