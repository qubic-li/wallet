import { Injectable } from '@angular/core';
import { AuthResponse, BalanceResponse, CurrentTickResponse, SubmitTransactionRequest, SubmitTransactionResponse } from './api.model';
import { HttpClient, HttpHeaders, HttpParams,
  HttpResponse, HttpEvent, HttpParameterCodec, HttpContext 
 }       from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { AuthInterceptor } from './auth-interceptor';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {


  public token: BehaviorSubject<string> = new BehaviorSubject<string>('');
  private basePath = environment.apiUrl;

  constructor(protected httpClient: HttpClient, private authInterceptor: AuthInterceptor) { 
    const token = localStorage.getItem("token")
    if(token)
      this.setToken(token);
    // temp Login für aktuelle verwendung mit public user
    // login to qubic.li
    this.login({
      username: 'guest@qubic.li',
      password: 'guest13@Qubic.li'
    }).subscribe(r => {
      if(r && r.token){
        this.setToken(r.token);
      }
    });
  }

  private setToken(token: string) {
    localStorage.setItem('token', token);
    this.token.next(token);
    this.authInterceptor.token.next(token);
  }

  public login(authRequest: {username: string, password: string}) {
    let localVarPath = `/Auth/Login`;
    return this.httpClient.request<AuthResponse>('post', `${this.basePath}${localVarPath}`,
            {
                context: new HttpContext(),
                body: authRequest,
                responseType: 'json'
            }
        );
  }

  public getCurrentBalance(publicIds: string[]) {
    let localVarPath = `/Wallet/CurrentBalance`;
    return this.httpClient.request<BalanceResponse[]>('post', `${this.basePath}${localVarPath}`,
            {
                context: new HttpContext(),
                headers: {
                  "Content-Type": "application/json"
                },
                body: publicIds,
                responseType: 'json'
            }
        );
  }

  public submitTransaction(submitTransaction: SubmitTransactionRequest) {
    let localVarPath = `/Public/SubmitTransaction`;
    return this.httpClient.request<SubmitTransactionResponse>('post', `${this.basePath}${localVarPath}`,
            {
                context: new HttpContext(),
                headers: {
                  "Content-Type": "application/json"
                },
                body: submitTransaction,
                responseType: 'json'
            }
        );
  }

  public getCurrentTick() {
    let localVarPath = `/Public/CurrentTick`;
    return this.httpClient.request<CurrentTickResponse>('get', `${this.basePath}${localVarPath}`,
            {
                context: new HttpContext(),
                responseType: 'json'
            }
        );
  }
}
