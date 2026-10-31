namespace fatortak.Entities
{
    public class PurchaseRequisition : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public string RequestNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public Guid? UserId { get; set; }
        public Guid? ApprovedByUserId { get; set; }
        public DateTime NeededBy { get; set; }
        public string Status { get; set; } = "Draft";
        public string? Notes { get; set; }
        public decimal Total { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime? RejectedAt { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public ApplicationUser? User { get; set; }
        public ApplicationUser? ApprovedByUser { get; set; }
        public ICollection<PurchaseRequisitionItem> Items { get; set; } = new List<PurchaseRequisitionItem>();
    }

    public class PurchaseRequisitionItem : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public Guid PurchaseRequisitionId { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
        public decimal EstimatedUnitPrice { get; set; }
        public decimal LineTotal { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public PurchaseRequisition PurchaseRequisition { get; set; } = null!;
    }
}
