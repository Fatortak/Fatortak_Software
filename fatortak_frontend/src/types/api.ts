export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  issueDate: string;
  dueDate: string;
  total: number;
  status: string;
  notes?: string;
  vatAmount?: number;
  currency: string;
  invoiceType?: string;
  createdAt?: string;
  updatedAt?: string;
  discount?: number;
  branchId?: string;
  projectId?: string;
  projectName?: string;
  customerId?: string;
  attachmentUrl?: string;
  installments?: InstallmentDto[];
  publicToken?: string;
}

export interface InstallmentDto {
  id: string;
  invoiceId: string;
  amount: number;
  dueDate: string;
  status: string;
  paidAt?: string;
  attachmentUrl?: string;
}

export interface PagedResponseDto<T> {
  data: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  metaData: any;
}

export interface PaginationDto {
  pageNumber: number;
  pageSize: number;
}

export interface InvoiceCreateDto {
  customerName: string;
  customerEmail?: string;
  invoiceNumber?: string;
  issueDate: string;
  dueDate: string;
  total: number;
  status: string;
  notes?: string;
  vatAmount?: number;
  currency: string;
  invoiceType?: string;
  branchId?: string;
  projectId?: string;
  paymentAccountId?: string;
}


export interface InvoiceUpdateDto {
  customerName?: string;
  customerEmail?: string;
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  status?: string;
  notes?: string;
  total?: number;
  vatAmount?: number;
  currency?: string;
  invoiceType?: string;
  branchId?: string;
  paymentAccountId?: string;
}

export interface InvoiceFilterDto {
  search?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  minimumPrice?: number;
  maximumPrice?: number;
  customerId?: number;
  invoiceType?: string;
  branchId?: string;
  expensesStatus?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  projectId?: string;
}

export interface SendInvoiceDto {
  email: string;
  message?: string;
}

export interface MarkPaidDto {
  paymentDate: string;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
}

export interface UpdateInvoiceStatusDto {
  status: string;
}

export interface RecordPaymentDto {
  amount: number;
  paymentMethod?: string;
  paymentAccountId?: string;
  attachment?: string | File | null;
  paymentDate?: string;
  chequeNumber?: string;
  chequeBankName?: string;
  chequeDueDate?: string;
}

// User related DTOs
export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  phoneNumber?: string;
}

export interface UserUpdateDto {
  firstName?: string;
  lastName?: string;
  role?: string;
  phoneNumber?: string;
  isActive?: boolean;
}

export interface UserFilterDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// Customer related DTOs
export interface CustomerDto {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  vatNumber?: string;
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
  isSupplier: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCreateDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  vatNumber?: string;
  paymentTerms?: string;
  isSupplier?: boolean;
  notes?: string;
}

export interface CustomerUpdateDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  vatNumber?: string;
  paymentTerms?: string;
  notes?: string;
  isActive?: boolean;
}

export interface CustomerFilterDto {
  name?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  isSupplier?: boolean;
}

// Item related DTOs
export interface ItemDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: "product" | "service";
  unitPrice: number;
  purchaseUnitPrice?: number;
  quantity?: number;
  vatRate: number;
  discount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  imageUrl: string | null;
  branchId?: string;
}

export interface ItemCreateDto {
  code: string;
  name: string;
  description?: string;
  type: "product" | "service";
  unitPrice: number;
  purchaseUnitPrice?: number;
  quantity?: number;
  vatRate: number;
  discount?: number;
  imageFile?: File | null;
  branchId?: string;
}

export interface ItemUpdateDto {
  code?: string;
  name?: string;
  description?: string;
  type?: "product" | "service";
  unitPrice?: number;
  purchaseUnitPrice?: number;
  quantity?: number;
  vatRate?: number;
  discount?: number;
  isActive?: boolean;
  imageFile?: File | null;
  removeImage?: boolean;
  branchId?: string;
}

export interface ItemFilterDto {
  code?: string;
  name?: string;
  nameOrCode?: string;
  category?: string;
  type?: "product" | "service";
  isActive?: boolean;
  branchId?: string;
}

