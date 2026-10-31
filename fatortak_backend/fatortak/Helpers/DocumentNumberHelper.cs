using System.Text.RegularExpressions;

namespace fatortak.Helpers
{
    public static class DocumentNumberHelper
    {
        public static string Next(string prefix, string? lastNumber)
        {
            if (string.IsNullOrWhiteSpace(lastNumber))
                return $"{prefix}0001";

            var match = Regex.Match(lastNumber, @"\d+$");
            if (match.Success && long.TryParse(match.Value, out var number))
                return $"{prefix}{(number + 1).ToString().PadLeft(4, '0')}";

            return $"{prefix}0001";
        }
    }
}
