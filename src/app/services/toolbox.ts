import {EventEmitter, Injectable, Output} from '@angular/core';

@Injectable()
export class ToolsBoxService {
  @Output() fireRefresh = new EventEmitter<any>();
  @Output() fireReceiveUpdatedValue = new EventEmitter<number>();

  // Will emit an event in order to trigger data update
  getRefreshTrigger = (): EventEmitter<any> => {
    return this.fireRefresh;
  }

  // Will emit an event in order to notify a data update
  getReceiveUpdateTrigger = (): EventEmitter<number> => {
    return this.fireReceiveUpdatedValue;
  }
}
