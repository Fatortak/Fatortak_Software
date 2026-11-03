using fatortak.Common;
using fatortak.Services.Deployment;
using Microsoft.Extensions.Configuration;

namespace fatortak.Tests;

public class SubdomainRulesTests
{
    [Theory]
    [InlineData("  My Company  ", "my-company")]
    [InlineData("Acme_Trading", "acme-trading")]
    [InlineData("ACME--HQ!!", "acme-hq")]
    [InlineData("---acme---", "acme")]
    [InlineData("a b c", "a-b-c")]
    public void Normalize_Produces_Safe_Subdomains(string input, string expected)
    {
        Assert.Equal(expected, SubdomainRules.Normalize(input));
    }

    [Fact]
    public void Format_Rejects_Too_Short_And_Too_Long_Values()
    {
        Assert.NotNull(SubdomainRules.GetFormatError("ab"));
        Assert.NotNull(SubdomainRules.GetFormatError(new string('a', 31)));
        Assert.Null(SubdomainRules.GetFormatError("acme-hq"));
    }

    [Fact]
    public void Format_Rejects_Leading_Or_Trailing_Hyphens()
    {
        Assert.NotNull(SubdomainRules.GetFormatError("-acme"));
        Assert.NotNull(SubdomainRules.GetFormatError("acme-"));
    }

    [Theory]
    [InlineData("admin")]
    [InlineData("ADMIN")]
    [InlineData("www")]
    [InlineData("fatortak")]
    public void Reserved_Names_Are_Case_Insensitive(string value)
    {
        Assert.True(SubdomainRules.IsReserved(SubdomainRules.Normalize(value)));
    }

    [Fact]
    public void Regular_Names_Are_Not_Reserved()
    {
        Assert.False(SubdomainRules.IsReserved("acme-hq"));
    }
}

public class RegistrationModeTests
{
    private static DeploymentMode Create(string mode, string multiTenantRegistration)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Deployment:Mode"] = mode,
                ["MultiTenant:AllowRegistration"] = multiTenantRegistration
            })
            .Build();
        return new DeploymentMode(configuration);
    }

    [Fact]
    public void MultiTenant_Registration_Defaults_To_Enabled()
    {
        var mode = Create("MultiTenant", "true");
        Assert.False(mode.IsSelfHosted);
        Assert.True(mode.AllowRegistration);
    }

    [Fact]
    public void MultiTenant_Registration_Can_Be_Disabled()
    {
        var mode = Create("MultiTenant", "false");
        Assert.False(mode.IsSelfHosted);
        Assert.False(mode.AllowRegistration);
    }
}
