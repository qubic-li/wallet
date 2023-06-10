import { Injectable } from '@angular/core';
import { AuthResponse, BalanceResponse, CurrentTickResponse, ProposalCreateRequest, ProposalCreateResponse, ProposalDto, SubmitTransactionRequest, SubmitTransactionResponse } from './api.model';
import { HttpClient, HttpHeaders, HttpParams,
  HttpResponse, HttpEvent, HttpParameterCodec, HttpContext 
 }       from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { AuthInterceptor } from './auth-interceptor';
import { environment } from '../../environments/environment';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {


  public token: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public currentProposals: BehaviorSubject<ProposalDto[]> = new BehaviorSubject<ProposalDto[]>([]);
  public currentProtocol: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private basePath = environment.apiUrl;
  private authenticationActive = false;

  constructor(protected httpClient: HttpClient, private authInterceptor: AuthInterceptor) { 
    const token = localStorage.getItem("token")
    if(token)
      this.setToken(token);
    this.reAuthenticate();
  }

  public reAuthenticate() {
    if(this.authenticationActive)
      return;
    
    this.authenticationActive = true;
    // temp Login für aktuelle verwendung mit public user
    // login to qubic.li
    this.login({
      username: 'guest@qubic.li',
      password: 'guest13@Qubic.li'
    }).subscribe(r => {
      if(r && r.token){
        this.setToken(r.token);
        this.getProtocol().subscribe();
      }
      this.authenticationActive = false;
    }, (e) => {
      this.authenticationActive = false;
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


  public getProtocol() {
    let localVarPath = `/Public/Protocol`;
    return this.httpClient.request<number>('get', `${this.basePath}${localVarPath}`,
            {
                context: new HttpContext(),
                headers: {
                  "Content-Type": "application/json"
                },
                responseType: 'json'
            }
        ).pipe(map((p) => {
          this.currentProtocol.next(p);
          return p;
        }));
  }

  public getProposals() {
    let localVarPath = `/Voting/Proposal`;
    return this.httpClient.request<ProposalDto[]>('get', `${this.basePath}${localVarPath}`,
            {
                context: new HttpContext(),
                headers: {
                  "Content-Type": "application/json"
                },
                responseType: 'json'
            }
        ).pipe(map((p) => {
          this.currentProposals.next(p);
          return p;
        }));
  }

  public submitProposalCreateRequest(proposal: ProposalCreateRequest) {
    let localVarPath = `/Voting/Proposal`;
    return this.httpClient.request<ProposalCreateResponse>('post', `${this.basePath}${localVarPath}`,
            {
                context: new HttpContext(),
                headers: {
                  "Content-Type": "application/json"
                },
                body: proposal,
                responseType: 'json'
            }
        );
  }

  public submitProposalPublished(proposalId: string) {
    let localVarPath = `/Voting/Proposal/` + proposalId + "/publish";
    return this.httpClient.request<ProposalCreateResponse>('post', `${this.basePath}${localVarPath}`,
            {
                context: new HttpContext(),
                headers: {
                  "Content-Type": "application/json"
                },
                responseType: 'json'
            }
        );
  }

}
