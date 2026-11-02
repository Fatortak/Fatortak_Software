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

    public class ImportColumnDto
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public List<string> Samples { get; set; } = new();
    }

    public class ImportPreviewRowDto
    {
        public int Row { get; set; }
        public Dictionary<string, string> Values { get; set; } = new();
        public List<string> Errors { get; set; } = new();
        public bool Duplicate { get; set; }
    }

    public class ImportPreviewDto
    {
        public string EntityType { get; set; } = string.Empty;
        public string Format { get; set; } = string.Empty;
        public string? FileName { get; set; }
        public List<string> Sheets { get; set; } = new();
        public string? SelectedSheet { get; set; }
        public List<ImportColumnDto> Columns { get; set; } = new();
        public Dictionary<string, string> SuggestedMapping { get; set; } = new();
        public List<ImportPreviewRowDto> Rows { get; set; } = new();
        public int TotalRows { get; set; }
        public int ValidRows { get; set; }
        public int ErrorRows { get; set; }
        public int DuplicateRows { get; set; }
        public List<string> Warnings { get; set; } = new();
    }

    public class ImportExecuteRowDto
    {
        public int Row { get; set; }
        public Dictionary<string, string> Values { get; set; } = new();
    }

    public class ImportExecuteDto
    {
        public string EntityType { get; set; } = "customers";
        public bool IsSupplier { get; set; }
        public Dictionary<string, string> Mapping { get; set; } = new();
        public List<ImportExecuteRowDto> Rows { get; set; } = new();
    }
}
