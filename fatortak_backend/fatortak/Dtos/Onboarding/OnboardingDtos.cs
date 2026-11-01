namespace fatortak.Dtos.Onboarding
{
    public class OnboardingStepDto
    {
        public string Key { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Route { get; set; } = string.Empty;
        public bool Completed { get; set; }
    }

    public class OnboardingProgressDto
    {
        public int Percent { get; set; }
        public int Completed { get; set; }
        public int Total { get; set; }
        public bool DemoDataLoaded { get; set; }
        public List<OnboardingStepDto> Steps { get; set; } = new();
    }

    public class DemoDataResultDto
    {
        public bool AlreadyLoaded { get; set; }
        public int Customers { get; set; }
        public int Items { get; set; }
        public int Projects { get; set; }
        public int Quotations { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
