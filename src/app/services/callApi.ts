import { Injectable } from '@angular/core';
import { Observable, EMPTY } from 'rxjs';

import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable()
export class CallApi {
   serverAddress = 'https://solar-back.kaminski.lu/api';
  constructor(private newHttp: HttpClient) {
  }

  call = (command: HTTP_COMMAND, endpoint: string, param?: any): Observable<any> => {

    // Contains the JWT for authentication
    const authenticatedHeader: HttpHeaders = new HttpHeaders()
      // .append('Authorization', 'Basic RWxpdFNvbGFyOg==')
      .append('Access-Control-Max-Age', '1')
      .append('Content-Type', 'application/json');

    if (command === HTTP_COMMAND.GET) {
      return this.newHttp.get(this.serverAddress + endpoint + (param ? param : ''),
        {headers: authenticatedHeader});
    } else if (command === HTTP_COMMAND.POST) {
      return this.newHttp.post(this.serverAddress + endpoint,
        param,
        {headers: authenticatedHeader});
    } else if (command === HTTP_COMMAND.PUT) {
      return this.newHttp.put(this.serverAddress + endpoint,
        param,
        {headers: authenticatedHeader});
    } else if (command === HTTP_COMMAND.DELETE) {
      return this.newHttp.delete(this.serverAddress + endpoint,
        {headers: authenticatedHeader});

    } else {
      return EMPTY;
    }

  }

}


export enum HTTP_ERROR {
  TECHNICAL = 500 ,
  UNAUTHORIZED = 401,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406
}

export enum HTTP_COMMAND {
  GET = 1 ,
  POST = 2,
  PUT = 3,
  DELETE = 0
}
