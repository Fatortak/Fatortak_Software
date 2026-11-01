namespace fatortak.Dtos.Documents
{
    public class DocumentRevisionDto
    {
        public Guid Id { get; set; }
        public string DocumentType { get; set; } = string.Empty;
        public Guid DocumentId { get; set; }
        public string DocumentNumber { get; set; } = string.Empty;
        public int Revision { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? Changes { get; set; }
        public string? Snapshot { get; set; }
        public string? UserName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
