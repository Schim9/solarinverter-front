import {Component, OnInit} from '@angular/core';
import {Observable, of} from 'rxjs';
import { Chart } from 'chart.js';
import {CallApi, HTTP_COMMAND} from '../services/callApi';
import * as moment from 'moment';
import {MatDatepickerInputEvent} from '@angular/material/datepicker';
import {ToolsBoxService} from '../services/toolbox';

@Component({
    selector: 'app-bar-chart',
    templateUrl: './barChart.component.html',
    styleUrls: ['./barChart.component.scss'],
    standalone: false
})
export class BarChartComponent implements OnInit  {
  data: {date: string, prod: number}[] = [];
  timestamps: string[] = [];
  values: number[] = [];
  barchart: Chart;

  currentDate = moment().startOf('day').format('YYYY-MM-DD');
  startDate = new Date(moment().startOf('month').format('YYYY-MM-DD hh:mm'));
  endDate = new Date(moment().endOf('month').format('YYYY-MM-DD hh:mm'));


  constructor(private callAPI: CallApi, private toolsBox: ToolsBoxService) {
  }

  ngOnInit() {
    this.refreshStat();
    // In case live data is updated, we may need to refresh the graph
    this.toolsBox.getReceiveUpdateTrigger().subscribe(
      dayProd => {
        console.log('New value received from live-data endpoint:', dayProd);
        if (dayProd == null || dayProd === 0) {
          console.log('no data received, no need to update');
        } else {
          // Check the stored current date production
          const currentDateProd = this.data.find(element => element.date === this.currentDate);
          console.log('currentDateProd is ', currentDateProd);
          if (!currentDateProd || dayProd !== Number(currentDateProd.prod)) {
            // Data has changed
            this.refreshStat();
          } else {
            console.log('No need to call the api');
          }
        }
        return of(null);
      }
    );
  }

  refreshStat = () => {
    // this.toolsBox.refreshValues();
    this.getInverterStat().subscribe(
      (res: any) => {
        this.clearData();
        const receivedData: [any] = res;
        receivedData.map(element => {
          // Format data
          const date = element.date;
          const value = element.value;
          // Store data for export
          this.data.unshift({date: date, prod: value});
          // Store data for display
          this.timestamps.unshift(date);
          this.values.unshift(value);
        });
        this.displayChart();
      },
      (err) => {
        console.log('Error while getting inverter stats', err);
      });
  }

  getInverterStat = (): Observable<any> => {
    const startDate: string = moment(this.startDate, moment.defaultFormat).format('YYYY-MM-DD');
    const endDate: string = moment(this.endDate, moment.defaultFormat).format('YYYY-MM-DD');
    const serviceURi = '/daily-prod' +
      '?start=' + startDate +
      '&end=' + endDate;
    return this.callAPI.call(HTTP_COMMAND.GET, serviceURi);
  }

  changeDate(type: string, event: MatDatepickerInputEvent<Date>) {
    const newDate = new Date(moment(event.value, moment.defaultFormat).format('YYYY-MM-DD hh:mm'));
    switch (type) {
      case 'start':
        this.startDate = newDate;
        break;
      case 'end':
        this.endDate = newDate;
        break;
      default:
        break;
    }
  }

  exportStat = () => {
    window.open('data:text/json,' + encodeURIComponent(JSON.stringify(this.data)),
      '_blank').focus();
  }

  private displayChart = () => {

      this.barchart = new Chart('canvas', {
        type: 'bar',
        data: {
          labels: this.timestamps,
          datasets: [
            {
              data: this.values,
              borderColor: '#3cba9f',
              backgroundColor: '#3cba9f',
              fill: true
            }
          ]
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              display: true
            }],
            yAxes: [{
              display: true
            }],
          }
        }
      });
  }
  private clearData = () => {
    this.data = [];
    this.timestamps = [];
    this.values = [];
  }
}
