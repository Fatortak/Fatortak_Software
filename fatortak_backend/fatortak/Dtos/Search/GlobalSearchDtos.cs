namespace fatortak.Dtos.Search
{
    public class GlobalSearchResultDto
    {
        public string Type { get; set; } = string.Empty;
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string Route { get; set; } = string.Empty;
    }
}
