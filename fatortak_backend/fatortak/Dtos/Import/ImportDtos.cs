namespace fatortak.Dtos.Import
{
    public class CsvImportDto
    {
        public string Csv { get; set; } = string.Empty;
        public bool IsSupplier { get; set; }
    }

    public class ImportRowErrorDto
    {
        public int Row { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class ImportResultDto
    {
        public int Imported { get; set; }
        public int Skipped { get; set; }
        public int Failed { get; set; }
        public List<ImportRowErrorDto> Errors { get; set; } = new();
    }
}
