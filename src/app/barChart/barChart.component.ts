import {Component, OnInit} from '@angular/core';
import {Observable, of} from 'rxjs';
import {CallApi, HTTP_COMMAND} from '../services/callApi';
import {MatDatepickerInputEvent, MatDatepickerInput, MatDatepickerToggle, MatDatepicker} from '@angular/material/datepicker';
import {ToolsBoxService} from '../services/toolbox';
import {MatInput, MatSuffix} from '@angular/material/input';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// SVG layout constants
const W = 1000, H = 400;
const ML = 60, MR = 20, MT = 20, MB = 60;
const CW = W - ML - MR;  // chart width  = 920
const CH = H - MT - MB;  // chart height = 320

interface BarItem {
  x: number; y: number; w: number; h: number;
  label: string; lx: number; ly: number; lt: string;
}
interface YTick { y: number; label: string; }

@Component({
  selector: 'app-bar-chart',
  templateUrl: './barChart.component.html',
  styleUrls: ['./barChart.component.scss'],
  imports: [MatInput, MatDatepickerInput, MatDatepickerToggle, MatSuffix, MatDatepicker]
})
export class BarChartComponent implements OnInit {
  data: {date: string, prod: number}[] = [];
  timestamps: string[] = [];
  values: number[] = [];

  currentDate = formatDate(new Date());
  startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  endDate   = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  // SVG chart data
  readonly viewBox = `0 0 ${W} ${H}`;
  bars: BarItem[] = [];
  yTicks: YTick[] = [];

  // Axis line endpoints (constants exposed to template)
  readonly axis = {
    yX: ML, yY1: MT, yY2: MT + CH,
    xY: MT + CH, xX2: ML + CW
  };

  constructor(private callAPI: CallApi, private toolsBox: ToolsBoxService) {}

  ngOnInit() {
    this.refreshStat();
    this.toolsBox.getReceiveUpdateTrigger().subscribe(dayProd => {
      console.log('New value received from live-data endpoint:', dayProd);
      if (dayProd == null || dayProd === 0) {
        console.log('no data received, no need to update');
      } else {
        const currentDateProd = this.data.find(element => element.date === this.currentDate);
        console.log('currentDateProd is ', currentDateProd);
        if (!currentDateProd || dayProd !== Number(currentDateProd.prod)) {
          this.refreshStat();
        } else {
          console.log('No need to call the api');
        }
      }
      return of(null);
    });
  }

  refreshStat = () => {
    this.getInverterStat().subscribe(
      (res: any) => {
        this.clearData();
        const receivedData: [any] = res;
        receivedData.map(element => {
          const date = element.date;
          const value = element.value;
          this.data.unshift({date: date, prod: value});
          this.timestamps.unshift(date);
          this.values.unshift(value);
        });
        this.buildChart();
      },
      (err) => {
        console.log('Error while getting inverter stats', err);
      });
  }

  getInverterStat = (): Observable<any> => {
    const serviceURi = '/daily-prod' +
      '?start=' + formatDate(this.startDate) +
      '&end=' + formatDate(this.endDate);
    return this.callAPI.call(HTTP_COMMAND.GET, serviceURi);
  }

  changeDate(type: string, event: MatDatepickerInputEvent<Date>) {
    const newDate = new Date(event.value!);
    switch (type) {
      case 'start': this.startDate = newDate; break;
      case 'end':   this.endDate   = newDate; break;
    }
  }

  exportStat = () => {
    window.open('data:text/json,' + encodeURIComponent(JSON.stringify(this.data)), '_blank')!.focus();
  }

  private buildChart() {
    const n = this.values.length;
    if (n === 0) { this.bars = []; this.yTicks = []; return; }

    const maxVal  = Math.max(...this.values);
    const slot    = CW / n;
    const barW    = slot * 0.7;
    const gap     = (slot - barW) / 2;

    this.bars = this.values.map((v, i) => {
      const barH = maxVal > 0 ? (v / maxVal) * CH : 0;
      const x    = ML + i * slot + gap;
      const y    = MT + CH - barH;
      const lx   = ML + i * slot + slot / 2;
      const ly   = MT + CH + 8;
      return { x, y, w: barW, h: barH, label: this.timestamps[i], lx, ly, lt: `rotate(-45,${lx},${ly})` };
    });

    const TICKS = 5;
    this.yTicks = maxVal > 0
      ? Array.from({length: TICKS + 1}, (_, i) => {
          const v = (maxVal * i) / TICKS;
          return { y: MT + CH - (v / maxVal) * CH, label: Number.isInteger(v) ? String(v) : v.toFixed(1) };
        })
      : [];
  }

  private clearData = () => {
    this.data = [];
    this.timestamps = [];
    this.values = [];
  }
}
