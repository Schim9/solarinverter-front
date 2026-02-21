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
  value: number; tooltip: string;
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

  // Tooltip state
  activeBar: BarItem | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private isTouchActive = false;

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
    if (this.hideTimer) clearTimeout(this.hideTimer);
  }

  // ── Tooltip interactions ────────────────────────────────────────────────────

  onBarMouseEnter(bar: BarItem) {
    if (this.isTouchActive) return; // ignore simulated mouse events after touch
    this.activeBar = bar;
  }

  onBarMouseLeave() {
    if (this.isTouchActive) return;
    this.activeBar = null;
  }

  onBarTouchStart(bar: BarItem) {
    // Block simulated mouseenter/click that fires ~300ms after touchstart
    this.isTouchActive = true;
    setTimeout(() => { this.isTouchActive = false; }, 500);

    if (this.activeBar === bar) {
      this.activeBar = null;
      if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
    } else {
      if (this.hideTimer) clearTimeout(this.hideTimer);
      this.activeBar = bar;
      // Auto-dismiss after 3s on mobile (no mouseleave on touch)
      this.hideTimer = setTimeout(() => {
        this.ngZone.run(() => { this.activeBar = null; });
      }, 3000);
    }
  }

  // Tooltip position getters
  get tooltipCx(): number {
    if (!this.activeBar) return 0;
    const cx = this.activeBar.x + this.activeBar.w / 2;
    return Math.max(this.axis.yX + 40, Math.min(cx, this.axis.xX2 - 40));
  }

  get tooltipTy(): number {
    if (!this.activeBar) return 0;
    return Math.max(this.activeBar.y - 38, this.axis.yY1 + 4);
  }

  get tooltipArrow(): string {
    const cx = this.tooltipCx;
    const base = this.tooltipTy + 28;
    return `${cx - 5},${base} ${cx + 5},${base} ${cx},${base + 6}`;
  }

  // ── Data ────────────────────────────────────────────────────────────────────

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
    const blob = new Blob([JSON.stringify(this.data, null, 2)], {type: 'application/json'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `production_${formatDate(this.startDate)}_${formatDate(this.endDate)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Chart rendering ─────────────────────────────────────────────────────────

  private buildChart() {
    if (!this.chartContainer) return;

    const { width, height } = this.chartContainer.nativeElement.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const ML = width < 400 ? 38 : 52;
    const MR = 12;
    const MT = 12;
    const MB = width < 400 ? 42 : 55;
    const CW = width  - ML - MR;
    const CH = height - MT - MB;

    this.axis = { yX: ML, yY1: MT, yY2: MT + CH, xY: MT + CH, xX2: ML + CW };
    this.activeBar = null;

    const n = this.values.length;
    if (n === 0) { this.bars = []; this.yTicks = []; return; }

    const maxVal = Math.max(...this.values);
    const slot   = CW / n;
    const barW   = Math.max(1, slot * 0.7);
    const gap    = (slot - barW) / 2;
    const labelInterval = Math.max(1, Math.ceil(50 / slot));

    this.bars = this.values.map((v, i) => {
      const barH = maxVal > 0 ? (v / maxVal) * CH : 0;
      const x    = ML + i * slot + gap;
      const y    = MT + CH - barH;
      const lx   = ML + i * slot + slot / 2;
      const ly   = MT + CH + 5;
      return {
        x, y, w: barW, h: barH,
        value: v,
        tooltip: Number.isInteger(v) ? String(v) : v.toFixed(1),
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