// Company related DTOs
export interface CompanyDto {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  vatNumber?: string;
  currency: string;
  defaultVatRate: number;
  invoicePrefix: string;
  logoUrl?: string;
  saleInvoiceTemplate?: string;
  saleInvoiceTemplateColor?: string;
  purchaseInvoiceTemplate?: string;
  purchaseInvoiceTemplateColor?: string;
  enableMultipleBranches: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyCreateDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  vatNumber?: string;
  currency: string;
  defaultVatRate: number;
  invoicePrefix: string;
}

export interface CompanyUpdateDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  vatNumber?: string;
  currency?: string;
  defaultVatRate?: number;
  invoicePrefix?: string;
  enableMultipleBranches?: boolean;
}
export interface CompanyUpdateInvoiceTemplateDto {
  invoiceType?: string;
  template?: string;
  color?: string;
}

export interface UploadCompanyLogoDto {
  companyId: string;
  file: File;
}

// Branch related DTOs
export interface BranchDto {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isMain: boolean;
  isActive: boolean;
}

export interface CreateBranchDto {
  name: string;
  address?: string;
  phone?: string;
  isMain: boolean;
}

export interface UpdateBranchDto {
  name?: string;
  address?: string;
  phone?: string;
  isMain?: boolean;
  isActive?: boolean;
}

// User Profile related DTOs
export interface UserProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  role?: string;
  userName?: string;
  lastLoginAt?: string;
  tenantName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileUpdateDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
}

export interface UpdateUserProfileImageDto {
  file: File;
}

// Expenses related DTOs
export interface ExpenseDto {
  id: number;
  date: string;
  total: number;
  notes?: string;
  fileUrl?: string;
  fileName?: string;
  attachmentUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
  branchId?: string;
  projectId?: string;
  projectName?: string;
  categoryId?: string;
  categoryName?: string;
  paymentAccountId?: string;
  paymentAccountName?: string;
}

export interface CreateExpenseDto {
  date: string;
  total: number;
  notes?: string;
  file?: File;
  branchId?: string;
  projectId?: string;
  categoryId?: string;
  paymentAccountId?: string;
}

export interface UpdateExpenseDto {
  date?: string;
  total?: number;
  notes?: string;
  file?: File;
  removeFile?: boolean;
  branchId?: string;
  projectId?: string;
  categoryId?: string;
  paymentAccountId?: string;
}

export interface ExpenseCategoryDto {
  id: string;
  name: string;
  accountId: string;
  accountName?: string;
  accountCode?: string;
}

export interface CreateExpenseCategoryDto {
  name: string;
  accountId: string;
}

export interface UpdateExpenseCategoryDto {
  name?: string;
  accountId?: string;
}

export interface ExpenseFilterDto {
  notes?: string;
  branchId?: string;
  projectId?: string;
}

// Auth related DTOs
export interface AuthResponseDto {
  token: string;
  user: UserDto;
  tenant?: TenantDto;
}

export interface TenantDto {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Report related DTOs
export interface DashboardReportDto {
  totalRevenue: number;
  totalInvoices: number;
  totalCustomers: number;
  totalItems: number;
  recentInvoices: InvoiceDto[];
  topCustomers: TopCustomerDto[];
  topItems: TopItemDto[];
  revenueChart: RevenueReportDto[];
}

export interface RevenueReportDto {
  period: string;
  revenue: number;
  invoiceCount: number;
}

export interface TopCustomerDto {
  customerId: string;
  customerName: string;
  totalRevenue: number;
  invoiceCount: number;
}

export interface TopItemDto {
  itemId: string;
  itemName: string;
  totalSold: number;
  totalRevenue: number;
}

export interface DateRangeDto {
  startDate: string;
  endDate: string;
}
// Notification related DTOs
export interface NotificationFilterDto {
  search?: string;
  isRead?: boolean;
  notificationType?: string;
  fromDate?: string;
  toDate?: string;
}

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  relatedEntityId?: string;
  relatedEntityType?: string;
  notificationType: string;
}

// Project related DTOs
export interface ProjectLineDto {
  id: string;
  sectionName?: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  lineTotal: number;
}

