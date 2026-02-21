import {Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone} from '@angular/core';
import {Observable, of} from 'rxjs';
import {CallApi, HTTP_COMMAND} from '../services/callApi';
import {MatDatepickerInputEvent, MatDatepickerInput, MatDatepickerToggle, MatDatepicker} from '@angular/material/datepicker';
import {ToolsBoxService} from '../services/toolbox';
import {MatInput, MatSuffix} from '@angular/material/input';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface BarItem {
  x: number; y: number; w: number; h: number;
  label: string; showLabel: boolean;
  lx: number; ly: number; lt: string;
}
interface YTick { y: number; label: string; }

@Component({
  selector: 'app-bar-chart',
  templateUrl: './barChart.component.html',
  styleUrls: ['./barChart.component.scss'],
  imports: [MatInput, MatSuffix, MatDatepickerInput, MatDatepickerToggle, MatDatepicker,
            MatFormField, MatLabel, MatButton, MatIcon]
})
export class BarChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartContainer') chartContainer!: ElementRef<HTMLElement>;

  data: {date: string, prod: number}[] = [];
  timestamps: string[] = [];
  values: number[] = [];

  currentDate = formatDate(new Date());
  startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  endDate   = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  bars: BarItem[] = [];
  yTicks: YTick[] = [];
  axis = { yX: 0, yY1: 0, yY2: 0, xY: 0, xX2: 0 };

  private resizeObserver!: ResizeObserver;

  constructor(
    private callAPI: CallApi,
    private toolsBox: ToolsBoxService,
    private ngZone: NgZone
  ) {}

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

  ngAfterViewInit() {
    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.run(() => this.buildChart());
    });
    this.resizeObserver.observe(this.chartContainer.nativeElement);
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
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
    if (!this.chartContainer) return;

    const { width, height } = this.chartContainer.nativeElement.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    // Adaptive margins based on available width
    const ML = width < 400 ? 38 : 52;
    const MR = 12;
    const MT = 12;
    const MB = width < 400 ? 42 : 55;
    const CW = width  - ML - MR;
    const CH = height - MT - MB;

    this.axis = { yX: ML, yY1: MT, yY2: MT + CH, xY: MT + CH, xX2: ML + CW };

    const n = this.values.length;
    if (n === 0) { this.bars = []; this.yTicks = []; return; }

    const maxVal = Math.max(...this.values);
    const slot   = CW / n;
    const barW   = Math.max(1, slot * 0.7);
    const gap    = (slot - barW) / 2;

    // Show 1 label every N bars to avoid overlap (target ~50px per label)
    const labelInterval = Math.max(1, Math.ceil(50 / slot));

    this.bars = this.values.map((v, i) => {
      const barH = maxVal > 0 ? (v / maxVal) * CH : 0;
      const x    = ML + i * slot + gap;
      const y    = MT + CH - barH;
      const lx   = ML + i * slot + slot / 2;
      const ly   = MT + CH + 5;
      return {
        x, y, w: barW, h: barH,
        label: this.timestamps[i],
        showLabel: i % labelInterval === 0,
        lx, ly, lt: `rotate(-45,${lx},${ly})`
      };
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
