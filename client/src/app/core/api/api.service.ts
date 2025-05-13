import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  /**
   * Performs a GET request
   */
  get<T>(url: string, params: any = {}): Observable<T> {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });

    return this.http.get<T>(url, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  /**
   * Performs a POST request
   */
  post<T>(url: string, body: any): Observable<T> {
    return this.http.post<T>(url, body)
      .pipe(catchError(this.handleError));
  }

  /**
   * Performs a PUT request
   */
  put<T>(url: string, body: any): Observable<T> {
    return this.http.put<T>(url, body)
      .pipe(catchError(this.handleError));
  }

  /**
   * Performs a DELETE request
   */
  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * Error handler
   */
  private handleError(error: HttpErrorResponse) {
    // Custom error handling logic
    if (error.status === 409) {
      return throwError(() => new Error('RENAMING_LOCKED'));
    }
    
    return throwError(() => error);
  }
}
