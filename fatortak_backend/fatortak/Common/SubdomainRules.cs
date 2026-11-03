using System.Text.RegularExpressions;

namespace fatortak.Common
{
    /// <summary>
    /// Shared rules for workspace subdomains. Keeping these in one place means
    /// registration, availability checks and admin tenant creation agree.
    /// </summary>
    public static class SubdomainRules
    {
        public const int MinLength = 3;
        public const int MaxLength = 30;

        private static readonly Regex InvalidCharacters =
            new("[^a-z0-9-]", RegexOptions.Compiled);
        private static readonly Regex RepeatedHyphens =
            new("-{2,}", RegexOptions.Compiled);
        private static readonly Regex ValidPattern =
            new("^[a-z0-9-]+$", RegexOptions.Compiled);

        private static readonly HashSet<string> Reserved = new(
            new[]
            {
                "www", "app", "api", "mail", "email", "smtp", "imap", "pop", "ftp",
                "admin", "administrator", "root", "system", "support", "help", "login",
                "signin", "signup", "register", "account", "accounts", "auth", "billing",
                "status", "docs", "blog", "news", "portal", "platform", "dashboard",
                "cdn", "static", "assets", "media", "img", "images", "files", "download",
                "localhost", "test", "testing", "staging", "dev", "demo", "sandbox",
                "fatortak", "app1", "ns1", "ns2", "mx", "vpn", "secure", "pay", "payments"
            },
            StringComparer.OrdinalIgnoreCase);

        public static string Normalize(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;

            var normalized = value.Trim().ToLowerInvariant();
            normalized = normalized.Replace('_', '-').Replace(' ', '-');
            normalized = InvalidCharacters.Replace(normalized, string.Empty);
            normalized = RepeatedHyphens.Replace(normalized, "-");
            return normalized.Trim('-');
        }

        public static string? GetFormatError(string normalized)
        {
            if (normalized.Length < MinLength)
                return $"Use at least {MinLength} characters for the workspace URL.";
            if (normalized.Length > MaxLength)
                return $"Use {MaxLength} characters or fewer for the workspace URL.";
            if (normalized.StartsWith('-') || normalized.EndsWith('-'))
                return "The workspace URL cannot start or end with a hyphen.";
            if (!ValidPattern.IsMatch(normalized))
                return "Use lowercase letters, numbers and hyphens only.";
            return null;
        }

        public static bool IsReserved(string normalized) => Reserved.Contains(normalized);
    }
}