export interface ProjectDto {
  id: string;
  name: string;
  description?: string;
  customerId?: string;
  customerName?: string;
  status: ProjectStatus;
  contractValue: number;
  paymentTerms?: string;
  notes?: string;
  invoiceId?: string;
  isInternal: boolean;
  createdAt: string;
  totalInvoiced: number;
  totalExpenses: number;
  totalAdvances: number;
  totalCollected: number;
  totalPaid: number;
  netProfit: number;
  discount: number;
  projectLines: ProjectLineDto[];
  includeVat?: boolean;
  vatRate?: number;
  updatedAt: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  customerId?: string;
  status?: ProjectStatus;
  contractValue: number;
  discount?: number;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  customerId?: string;
  status?: ProjectStatus;
  contractValue?: number;
  discount?: number;
}

export enum ProjectStatus {
  NotStarted = "NotStarted",
  Active = "Active",
  Completed = "Completed",
  OnHold = "OnHold",
  Cancelled = "Cancelled",
  Settled = "Settled",
  Archived = "Archived",
  Draft = "Draft",
}

export interface ProjectFilterDto {
  name?: string;
  status?: ProjectStatus;
  clientName?: string;
  customerId?: string;
}

export interface CreateProjectWithContractCommand {
  projectName: string;
  clientId: string;
  paymentTerms?: string;
  notes?: string;
  lines: Partial<ProjectLineDto>[];
  activateImmediately: boolean;
  discount?: number;
}


// Accounting Module Types
export enum AccountType {
  Asset = 1,
  Liability = 2,
  Equity = 3,
  Revenue = 4,
  Expense = 5,
  Cash = 6,
  Bank = 7,
  Other = 8,
}

export enum JournalEntryReferenceType {
  Manual = 1,
  Invoice = 2,
  Expense = 3,
  Payment = 4,
  PurchaseInvoice = 5,
  Reversing = 6,
  Inventory = 7,
  Payroll = 8,
  OpeningBalance = 9,
}

export interface AccountDto {
  id: string;
  tenantId: string;
  accountCode: string;
  name: string;
  accountType: AccountType;
  accountTypeName: string;
  parentAccountId?: string;
  parentAccountName?: string;
  level: number;
  isActive: boolean;
  isPostable: boolean;
  isSystem: boolean;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  childAccounts?: AccountDto[];
  balance?: number;
}

export interface AccountCreateDto {
  accountCode: string;
  name: string;
  accountType: AccountType;
  parentAccountId?: string;
  description?: string;
  isActive?: boolean;
  isPostable?: boolean;
}

export interface AccountUpdateDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface AccountFilterDto {
  accountCode?: string;
  name?: string;
  accountType?: AccountType;
  parentAccountId?: string;
  isActive?: boolean;
  isPostable?: boolean;
  includeInactive?: boolean;
}

export interface JournalEntryLineDto {
  id: string;
  journalEntryId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
  reference?: string;
}

export interface JournalEntryDto {
  id: string;
  tenantId: string;
  entryNumber: string;
  date: string;
  referenceType: JournalEntryReferenceType;
  referenceTypeName: string;
  referenceId?: string;
  description?: string;
  isPosted: boolean;
  postedAt?: string;
  createdBy?: string;
  postedBy?: string;
  createdAt: string;
  updatedAt?: string;
  reversingEntryId?: string;
  projectId?: string;
  projectName?: string;
  lines: JournalEntryLineDto[];
  totalDebit: number;
  totalCredit: number;
  attachmentUrl?: string;
}

export interface JournalEntryLineCreateDto {
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
  reference?: string;
}

export interface JournalEntryCreateDto {
  date: string;
  description?: string;
  lines: JournalEntryLineCreateDto[];
  attachmentUrl?: string;
  attachment?: File;
}

export interface JournalEntryFilterDto {
  fromDate?: string;
  toDate?: string;
  referenceType?: JournalEntryReferenceType;
  referenceId?: string;
  isPosted?: boolean;
  accountId?: string;
  entryNumber?: string;
  projectId?: string;
}

export interface AccountBalanceDto {
  accountId: string;
  accountCode: string;
  accountName: string;
  debitTotal: number;
  creditTotal: number;
  balance: number;
  asOfDate?: string;
}

export interface TrialBalanceItemDto {
  accountId: string;
  accountCode: string;
  accountName: string;
  debitTotal: number;
  creditTotal: number;
  balance: number;
}

