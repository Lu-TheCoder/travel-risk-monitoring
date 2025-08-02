import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Risk {

  private http = inject(HttpClient)

  createRisk(risk_level: string): Observable<any> {
    return this.http.post("https://locahost:3000/api/risks", { risk_level })
  }

  getUserRisks(): Observable<any> {
    return this.http.get("https://localhost:3000/api/risks")
  }
}
