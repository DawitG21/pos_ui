import { Component, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { MessageService } from "../../service/message.service";
import { ToastService } from "../../service/toast.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ResourceEndpointService } from "../../endpoints/resource-endpoint.service";
import { StorageService } from "../../service/storage.service";
import { KeyService } from "../../service/key.service";
import Swal from "sweetalert2";

import { ListOfAccounts } from "../../models/accounts/accounts_list.model";

import { SearchResult } from "../../interfaces/search-result";

import { firstValueFrom } from "rxjs";

import { AuthService } from "../../service/auth.service";
import { AccountsService } from "./accounts.service";

@Component({
  selector: "app-accounts",
  templateUrl: "./accounts.component.html",
  styleUrls: ["./accounts.component.css"],
})
export class AccountsComponent {
  searchTerm: string = "";

  busy: boolean = true;
  pages: number[] = [];
  listaccounts?: ListOfAccounts[] = [];
  accounts!: ListOfAccounts;
  page = 1;
  pageSize = 10;
  searchAccountTerm: string = "";
  claims: any;
  usertype!: string;
  companyId!: string;
  startPage = 1;
  endPage = 10;

  @ViewChild("viewModal") viewModal: any;

  constructor(
    private accountServices: AccountsService,
    public route: Router,
    private messageService: MessageService,
    private toastService: ToastService,
    private modalService: NgbModal,
    private storageService: StorageService,
    private keyService: KeyService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.claims = this.storageService.getData(this.keyService.CLAIMS_KEY);
    this.usertype = this.storageService.getData(this.keyService.USERTYPE_NAME);
    this.companyId = this.authService.getCompanyId;
    if (this.usertype == "Company User" || this.usertype == "Company Admin") {
      this.getAccountsbyCompany();
    } else if (this.usertype == "POS Owner") {
      this.getAllAccounts();
    }
  }

  setPageSize(event: any) {
    const selectedValue = event.target.value;
    this.pageSize = selectedValue;

    if (this.pageSize == 20) {
      this.page = Math.round(this.page / 2);

      if (this.page % 10 == 0) {
        this.startPage = this.page - 9;
        this.endPage = this.page;
      } else {
        this.startPage = this.page - (this.page % 10) + 1;
        this.endPage = this.startPage + 9;
      }

      if (this.endPage > this.pages.length / 2) {
        this.endPage = Math.round(this.pages.length / 2);
      } else {
        this.endPage = this.startPage + 9;
      }
    } else if (this.pageSize == 10) {
      this.page = this.page * 2 - 1;
      this.startPage = this.page - (this.page % 10) + 1;
      this.endPage = this.startPage + 9;

      if (this.endPage > this.pages.length * 2) {
        this.endPage = this.pages.length * 2;
      } else {
        this.endPage = this.startPage + 9;
      }
    }
    if (this.usertype == "Company User" || this.usertype == "Company Admin") {
      this.getAccountsbyCompany();
    } else if (this.usertype == "POS Owner") {
      this.getAllAccounts();
    }
  }

  setPageRangeSubtract(page: number) {
    if (page >= 1 && page <= this.pages.length) {
      this.page = page;
      if (page === 1) {
        this.startPage = this.page;
        this.endPage = this.startPage + 9;
      } else {
        if (this.endPage === this.pages.length) {
          this.endPage = this.endPage - (this.endPage % 10);
          this.startPage = this.endPage - 9;
        } else {
          this.startPage -= 10;
          this.endPage -= 10;
        }
      }
      //this.getUsersPagination(this.page, this.pageSize);
      if (this.usertype == "Company User" || this.usertype == "Company Admin") {
        this.getAccountsbyCompany();
      } else if (this.usertype == "POS Owner") {
        this.getAllAccounts();
      }
    }
  }

  setPageRangeAdd(page: number) {
    if (page >= 1 && page < this.pages.length) {
      this.page = page + 10;
      if (this.page >= this.pages.length) {
        page = this.pages.length;
        this.page = this.pages.length;
        this.endPage = this.pages.length;
        if (this.endPage % 10 === 0) this.startPage = this.endPage - 9;
        else this.startPage = this.pages.length - (this.pages.length % 10) + 1;
      } else {
        this.startPage += 10;
        this.endPage += 10;
        if (this.endPage > this.pages.length) this.endPage = this.pages.length;
      }
      //this.getUsersPagination(this.page, this.pageSize);
      if (this.usertype == "Company User" || this.usertype == "Company Admin") {
        this.getAccountsbyCompany();
      } else if (this.usertype == "POS Owner") {
        this.getAllAccounts();
      }
    }
  }

  setCurrentPage(page: number) {
    // Ensure the clicked page is within the valid range
    if (page >= 1 && page <= this.pages.length) {
      this.page = page;
      //this.getUsersPagination(this.page, this.pageSize);
      if (this.usertype == "Company User" || this.usertype == "Company Admin") {
        this.getAccountsbyCompany();
      } else if (this.usertype == "POS Owner") {
        this.getAllAccounts();
      }
    }
  }

  goCreateAccount() {
    this.route.navigate(["pages/create-account"]);
  }

  goEditAccount(account: ListOfAccounts) {
    this.route.navigate(["pages/edit-account"]);
    this.storageService.setData(this.keyService.Account_KEY, account);
  }

  public getAccounts(): Promise<any> {
    return firstValueFrom(
      this.accountServices.getAccounts(this.page, this.pageSize)
    );
  }

  getAllAccounts(): void {
    this.busy = true;
    this.getAccounts()
      .then(
        (result: SearchResult) => {
          if (this.listaccounts?.length === 0) {
            this.listaccounts = result.data;
            this.pages = Array.from(
              { length: result.pages },
              (_, index) => index + 1
            );
          } else {
            this.listaccounts = [];
            this.listaccounts = result.data;
            this.pages = Array.from(
              { length: result.pages },
              (_, index) => index + 1
            );
          }
        },
        (reject) => {
          this.toastService.error(this.messageService.serverError);
        }
      )
      .catch((error) => {
        this.toastService.error(this.messageService.serverError);
      })
      .finally(() => {
        this.busy = false;
      });
  }

  getAccountsbyCompany() {
    this.busy = true;
    return firstValueFrom(
      this.accountServices.getAccountsbyCompany(
        this.page,
        this.pageSize,
        this.companyId
      )
    )
      .then(
        (result) => {
          if (this.listaccounts?.length === 0) {
            this.listaccounts = result.data;
            this.pages = Array.from(
              { length: result.pages },
              (_, index) => index + 1
            );
          } else {
            this.listaccounts = [];
            this.listaccounts = result.data;
            this.pages = Array.from(
              { length: result.pages },
              (_, index) => index + 1
            );
          }
        },
        (reject) => {
          this.toastService.error(this.messageService.serverError);
        }
      )
      .catch((error) => {
        this.toastService.error(this.messageService.serverError);
      })
      .finally(() => {
        this.busy = false;
      });
  }

  view(account: ListOfAccounts) {
    this.accounts = account;
    // this.userId = user.id!;
    this.modalService
      .open(this.viewModal, { ariaLabelledBy: "viewModalLabel" })
      .result.then(
        (result) => {
          // Handle close (if needed)
        },
        (reason) => {
          // Handle dismiss (if needed)
        }
      );
  }

  formatDateToCustomFormat(dateString: string): string {
    const dateObject = new Date(dateString);

    const formattedDate = dateObject.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return formattedDate;
  }

  public deleteAccount(id: string): Promise<any> {
    return firstValueFrom(this.accountServices.delete(id));
  }

  delete(accounts: ListOfAccounts) {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        this.busy = true;
        this.deleteAccount(accounts.id)
          .then(
            (result) => {
              this.listaccounts = this.listaccounts?.filter(
                (acc) => acc !== accounts
              );
              this.toastService.success("Success");
            },
            (reject) => {
              this.toastService.error(this.messageService.serverError);
            }
          )
          .catch((error) => {
            this.toastService.error(this.messageService.serverError);
          })
          .finally(() => {
            this.busy = false;
          });
      }
    });
  }
}