export interface TrialBalanceDto {
  items: TrialBalanceItemDto[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  asOfDate?: string;
}

export interface LedgerEntryDto {
  journalEntryId: string;
  entryNumber: string;
  date: string;
  description?: string;
  debit: number;
  credit: number;
  runningBalance: number;
  reference?: string;
}

export interface LedgerDto {
  accountId: string;
  accountCode: string;
  accountName: string;
  fromDate?: string;
  toDate?: string;
  entries: LedgerEntryDto[];
  openingBalance: number;
  closingBalance: number;
}

export interface ProfitAndLossItemDto {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: number;
}

export interface ProfitAndLossDto {
  fromDate: string;
  toDate: string;
  revenueItems: ProfitAndLossItemDto[];
  expenseItems: ProfitAndLossItemDto[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

export interface BalanceSheetItemDto {
  accountId: string;
  accountCode: string;
  accountName: string;
  balance: number;
}

export interface BalanceSheetDto {
  asOfDate: string;
  assets: BalanceSheetItemDto[];
  liabilities: BalanceSheetItemDto[];
  equity: BalanceSheetItemDto[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  isBalanced: boolean;
}

export interface PostPaymentDto {
  invoiceId: string;
  amount: number;
}


export interface GiveCustodyByAccountDto {
  accountId: string;
  amount: number;
  sourceAccountId?: string;
  description?: string;
}

export interface ReturnCustodyByAccountDto {
  accountId: string;
  amount: number;
  destinationAccountId?: string;
  description?: string;
}

export interface ReplenishCustodyByAccountDto {
  accountId: string;
  amount: number;
  sourceAccountId?: string;
  description?: string;
}

export interface CreateCustodyAccountDto {
  name: string;
  description?: string;
}

export interface SetInitialBalanceDto {
  accountId: string;
  amount: number;
  date: string;
  description?: string;
  sourceAccountId?: string;
}

// Quotation / sales document DTOs
export interface QuotationItemDto {
  id: string;
  itemId?: string;
  itemName?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  discount: number;
  lineTotal: number;
}

export interface QuotationDto {
  id: string;
  quotationNumber: string;
  documentType?: string;
  sourceQuotationId?: string;
  customerId: string;
  customerName?: string;
  customerPhoneNumber?: string;
  branchId?: string;
  projectId?: string;
  projectName?: string;
  issueDate: string;
  validUntil: string;
  status: string;
  subtotal: number;
  vatAmount: number;
  totalDiscount: number;
  total: number;
  currency?: string;
  notes?: string;
  terms?: string;
  attachmentUrl?: string;
  createdAt: string;
  sentAt?: string;
  acceptedAt?: string;
  confirmedAt?: string;
  convertedAt?: string;
  convertedInvoiceId?: string;
  daysUntilExpiry: number;
  isExpired: boolean;
  items: QuotationItemDto[];
}

export interface QuotationItemCreateDto {
  itemId?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  discount: number;
}

export interface QuotationCreateDto {
  customerId: string;
  branchId?: string;
  projectId?: string;
  quotationNumber?: string;
  issueDate: string;
  validUntil: string;
  status?: string;
  notes?: string;
  terms?: string;
  attachmentUrl?: string;
  items: QuotationItemCreateDto[];
}

export interface QuotationUpdateDto extends QuotationCreateDto {}

export interface QuotationFilterDto {
  search?: string;
  documentType?: string;
  customerId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  branchId?: string;
  projectId?: string;
}

export interface ConvertQuotationDto {
  issueDate?: string;
  dueDate?: string;
  notes?: string;
}

export interface ConvertQuotationResultDto {
  invoiceId: string;
  invoiceNumber: string;
  status: string;
}

// Purchase requisition DTOs
export interface PurchaseRequisitionItemDto {
  id: string;
  description: string;
  quantity: number;
  estimatedUnitPrice: number;
  lineTotal: number;
}

export interface PurchaseRequisitionDto {
  id: string;
  requestNumber: string;
  title: string;
  requesterName?: string;
  approvedByName?: string;
  neededBy: string;
  status: string;
  notes?: string;
  total: number;
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  items: PurchaseRequisitionItemDto[];
}

export interface PurchaseRequisitionItemCreateDto {
  description: string;
  quantity: number;
  estimatedUnitPrice: number;
}

export interface PurchaseRequisitionCreateDto {
  title: string;
  neededBy: string;
  notes?: string;
  items: PurchaseRequisitionItemCreateDto[];
}

export interface PurchaseRequisitionUpdateDto extends PurchaseRequisitionCreateDto {}

export interface PurchaseRequisitionFilterDto {
  search?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

// Request for quotation DTOs
export interface RfqItemDto {
  id: string;
  itemId?: string;
  description: string;
  quantity: number;
  targetUnitPrice: number;
  lineTotal: number;
}

export interface RfqSupplierItemDto {
  rfqItemId: string;
  unitPrice: number;
  lineTotal: number;
}

export interface RfqSupplierDto {
  id: string;
  supplierId: string;
  supplierName: string;
  status: string;
  quotedAt?: string;
  validUntil?: string;
  total: number;
  notes?: string;
  items: RfqSupplierItemDto[];
}

export interface RfqDto {
  id: string;
  rfqNumber: string;
  purchaseRequisitionId?: string;
  purchaseRequisitionNumber?: string;
  title: string;
  issueDate: string;
  dueDate: string;
  status: string;
  notes?: string;
  currency?: string;
  awardedSupplierId?: string;
  awardedSupplierName?: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  createdAt: string;
  sentAt?: string;
  awardedAt?: string;
  totalTargetValue: number;
  items: RfqItemDto[];
  suppliers: RfqSupplierDto[];
}

export interface RfqItemCreateDto {
  itemId?: string;
  description: string;
  quantity: number;
  targetUnitPrice: number;
}

export interface RfqCreateDto {
  purchaseRequisitionId?: string;
  title: string;
  issueDate: string;
  dueDate: string;
  notes?: string;
  currency?: string;
  items: RfqItemCreateDto[];
  supplierIds: string[];
}

export interface RfqUpdateDto extends RfqCreateDto {}

export interface RfqSupplierQuoteItemDto {
  rfqItemId: string;
  unitPrice: number;
}

export interface RfqSupplierQuoteDto {
  validUntil?: string;
  notes?: string;
  items: RfqSupplierQuoteItemDto[];
}

export interface AwardRfqDto {
  expectedDate?: string;
  terms?: string;
  notes?: string;
}

export interface RfqFilterDto {
  search?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

// Purchase order DTOs
export interface PurchaseOrderItemDto {
  id: string;
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  discount: number;
  lineTotal: number;
  receivedQuantity: number;
  rejectedQuantity: number;
  billedQuantity: number;
  remainingQuantity: number;
  remainingToBill: number;
}

export interface PurchaseOrderDto {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  purchaseRequisitionId?: string;
  requestForQuotationId?: string;
  rfqNumber?: string;
  issueDate: string;
  expectedDate: string;
  status: string;
  currency?: string;
  notes?: string;
  terms?: string;
  subtotal: number;
  vatAmount: number;
  totalDiscount: number;
  total: number;
  createdAt: string;
  orderedAt?: string;
  closedAt?: string;
  goodsReceiptCount: number;
  receivedValue: number;
  items: PurchaseOrderItemDto[];
}

export interface PurchaseOrderItemCreateDto {
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  discount: number;
}

export interface PurchaseOrderCreateDto {
  supplierId: string;
  purchaseRequisitionId?: string;
  issueDate: string;
  expectedDate: string;
  currency?: string;
  notes?: string;
  terms?: string;
  items: PurchaseOrderItemCreateDto[];
}

export interface PurchaseOrderUpdateDto extends PurchaseOrderCreateDto {}

export interface PurchaseOrderFilterDto {
  search?: string;
  status?: string;
  supplierId?: string;
  fromDate?: string;
  toDate?: string;
}

// Goods receipt DTOs
export interface GoodsReceiptItemDto {
  id: string;
  purchaseOrderItemId: string;
  description: string;
  orderedQuantity: number;
  receivedQuantity: number;
  rejectedQuantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface GoodsReceiptDto {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  receivedDate: string;
  status: string;
  notes?: string;
  receivedByName?: string;
  createdAt: string;
  postedAt?: string;
  receivedValue: number;
  items: GoodsReceiptItemDto[];
}

export interface GoodsReceiptItemCreateDto {
  purchaseOrderItemId: string;
  receivedQuantity: number;
  rejectedQuantity: number;
}

export interface GoodsReceiptCreateDto {
  purchaseOrderId: string;
  receivedDate: string;
  notes?: string;
  items: GoodsReceiptItemCreateDto[];
}

export interface GoodsReceiptUpdateDto extends GoodsReceiptCreateDto {}

export interface GoodsReceiptFilterDto {
  search?: string;
  status?: string;
  purchaseOrderId?: string;
  fromDate?: string;
  toDate?: string;
}

// Supplier bill matching DTOs
export interface SupplierBillItemCreateDto {
  purchaseOrderItemId: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  discount: number;
}

export interface SupplierBillCreateDto {
  supplierInvoiceNumber: string;
  issueDate: string;
  dueDate: string;
  notes?: string;
  goodsReceiptNoteId?: string;
  items: SupplierBillItemCreateDto[];
}

export interface SupplierBillLineDto {
  purchaseOrderItemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  purchaseOrderUnitPrice: number;
  vatRate?: number;
  lineTotal: number;
  priceVariance: number;
  amountVariance: number;
}

export interface SupplierBillDto {
  invoiceId: string;
  invoiceNumber: string;
  supplierInvoiceNumber?: string;
  status: string;
  issueDate: string;
  dueDate: string;
  createdAt: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  goodsReceiptNoteId?: string;
  hasVariance: boolean;
  lines: SupplierBillLineDto[];
}

export interface SupplierBillMatchingDto {
  purchaseOrderId: string;
  poNumber: string;
  receivedValue: number;
  billedValue: number;
  hasVariance: boolean;
  bills: SupplierBillDto[];
}

// Credit / debit note DTOs
export interface InvoiceNoteItemCreateDto {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  discount: number;
}

export interface InvoiceNoteCreateDto {
  originalInvoiceId: string;
  noteType: "Credit" | "Debit";
  issueDate: string;
  reason: string;
  notes?: string;
  items: InvoiceNoteItemCreateDto[];
}

export interface InvoiceNoteUpdateDto extends InvoiceNoteCreateDto {}

export interface InvoiceNoteItemDto {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  discount: number;
  lineTotal: number;
}

export interface InvoiceNoteDto {
  id: string;
  noteNumber: string;
  noteType: "Credit" | "Debit";
  invoiceType: string;
  originalInvoiceId: string;
  originalInvoiceNumber?: string;
  partyName?: string;
  issueDate: string;
  reason: string;
  notes?: string;
  status: string;
  subtotal: number;
  vatAmount: number;
  totalDiscount: number;
  total: number;
  createdAt: string;
  postedAt?: string;
  items: InvoiceNoteItemDto[];
}

export interface InvoiceNoteFilterDto {
  search?: string;
  status?: string;
  noteType?: string;
  invoiceType?: string;
  fromDate?: string;
  toDate?: string;
}

// Recurring invoice DTOs
export interface RecurringInvoiceItemDto {
  id: string;
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  discount: number;
  lineTotal: number;
}

export interface RecurringInvoiceDto {
  id: string;
  recurringNumber: string;
  name: string;
  customerId: string;
  customerName: string;
  branchId?: string;
  projectId?: string;
  invoiceType: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  nextRunDate: string;
  dueDays: number;
  autoSend: boolean;
  status: string;
  currency?: string;
  notes?: string;
  terms?: string;
  lastRunAt?: string;
  runCount: number;
  createdAt: string;
  total: number;
  items: RecurringInvoiceItemDto[];
}

export interface RecurringInvoiceItemCreateDto {
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  discount: number;
}

export interface RecurringInvoiceCreateDto {
  name: string;
  customerId: string;
  branchId?: string;
  projectId?: string;
  invoiceType: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  dueDays: number;
  autoSend: boolean;
  currency?: string;
  notes?: string;
  terms?: string;
  items: RecurringInvoiceItemCreateDto[];
}

export interface RecurringInvoiceUpdateDto extends RecurringInvoiceCreateDto {}

export interface RecurringInvoiceFilterDto {
  search?: string;
  status?: string;
  frequency?: string;
  customerId?: string;
}
