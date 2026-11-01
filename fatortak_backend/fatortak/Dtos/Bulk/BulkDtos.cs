namespace fatortak.Dtos.Bulk
{
    public class BulkActionDto
    {
        public List<Guid> Ids { get; set; } = new();
        public bool IsActive { get; set; } = true;
    }

    public class BulkActionResultDto
    {
        public int Affected { get; set; }
        public int Missing { get; set; }
    }
}
